import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { TokenManager } from '../../auth/token-mananger';
import { createChatComponent } from '../../components/chat';
import { View } from '../view';

function getMyAccount(): string {
  const token = TokenManager.getToken();
  if (!token) return 'unknown';
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload.sub || 'unknown';
  } catch {
    return 'unknown';
  }
}

function createChatRoomView(router: Navigo, roomId: string): View {
  const page = el('div', { className: 'page flex flex-col h-screen p-4 gap-2' }, {
    style: { height: '100%' }
  });

  /* ---------- ChatComponent ---------- */
  const chat = createChatComponent({
    roomId,
    myAccount: getMyAccount(),
  });

  page.append(chat.el);

  return {
    el: page,
    remove() {
      chat.remove();
      page.remove();
    },
  };
}

export { createChatRoomView };
