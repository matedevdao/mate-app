import { el } from '@webtaku/el';
import { tokenManager } from '@gaiaprotocol/client-common';
import { createChatComponent } from '@gaiaprotocol/chat-client';
function getMyAccount() {
    const token = tokenManager.getToken();
    if (!token)
        return 'unknown';
    try {
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        return payload.sub || 'unknown';
    }
    catch {
        return 'unknown';
    }
}
function createChatRoomView(router, roomId) {
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
//# sourceMappingURL=chatroom.js.map