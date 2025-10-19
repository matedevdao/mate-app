import { openWalletConnectModal, tokenManager, wagmiConfig } from '@gaiaprotocol/client-common';
import { disconnect, getAccount, watchAccount } from '@wagmi/core';
import { el } from "@webtaku/el";
import { googleLogout } from '../../auth/google-login';
import { requestLogin } from '../../auth/login';
import { signMessage } from '../../auth/siwe';
import { showErrorAlert } from '../../components/alert';
import { hideLoading, showLoading } from '../../components/loading';
import { isWebView, platform } from '../../platform';
import './login.css';
async function ensureWalletConnected() {
    const account = getAccount(wagmiConfig);
    if (!account.isConnected || !account.address) {
        throw new Error('지갑 연결이 필요합니다.');
    }
    return account.address;
}
async function handleLoginClick(router) {
    try {
        const address = await ensureWalletConnected();
        const signature = await signMessage(address);
        const token = await requestLogin(address, signature);
        tokenManager.set(token, address);
        let href = '/';
        if (platform) {
            href = `/?platform=${platform}`;
            if (isWebView)
                href += '&source=webview';
        }
        else if (isWebView)
            href = '/?source=webview';
        location.href = href;
    }
    catch (err) {
        console.error(err);
        showErrorAlert('Error', err instanceof Error ? err.message : String(err));
    }
}
export function createGoogleLinkWeb3WalletView(router) {
    const title = el('h1.login-title', 'Link your Web3 Wallet');
    const description = el('p.login-description', 'You’re signed in with Google. Connect your wallet and sign a message to link it to your account.');
    // ── 구글 로그아웃 핸들러 ─────────────────────────────────────────────
    const handleGoogleLogout = async () => {
        showLoading();
        try {
            // 서버 세션 종료
            await googleLogout();
            // 토큰/지갑 상태 정리
            try {
                tokenManager.clear(); // clear 메서드가 있으면 사용
            }
            catch { }
            try {
                await disconnect(wagmiConfig);
            }
            catch { }
            // 로그인 페이지로 이동
            router.navigate('/login');
        }
        catch (err) {
            console.error(err);
            showErrorAlert('Logout failed', err instanceof Error ? err.message : String(err));
        }
        finally {
            hideLoading();
        }
    };
    // ── 1) 지갑 연결/해제 버튼 ─────────────────────────────────────────
    const connectButton = el('sl-button.login-button', {
        variant: 'primary',
        onclick: () => {
            if (getAccount(wagmiConfig).isConnected) {
                disconnect(wagmiConfig);
                linkButton.loading = false;
            }
            else {
                openWalletConnectModal();
            }
        }
    }, '1. Connect Wallet');
    // ── 2) 링크(서명) 버튼 ────────────────────────────────────────────
    const isConnected = getAccount(wagmiConfig).isConnected;
    const linkButton = el('sl-button.login-button', {
        variant: isConnected ? 'primary' : 'default',
        disabled: !isConnected,
        onclick: async () => {
            linkButton.loading = true;
            try {
                await handleLoginClick(router);
            }
            finally {
                linkButton.loading = false;
            }
        }
    }, '2. Link Wallet');
    // ── 3) 구글 로그아웃 버튼 ─────────────────────────────────────────
    const googleLogoutButton = el('sl-button.login-button.google-logout', {
        variant: 'default',
        'aria-label': 'Logout from Google',
        onclick: handleGoogleLogout
    }, 'Sign out of Google');
    // 레이아웃
    const wrapper = el('.login-wrapper', title, description, connectButton, linkButton, el('.login-or', el('span.login-or-line'), el('span.login-or-text', '— or —'), el('span.login-or-line')), googleLogoutButton);
    // 지갑 상태 변경 감지
    const unwatch = watchAccount(wagmiConfig, {
        onChange(account) {
            if (account.isConnected) {
                connectButton.textContent = 'Disconnect Wallet';
                connectButton.variant = 'default';
                linkButton.disabled = false;
                linkButton.variant = 'primary';
            }
            else {
                connectButton.textContent = '1. Connect Wallet';
                connectButton.variant = 'primary';
                linkButton.disabled = true;
                linkButton.variant = 'default';
            }
        }
    });
    return {
        el: wrapper,
        remove: () => {
            wrapper.remove();
            unwatch();
        }
    };
}
//# sourceMappingURL=google-link-web3-wallet.js.map