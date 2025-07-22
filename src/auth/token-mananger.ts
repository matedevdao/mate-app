import { getAddress } from "viem";

class TokenManager {
  static readonly TOKEN_KEY = 'token';
  static readonly ADDRESS_KEY = 'token_address';

  static set(token: string, address: `0x${string}`) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ADDRESS_KEY, getAddress(address));
  }

  static getToken(): string | undefined {
    return localStorage.getItem(this.TOKEN_KEY) ?? undefined;
  }

  static getAddress(): `0x${string}` | undefined {
    return localStorage.getItem(this.ADDRESS_KEY) as `0x${string}` ?? undefined;
  }

  static clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ADDRESS_KEY);
  }

  static has(): boolean {
    return !!this.getToken();
  }

  static isMatchedWith(currentAddress: `0x${string}`): boolean {
    const saved = this.getAddress();
    return saved !== undefined && saved === getAddress(currentAddress);
  }
}

export { TokenManager };
