import { el } from '@webtaku/el';
import { View } from '../view';
import { createChatRooms } from '../../components/chat-rooms';

function createHomeView(): View {
  const page = el('div', { className: 'page flex flex-col h-screen p-4 gap-2' }, {
    style: { height: '100%' }
  });

  page.append(createChatRooms().el);

  return {
    el: page,
    remove() {
      page.remove();
    },
  };
}

export { createHomeView };
