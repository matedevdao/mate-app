import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { View } from '../view';
import { tokenManager } from '@gaiaprotocol/client-common';
import { chatProfileService, createChatComponent } from '@gaiaprotocol/chat-client';

import { fetchHeldNfts, HeldNft } from '../../api/nfts';
import { fetchMyMainNft, setMainNft } from '../../api/main-nft';
import { createSelectMainNftModal } from '../../modals/select-main-nft';

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
    return `https://god-images.gaia.cc/${img}`; // 상대 경로면 프리픽스
  }
}

function createChatRoomView(router: Navigo, roomId: string): View & {
  scrollToBottom: () => void;
} {
  const page = el('div', { className: 'page flex flex-col h-screen p-4 gap-2' }, {
    style: { height: '100%' }
  });

  /* ---------- ChatComponent ---------- */
  const chat = createChatComponent({
    roomId,
    myAccount: getMyAccount(),
  });

  page.append(chat.el);

  // ✅ 방(=컬렉션 주소) 기준으로 메인 NFT가 없으면 선택 모달 띄우기
  (async () => {
    const account = getMyAccount();
    if (!account || account === 'unknown') return;

    try {
      const mine = await fetchMyMainNft(roomId);
      const hasMain = !!mine?.token_id;

      if (!hasMain) {
        const modal = createSelectMainNftModal({
          // 현재 방(컬렉션)의 내 보유 NFT 불러오기
          loadItems: async () => {
            const nfts: HeldNft[] = await fetchHeldNfts(account, { collection: roomId });
            return nfts.map(n => ({
              id: String(n.id ?? ''),         // 서버 응답 키에 맞춰 token_id 또는 id 사용
              name: n.type ? `${n.type} #${n.id}` : `NFT #${n.id}`,
              image: toImageUrl(n.image),
              contractAddr: n.contract_addr,
            }));
          },
          // 선택 시 저장
          onSelected: async (contractAddr: string, tokenId: string) => {
            await setMainNft({ collection: roomId, contractAddr, tokenId });
            // 필요하면 여기서 채팅 UI/프로필 캐시 갱신 로직 추가
            chatProfileService.preload([account]);
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
      // 실패해도 채팅은 계속 동작하게 둠
    }
  })();

  return {
    el: page,
    scrollToBottom: chat.scrollToBottom,
    remove() {
      chat.remove();
      page.remove();
    },
  };
}

export { createChatRoomView };
