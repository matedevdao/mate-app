import { chatProfileService } from '@gaiaprotocol/chat-client';
import { createRainbowKit, tokenManager } from '@gaiaprotocol/client-common';
import { BackButtonEvent, setupConfig } from '@ionic/core';
import { defineCustomElements } from '@ionic/core/loader';
import { initializeApp } from 'firebase/app';
import { getMessaging /*, getToken*/ } from 'firebase/messaging';
import Navigo from 'navigo';
import { getAddress } from 'viem';

// ===== New auth/link APIs pulled from Valhalla =====
import { fetchGoogleMe, GoogleMe, linkGoogleWeb3Wallet, unlinkGoogleWeb3WalletBySession } from './api/google';
import { validateToken } from './auth/validate';

// ===== App-specific APIs kept from mate-app =====
import { fetchMainNftsWithInfo } from './api/main-nfts-with-info';
import { fetchProfiles } from './api/profile';

// ===== Views =====
import './main.css';
import { createChatRoomView } from './views/authenticated/chatroom';
import { createHomeView } from './views/authenticated/home';
import { createLayoutView } from './views/authenticated/layout';
import { createGoogleLinkWeb3WalletView } from './views/unauthenticated/google-link-web3-wallet';
import { createLoginView } from './views/unauthenticated/login';
import { View } from './views/view';

// ------------------------------
// Constants & Utilities
// ------------------------------
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/mate-app/' : '/';

const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  LINK_WALLET: '/google-link-web3-wallet',
  ROOM: '/:roomId',
} as const;

function safeRemove(view?: View) {
  try { view?.remove(); } catch { /* noop */ }
}

function bySel<T extends Element = HTMLElement>(root: ParentNode, sel: string) {
  return root.querySelector(sel) as T | null;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms = 100) {
  let t: number | undefined;
  return ((...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  }) as T;
}

// ------------------------------
// App Shell & Back Button
// ------------------------------
setupConfig({
  hardwareBackButton: true,
  experimentalCloseWatcher: true,
});

const backHandler = (event: BackButtonEvent) => {
  event.detail.register(0, () => {
    const hasHistory = window.history.length > 1;
    const isFromExternal = document.referrer && !document.referrer.startsWith(window.location.origin);
    if (!hasHistory || isFromExternal) {
      document.removeEventListener('ionBackButton' as any, backHandler);
    }
    window.history.back();
  });
};

document.addEventListener('ionBackButton' as any, backHandler);

defineCustomElements(window);
document.documentElement.setAttribute('mode', 'ios');
document.body.appendChild(createRainbowKit());

// ------------------------------
// Environment / WebView detection
// ------------------------------
const urlParams = new URLSearchParams(window.location.search);
const isWebView = urlParams.get('source') === 'webview';

// ------------------------------
// Notifications (optional & lazy)
// ------------------------------
function initFirebaseAndMessaging() {
  const firebaseConfig = {
    apiKey: 'AIzaSyBbwkLP-C61kWmzCq-pFdvSJXHHUjmoRK0',
    authDomain: 'mate-ba361.firebaseapp.com',
    projectId: 'mate-ba361',
    storageBucket: 'mate-ba361.firebasestorage.app',
    messagingSenderId: '996341622273',
    appId: '1:996341622273:web:f1a110eea9820b30ad8200',
    measurementId: 'G-1V0KFDFZTF'
  } as const;

  const app = initializeApp(firebaseConfig);
  let messaging;
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.error('Failed to initialize Firebase Messaging', err);
  }
  return { app, messaging };
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
  try {
    return await Notification.requestPermission();
  } catch {
    return new Promise((resolve) => {
      Notification.requestPermission((perm: NotificationPermission) => resolve(perm));
    });
  }
}

if (!isWebView) {
  // Lazy init; keep side-effects minimal
  initFirebaseAndMessaging();
}

