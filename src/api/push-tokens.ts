import { tokenManager } from '@gaiaprotocol/client-common';

declare const API_BASE_URI: string;

export async function registerPushToken(
  fcmToken: string,
  deviceInfo?: string
): Promise<{ success: boolean }> {
  const authToken = tokenManager.getToken();
  if (!authToken) {
    throw new Error('인증 토큰이 없습니다.');
  }

  const res = await fetch(`${API_BASE_URI}/push-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      fcm_token: fcmToken,
      device_info: deviceInfo,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`푸시 토큰 등록에 실패했습니다. (status: ${res.status})\n${text}`);
  }

  return res.json();
}

export async function unregisterPushToken(fcmToken: string): Promise<{ success: boolean }> {
  const authToken = tokenManager.getToken();
  if (!authToken) {
    throw new Error('인증 토큰이 없습니다.');
  }

  const res = await fetch(`${API_BASE_URI}/push-tokens`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ fcm_token: fcmToken }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`푸시 토큰 해제에 실패했습니다. (status: ${res.status})\n${text}`);
  }

  return res.json();
}
