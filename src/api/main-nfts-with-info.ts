import { getAddress } from 'viem';

declare const API_BASE_URI: string;

export type NftDetail = {
  nft_address: string;
  token_id: number;
  holder: string;
  type?: string | null;
  gender?: string | null;
  parts?: string | null;
  image?: string | null;
};

export type MainNftWithInfo = {
  collection: string;         // 컬렉션(방) 주소
  user_address: string;       // 유저 주소
  contract_addr: string;      // NFT 컨트랙트 주소
  token_id: string;           // 메인 NFT 토큰 ID
  selected_at: number;        // 선택 시각 (unix seconds)
  nft: NftDetail | null;      // 상세 NFT (없을 수 있음)
};

/**
 * 여러 주소의 메인 NFT 정보를 조회 (상세 NFT 포함)
 * 서버: POST /get-main-nfts-with-info
 * body: { collection, addresses }
 */
export async function fetchMainNftsWithInfo(
  collection: string,
  addresses: string[],
): Promise<MainNftWithInfo[]> {
  if (addresses.length === 0) return [];

  const col = collection;
  const normalized = addresses.map(getAddress);

  const res = await fetch(`${API_BASE_URI}/get-main-nfts-with-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: col, addresses: normalized }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`fetchMainNftsWithInfo failed: ${res.status} ${res.statusText}`, text);
    throw new Error(`Failed to fetch main nfts with info: ${res.status}`);
  }

  const data: MainNftWithInfo[] = await res.json();
  return data;
}

/** 편의: 단일 주소만 조회 */
export async function fetchMyMainNftWithInfo(
  collection: string,
  address: string,
): Promise<MainNftWithInfo | null> {
  const list = await fetchMainNftsWithInfo(collection, [address]);
  return list[0] ?? null;
}
