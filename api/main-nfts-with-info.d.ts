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
    collection: string;
    user_address: string;
    contract_addr: string;
    token_id: string;
    selected_at: number;
    nft: NftDetail | null;
};
/**
 * 여러 주소의 메인 NFT 정보를 조회 (상세 NFT 포함)
 * 서버: POST /get-main-nfts-with-info
 * body: { collection, addresses }
 */
export declare function fetchMainNftsWithInfo(collection: string, addresses: string[]): Promise<MainNftWithInfo[]>;
/** 편의: 단일 주소만 조회 */
export declare function fetchMyMainNftWithInfo(collection: string, address: string): Promise<MainNftWithInfo | null>;
//# sourceMappingURL=main-nfts-with-info.d.ts.map