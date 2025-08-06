import { getAddress } from "viem";
class TokenManager {
    static TOKEN_KEY = 'token';
    static ADDRESS_KEY = 'token_address';
    static set(token, address) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.ADDRESS_KEY, getAddress(address));
    }
    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY) ?? undefined;
    }
    static getAddress() {
        return localStorage.getItem(this.ADDRESS_KEY) ?? undefined;
    }
    static clear() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ADDRESS_KEY);
    }
    static has() {
        return !!this.getToken();
    }
    static isMatchedWith(currentAddress) {
        const saved = this.getAddress();
        return saved !== undefined && saved === getAddress(currentAddress);
    }
}
export { TokenManager };
//# sourceMappingURL=token-mananger.js.map