import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { View } from '../view';
import { tokenManager } from '@gaiaprotocol/client-common';
import { chatProfileService, createChatComponent } from '@gaiaprotocol/chat-client';

import { fetchHeldNfts, HeldNft } from '../../api/nfts';
import { fetchMyMainNft, setMainNft } from '../../api/main-nft';
import { createSelectMainNftModal } from '../../modals/select-main-nft';
import { profileService } from '../../services/profile';

function getMyAccount(): string {
  const token = tokenManager.getToken();
  if (!token) return 'unknown';
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload.sub || 'unknown';
  } catch {
    return 'unknown';
  }
}

// 상대 경로 이미지 보정 (환경에 맞게 수정)
function toImageUrl(img?: string | null) {
  if (!img) return '';
  try {
    return new URL(img).href; // 절대 경로면 그대로
  } catch {
    return `https://pub-b5f5f68564ba4ce693328fe84e1a6c57.r2.dev/${img}`; // 상대 경로면 프리픽스
  }
}

function createChatRoomView(router: Navigo, roomId: string): View & {
  scrollToBottom: () => void;
} {
  const page = el('div', { className: 'page flex flex-col h-screen p-4 gap-2' }, {
    style: { height: '100%' }
  });

  // 내 계정 고정
  const myAccount = getMyAccount();

  /* ---------- ChatComponent ---------- */
  const chat = createChatComponent({
    roomId,
    myAccount,
  });

  page.append(chat.el);

  // ✅ 프로필 캐시를 채팅 컴포넌트에 반영
  const applyCachedProfile = () => {
    if (!myAccount || myAccount === 'unknown') return;
    const cached = profileService.getCached(myAccount);
    const prev = chatProfileService.getCached(myAccount);

    const nickname = cached?.nickname ?? prev?.nickname ?? undefined;
    // profileImage를 profileService가 관리하지 않는다면 기존 아바타 유지
    const profileImage = (cached as any)?.profileImage ?? prev?.profileImage ?? undefined;

    chatProfileService.setProfile(myAccount, nickname, profileImage);
  };

  // 최초 진입 시 프로필 선반영 + 서버값 동기화
  if (myAccount && myAccount !== 'unknown') {
    applyCachedProfile();
    chatProfileService.preload([myAccount]); // 원천 동기화
    profileService.resolve(myAccount).finally(applyCachedProfile); // 캐시 최신화 후 재반영
  }

  // ✅ 프로필 변경 이벤트만 구독
  const onMyProfileChange = () => applyCachedProfile();
  profileService.addEventListener('myprofilechange', onMyProfileChange);

  // 기존 메인 NFT 선택 로직 유지
  (async () => {
    const account = myAccount;
    if (!account || account === 'unknown') return;

    try {
      const mine = await fetchMyMainNft(roomId);
      const hasMain = !!mine?.token_id;

      if (!hasMain) {
        const modal = createSelectMainNftModal({
          loadItems: async () => {
            const nfts: HeldNft[] = await fetchHeldNfts(account, { room: roomId });
            return nfts.map(n => ({
              id: String(n.id ?? ''),
              name: n.type ? `${n.type} #${n.id}` : `NFT #${n.id}`,
              image: toImageUrl(n.image),
              contractAddr: n.contract_addr,
            }));
          },
          onSelected: async (contractAddr: string, tokenId: string) => {
            await setMainNft({ collection: roomId, contractAddr, tokenId });
            // 아바타가 메인 NFT로 바뀌는 UX가 있다면, 서버 기준으로 재동기화만 수행
            chatProfileService.preload([account]);
            applyCachedProfile();
          },
          labels: {
            title: '메인 NFT 선택',
            description: '이 방에서 사용할 메인 NFT를 선택하세요.',
          },
        });

        document.body.appendChild(modal);
        (modal as any).present?.() || (modal as any).showModal?.();
      }
    } catch (e) {
      console.error('메인 NFT 확인/표시 중 오류', e);
    }
  })();

  return {
    el: page,
    scrollToBottom: chat.scrollToBottom,
    remove() {
      // 이벤트 해제
      profileService.removeEventListener?.('myprofilechange', onMyProfileChange as any);
      chat.remove();
      page.remove();
    },
  };
}

export { createChatRoomView };
