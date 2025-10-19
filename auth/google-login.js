import { logoutGoogle, verifyGoogleLogin } from "../api/google";
import { isWebView, platform } from "../platform";
const GOOGLE_LOGIN_PATH = `${API_BASE_URI}/google-login`;
export function googleLogin() {
    if (isWebView && window.Native?.signInWithGoogle) {
        window.Native.signInWithGoogle();
    }
    else if (isWebView && window.Android?.signInWithGoogle) {
        window.Android.signInWithGoogle();
    }
    else {
        location.href = GOOGLE_LOGIN_PATH;
    }
}
let signOutResolve;
export async function googleLogout() {
    if (isWebView && window.Native?.signOutFromGoogle) {
        window.Native.signOutFromGoogle();
        return new Promise(resolve => signOutResolve = resolve);
    }
    else if (isWebView && window.Android?.signOutFromGoogle) {
        window.Android.signOutFromGoogle();
        return new Promise(resolve => signOutResolve = resolve);
    }
    else {
        await logoutGoogle();
    }
}
if (isWebView) {
    window.addEventListener('googleSignInComplete', async (e) => {
        const { idToken, nonce } = e.detail;
        try {
            // 서버에서 구글 공개키로 ID 토큰 검증 + nonce 검증 + aud(=WEB_CLIENT_ID) 검증 필수
            const { ok } = await verifyGoogleLogin({ provider: 'google', idToken, nonce });
            if (ok)
                location.href = `/?platform=${platform}&source=webview`;
            else {
                const toast = document.createElement("ion-toast");
                toast.message = `Google sign-in failed. ${e.detail.message}`;
                toast.duration = 1600;
                toast.position = "bottom";
                document.body.appendChild(toast);
                toast.present();
            }
        }
        catch (error) {
            const toast = document.createElement("ion-toast");
            toast.message = `Google sign-in failed. ${error.message}`;
            toast.duration = 1600;
            toast.position = "bottom";
            document.body.appendChild(toast);
            toast.present();
        }
    });
    window.addEventListener('googleSignInFailed', (e) => {
        console.warn('Google sign-in failed', e.detail);
        const toast = document.createElement("ion-toast");
        toast.message = `Google sign-in failed. ${e.detail.message}`;
        toast.duration = 1600;
        toast.position = "bottom";
        document.body.appendChild(toast);
        toast.present();
    });
    window.addEventListener('googleSignOutComplete', () => {
        signOutResolve?.();
    });
    window.addEventListener('googleSignOutFailed', (e) => {
        console.error('Sign-out failed:', e.detail?.message);
        const toast = document.createElement("ion-toast");
        toast.message = `Google sign-out failed. ${e.detail.message}`;
        toast.duration = 1600;
        toast.position = "bottom";
        document.body.appendChild(toast);
        toast.present();
    });
}
//# sourceMappingURL=google-login.js.map