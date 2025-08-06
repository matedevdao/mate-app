import { z } from 'zod';
const ProfileSchema = z.object({
    nickname: z.string().optional(),
    bio: z.string().optional()
});
/**
 * 프로필을 설정합니다.
 */
export async function setProfile(payload, token) {
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
        throw new Error(`프로필 설정에 실패했습니다. (status: ${res.status})\n${text}`);
    }
    try {
        const json = JSON.parse(text);
        if (typeof json.success === 'boolean') {
            return json;
        }
        else {
            throw new Error('서버 응답이 올바르지 않습니다.');
        }
    }
    catch (e) {
        throw new Error(`응답 파싱 오류: ${e.message}`);
    }
}
/**
 * 프로필을 가져옵니다.
 */
export async function fetchProfile(address) {
    const res = await fetch(`${API_URI}/profile?address=${address}`);
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`프로필 조회에 실패했습니다. (status: ${res.status})\n${text}`);
    }
    try {
        const json = JSON.parse(text);
        const parsed = ProfileSchema.safeParse(json);
        if (!parsed.success) {
            throw new Error('서버에서 잘못된 프로필 데이터를 반환했습니다.');
        }
        return parsed.data;
    }
    catch (e) {
        throw new Error(`응답 파싱 오류: ${e.message}`);
    }
}
/**
 * 여러 프로필을 가져옵니다.
 */
export async function fetchProfiles(addresses) {
    const res = await fetch(`${API_URI}/profiles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addresses })
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`프로필 조회에 실패했습니다. (status: ${res.status})\n${text}`);
    }
    try {
        const json = JSON.parse(text);
        if (typeof json !== 'object' || json === null) {
            throw new Error('응답이 객체가 아닙니다.');
        }
        const result = {};
        for (const [key, value] of Object.entries(json)) {
            if (typeof key !== 'string' || !key.startsWith('0x'))
                continue;
            const parsed = ProfileSchema.safeParse(value);
            result[key] = parsed.success ? parsed.data : null;
        }
        return result;
    }
    catch (e) {
        throw new Error(`응답 파싱 오류: ${e.message}`);
    }
}
//# sourceMappingURL=profile.js.map