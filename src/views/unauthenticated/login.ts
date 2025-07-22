import { SlButton } from '@shoelace-style/shoelace';
import { disconnect, getAccount, watchAccount } from '@wagmi/core';
import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { requestLogin } from '../../auth/login';
import { signMessage } from '../../auth/siwe';
import { TokenManager } from '../../auth/token-mananger';
import { showErrorAlert } from '../../components/alert';
import { openWalletConnectModal, wagmiConfig } from '../../components/wallet';
import { View } from '../view';
import './login.less';
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

    TokenManager.set(token, address);
    router.navigate('/');
  } catch (err) {
    console.error(err);
    showErrorAlert('오류', err instanceof Error ? err.message : String(err));
  }
}

export function createLoginView(router: Navigo): View {
  const title = el('h1.login-title', 'Mate');

  const logo = el('img.login-logo', {
    src: logoImage,
    alt: 'Mate App Logo',
  });

  const description = el(
    'p.login-description',
    '지갑을 연결하고 메시지에 서명해\nMate에 접속하세요.'
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

  const wrapper = el(
    '.login-wrapper',
    title,
    logo,
    description,
    connectButton,
    signButton
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
