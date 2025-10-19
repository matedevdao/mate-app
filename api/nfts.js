import { getAddress } from 'viem';
/**
 * 지갑 주소가 보유한 NFT 전체를 조회
 * 백엔드 라우팅이 `/{holder}/nfts` (endsWith('/nfts'))인 점을 활용합니다.
 */
export async function fetchHeldNfts(holder, opts = {}) {
    if (!holder)
        return [];
    const normalized = getAddress(holder);
    const url = new URL(`${NFT_API_BASE_URI}/${normalized}/nfts`);
    // 백엔드가 지원하는 쿼리만 붙여주세요.
    if (opts.collection)
        url.searchParams.set('collection', opts.collection);
    if (opts.start !== undefined)
        url.searchParams.set('start', String(opts.start));
    if (opts.end !== undefined)
        url.searchParams.set('end', String(opts.end));
    if (opts.limit !== undefined)
        url.searchParams.set('limit', String(opts.limit));
    if (opts.cursor)
        url.searchParams.set('cursor', opts.cursor);
    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`fetchHeldNfts failed: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to fetch held NFTs: ${res.status}`);
    }
    const data = await res.json();
    // 배열 또는 { items, nextCursor } 형태 모두 대응
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    return items;
}
/** 선택적으로 토큰 id 목록으로 상세를 받아와야 할 때 (백엔드에 /nfts/by-ids 존재) */
export async function fetchNftsByIds(params) {
    const body = {
        nft_address: getAddress(params.nft_address),
        token_ids: params.token_ids.map(id => Number(id)),
    };
    const res = await fetch(`${NFT_API_BASE_URI}/nfts/by-ids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`fetchNftsByIds failed: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to fetch NFTs by ids: ${res.status}`);
    }
    const items = await res.json();
    return items;
}
//# sourceMappingURL=nfts.js.map