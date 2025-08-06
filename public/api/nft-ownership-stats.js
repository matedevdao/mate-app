export async function fetchNftOwnershipStats(address) {
    const res = await fetch(`${API_URI}/nft-ownership-stats?address=${address}`);
    if (!res.ok) {
        throw new Error(`NFT 소유 상태 확인에 실패했습니다. (status: ${res.status})`);
    }
    const result = await res.json();
    return result;
}
//# sourceMappingURL=nft-ownership-stats.js.map