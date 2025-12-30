declare class PushNotificationService {
    private app;
    private messaging;
    private currentToken;
    init(): Promise<void>;
    private showInAppNotification;
    requestPermission(): Promise<NotificationPermission>;
    registerToken(): Promise<string | null>;
    unregisterToken(): Promise<void>;
    getStoredToken(): string | null;
    isPermissionGranted(): boolean;
    isPermissionDenied(): boolean;
}
export declare const pushNotificationService: PushNotificationService;
export {};
//# sourceMappingURL=push-notification.d.ts.map