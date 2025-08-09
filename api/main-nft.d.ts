export interface MainNftData {
    collection: string;
    user_address: string;
    contract_addr?: string;
    token_id?: string;
    selected_at?: number;
}
export interface SetMainNftParams {
    collection: string;
    contractAddr: string;
    tokenId: string | number;
}
export declare function fetchMyMainNft(collection: string): Promise<MainNftData>;
/**
 * 메인 NFT 설정 (현재 인증된 계정)
 * 서버 라우팅: POST /set-main-nft
 * body: { collection, contract_addr, token_id }
 */
export declare function setMainNft(params: SetMainNftParams): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=main-nft.d.ts.map