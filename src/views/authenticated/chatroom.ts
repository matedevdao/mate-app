import { chatProfileService, createChatComponent } from '@gaiaprotocol/chat-client';
import { tokenManager } from '@gaiaprotocol/client-common';
import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { View } from '../view';

import { getAddress } from 'viem';
import { fetchMyMainNft, setMainNft } from '../../api/main-nft';
import { fetchMainNftsWithInfo } from '../../api/main-nfts-with-info';
import { fetchHeldNfts, HeldNft } from '../../api/nfts';
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

  // 최초 진입 시 프로필 선반영 + 서버값 동기화
  if (myAccount && myAccount !== 'unknown') {
    chatProfileService.preload([myAccount]); // 원천 동기화
  }

  // ✅ 프로필 변경 이벤트만 구독
  const onMyProfileChange = async () => {
    const addr = getAddress(myAccount);
    const profile = profileService.getCached(addr);
    const prev = chatProfileService.getCached(addr);
    chatProfileService.setProfile(getAddress(addr), profile?.nickname ?? undefined, prev?.profileImage ?? undefined);
  };
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
            await setMainNft({ room: roomId, contractAddr, tokenId });

            // 아바타가 메인 NFT로 바뀌는 UX가 있다면, 서버 기준으로 재동기화만 수행
            const nftRows = await fetchMainNftsWithInfo(roomId, [myAccount]);

            const imageMap = new Map<string, string | null>();
            for (const row of nftRows) {
              const addr = getAddress(row.user_address);
              imageMap.set(addr, row.nft?.image ?? null);
            }

            for (const addr of [myAccount]) {
              const prev = chatProfileService.getCached(addr);
              chatProfileService.setProfile(getAddress(addr), prev?.nickname ?? undefined, imageMap.get(addr) ?? undefined);
            }
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
