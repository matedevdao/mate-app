declare const API_URI: string;

async function requestLogin(address: `0x${string}`, signature: `0x${string}`): Promise<string> {
  const response = await fetch(
    `${API_URI}/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        signature,
      }),
    },
  );
  if (!response.ok) throw new Error('로그인에 실패했습니다');
  const data = await response.json();
  if (!data.token) throw new Error('서버로부터 잘못된 응답을 받았습니다');

  return data.token;
}

export { requestLogin };
