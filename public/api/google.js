const GOOGLE_ME_PATH = `${API_BASE_URI}/google-me`;
const GOOGLE_ME_BY_WALLET_PATH = `${API_BASE_URI}/google-me-by-wallet`;
const GOOGLE_LOGOUT_PATH = `${API_BASE_URI}/google-logout`;
const LINK_WALLET_PATH = `${API_BASE_URI}/google-link-web3-wallet`;
const UNLINK_WALLET_BY_TOKEN_PATH = `${API_BASE_URI}/google-unlink-web3-wallet-by-token`;
const UNLINK_WALLET_BY_SESSION_PATH = `${API_BASE_URI}/google-unlink-web3-wallet-by-session`;
const GOOGLE_VERIFY_PATH = `${API_BASE_URI}/oauth2/verify`;
// ─────────────────────────────────────────────────────────────
// Common fetch helpers
// ─────────────────────────────────────────────────────────────
async function parseError(res, fallback) {
    let message = `${fallback}: ${res.status}`;
    try {
        const data = await res.json();
        if (data?.error)
            message = data.error;
    }
    catch {
        try {
            const text = await res.text();
            if (text)
                message = text;
        }
        catch { /* ignore */ }
    }
    throw new Error(message);
}
async function getJson(url) {
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok)
        await parseError(res, `GET ${url} failed`);
    return (await res.json());
}
async function getJsonAuth(url, authToken) {
    if (!authToken)
        throw new Error('Missing authorization token.');
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    });
    if (!res.ok)
        await parseError(res, `GET ${url} failed`);
    return (await res.json());
}
async function postJson(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok)
        await parseError(res, `POST ${url} failed`);
    try {
        return (await res.json());
    }
    catch {
        return {};
    }
}
async function postJsonAuth(url, authToken, body) {
    if (!authToken)
        throw new Error('Missing authorization token.');
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok)
        await parseError(res, `POST ${url} failed`);
    try {
        return (await res.json());
    }
    catch {
        return {};
    }
}
// ─────────────────────────────────────────────────────────────
// Public APIs
// ─────────────────────────────────────────────────────────────
/** 쿠키 세션 기반: 내 세션/토큰/지갑 상태 조회 */
export async function fetchGoogleMe() {
    return await getJson(GOOGLE_ME_PATH);
}
/** 지갑 JWT 기반: 지갑 주소로 연동된 Google 계정 조회 */
export async function fetchGoogleMeByWallet(authToken) {
    return await getJsonAuth(GOOGLE_ME_BY_WALLET_PATH, authToken);
}
/** 쿠키 세션 기반: 서버 세션 로그아웃 */
export async function logoutGoogle() {
    await postJson(GOOGLE_LOGOUT_PATH);
}
/** 지갑 JWT 기반: Google 계정과 Web3 지갑 주소 링크 */
export async function linkGoogleWeb3Wallet(authToken) {
    // 서버는 바디를 사용하지 않으므로 빈 바디
    return await postJsonAuth(LINK_WALLET_PATH, authToken, {});
}
/** 지갑 JWT 기반: 링크 해제 */
export async function unlinkGoogleWeb3WalletByToken(authToken) {
    return await postJsonAuth(UNLINK_WALLET_BY_TOKEN_PATH, authToken, {});
}
/** 쿠키 세션 기반: 링크 해제 */
export async function unlinkGoogleWeb3WalletBySession() {
    return await postJson(UNLINK_WALLET_BY_SESSION_PATH);
}
async function postJsonWithCreds(url, body, credentials = "include") {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok)
        await parseError(res, `POST ${url} failed`);
    try {
        return (await res.json());
    }
    catch {
        return {};
    }
}
/** ID 토큰 검증 전담: 서버가 ID 토큰/nonce 검증 및 세션 수립 */
export async function verifyGoogleLogin(payload) {
    // 보안/쿠키 세팅 목적상 credentials: 'include' 유지
    return await postJsonWithCreds(GOOGLE_VERIFY_PATH, payload, "include");
}
//# sourceMappingURL=google.js.map