import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { connectorsForWallets, lightTheme, RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { kaiaWallet, metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { el } from '@webtaku/el';
import {
  createConfig,
  http,
  WagmiProvider
} from 'wagmi';
import { kaia, mainnet } from 'wagmi/chains';

const queryClient = new QueryClient();

// wagmi + rainbowkit 최신 설정
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [kaiaWallet, metaMaskWallet, walletConnectWallet],
  },
], {
  appName: 'Mate',
  projectId: 'faa5a33f9f8688fcb9bc3c412e6a8ddb',
});

const config = createConfig({
  chains: [mainnet, kaia],
  transports: {
    [mainnet.id]: http(), // RPC를 설정
    [kaia.id]: http(), // RPC를 설정
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
