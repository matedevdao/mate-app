import { el } from '@webtaku/el';
import { fetchAnnouncements, Announcement } from '../api/announcements';
import { Component } from './component';

function createAnnouncementBanner(): Component {
  const container = el('div', {
    className: 'announcement-banner',
    style: {
      display: 'none',
    }
  });

  let currentIndex = 0;
  let announcements: Announcement[] = [];
  let rotationInterval: number | undefined;

  const renderAnnouncement = (announcement: Announcement) => {
    container.innerHTML = '';
    container.style.display = 'block';

    const card = el('ion-card', {
      color: 'warning',
      style: {
        margin: '0 0 8px 0',
        cursor: announcement.link_url ? 'pointer' : 'default',
      }
    });

    if (announcement.link_url) {
      card.onclick = () => window.open(announcement.link_url, '_blank');
    }

    const cardContent = el('ion-card-content', {
      style: {
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }
    });

    const icon = el('ion-icon', {
      name: 'megaphone-outline',
      style: { fontSize: '20px', flexShrink: '0' },
    });

    const textWrapper = el('div', {
      style: {
        flex: '1',
        minWidth: '0',
        overflow: 'hidden',
      }
    });

    const title = el('div', {
      style: {
        fontWeight: '600',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }
    }, announcement.title);

    const content = el('div', {
      style: {
        fontSize: '12px',
        opacity: '0.8',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginTop: '2px',
      }
    }, announcement.content);

    textWrapper.append(title, content);
    cardContent.append(icon, textWrapper);

    if (announcements.length > 1) {
      const indicator = el('div', {
        style: {
          fontSize: '11px',
          opacity: '0.6',
          flexShrink: '0',
        }
      }, `${currentIndex + 1}/${announcements.length}`);
      cardContent.append(indicator);
    }

    if (announcement.link_url) {
      const arrow = el('ion-icon', {
        name: 'chevron-forward-outline',
        style: { fontSize: '16px', flexShrink: '0' },
      });
      cardContent.append(arrow);
    }

    card.append(cardContent);
    container.append(card);
  };

  const startRotation = () => {
    if (announcements.length <= 1) return;
    rotationInterval = window.setInterval(() => {
      currentIndex = (currentIndex + 1) % announcements.length;
      renderAnnouncement(announcements[currentIndex]);
    }, 5000);
  };

  const stopRotation = () => {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      rotationInterval = undefined;
    }
  };

  fetchAnnouncements()
    .then((data) => {
      announcements = data;
      if (announcements.length > 0) {
        renderAnnouncement(announcements[0]);
        startRotation();
      }
    })
    .catch((err) => {
      console.error('Failed to fetch announcements:', err);
    });

  return {
    el: container,
    remove() {
      stopRotation();
      container.remove();
    },
  };
}

export { createAnnouncementBanner };
