declare const API_URI: string;

type ChatAccessResult = Record<string, boolean>;

export async function checkChatAccess(address: `0x${string}`): Promise<ChatAccessResult> {
  const res = await fetch(`${API_URI}/chat-access?address=${address}`);
  if (!res.ok) {
    throw new Error(`채팅방 접근 권한 확인에 실패했습니다. (status: ${res.status})`);
  }
  const result = await res.json();
  return result as ChatAccessResult;
}
