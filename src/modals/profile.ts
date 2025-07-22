import { el } from "@webtaku/el";
import Navigo from "navigo";
import { getAddress } from "viem";
import { logout } from "../auth/logout";
import { TokenManager } from "../auth/token-mananger";
import { createJazzicon } from "../components/jazzicon";
import { shortenAddress } from "../utils/address";

function createInfoModal(title: string, message: string) {
  const modal = el('ion-modal');

  const header = el('ion-header',
    el('ion-toolbar',
      el('ion-title', title),
      el('ion-buttons', { slot: 'end' },
        el('ion-button', { onclick: () => modal.dismiss() }, '닫기')
      )
    )
  );

  const content = el('ion-content.ion-padding',
    el('div', {
      style: `
        text-align: center;
      `
    }, message)
  );

  modal.append(header, content);
  return modal;
}

function createProfileModal(router: Navigo): HTMLElement {
  const myAddress = getAddress(TokenManager.getAddress() || '');

  const avatar = createJazzicon(myAddress);
  avatar.style.width = '64px';
  avatar.style.height = '64px';
  avatar.style.margin = 'auto';

  const nameSpan = el("span", shortenAddress(myAddress));
  const addressSpan = el("span", myAddress);

  const modal = el('ion-modal', { trigger: 'open-profile' }); // 트리거는 레이아웃의 버튼 id

  const profileCard = el('ion-card',
    el('ion-card-header', {style: `
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `},
      el('ion-avatar', { style: 'width:64px;height:64px;margin:auto' },
        avatar
      ),
      el('ion-card-title', nameSpan),
      el('ion-card-subtitle', addressSpan),
    ),
    el('ion-button',
      { slot: 'end', style: 'position:absolute;right:16px;top:16px', fill: 'clear' },
      el('ion-icon', { name: 'camera' })
    )
  );

  const menuItem = (icon: string, title: string, subtitle = '', onClick?: () => void, rightEl?: HTMLElement) =>
    el('ion-item',
      { button: !!onClick, onclick: onClick },
      el('ion-icon', { name: icon, slot: 'start' }),
      el('ion-label',
        el('h2', title),
        subtitle ? el('p', subtitle) : undefined
      ),
      //rightEl ? rightEl : el('ion-icon', { name: 'chevron-forward', slot: 'end' }),
    );

  const modalContent = el('ion-content.ion-padding',
    profileCard,

    el('ion-list',
      menuItem('person-circle', '프로필', '프로필 정보를 편집합니다', () => {
        const modal = createInfoModal(
          '프로필',
          '프로필 설정은 현재 준비 중입니다.'
        );
        document.body.appendChild(modal);
        modal.present();
      }),

      menuItem('log-out', '로그아웃', '', async () => {
        await logout();
        router.navigate('/login');
      }),
    ),
  );

  const modalHeader = el('ion-header',
    el('ion-toolbar',
      el('ion-title', '프로필 설정'),
      el('ion-buttons', { slot: 'end' },
        el('ion-button', { onclick: () => modal.dismiss() }, '닫기')
      ),
    )
  );

  modal.append(modalHeader, modalContent);

  return modal;
}

export { createProfileModal };
