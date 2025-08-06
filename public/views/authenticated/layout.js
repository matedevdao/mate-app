import { el } from '@webtaku/el';
import { createProfileModal } from '../../modals/profile';
function createHeader() {
    return el('ion-header', el('ion-toolbar', el('ion-title', { style: 'text-align: center;' }, 'Mate'), el('ion-buttons', { slot: 'end' }, el('ion-button', { id: 'open-profile' }, el('ion-icon', { slot: 'icon-only', name: 'person-circle' }) // 유저 아이콘
    ))));
}
function createLayoutView(router) {
    const layout = el('ion-app', createHeader(), el('ion-content.content'), createProfileModal(router));
    return {
        el: layout,
        remove: () => {
            layout.remove();
        }
    };
}
export { createLayoutView };
//# sourceMappingURL=layout.js.map