declare class SessionManager {
    readonly KEY_SID: string;
    set(sid: string): void;
    get(): string | undefined;
    has(): boolean;
    clear(): void;
}
declare const sessionManager: SessionManager;
export { sessionManager };
//# sourceMappingURL=session-manager.d.ts.map