import { createJazzicon, logout, tokenManager } from "@gaiaprotocol/client-common";
import { el } from "@webtaku/el";
import Navigo from "navigo";
import { getAddress, zeroAddress } from "viem";
import { googleLogin, googleLogout } from "../auth/google-login";
import { oauth2MeByToken, oauthUnlinkWalletByToken } from "../auth/oauth2";
import { launchInstallFlow } from "../components/install-ui";
import { isMobile, isStandalone, isWebView } from "../platform";
import { profileService } from "../services/profile";
import { shortenAddress } from "../utils/address";
import { createProfileFormModal } from "./profile-form";
import { fetchMyMainNft, setMainNft } from "../api/main-nft";
import { createSelectMainNftModal } from "./select-main-nft";
import { fetchHeldNfts, HeldNft } from "../api/nfts";
import { fetchMainNftsWithInfo } from "../api/main-nfts-with-info";
import { chatProfileService } from "@gaiaprotocol/chat-client";

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

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/mate-app/' : '/';

function getCurrentRoomFromPath(): string | null {
  let path = location.pathname || '';
  if (path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  const seg = path.split('/').filter(Boolean)[0] || '';
  return seg || null;
}

export function createInstallAppItem(): HTMLElement | null {
  // WebView/설치됨 환경에서는 숨김
  if (!(isMobile && !isWebView && !isStandalone)) return null;

  return el('ion-item', {
    button: true,
    detail: true,
    onclick: () => {
      launchInstallFlow().then((result) => console.log('[install]', result));
      (document.getElementById('main-menu') as any)?.dismiss?.();
    }
  },
    el('ion-icon', { slot: 'start', name: 'download' }),
    el('ion-label', '앱 설치')
  );
}

export function createContactUsItem(): HTMLElement {
  return el('ion-item', {
    button: true,
    detail: true,
    onclick: () => {
      const subject = encodeURIComponent('[Mate App] 제목 작성');
      const body = encodeURIComponent('안녕하세요,\n\n문의 내용을 아래에 작성해 주세요.\n\n감사합니다.');
      window.location.href =
        `mailto:matedevdaocontact@gmail.com?subject=${subject}&body=${body}`;
      (document.getElementById('main-menu') as any)?.dismiss?.();
    }
  },
    el('ion-icon', { slot: 'start', name: 'mail' }),
    el('ion-label', '문의하기')
  );
}

function createProfileModal(router: Navigo): HTMLElement {
  const _addr = tokenManager.getAddress();
  const myAddress = _addr ? getAddress(_addr) : zeroAddress;
  const token = tokenManager.getToken() || '';

  const avatar = createJazzicon(myAddress);
  avatar.style.width = '64px';
  avatar.style.height = '64px';
  avatar.style.margin = 'auto';

  const nicknameSpan = el("span", "", { style: "font-weight: bold; font-size: 1.1em;" });
  const addressSpan = el("span", shortenAddress(myAddress), { style: "color: gray;" });
  const bioSpan = el("span", "", { style: "font-size: 0.9em; color: #666;" });

  const modal = el('ion-modal', { trigger: 'open-profile' });

  const profileCard = el('ion-card',
    el('ion-card-header', {
      style: `
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `},
      el('ion-avatar', { style: 'width:64px;height:64px;margin:auto' }, avatar),
      nicknameSpan,
      addressSpan,
      bioSpan
    )
  );

  // 최초 로드 시 캐시에서 불러옴
  const updateProfileDisplay = () => {
    const cached = profileService.getCached(myAddress);
    if (cached) {
      nicknameSpan.textContent = cached.nickname || shortenAddress(myAddress);
      bioSpan.textContent = cached.bio ?? '';
    } else {
      nicknameSpan.textContent = shortenAddress(myAddress);
      bioSpan.textContent = '';
    }
  };

  updateProfileDisplay();

  profileService.resolve(myAddress).then(() => {
    updateProfileDisplay();
  });

  // 내 프로필 변경되면 갱신
  profileService.addEventListener('myprofilechange', () => {
    updateProfileDisplay();
  });

  // ✅ 간단 토스트 & 로딩 헬퍼
  const showToast = async (message: string) => {
    const t = document.createElement('ion-toast') as any;
    t.message = message;
    t.duration = 1600;
    t.position = 'bottom';
    document.body.appendChild(t);
    await t.present?.();
  };

  const withLoading = async <T,>(fn: () => Promise<T>, msg = '처리 중...'): Promise<T> => {
    const loading = document.createElement('ion-loading') as any;
    loading.message = msg;
    document.body.appendChild(loading);
    await loading.present?.();
    try {
      return await fn();
    } finally {
      await loading.dismiss?.();
      loading.remove();
    }
  };

  const menuItem = (icon: string, title: string, subtitle = '', onClick?: () => void, rightEl?: HTMLElement) =>
    el('ion-item', { button: !!onClick, onclick: onClick },
      el('ion-icon', { name: icon, slot: 'start' }),
      el('ion-label', el('h2', title), subtitle ? el('p', subtitle) : undefined),
      rightEl ? rightEl : undefined
    );

  // ✅ 구글 연동 Link/Unlink 항목(표시 토글을 위해 변수로 보관)
  let linkItemEl: HTMLElement;
  let unlinkItemEl: HTMLElement;

  const modalContent = el('ion-content.ion-padding',
    profileCard,

    el('ion-list',
      menuItem('happy', '메인 NFT 선택', '현재 방의 메인 NFT를 선택합니다.', async () => {
        const account = getMyAccount();
        if (!account || account === 'unknown') return;

        const roomId = getCurrentRoomFromPath();
        if (!roomId) {
          showToast('방 정보를 찾을 수 없습니다.');
          return;
        }

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
                const nftRows = await fetchMainNftsWithInfo(roomId, [roomId]);

                const imageMap = new Map<string, string | null>();
                for (const row of nftRows) {
                  const addr = getAddress(row.user_address);
                  imageMap.set(addr, row.nft?.image ?? null);
                }

                for (const addr of [account]) {
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
      }),

      menuItem('person-circle', '프로필 편집', '닉네임과 자기소개를 수정합니다.', () => {
        const formModal = createProfileFormModal(myAddress, token);
        document.body.appendChild(formModal);
        (formModal as any).present?.();
      }),

      // ✅ Google 계정 연동
      (linkItemEl = menuItem(
        'logo-google',
        'Google 계정 연동',
        'Google 계정을 연결합니다.',
        async () => {
          await withLoading(async () => {
            await googleLogin();
            await refreshGoogleLinkState(); // 연동 후 상태 즉시 갱신
          }, 'Google 계정 연동 중...');
          await showToast('Google 계정이 연동되었습니다.');
        }
      )),

      // ✅ Google 계정 연결 해제
      (unlinkItemEl = menuItem(
        'logo-google',
        'Google 계정 연결 해제',
        '지갑에서 Google 계정 연결을 해제합니다.',
        async () => {
          await withLoading(async () => {
            const t = tokenManager.getToken();
            if (!t) throw new Error('인증 토큰이 없습니다.');
            await oauthUnlinkWalletByToken();
            await googleLogout();
            await refreshGoogleLinkState(); // 해제 후 상태 즉시 갱신
          }, '연결 해제 중...');
          await showToast('Google 계정 연결이 해제되었습니다.');
        }
      )),

      createInstallAppItem(),
      createContactUsItem(),

      menuItem('log-out', '로그아웃', '', async () => {
        await withLoading(async () => {
          await logout();
          await googleLogout().catch(() => { }); // 이미 해제된 경우 무시
          router.navigate('/login');
        }, '로그아웃 중...')
      }),
    )
  );

  const modalHeader = el('ion-header',
    el('ion-toolbar',
      el('ion-title', '프로필'),
      el('ion-buttons', { slot: 'end' },
        el('ion-button', { onclick: () => (modal as any).dismiss?.() }, '닫기')
      ),
    )
  );

  modal.append(modalHeader, modalContent);

  // ✅ 연동 상태 갱신 함수
  const refreshGoogleLinkState = async () => {
    const setLinkedUI = (linked: boolean) => {
      if (linkItemEl) linkItemEl.style.display = linked ? 'none' : '';
      if (unlinkItemEl) unlinkItemEl.style.display = linked ? '' : 'none';
    };

    try {
      const t = tokenManager.getToken();
      if (!t) {
        setLinkedUI(false);
        return;
      }
      const me = await oauth2MeByToken('google');
      const linked = !!(me?.ok && me?.sub);
      setLinkedUI(linked);

      // 연결된 이메일을 Unlink 항목 부제목으로 표시
      if (unlinkItemEl) {
        const labelP = unlinkItemEl.querySelector('ion-label > p') as HTMLElement | null;
        if (labelP) {
          labelP.textContent = linked && me?.email
            ? `연결된 계정: ${me.email}`
            : '지갑에서 Google 계정 연결을 해제합니다.';
        }
      }
    } catch {
      // 조회 실패 시 미연동으로 간주
      setLinkedUI(false);
    }
  };

  // ✅ 최초 진입 시 연동 상태 반영
  refreshGoogleLinkState();

  return modal;
}

export { createProfileModal };
