// ------------------------------
// Loading Overlay (ion-spinner)
// ------------------------------
let loadingEl = null;
export function showLoading() {
    if (loadingEl)
        return;
    loadingEl = document.createElement('div');
    loadingEl.setAttribute('data-loading-overlay', '');
    Object.assign(loadingEl.style, {
        position: 'fixed',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'color-mix(in oklab, var(--ion-background-color, #fff) 70%, transparent)',
        zIndex: '2147483647',
    });
    loadingEl.innerHTML = `<ion-spinner name="crescent" style="width:48px;height:48px"></ion-spinner>`;
    document.body.appendChild(loadingEl);
}
export function hideLoading() {
    try {
        loadingEl?.remove();
    }
    catch { /* noop */ }
    loadingEl = null;
}
//# sourceMappingURL=loading.js.map