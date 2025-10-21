import { openWalletConnectModal, tokenManager, wagmiConfig } from '@gaiaprotocol/client-common';
import { SlButton } from '@shoelace-style/shoelace';
import { disconnect, getAccount, watchAccount } from '@wagmi/core';
import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { googleLogout } from '../../auth/google-login';
import { requestLogin } from '../../auth/login';
import { signMessage } from '../../auth/siwe';
import { showErrorAlert } from '../../components/alert';
import { hideLoading, showLoading } from '../../components/loading';
import { isWebView, platform } from '../../platform';
import { View } from '../view';
import './login.css';

/** 지갑 연결 보장: 연결이 없으면 에러 발생 */
async function ensureWalletConnected(): Promise<`0x${string}`> {
  const account = getAccount(wagmiConfig);
  if (!account.isConnected || !account.address) {
    throw new Error('지갑 연결이 필요합니다.');
  }
  return account.address;
}

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/mate-app/' : '/';

/** 지갑 서명 + 서버 로그인 + 토큰 저장 + 리다이렉트 */
async function handleLoginClick(router: Navigo) {
  try {
    const address = await ensureWalletConnected();
    const signature = await signMessage(address);
    const token = await requestLogin(address, signature);

    tokenManager.set(token, address);

    // 플랫폼/웹뷰 파라미터 유지하여 홈으로 이동
    let href = BASE_PATH;
    if (platform) {
      href = `${BASE_PATH}?platform=${platform}`;
      if (isWebView) href += '&source=webview';
    } else if (isWebView) {
      href = `${BASE_PATH}?source=webview`;
    }
    location.href = href;
  } catch (err) {
    console.error(err);
    showErrorAlert('오류', err instanceof Error ? err.message : String(err));
  }
}

/** Google 계정과 Web3 지갑 연동 화면 */
export function createGoogleLinkWeb3WalletView(router: Navigo): View {
  // ── 헤더/설명 ─────────────────────────────────────────────────────
  const title = el('h1.login-title', 'Web3 지갑 연결');
  const description = el(
    'p.login-description',
    'Google 계정으로 로그인되었습니다. 지갑을 연결하고 메시지 서명을 완료해 계정과 연동하세요.'
  );

  // ── Google 로그아웃 핸들러 ────────────────────────────────────────
  const handleGoogleLogout = async () => {
    showLoading();
    try {
      // 서버 세션 종료
      await googleLogout();

      // 토큰/지갑 상태 정리 (있으면 정리)
      try {
        tokenManager.clear?.();
      } catch { }
      try {
        await disconnect(wagmiConfig);
      } catch { }

      // 로그인 페이지로 이동
      router.navigate('/login');
    } catch (err) {
      console.error(err);
      showErrorAlert('로그아웃 실패', err instanceof Error ? err.message : String(err));
    } finally {
      hideLoading();
    }
  };

  // ── 버튼들 ────────────────────────────────────────────────────────
  const isConnected = getAccount(wagmiConfig).isConnected;

  // 1) 지갑 연결/해제
  const connectButton = el(
    'sl-button.login-button',
    {
      variant: 'primary',
      'aria-label': '지갑 연결',
      onclick: () => {
        if (getAccount(wagmiConfig).isConnected) {
          disconnect(wagmiConfig);
          linkButton.loading = false;
        } else {
          openWalletConnectModal();
        }
      }
    },
    '1. 지갑 연결'
  ) as SlButton;

  // 2) 지갑 연동(서명)
  const linkButton = el(
    'sl-button.login-button',
    {
      variant: isConnected ? 'primary' : 'default',
      disabled: !isConnected,
      'aria-label': '지갑 연동',
      onclick: async () => {
        linkButton.loading = true;
        try {
          await handleLoginClick(router);
        } finally {
          linkButton.loading = false;
        }
      }
    },
    '2. 지갑 연동'
  ) as SlButton;

  // 3) Google 로그아웃
  const googleLogoutButton = el(
    'sl-button.login-button.google-logout',
    {
      variant: 'default',
      'aria-label': 'Google에서 로그아웃',
      onclick: handleGoogleLogout
    },
    'Google 로그아웃'
  ) as SlButton;

  // ── 레이아웃 ─────────────────────────────────────────────────────
  const wrapper = el(
    '.login-wrapper',
    title,
    description,
    connectButton,
    linkButton,
    el(
      '.login-or',
      el('span.login-or-line'),
      el('span.login-or-text', '또는'),
      el('span.login-or-line')
    ),
    googleLogoutButton
  );

  // ── 지갑 상태 변경 반영 ───────────────────────────────────────────
  const unwatch = watchAccount(wagmiConfig, {
    onChange(account) {
      if (account.isConnected) {
        connectButton.textContent = '지갑 연결 해제';
        connectButton.variant = 'default';
        connectButton.setAttribute('aria-label', '지갑 연결 해제');

        linkButton.disabled = false;
        linkButton.variant = 'primary';
      } else {
        connectButton.textContent = '1. 지갑 연결';
        connectButton.variant = 'primary';
        connectButton.setAttribute('aria-label', '지갑 연결');

        linkButton.disabled = true;
        linkButton.variant = 'default';
      }
    }
  });

  // ── View 인터페이스 반환 ─────────────────────────────────────────
  return {
    el: wrapper,
    remove: () => {
      wrapper.remove();
      unwatch();
    }
  };
}
