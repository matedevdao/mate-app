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
    /** 현재 컨텍스트(콜렉션)에서 아이템 로드 */
    loadItems: () => Promise<NftItem[]>;
    /** 선택 완료 콜백: (컨트랙트 주소, 토큰 ID) */
    onSelected: (contractAddr: string, tokenId: string) => Promise<void> | void;
    /** 미리 선택되어 있어야 하는 id(선택 강조용, 선택 유지) */
    preselectedId?: string | null;
    /** 표시 문구 커스터마이즈 */
    labels?: Labels;
    /** 격자 열 수 (기본 2) */
    columns?: number;
    /** 카드 이미지 높이 (기본 140px) */
    cardImageHeight?: number;
    /** ✅ 아이템에 contractAddr가 없을 때 사용할 기본 컨트랙트 주소 */
    defaultContractAddr?: string;
};
export declare function createSelectMainNftModal(options: SelectMainNftOptions): HTMLIonModalElement;
export {};
//# sourceMappingURL=select-main-nft.d.ts.map