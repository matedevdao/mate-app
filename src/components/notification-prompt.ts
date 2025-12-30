import { el } from '@webtaku/el';
import { pushNotificationService } from '../services/push-notification';
import { Component } from './component';

const NOTIFICATION_PROMPT_DISMISSED_KEY = 'notification_prompt_dismissed';

function createNotificationPrompt(): Component {
  const container = el('div', {
    className: 'notification-prompt',
    style: { display: 'none' }
  });

  const shouldShow = () => {
    if (pushNotificationService.isPermissionGranted()) return false;
    if (pushNotificationService.isPermissionDenied()) return false;
    if (localStorage.getItem(NOTIFICATION_PROMPT_DISMISSED_KEY)) return false;
    if (!('Notification' in window)) return false;
    return true;
  };

  if (!shouldShow()) {
    return { el: container, remove: () => container.remove() };
  }

  container.style.display = 'block';

  const card = el('ion-card', {
    style: { margin: '0 0 8px 0' }
  });

  const cardContent = el('ion-card-content', {
    style: {
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }
  });

  const header = el('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }
  });

  const icon = el('ion-icon', {
    name: 'notifications-outline',
    style: { fontSize: '20px' },
  });

  const title = el('div', {
    style: {
      fontWeight: '600',
      fontSize: '14px',
      flex: '1',
    }
  }, '알림 받기');

  const closeBtn = el('ion-button', {
    fill: 'clear',
    size: 'small',
  }) as HTMLIonButtonElement;
  closeBtn.style.setProperty('--padding-start', '0');
  closeBtn.style.setProperty('--padding-end', '0');
  const closeIcon = el('ion-icon', { name: 'close-outline', slot: 'icon-only' });
  closeBtn.appendChild(closeIcon);
  closeBtn.onclick = () => {
    localStorage.setItem(NOTIFICATION_PROMPT_DISMISSED_KEY, '1');
    container.style.display = 'none';
  };

  header.append(icon, title, closeBtn);

  const description = el('div', {
    style: {
      fontSize: '13px',
      opacity: '0.8',
    }
  }, '중요한 공지사항과 메시지 알림을 받으세요.');

  const enableBtn = el('ion-button', {
    expand: 'block',
    size: 'small',
  }, '알림 켜기') as HTMLIonButtonElement;

  enableBtn.onclick = async () => {
    enableBtn.disabled = true;
    enableBtn.innerHTML = '<ion-spinner name="circular"></ion-spinner>';

    try {
      const permission = await pushNotificationService.requestPermission();

      if (permission === 'granted') {
        await pushNotificationService.registerToken();
        container.style.display = 'none';

        const toast = document.createElement('ion-toast');
        toast.message = '알림이 활성화되었습니다!';
        toast.duration = 2000;
        toast.position = 'top';
        toast.color = 'success';
        document.body.appendChild(toast);
        (toast as any).present?.();
      } else {
        enableBtn.textContent = '알림 켜기';
        enableBtn.disabled = false;

        if (permission === 'denied') {
          localStorage.setItem(NOTIFICATION_PROMPT_DISMISSED_KEY, '1');
          container.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      enableBtn.textContent = '알림 켜기';
      enableBtn.disabled = false;
    }
  };

  cardContent.append(header, description, enableBtn);
  card.append(cardContent);
  container.append(card);

  return {
    el: container,
    remove() {
      container.remove();
    },
  };
}

export { createNotificationPrompt };