// ------------------------------
// Helper: path -> current collection (for room images)
// ------------------------------
function getCurrentCollectionFromPath(): string | null {
  let path = location.pathname || '';
  if (path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  const seg = path.split('/').filter(Boolean)[0] || '';
  return seg || null;
}

// ------------------------------
// Chat profile hydration
// ------------------------------
chatProfileService.init(async (addresses) => {
  const normalized = addresses.map(getAddress);
  const collection = getCurrentCollectionFromPath();

  const profiles = await fetchProfiles(normalized as unknown as (`0x${string}`)[]);

  const nftRows = collection
    ? await fetchMainNftsWithInfo(collection, normalized)
    : [];

  const imageMap = new Map<string, string | null>();
  for (const row of nftRows) {
    const addr = getAddress(row.user_address);
    imageMap.set(addr, row.nft?.image ?? null);
  }

  const result: Record<string, { nickname?: string | null; profileImage?: string | null } | null> = {};
  for (const addr of normalized) {
    const p = profiles[addr as `0x${string}`] ?? null;
    result[addr] = {
      nickname: p?.nickname ?? null,
      profileImage: imageMap.get(addr) ?? null,
    };
  }
  return result;
});

// ------------------------------
// Router & view orchestration
// ------------------------------
const router = new Navigo(BASE_PATH) as Navigo;

let layoutView: View | undefined;
let contentContainer: HTMLElement | undefined;
let unauthView: View | undefined; // login or link-wallet

const scrollBottomSoon = debounce(() => {
  try {
    const home = bySel<HTMLElement>(document, '[data-home-root]');
    home?.scrollTo({ top: home.scrollHeight });
  } catch {/* noop */ }
}, 100);

function mountContent(content: View) {
  if (!layoutView) {
    layoutView = createLayoutView(router);
    contentContainer = bySel<HTMLElement>(layoutView.el, '.content')!;
    contentContainer.appendChild(content.el);
    document.body.appendChild(layoutView.el);
  } else {
    contentContainer!.replaceChildren(content.el);
  }
}

function showAuthed(content: View) {
  safeRemove(unauthView); unauthView = undefined;
  mountContent(content);
}

function showUnauthed(factory: () => View) {
  if (layoutView) { safeRemove(layoutView); layoutView = undefined; contentContainer = undefined; }
  safeRemove(unauthView);
  unauthView = factory();
  document.body.appendChild(unauthView.el);
}

// ------------------------------
// Auth helpers (single source of truth)
// ------------------------------
async function tryAutoLinkIfNeeded(googleMe: GoogleMe | null): Promise<'ok' | 'to-link' | 'skip'> {
  const walletHasToken = tokenManager.has();

  // 1) Complete Google session → inject immediately
  if (googleMe?.ok && googleMe.wallet_address && googleMe.token) {
    tokenManager.set(googleMe.token, googleMe.wallet_address);
    return 'ok';
  }

  // 2) Google logged in but wallet token missing → go to link screen
  if (googleMe?.ok && !walletHasToken) {
    return 'to-link';
  }

  // 3) Wallet token exists & Google session present but incomplete → try server-side link using wallet auth
  if (walletHasToken && googleMe?.ok) {
    const authToken = tokenManager.getToken();
    if (!authToken) return 'to-link';
    try {
      const linkRes = await linkGoogleWeb3Wallet(authToken);
      if (linkRes?.ok) {
        if (linkRes.token && linkRes.wallet_address) {
          tokenManager.set(linkRes.token, linkRes.wallet_address);
        } else {
          const refreshed = await fetchGoogleMe();
          if (refreshed.ok && refreshed.token && refreshed.wallet_address) {
            tokenManager.set(refreshed.token, refreshed.wallet_address);
          }
        }
        return 'ok';
      }
      return 'to-link';
    } catch {
      return 'to-link';
    }
  }

  // 4) Other cases: do nothing special
  return 'skip';
}

async function determineFlow(): Promise<'ok' | 'to-login' | 'to-link'> {
  let walletHasToken = tokenManager.has();

  let googleMe: GoogleMe | null = null;
  try { googleMe = await fetchGoogleMe(); } catch { googleMe = null; }

  const linkResult = await tryAutoLinkIfNeeded(googleMe);

  // tokenManager may be mutated in tryAutoLinkIfNeeded
  walletHasToken = tokenManager.has();

  // If neither Google nor wallet auth exists, go to login
  if (!googleMe?.ok && !walletHasToken) return 'to-login';
  if (linkResult === 'to-link') return 'to-link';

  const valid = await validateToken();
  if (!valid) {
    if (walletHasToken && googleMe?.ok) {
      try { await unlinkGoogleWeb3WalletBySession(); } catch (err) { console.error(err); }
    }
    tokenManager.clear();
    return 'to-login';
  }

  const address = tokenManager.getAddress();
  if (!address) { tokenManager.clear(); return 'to-login'; }

  return 'ok';
}

// ------------------------------
// Unified auth flow used by ROOT route
// ------------------------------
async function runAuthFlow(roomId: string | undefined) {
  // lightweight inlined loader; replace with your own
  document.body.setAttribute('data-loading', '1');
  try {
    const next = await determineFlow();

    if (next === 'to-login') {
      router.navigate(ROUTES.LOGIN);
      return;
    }
    if (next === 'to-link') {
      router.navigate(ROUTES.LINK_WALLET);
      return;
    }

    // Auth OK → decide content based on path
    const view = roomId ? createChatRoomView(router, roomId) : createHomeView(router);
    showAuthed(view);

    // Let layout settle then scroll (for chat UIs)
    scrollBottomSoon();
    window.setTimeout(scrollBottomSoon, 120);
  } finally {
    document.body.removeAttribute('data-loading');
  }
}

// ------------------------------
// Initial URL handling (preserve old `p` param behavior)
// ------------------------------
const p = urlParams.get('p');
if (p) {
  history.replaceState({}, '', p);
}

// ------------------------------
// Routes (thin handlers, no duplicate auth logic)
// ------------------------------
router.on(ROUTES.ROOT, async () => {
  await runAuthFlow(undefined);
});

router.on(ROUTES.LOGIN, () => {
  if (tokenManager.has()) return router.navigate(ROUTES.ROOT);
  showUnauthed(() => createLoginView(router));
});

router.on(ROUTES.LINK_WALLET, () => {
  if (tokenManager.has()) return router.navigate(ROUTES.ROOT);
  showUnauthed(() => createGoogleLinkWeb3WalletView(router));
});

router.on(ROUTES.ROOM, (match) => {
  const roomId = match?.data?.roomId as string | undefined;
  if (!roomId) return router.navigate(ROUTES.ROOT);
  // defer auth check to unified flow
  runAuthFlow(roomId);
});

router.notFound(() => router.navigate(ROUTES.ROOT));

// Kick things off
router.resolve();

// Final safety: ensure token validity on load (parity with previous code)
(async () => {
  const ok = await validateToken();
  if (!ok) {
    tokenManager.clear();
    router.resolve();
    return;
  }

  const address = tokenManager.getAddress();
  if (!address) {
    tokenManager.clear();
    router.resolve();
    return;
  }

  router.resolve();
})();
