import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { View } from '../view';

function createHeader(): HTMLElement {
  return el('ion-header',
    el('ion-toolbar',
      el('ion-title', { style: 'text-align: center;' }, 'Mate'),
    )
  );
}

function createLayoutView(router: Navigo): View {
  const layout = el('ion-app',
    createHeader(),
    el('ion-content.content'),
  );

  return {
    el: layout,
    remove: () => {
      layout.remove();
    }
  };
}

export { createLayoutView };
