import { TokenManager } from './token-mananger';

declare const API_URI: string;

export async function validateToken(): Promise<boolean> {
  const token = TokenManager.getToken();
  if (!token) return false;

  const res = await fetch(`${API_URI}/validate-token`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    TokenManager.clear();
    return false;
  }

  return true;
}
