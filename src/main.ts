import { defineCustomElements } from '@ionic/core/loader';
import Navigo from 'navigo';
import { TokenManager } from './auth/token-mananger';
import { validateToken } from './auth/validate';
import { createRainbowKit } from './components/wallet';
import './main.less';
import { createHomeView } from './views/authenticated/home';
import { createLayoutView } from './views/authenticated/layout';
import { createLoginView } from './views/unauthenticated/login';
import { View } from './views/view';

defineCustomElements(window);
document.documentElement.setAttribute('mode', 'ios');
document.body.appendChild(createRainbowKit());

const params = new URLSearchParams(location.search);
const p = params.get('p');

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
  if (!TokenManager.has()) {
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
  requireAuth(() => renderContent(createHomeView()));
});

router.on('/login', () => {
  if (layoutView) {
    layoutView.remove();
    layoutView = undefined;
    contentContainer = undefined;
  }

  if (TokenManager.has()) {
    router.navigate('/');
  } else {
    renderLogin();
  }
});

(async () => {
  const ok = await validateToken();
  if (!ok) {
    TokenManager.clear();
    router.resolve();
    return;
  }

  const address = TokenManager.getAddress();
  if (!address) {
    TokenManager.clear();
    router.resolve();
    return;
  }

  router.resolve();
})();
