import { tokenManager } from "@gaiaprotocol/client-common";
import { getAddress } from "viem";
export async function fetchMyMainNft(collection) {
    const res = await fetch(`${API_BASE_URI}/get-my-main-nft`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${tokenManager.getToken()}`,
        },
        body: JSON.stringify({ collection }), // ✅ body로 보냄
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`fetchMyMainNft failed: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to fetch my main nft: ${res.status}`);
    }
    return res.json();
}
/**
 * 메인 NFT 설정 (현재 인증된 계정)
 * 서버 라우팅: POST /set-main-nft
 * body: { collection, contract_addr, token_id }
 */
export async function setMainNft(params) {
    const body = {
        collection: params.collection,
        contract_addr: getAddress(params.contractAddr),
        token_id: String(params.tokenId),
    };
    const res = await fetch(`${API_BASE_URI}/set-main-nft`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${tokenManager.getToken()}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`setMainNft failed: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to set main nft: ${res.status}`);
    }
    return res.json();
}
//# sourceMappingURL=main-nft.js.map