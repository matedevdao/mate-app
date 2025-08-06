import { el } from '@webtaku/el';
import { createChatRooms } from '../../components/chat-rooms';
function createHomeView(router) {
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
//# sourceMappingURL=home.js.map