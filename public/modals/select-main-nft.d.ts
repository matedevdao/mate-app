export type NftItem = {
    id: string;
    name?: string;
    image?: string | null;
    contractAddr?: string;
};
type Labels = {
    title?: string;
    description?: string;
    cancel?: string;
    confirm?: string;
    loading?: string;
    empty?: string;
    loadError?: string;
    unnamed?: string;
};
type SelectMainNftOptions = {
    loadItems: () => Promise<NftItem[]>;
    onSelected: (contractAddr: string, tokenId: string) => Promise<void> | void;
    preselectedId?: string | null;
    labels?: Labels;
    columns?: number;
    cardImageHeight?: number;
    defaultContractAddr?: string;
};
export declare function createSelectMainNftModal(options: SelectMainNftOptions): HTMLIonModalElement;
export {};
//# sourceMappingURL=select-main-nft.d.ts.map