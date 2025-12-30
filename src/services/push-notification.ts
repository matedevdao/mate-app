import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { registerPushToken, unregisterPushToken } from '../api/push-tokens';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBbwkLP-C61kWmzCq-pFdvSJXHHUjmoRK0',
  authDomain: 'mate-ba361.firebaseapp.com',
  projectId: 'mate-ba361',
  storageBucket: 'mate-ba361.firebasestorage.app',
  messagingSenderId: '996341622273',
  appId: '1:996341622273:web:f1a110eea9820b30ad8200',
  measurementId: 'G-1V0KFDFZTF'
} as const;

declare const VAPID_PUBLIC_KEY: string;

const FCM_TOKEN_KEY = 'fcm_token';
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/mate-app/' : '/';

class PushNotificationService {
  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;

  async init(): Promise<void> {
    if (this.messaging) return;

    try {
      const existingApps = getApps();
      this.app = existingApps.length > 0 ? existingApps[0] : initializeApp(FIREBASE_CONFIG);
      this.messaging = getMessaging(this.app);

      onMessage(this.messaging, (payload) => {
        console.log('Foreground message received:', payload);
        this.showInAppNotification(payload);
      });
    } catch (err) {
      console.error('Failed to initialize Firebase Messaging:', err);
    }
  }

  private showInAppNotification(payload: any): void {
    const { notification } = payload;
    if (!notification) return;

    const toast = document.createElement('ion-toast');
    toast.header = notification.title;
    toast.message = notification.body;
    toast.duration = 5000;
    toast.position = 'top';
    toast.buttons = [
      {
        text: '닫기',
        role: 'cancel',
      }
    ];
    document.body.appendChild(toast);
    (toast as any).present?.();
  }

  async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return new Promise((resolve) => {
        Notification.requestPermission((perm: NotificationPermission) => resolve(perm));
      });
    }
  }

  async registerToken(): Promise<string | null> {
    if (!this.messaging) {
      await this.init();
    }

    if (!this.messaging) {
      console.error('Messaging not initialized');
      throw new Error('Firebase Messaging을 초기화할 수 없습니다.');
    }

    // Service Worker 명시적 등록 (서브디렉토리 경로 지원)
    const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
      const swPath = `${BASE_PATH}firebase-messaging-sw.js`;

      // 먼저 기존 등록된 SW 확인
      const registrations = await navigator.serviceWorker.getRegistrations();
      const existingSW = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw.js'));
      if (existingSW) {
        return existingSW;
      }

      // SW 등록
      try {
        const registration = await navigator.serviceWorker.register(swPath, {
          scope: BASE_PATH,
        });
        console.log('[Push] Service Worker registered:', swPath);

        // SW가 활성화될 때까지 대기
        if (registration.installing) {
          await new Promise<void>((resolve) => {
            registration.installing!.addEventListener('statechange', function handler(e) {
              if ((e.target as ServiceWorker).state === 'activated') {
                resolve();
              }
            });
          });
        }

        return registration;
      } catch (err) {
        console.error('[Push] Service Worker registration failed:', err);
        throw new Error('Service Worker 등록에 실패했습니다.');
      }
    };

    try {
      const registration = await getServiceWorkerRegistration();

      const vapidKey = typeof VAPID_PUBLIC_KEY !== 'undefined' ? VAPID_PUBLIC_KEY : undefined;

      const token = await getToken(this.messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        this.currentToken = token;
        localStorage.setItem(FCM_TOKEN_KEY, token);

        const deviceInfo = navigator.userAgent;
        await registerPushToken(token, deviceInfo);

        console.log('FCM token registered:', token.substring(0, 20) + '...');
        return token;
      }

      throw new Error('FCM 토큰을 가져올 수 없습니다.');
    } catch (err) {
      console.error('Failed to get FCM token:', err);
      throw err;
    }
  }

  async unregisterToken(): Promise<void> {
    const token = this.currentToken || localStorage.getItem(FCM_TOKEN_KEY);
    if (!token) return;

    try {
      await unregisterPushToken(token);
      localStorage.removeItem(FCM_TOKEN_KEY);
      this.currentToken = null;
      console.log('FCM token unregistered');
    } catch (err) {
      console.error('Failed to unregister FCM token:', err);
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem(FCM_TOKEN_KEY);
  }

  isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  isPermissionDenied(): boolean {
    return Notification.permission === 'denied';
  }
}

export const pushNotificationService = new PushNotificationService();
