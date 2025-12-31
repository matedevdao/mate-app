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

  let announcements: Announcement[] = [];

  const showAnnouncementDetail = (announcement: Announcement) => {
    const modal = document.createElement('ion-modal');
    modal.classList.add('announcement-detail-modal');

    const header = el('ion-header', {},
      el('ion-toolbar', {},
        el('ion-title', {}, '공지사항'),
        el('ion-buttons', { slot: 'end' },
          announcements.length > 1 ? el('ion-button', {
            onclick: () => {
              modal.dismiss();
              showAnnouncementList();
            },
          }, '목록') : null,
          el('ion-button', {
            onclick: () => modal.dismiss(),
          }, el('ion-icon', { name: 'close' }))
        )
      )
    );

    const contentEl = el('ion-content', {
      className: 'ion-padding',
    });

    const titleEl = el('h2', {
      style: {
        fontWeight: '600',
        fontSize: '18px',
        marginBottom: '12px',
      }
    }, announcement.title);

    const bodyEl = el('div', {
      style: {
        fontSize: '14px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
      }
    }, announcement.content);

    contentEl.append(titleEl, bodyEl);

    if (announcement.link_url) {
      const linkButton = el('ion-button', {
        expand: 'block',
        style: { marginTop: '20px' },
        onclick: () => window.open(announcement.link_url, '_blank'),
      }, '링크 열기');
      contentEl.append(linkButton);
    }

    modal.append(header, contentEl);
    document.body.append(modal);
    modal.present();
  };

  const showAnnouncementList = () => {
    const modal = document.createElement('ion-modal');
    modal.classList.add('announcement-list-modal');

    const header = el('ion-header', {},
      el('ion-toolbar', {},
        el('ion-title', {}, '공지사항 목록'),
        el('ion-buttons', { slot: 'end' },
          el('ion-button', {
            onclick: () => modal.dismiss(),
          }, el('ion-icon', { name: 'close' }))
        )
      )
    );

    const contentEl = el('ion-content', {});

    const list = el('ion-list', {});

    announcements.forEach((announcement) => {
      const item = el('ion-item', {
        button: true,
        detail: true,
        onclick: () => {
          modal.dismiss();
          showAnnouncementDetail(announcement);
        },
      });

      const label = el('ion-label', {});

      const titleEl = el('h3', {
        style: {
          fontWeight: '600',
          fontSize: '14px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }
      }, announcement.title.replace(/\n/g, ' '));

      const contentText = el('p', {
        style: {
          fontSize: '12px',
          opacity: '0.7',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }
      }, announcement.content.replace(/\n/g, ' '));

      label.append(titleEl, contentText);
      item.append(label);
      list.append(item);
    });

    contentEl.append(list);
    modal.append(header, contentEl);
    document.body.append(modal);
    modal.present();
  };

  const renderAnnouncement = (announcement: Announcement) => {
    container.innerHTML = '';
    container.style.display = 'block';

    const card = el('ion-card', {
      color: 'warning',
      style: {
        margin: '16px 16px 0 16px',
        borderRadius: '12px',
        cursor: 'pointer',
      }
    });

    card.onclick = () => showAnnouncementDetail(announcement);

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
    }, announcement.title.replace(/\n/g, ' '));

    const content = el('div', {
      style: {
        fontSize: '12px',
        opacity: '0.8',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginTop: '2px',
      }
    }, announcement.content.replace(/\n/g, ' '));

    textWrapper.append(title, content);
    cardContent.append(icon, textWrapper);

    if (announcements.length > 1) {
      const listButton = el('ion-button', {
        fill: 'clear',
        size: 'small',
        color: 'dark',
        onclick: (e: Event) => {
          e.stopPropagation();
          showAnnouncementList();
        },
      }, '목록');
      cardContent.append(listButton);
    }

    card.append(cardContent);
    container.append(card);
  };

  fetchAnnouncements()
    .then((data) => {
      announcements = data;
      if (announcements.length > 0) {
        renderAnnouncement(announcements[0]);
      }
    })
    .catch((err) => {
      console.error('Failed to fetch announcements:', err);
    });

  return {
    el: container,
    remove() {
      container.remove();
    },
  };
}

export { createAnnouncementBanner };
