import { wagmiConfig } from '@gaiaprotocol/client-common';
import { signMessage as wagmiSignMessage } from '@wagmi/core';
import { createSiweMessage as viemCreateSiweMessage } from 'viem/siwe';
import { MESSAGE_FOR_WALLET_LOGIN } from '../vars';

declare const API_BASE_URI: string;

function createSiweMessage(address: `0x${string}`, nonce: string, issuedAt: string) {

  console.log({
    domain: location.host,
    address,
    statement: MESSAGE_FOR_WALLET_LOGIN,
    uri: location.origin,
    version: '1',
    chainId: 8217,
    nonce,
    issuedAt: new Date(issuedAt),
  });

  return viemCreateSiweMessage({
    domain: location.host,
    address,
    statement: MESSAGE_FOR_WALLET_LOGIN,
    uri: location.origin,
    version: '1',
    chainId: 8217,
    nonce,
    issuedAt: new Date(issuedAt),
  });
}

async function signMessage(address: `0x${string}`): Promise<`0x${string}`> {
  const response = await fetch(
    `${API_BASE_URI}/nonce`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        domain: location.host,
        uri: location.origin,
      }),
    },
  );
  if (!response.ok) throw new Error('nonce 생성에 실패했습니다');
  const { nonce, issuedAt } = await response.json();
  if (!nonce || !issuedAt) throw new Error('서버로부터 잘못된 응답을 받았습니다');

  const siweMessage = createSiweMessage(address, nonce, issuedAt);

  return await wagmiSignMessage(wagmiConfig, {
    message: siweMessage,
    account: address,
  });
}

export { signMessage };
