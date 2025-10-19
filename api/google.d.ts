export type GoogleProfile = {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
};
export type GoogleMe = {
    ok?: boolean;
    token?: string;
    wallet_address?: `0x${string}` | null;
    profile?: GoogleProfile;
    error?: string;
};
export type GoogleMeByWallet = {
    ok?: boolean;
    wallet_address?: `0x${string}`;
    google_sub?: string;
    token?: string;
    linked_at?: number;
    profile?: GoogleProfile;
    error?: string;
};
export type LinkWalletResult = {
    ok?: boolean;
    wallet_address?: `0x${string}`;
    google_sub?: string;
    token?: string;
    linked_at?: number;
    profile?: GoogleProfile;
    error?: string;
};
export type UnlinkWalletResult = {
    ok?: boolean;
    error?: string;
};
/** 쿠키 세션 기반: 내 세션/토큰/지갑 상태 조회 */
export declare function fetchGoogleMe(): Promise<GoogleMe>;
/** 지갑 JWT 기반: 지갑 주소로 연동된 Google 계정 조회 */
export declare function fetchGoogleMeByWallet(authToken: string): Promise<GoogleMeByWallet>;
/** 지갑 JWT 기반: Google 계정과 Web3 지갑 주소 링크 */
export declare function linkGoogleWeb3Wallet(authToken: string): Promise<LinkWalletResult>;
/** 지갑 JWT 기반: 링크 해제 */
export declare function unlinkGoogleWeb3WalletByToken(authToken: string): Promise<UnlinkWalletResult>;
/** 쿠키 세션 기반: 링크 해제 */
export declare function unlinkGoogleWeb3WalletBySession(): Promise<UnlinkWalletResult>;
export type VerifyPayload = {
    provider: "google";
    idToken: string;
    nonce: string;
};
export type VerifyResult = {
    ok?: boolean;
    token?: string;
    profile?: GoogleProfile;
    wallet_address?: `0x${string}` | null;
    error?: string;
};
/** ID 토큰 검증 전담: 서버가 ID 토큰/nonce 검증 및 세션 수립 */
export declare function verifyGoogleLogin(payload: VerifyPayload): Promise<VerifyResult>;
//# sourceMappingURL=google.d.ts.map