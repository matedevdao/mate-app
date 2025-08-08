import { z } from 'zod';

declare const API_BASE_URI: string;

export type Profile = {
  nickname?: string;
  bio?: string;
};

const ProfileSchema = z.object({
  nickname: z.string().optional(),
  bio: z.string().optional()
});

type SetProfilePayload = {
  nickname?: string;
  bio?: string;
};

type SetProfileResponse = {
  success: boolean;
};

/**
 * 프로필을 설정합니다.
 */
export async function setProfile(
  payload: SetProfilePayload,
  token: string
): Promise<SetProfileResponse> {
  const res = await fetch(`${API_BASE_URI}/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `프로필 설정에 실패했습니다. (status: ${res.status})\n${text}`
    );
  }

  try {
    const json = JSON.parse(text);
    if (typeof json.success === 'boolean') {
      return json as SetProfileResponse;
    } else {
      throw new Error('서버 응답이 올바르지 않습니다.');
    }
  } catch (e) {
    throw new Error(`응답 파싱 오류: ${(e as Error).message}`);
  }
}

/**
 * 프로필을 가져옵니다.
 */
export async function fetchProfile(
  address: `0x${string}`
): Promise<Profile> {
  const res = await fetch(`${API_BASE_URI}/profile?address=${address}`);

  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `프로필 조회에 실패했습니다. (status: ${res.status})\n${text}`
    );
  }

  try {
    const json = JSON.parse(text);
    const parsed = ProfileSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error('서버에서 잘못된 프로필 데이터를 반환했습니다.');
    }
    return parsed.data;
  } catch (e) {
    throw new Error(`응답 파싱 오류: ${(e as Error).message}`);
  }
}

/**
 * 여러 프로필을 가져옵니다.
 */
export async function fetchProfiles(
  addresses: (`0x${string}`)[]
): Promise<Record<`0x${string}`, Profile | null>> {
  const res = await fetch(`${API_BASE_URI}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ addresses })
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `프로필 조회에 실패했습니다. (status: ${res.status})\n${text}`
    );
  }

  try {
    const json = JSON.parse(text);

    if (typeof json !== 'object' || json === null) {
      throw new Error('응답이 객체가 아닙니다.');
    }

    const result: Record<`0x${string}`, Profile | null> = {};

    for (const [key, value] of Object.entries(json)) {
      if (typeof key !== 'string' || !key.startsWith('0x')) continue;

      const parsed = ProfileSchema.safeParse(value);
      result[key as `0x${string}`] = parsed.success ? parsed.data : null;
    }

    return result;
  } catch (e) {
    throw new Error(`응답 파싱 오류: ${(e as Error).message}`);
  }
}
