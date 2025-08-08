declare const API_BASE_URI: string;

type NftOwnershipStat = {
  owned: boolean;
  totalHolders: number;
};

export type NftOwnershipStatsResult = Record<string, NftOwnershipStat>;

export async function fetchNftOwnershipStats(address: `0x${string}`): Promise<NftOwnershipStatsResult> {
  const res = await fetch(`${API_BASE_URI}/nft-ownership-stats?address=${address}`);
  if (!res.ok) {
    throw new Error(`NFT 소유 상태 확인에 실패했습니다. (status: ${res.status})`);
  }
  const result = await res.json();
  return result as NftOwnershipStatsResult;
}
