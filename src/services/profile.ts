import { tokenManager } from '@gaiaprotocol/client-common';
import { getAddress } from 'viem';
import { fetchProfile } from '../api/profile';

/** 캐시에 저장되는 구조 */
type ProfileEntry = {
  nickname?: string | null;
  bio?: string | null;
  fetchedAt: number;
};

const TTL = 10 * 60 * 1000; // 10분

class ProfileService extends EventTarget {
  #cache = new Map<string, ProfileEntry>();
  #inflight = new Set<string>();

  /** 주소를 등록(=프리로드). */
  preload(accounts: string[]) {
    const toFetch = accounts
      .map(a => getAddress(a))
      .filter(a => this.#needsRefresh(a));
    if (toFetch.length) this.#fetchBatch(toFetch);
  }

  /**
   * 비동기로 최신 프로필을 반환.
   */
  async resolve(account: string): Promise<ProfileEntry | undefined> {
    const addr = getAddress(account);
    if (this.#needsRefresh(addr)) await this.#fetchBatch([addr]);
    return this.#cache.get(addr);
  }

  /**
   * 캐시된(혹은 오래된) 값 그대로 반환. 없으면 undefined
   */
  getCached(account: string): ProfileEntry | undefined {
    return this.#cache.get(getAddress(account));
  }

  /**
   * 강제로 프로필을 주입합니다.
   */
  setProfile(account: string, nickname?: string, bio?: string) {
    const addr = getAddress(account);
    const prev = this.#cache.get(addr);

    this.#cache.set(addr, {
      nickname,
      bio,
      fetchedAt: Date.now()
    });

    this.#emitIfChanged(addr, prev, { nickname, bio });
  }

  /* ---------- 내부 ---------- */

  #needsRefresh(addr: string) {
    const entry = this.#cache.get(getAddress(addr));
    return !entry || Date.now() - entry.fetchedAt > TTL;
  }

  async #fetchBatch(addresses: string[], force = false) {
    const targets = addresses.filter(a => {
      if (this.#inflight.has(a)) return false;
      if (!force && !this.#needsRefresh(a)) return false;
      return true;
    });
    if (!targets.length) return;

    targets.forEach(a => this.#inflight.add(a));

    try {
      const results = await Promise.all(
        targets.map(async addr => {
          const profile = await fetchProfile(addr as `0x${string}`);
          return [getAddress(addr), profile] as const;
        })
      );

      for (const [addr, profile] of results) {
        const prev = this.#cache.get(addr);

        this.#cache.set(addr, {
          nickname: profile?.nickname ?? null,
          bio: profile?.bio ?? null,
          fetchedAt: Date.now()
        });

        this.#emitIfChanged(addr, prev, profile);
      }
    } finally {
      targets.forEach(a => this.#inflight.delete(a));
    }
  }

  #emitIfChanged(addr: string, prev?: ProfileEntry, next?: { nickname?: string | null, bio?: string | null }) {
    if (
      prev?.nickname !== next?.nickname ||
      prev?.bio !== next?.bio
    ) {
      this.dispatchEvent(
        new CustomEvent('profilechange', { detail: { account: addr, profile: next } })
      );
      if (addr === tokenManager.getAddress()) {
        this.dispatchEvent(new Event('myprofilechange'));
      }
    }
  }
}

export const profileService = new ProfileService();
