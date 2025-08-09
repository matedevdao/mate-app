import { tokenManager } from "@gaiaprotocol/client-common";
export async function validateToken() {
    const token = tokenManager.getToken();
    if (!token)
        return false;
    const res = await fetch(`${API_BASE_URI}/validate-token`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        tokenManager.clear();
        return false;
    }
    return true;
}
//# sourceMappingURL=validate.js.map