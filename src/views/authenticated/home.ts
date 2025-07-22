import { el } from '@webtaku/el';
import { View } from '../view';
import { createChatRooms } from '../../components/chat-rooms';
import Navigo from 'navigo';

function createHomeView(router: Navigo): View {
  const page = el('div', { className: 'page flex flex-col h-screen p-4 gap-2' }, {
    style: { height: '100%' }
  });

  page.append(createChatRooms(router).el);

  return {
    el: page,
    remove() {
      page.remove();
    },
  };
}

export { createHomeView };
