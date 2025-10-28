import './install-ui.css';
type DeferredPrompt = BeforeInstallPromptEvent | null;
declare global {
    interface Window {
        deferredPWAInstallPrompt?: DeferredPrompt;
    }
    interface BeforeInstallPromptEvent extends Event {
        prompt: () => Promise<void>;
        userChoice: Promise<{
            outcome: 'accepted' | 'dismissed';
            platform: string;
        }>;
    }
}
export declare function setupInstallCapture(): void;
/**
 * iOS: 가이드 표시
 * Android: 가이드(필요 시 네이티브 프롬프트 포함)
 * Desktop: 네이티브 프롬프트 또는 'unavailable'
 */
export declare function launchInstallFlow(): Promise<'ios-shown' | 'android-shown' | 'accepted' | 'dismissed' | 'unavailable' | 'installed'>;
export {};
//# sourceMappingURL=install-ui.d.ts.map