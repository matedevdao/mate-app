import { chatProfileService } from '@gaiaprotocol/chat-client';
import { createRainbowKit, tokenManager } from '@gaiaprotocol/client-common';
import { BackButtonEvent, setupConfig } from '@ionic/core';
import { defineCustomElements } from '@ionic/core/loader';
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import Navigo from 'navigo';
import { fetchProfiles } from './api/profile';
import { validateToken } from './auth/validate';
import './main.css';
import { createChatRoomView } from './views/authenticated/chatroom';
import { createHomeView } from './views/authenticated/home';
import { createLayoutView } from './views/authenticated/layout';
import { createLoginView } from './views/unauthenticated/login';
import { View } from './views/view';

setupConfig({
  hardwareBackButton: true,
  experimentalCloseWatcher: true
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

const urlParams = new URLSearchParams(window.location.search);
const isWebView = urlParams.get('source') === 'webview';
if (!isWebView) {

  const firebaseConfig = {
    apiKey: 'AIzaSyBbwkLP-C61kWmzCq-pFdvSJXHHUjmoRK0',
    authDomain: 'mate-ba361.firebaseapp.com',
    projectId: 'mate-ba361',
    storageBucket: 'mate-ba361.firebasestorage.app',
    messagingSenderId: '996341622273',
    appId: '1:996341622273:web:f1a110eea9820b30ad8200',
    measurementId: 'G-1V0KFDFZTF'
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  async function requestNotificationPermission() {
    return new Promise<NotificationPermission>((resolve) => {
      Notification.requestPermission((permission) => resolve(permission));
    });
  }

  /*requestNotificationPermission().then((permission) => {
    if (permission === "granted") {
      getToken(messaging, { vapidKey: 'BM3LFF_FNEgmlM6lvonw-qwKHQYp2tdTKuSUmo2CRi6yJwmRMyK77C2yboTUswiWGvzMad26W5GljYgMkC8lgfY' }).then((token) => {
        console.log(token);
      });
    } else {
      console.log("Permission denied:", permission);
    }
  });*/
}

chatProfileService.init(async (addresses) => {
  const profiles = await fetchProfiles(addresses);
  return profiles;
})

const p = urlParams.get('p');

if (p) {
  // 쿼리스트링을 클리어하고, 라우터로 이동
  history.replaceState({}, '', p);
}

const router = new Navigo(process.env.NODE_ENV === 'production' ? '/mate-app/' : '/');

let layoutView: View | undefined;
let contentContainer: HTMLElement | undefined;
let loginView: View | undefined;

function removeLoginView() {
  loginView?.remove();
  loginView = undefined;
}

function requireAuth(next: () => void) {
  if (!tokenManager.has()) {
    router.navigate('/login');
  } else {
    next();
  }
}

/**
 * 최초 로그인 후 layout을 생성하고 content만 교체
 */
function renderContent(content: View) {
  removeLoginView();

  if (!layoutView) {
    layoutView = createLayoutView(router);
    contentContainer = layoutView.el.querySelector('.content') as HTMLElement;
    contentContainer.appendChild(content.el);
    document.body.appendChild(layoutView.el);
  } else {
    contentContainer!.innerHTML = '';
    contentContainer!.appendChild(content.el);
  }
}

/**
 * layout을 완전히 제거하고 로그인 화면 표시
 */
function renderLogin() {
  if (layoutView) {
    layoutView.remove();
    layoutView = undefined;
    contentContainer = undefined;
  }
  removeLoginView();

  loginView = createLoginView(router);
  document.body.appendChild(loginView.el);
}

router.on('/', () => {
  removeLoginView();
  requireAuth(() => renderContent(createHomeView(router)));
});

router.on('/login', () => {
  if (layoutView) {
    layoutView.remove();
    layoutView = undefined;
    contentContainer = undefined;
  }

  if (tokenManager.has()) {
    router.navigate('/');
  } else {
    renderLogin();
  }
});

router.on('/:roomId', (match) => {
  const roomId = match?.data?.roomId;
  if (roomId) {
    renderContent(createChatRoomView(router, roomId));
  } else {
    router.navigate('/');
  }
});

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
