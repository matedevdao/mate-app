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
    searchPlaceholder?: string;
    noContract?: string;
    selected?: string;
};
type SelectMainNftOptions = {
    loadItems: () => Promise<NftItem[]>;
    onSelected: (contractAddr: string, tokenId: string) => Promise<void> | void;
    preselectedId?: string | null;
    labels?: Labels;
    /** 고정 열 수를 원할 때 사용(기본 자동 배치) */
    columns?: number | null;
    /** 카드 이미지 높이(기본 160px) */
    cardImageHeight?: number;
    defaultContractAddr?: string;
};
export declare function createSelectMainNftModal(options: SelectMainNftOptions): HTMLIonModalElement;
export {};
//# sourceMappingURL=select-main-nft.d.ts.map