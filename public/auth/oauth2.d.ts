export declare function oauth2Start(provider: string): void;
export declare function oauth2LoginWithIdToken(provider: string, idToken: string, nonce: string): Promise<{
    ok: boolean;
}>;
export type OAuth2MeResult = {
    ok?: boolean;
    user?: {
        sub?: string;
        id?: string;
        email?: string;
        name?: string;
        picture?: string;
    };
    provider?: string;
    token_expires_in?: number;
    sub?: string;
    wallet_address?: `0x${string}`;
    token?: string;
    linked_at?: number;
    email?: string;
};
export declare function oauth2Me(): Promise<OAuth2MeResult>;
export declare function oauth2MeByToken(provider: string): Promise<OAuth2MeResult>;
export declare function oauth2Logout(): Promise<void>;
export declare function oauthLinkWallet(): Promise<any>;
export declare function oauthUnlinkWalletByToken(): Promise<void>;
export declare function oauthUnlinkWalletBySession(): Promise<void>;
//# sourceMappingURL=oauth2.d.ts.map