import { z } from 'zod';

declare const API_URI: string;

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
  const res = await fetch(`${API_URI}/profile`, {
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
  const res = await fetch(`${API_URI}/profile?address=${address}`);

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
