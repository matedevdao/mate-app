import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { createProfileModal } from '../../modals/profile';
import { View } from '../view';

function createHeader(): HTMLElement {
  return el('ion-header',
    el('ion-toolbar',
      el('ion-title', { style: 'text-align: center;' }, 'Mate'),
      el('ion-buttons', { slot: 'end' },
        el('ion-button', { id: 'open-profile' },
          el('ion-icon', { slot: 'icon-only', name: 'person-circle' })  // 유저 아이콘
        )
      )
    )
  );
}

function createLayoutView(router: Navigo): View {
  const layout = el('ion-app',
    createHeader(),
    el('ion-content.content'),
    createProfileModal(router),
  );

  return {
    el: layout,
    remove: () => {
      layout.remove();
    }
  };
}

export { createLayoutView };
