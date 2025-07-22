import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { lightTheme, getDefaultWallets, RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { el } from '@webtaku/el';
import {
  createConfig,
  http,
  WagmiProvider
} from 'wagmi';
import { mainnet } from 'wagmi/chains';

const queryClient = new QueryClient();

// wagmi + rainbowkit 최신 설정
const { connectors } = getDefaultWallets({
  appName: 'Valhalla',
  projectId: '9a637488c787c2c68339c70e1319ac6a',
});

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(), // RPC를 설정
  },
  connectors,
  ssr: false, // (선택) SSR 사용하지 않을 경우
});

let openWalletConnectModal: () => void;

function ConnectModalController() {
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    openWalletConnectModal = () => {
      if (openConnectModal) openConnectModal();
    };
  }, [openConnectModal]);

  return null;
}

function createRainbowKit() {
  const container = el();
  createRoot(container).render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={lightTheme()}>
          <ConnectModalController />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
  return container;
}

export {
  createRainbowKit,
  openWalletConnectModal, config as wagmiConfig
};
