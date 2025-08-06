import { TokenManager } from '../auth/token-mananger';
import { ChatMessage } from '../types/chat';
class ChatService extends EventTarget {
    roomId;
    abortController = null;
    currentPromise = null;
    reconnectDelay = 3000;
    stopped = false;
    constructor(roomId) {
        super();
        this.roomId = roomId;
    }
    /** SSE 연결 시작 */
    connect() {
        this.#connectSSE().catch(console.error);
    }
    /** 연결 중단(페이지 언마운트 시 호출) */
    disconnect() {
        this.stopped = true;
        this.abortController?.abort();
    }
    /** 텍스트 메시지 전송 → 서버가 확정한 ChatMessage 반환 */
    async send(text, attachments = [], localId) {
        const token = TokenManager.getToken();
        const resp = await fetch(`${API_URI}/chat/${this.roomId}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text, attachments, localId }),
        });
        if (!resp.ok) {
            const err = new Error(`Send failed ${resp.status}`);
            this.dispatchEvent(new CustomEvent('error', { detail: err }));
            throw err;
        }
        const msg = await resp.json();
        return msg;
    }
    /* ------------------------------------------------------------------ */
    /*                           내부 구현부                               */
    /* ------------------------------------------------------------------ */
    async #connectSSE() {
        if (this.stopped)
            return;
        // 기존 연결 정리
        if (this.abortController) {
            this.abortController.abort();
            if (this.currentPromise) {
                try {
                    await this.currentPromise;
                }
                catch { /* ignore */ }
            }
        }
        this.abortController = new AbortController();
        this.currentPromise = (async () => {
            let reader = null;
            let buffer = '';
            try {
                const resp = await fetch(`${API_URI}/chat/${this.roomId}/stream`, {
                    headers: { Authorization: `Bearer ${TokenManager.getToken()}` },
                    signal: this.abortController.signal,
                });
                if (!resp.ok || !resp.body) {
                    throw new Error(`SSE failed ${resp.status}`);
                }
                // 성공적으로 연결되면 재연결 지연 초기화
                this.reconnectDelay = 3000;
                reader = resp.body.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    buffer += decoder.decode(value, { stream: true });
                    const chunks = buffer.split('\n\n');
                    buffer = chunks.pop() || '';
                    for (const chunk of chunks) {
                        if (chunk.startsWith('data: ')) {
                            const msg = JSON.parse(chunk.slice(6));
                            this.dispatchEvent(new CustomEvent('message', { detail: msg }));
                        }
                    }
                }
            }
            catch (err) {
                if (!this.abortController.signal.aborted) {
                    this.dispatchEvent(new CustomEvent('error', { detail: err }));
                }
            }
            finally {
                try {
                    await reader?.cancel();
                }
                catch { /* ignore */ }
                this.#scheduleReconnect();
            }
        })();
    }
    #scheduleReconnect() {
        if (this.stopped)
            return;
        setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 60000);
            this.#connectSSE().catch(console.error);
        }, this.reconnectDelay);
    }
}
export { ChatMessage, ChatService };
//# sourceMappingURL=chat.js.map