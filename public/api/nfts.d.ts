export type HeldNft = {
    collection: string;
    id: number;
    holder: string;
    type?: string | null;
    gender?: string | null;
    parts?: string | null;
    image?: string | null;
    contract_addr?: string;
};
export type FetchHeldNftsOptions = {
    collection?: string;
    start?: number;
    end?: number;
    cursor?: string;
    limit?: number | string;
};
/**
 * 지갑 주소가 보유한 NFT 전체를 조회
 * 백엔드 라우팅이 `/{holder}/nfts` (endsWith('/nfts'))인 점을 활용합니다.
 */
export declare function fetchHeldNfts(holder: string, opts?: FetchHeldNftsOptions): Promise<HeldNft[]>;
/** 선택적으로 토큰 id 목록으로 상세를 받아와야 할 때 (백엔드에 /nfts/by-ids 존재) */
export declare function fetchNftsByIds(params: {
    nft_address: string;
    token_ids: (number | string)[];
}): Promise<HeldNft[]>;
//# sourceMappingURL=nfts.d.ts.map