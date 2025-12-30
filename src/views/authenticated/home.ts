import { el } from '@webtaku/el';
import { View } from '../view';
import { createChatRooms } from '../../components/chat-rooms';
import { createAnnouncementBanner } from '../../components/announcement-banner';
import { createNotificationPrompt } from '../../components/notification-prompt';
import Navigo from 'navigo';
import { changeTitle } from './layout';

function createHomeView(router: Navigo): View {
  const page = el('div', { className: 'page flex flex-col h-screen p-4 gap-2' }, {
    style: { height: '100%' }
  });

  const announcementBanner = createAnnouncementBanner();
  page.append(announcementBanner.el);

  const notificationPrompt = createNotificationPrompt();
  page.append(notificationPrompt.el);

  page.append(createChatRooms(router).el);

  setTimeout(() => {
    changeTitle('Mate')
  })

  return {
    el: page,
    remove() {
      announcementBanner.remove();
      notificationPrompt.remove();
      page.remove();
    },
  };
}

export { createHomeView };
