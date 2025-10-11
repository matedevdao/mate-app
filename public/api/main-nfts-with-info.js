import { getAddress } from 'viem';
/**
 * 여러 주소의 메인 NFT 정보를 조회 (상세 NFT 포함)
 * 서버: POST /get-main-nfts-with-info
 * body: { collection, addresses }
 */
export async function fetchMainNftsWithInfo(collection, addresses) {
    if (addresses.length === 0)
        return [];
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
    const data = await res.json();
    return data;
}
/** 편의: 단일 주소만 조회 */
export async function fetchMyMainNftWithInfo(collection, address) {
    const list = await fetchMainNftsWithInfo(collection, [address]);
    return list[0] ?? null;
}
//# sourceMappingURL=main-nfts-with-info.js.map