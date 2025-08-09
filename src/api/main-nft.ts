import { tokenManager } from "@gaiaprotocol/client-common";
import { getAddress } from "viem";

declare const API_BASE_URI: string;

export interface MainNftData {
  collection: string;              // 컬렉션(방) 주소
  user_address: string;            // 조회 계정 주소
  contract_addr?: string;          // NFT 컨트랙트 주소
  token_id?: string;               // 토큰 ID (문자열로 보관 권장)
  selected_at?: number;            // 선택 시각 (unix seconds)
}

export interface SetMainNftParams {
  collection: string;              // 방(=콜렉션) 주소
  contractAddr: string;            // NFT 컨트랙트 주소
  tokenId: string | number;        // 토큰 ID
}

export async function fetchMyMainNft(collection: string): Promise<MainNftData> {
  const res = await fetch(`${API_BASE_URI}/get-my-main-nft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${tokenManager.getToken()}`,
    },
    body: JSON.stringify({ collection }), // ✅ body로 보냄
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`fetchMyMainNft failed: ${res.status} ${res.statusText}`, text);
    throw new Error(`Failed to fetch my main nft: ${res.status}`);
  }

  return res.json();
}

/**
 * 메인 NFT 설정 (현재 인증된 계정)
 * 서버 라우팅: POST /set-main-nft
 * body: { collection, contract_addr, token_id }
 */
export async function setMainNft(params: SetMainNftParams): Promise<{ success: boolean }> {
  const body = {
    collection: params.collection,
    contract_addr: getAddress(params.contractAddr),
    token_id: String(params.tokenId),
  };

  const res = await fetch(`${API_BASE_URI}/set-main-nft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${tokenManager.getToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`setMainNft failed: ${res.status} ${res.statusText}`, text);
    throw new Error(`Failed to set main nft: ${res.status}`);
  }

  return res.json();
}
