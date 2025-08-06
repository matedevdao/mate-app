import { createJazzicon, logout, tokenManager } from "@gaiaprotocol/client-common";
import { el } from "@webtaku/el";
import Navigo from "navigo";
import { getAddress, zeroAddress } from "viem";
import { profileService } from "../services/profile";
import { shortenAddress } from "../utils/address";
import { createProfileFormModal } from "./profile-form";

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

  const menuItem = (icon: string, title: string, subtitle = '', onClick?: () => void) =>
    el('ion-item', { button: !!onClick, onclick: onClick },
      el('ion-icon', { name: icon, slot: 'start' }),
      el('ion-label', el('h2', title), subtitle ? el('p', subtitle) : undefined)
    );

  const modalContent = el('ion-content.ion-padding',
    profileCard,

    el('ion-list',
      menuItem('person-circle', '프로필 편집', '닉네임과 자기소개를 수정합니다.', () => {
        const formModal = createProfileFormModal(myAddress, token);
        document.body.appendChild(formModal);
        formModal.present();
      }),

      menuItem('log-out', '로그아웃', '', async () => {
        await logout();
        router.navigate('/login');
      }),
    )
  );

  const modalHeader = el('ion-header',
    el('ion-toolbar',
      el('ion-title', '프로필'),
      el('ion-buttons', { slot: 'end' },
        el('ion-button', { onclick: () => modal.dismiss() }, '닫기')
      ),
    )
  );

  modal.append(modalHeader, modalContent);
  return modal;
}

export { createProfileModal };
