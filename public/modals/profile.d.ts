import Navigo from "navigo";
export declare function createInstallAppItem(): HTMLElement | null;
export declare function createPushNotificationItem(showToast: (msg: string) => Promise<void>, withLoading: <T>(fn: () => Promise<T>, msg?: string) => Promise<T>): HTMLElement;
export declare function createContactUsItem(): HTMLElement;
declare function createProfileModal(router: Navigo): HTMLElement;
export { createProfileModal };
//# sourceMappingURL=profile.d.ts.map