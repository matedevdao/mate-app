import { isAndroid, isIOS, isStandalone } from '../platform';
import './install-ui.css';

type DeferredPrompt = BeforeInstallPromptEvent | null;

declare global {
  interface Window {
    deferredPWAInstallPrompt?: DeferredPrompt;
  }
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}

const IOS_GUIDE_ID = 'iosInstallGuide';
const ANDROID_GUIDE_ID = 'androidInstallGuide';

/* ---------------- iOS Guide ---------------- */

function ensureIOSGuide(): HTMLDivElement {
  let guide = document.getElementById(IOS_GUIDE_ID) as HTMLDivElement | null;
  if (guide) return guide;

  guide = document.createElement('div');
  guide.id = IOS_GUIDE_ID;
  guide.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ios-guide-title">
      <h3 id="ios-guide-title">홈 화면에 추가</h3>
      <p>iOS Safari에서 이 앱을 설치하려면 아래 단계를 따라주세요.</p>
      <ol>
        <li><strong>공유</strong> 아이콘을 탭합니다 (<ion-icon name="share-outline"></ion-icon>).</li>
        <li><strong>홈 화면에 추가</strong>를 선택합니다.</li>
        <li>이름을 확인하고 <strong>추가</strong>를 탭합니다.</li>
      </ol>
      <div class="actions">
        <button class="ok" type="button">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(guide);

  const ok = guide.querySelector('.ok') as HTMLButtonElement;
  const hide = () => guide!.setAttribute('data-open', 'false');
  ok.addEventListener('click', hide);
  guide.addEventListener('click', (e) => { if (e.target === guide) hide(); });

  return guide;
}

function showIOSGuide() {
  const guide = ensureIOSGuide();
  guide.setAttribute('data-open', 'true');
}

/* ---------------- Android Guide ---------------- */

function ensureAndroidGuide(): HTMLDivElement {
  let guide = document.getElementById(ANDROID_GUIDE_ID) as HTMLDivElement | null;
  if (guide) return guide;

  guide = document.createElement('div');
  guide.id = ANDROID_GUIDE_ID;
  guide.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="android-guide-title">
      <h3 id="android-guide-title">앱 설치</h3>
      <p>이 앱을 홈 화면에 설치할 수 있습니다.</p>
      <ol>
        <li>브라우저 메뉴를 엽니다 (<ion-icon name="ellipsis-vertical-outline"></ion-icon>).</li>
        <li><strong>홈 화면에 추가</strong> 또는 <strong>앱 설치</strong>를 탭합니다.</li>
        <li>안내에 따라 추가/설치합니다.</li>
      </ol>
      <div class="actions">
        <button class="ok" type="button">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(guide);

  const ok = guide.querySelector('.ok') as HTMLButtonElement;

  const hide = () => guide!.setAttribute('data-open', 'false');

  ok.addEventListener('click', async () => {
    const dp = window.deferredPWAInstallPrompt;
    if (dp) {
      hide();
      await dp.prompt();
      try { await dp.userChoice; } finally { window.deferredPWAInstallPrompt = null; }
    } else {
      hide();
    }
  });

  guide.addEventListener('click', (e) => { if (e.target === guide) hide(); });

  return guide;
}

function showAndroidGuide() {
  const guide = ensureAndroidGuide();
  guide.setAttribute('data-open', 'true');
}

/* ---------------- Capture & Launch ---------------- */

export function setupInstallCapture() {
  const handler = (e: Event) => {
    e.preventDefault();
    window.deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
  };

  window.removeEventListener('beforeinstallprompt', handler as any);
  window.addEventListener('beforeinstallprompt', handler as any);

  window.addEventListener('appinstalled', () => {
    window.deferredPWAInstallPrompt = null;
  });

  ensureIOSGuide();
  ensureAndroidGuide();
}

/**
 * iOS: 가이드 표시
 * Android: 가이드(필요 시 네이티브 프롬프트 포함)
 * Desktop: 네이티브 프롬프트 또는 'unavailable'
 */
export async function launchInstallFlow(): Promise<'ios-shown' | 'android-shown' | 'accepted' | 'dismissed' | 'unavailable' | 'installed'> {
  if (isStandalone) return 'installed';

  if (isIOS) {
    showIOSGuide();
    return 'ios-shown';
  }

  if (isAndroid) {
    const dp = window.deferredPWAInstallPrompt;
    showAndroidGuide();
    return 'android-shown';
  }

  const dp = window.deferredPWAInstallPrompt;
  if (!dp) return 'unavailable';

  await dp.prompt();
  const { outcome } = await dp.userChoice;
  window.deferredPWAInstallPrompt = null;
  return outcome; // 'accepted' | 'dismissed'
}
