const params = new URLSearchParams(window.location.search);

export const platform = params.get('platform');
export const isWebView = params.get('source') === 'webview';
export const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
export const isAndroid = /Android/i.test(navigator.userAgent);
export const isMobile = isIOS || isAndroid;
export const isStandalone = (
  (window.navigator as any).standalone === true ||
  window.matchMedia?.('(display-mode: standalone)').matches === true
);
