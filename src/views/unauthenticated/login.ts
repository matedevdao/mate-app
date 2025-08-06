import { openWalletConnectModal, tokenManager, wagmiConfig } from '@gaiaprotocol/client-common';
import { SlButton } from '@shoelace-style/shoelace';
import { disconnect, getAccount, watchAccount } from '@wagmi/core';
import { el } from '@webtaku/el';
import Navigo from 'navigo';
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

  const wrapper = el(
    '.login-wrapper',
    logo,
    description,
    el(
      'sl-alert.klip-alert',
      {
        open: true,
      },
      el('sl-icon', { slot: 'icon', name: 'info-circle' }),
      isAndroidWebView() ?
        `👋 Google Play 검토팀께,
이 앱에 대한 접근 안내는 Play Console의 "앱 액세스 안내" 항목에 모두 작성되어 있습니다.
앱 테스트를 위해 필요한 지침은 해당 항목을 참고해 주세요.
검토해 주셔서 감사합니다!` :
        'Klip을 사용하시는 경우, WalletConnect를 통해 접속해주세요.'
    ),
    connectButton,
    signButton,
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
