import { openWalletConnectModal, tokenManager, wagmiConfig } from '@gaiaprotocol/client-common';
import { SlButton } from '@shoelace-style/shoelace';
import { disconnect, getAccount, watchAccount } from '@wagmi/core';
import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { googleLogin } from '../../auth/google-login';
import { requestLogin } from '../../auth/login';
import { signMessage } from '../../auth/siwe';
import { showErrorAlert } from '../../components/alert';
import { View } from '../view';
import './login.css';
import logoImage from './logo.png';

async function ensureWalletConnected(): Promise<`0x${string}`> {
  const account = getAccount(wagmiConfig);
  if (!account.isConnected || !account.address) {
    throw new Error('지갑 연결이 필요합니다.');
  }
  return account.address;
}

async function handleLoginClick(router: Navigo) {
  try {
    const address = await ensureWalletConnected();
    const signature = await signMessage(address);
    const token = await requestLogin(address, signature);

    tokenManager.set(token, address);
    router.navigate('/');
  } catch (err) {
    console.error(err);
    showErrorAlert('오류', err instanceof Error ? err.message : String(err));
  }
}

// ✅ Google 로그인 버튼 핸들러 (Valhalla 방식과 동일 인터페이스)
async function handleGoogleLogin(router: Navigo, btn: SlButton) { // <-- NEW
  btn.loading = true;
  try {
    // googleLogin 내부에서 토큰 발급/백엔드 교환/토큰 저장까지 처리되도록 구성
    await googleLogin();
    router.navigate('/');
  } catch (err) {
    console.error(err);
    showErrorAlert('오류', err instanceof Error ? err.message : String(err));
  } finally {
    btn.loading = false;
  }
}

export function createLoginView(router: Navigo): View {
  const logo = el('img.login-logo', {
    src: logoImage,
    alt: 'Mate App Logo',
  });

  const description = el(
    'p.login-description',
    '지갑을 연결하고 메시지에 서명해\nMate에 접속하세요.',
  );

  const connectButton = el(
    'sl-button.login-button',
    {
      variant: 'primary',
      onclick: () => {
        if (getAccount(wagmiConfig).isConnected) {
          disconnect(wagmiConfig);
          signButton.loading = false;
        } else {
          openWalletConnectModal();
        }
      }
    },
    '1. 지갑 연결'
  ) as SlButton;

  const isConnected = getAccount(wagmiConfig).isConnected;
  const signButton = el(
    'sl-button.login-button',
    {
      variant: isConnected ? 'primary' : 'default',
      disabled: !isConnected,
      onclick: async () => {
        signButton.loading = true;
        try {
          await handleLoginClick(router);
        } finally {
          signButton.loading = false;
        }
      }
    },
    '2. 메시지 서명'
  ) as SlButton;

  function isAndroidWebView() {
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get('platform');
    const source = urlParams.get('source');

    return platform === 'android' && source === 'webview';
  }

  // ---------- NEW: OR Divider + Google 버튼 ----------
  const orDivider = el(
    '.login-or',
    el('span.login-or-line'),
    el(
      'span.login-or-text',
      '이미 지갑이 연동된 경우 구글로 바로 로그인하거나, 로그인 후 지갑을 연동할 수 있어요.'
    ),
    el('span.login-or-line'),
  );

  const googleButton = el(
    'sl-button.login-button.google',
    {
      variant: 'default',
      'aria-label': 'Google로 계속하기',
      onclick: async (e: MouseEvent) => {
        await handleGoogleLogin(router, e.currentTarget as SlButton);
      }
    },
    el('.login-google-content',
      el('.login-google-icon'),
      el('span.login-google-text', 'Google로 계속하기')
    )
  ) as SlButton;
  // ---------------------------------------------------

  const wrapper = el(
    '.login-wrapper',
    logo,
    description,
    el('.klip-alert-wrapper',
      el(
        'sl-alert.klip-alert',
        {
          open: true,
        },
        el('sl-icon', { slot: 'icon', name: 'info-circle' }),
        'Klip을 사용하시는 경우, WalletConnect를 통해 접속해주세요.'
      ),
    ),
    connectButton,
    signButton,
    orDivider,      // <-- NEW
    googleButton,   // <-- NEW
  );

  const unwatch = watchAccount(wagmiConfig, {
    onChange(account) {
      if (account.isConnected) {
        connectButton.textContent = '지갑 연결 해제';
        connectButton.variant = 'default';
        signButton.disabled = false;
        signButton.variant = 'primary';
      } else {
        connectButton.textContent = '1. 지갑 연결';
        connectButton.variant = 'primary';
        signButton.disabled = true;
        signButton.variant = 'default';
      }
    }
  });

  return {
    el: wrapper,
    remove: () => {
      wrapper.remove();
      unwatch();
    }
  };
}
