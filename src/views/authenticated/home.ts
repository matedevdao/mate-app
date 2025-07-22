import { el } from '@webtaku/el';
import { View } from '../view';

function createHomeView(): View {
  const page = el('div', { className: 'page flex flex-col h-screen p-4 gap-2' }, {
    style: { height: '100%' }
  });

  return {
    el: page,
    remove() {
      page.remove();
    },
  };
}

export { createHomeView };
