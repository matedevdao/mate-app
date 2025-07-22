import { el } from "@webtaku/el";
import babypingAvatar from './chat-rooms-avatars/babyping.png';
import bmcsAvatar from './chat-rooms-avatars/bmcs.png';
import emateAvatar from './chat-rooms-avatars/emate.png';
import kcdKongzAvatar from './chat-rooms-avatars/kcd-kongz.png';
import mateAvatar from './chat-rooms-avatars/mate.png';
import sparrowAvatar from './chat-rooms-avatars/sparrow.png';
import { Component } from "./component";

function createChatRooms(): Component {
  const list = el('ion-content', { className: 'chat-rooms' });

  const nfts = [
    {
      name: "메이트 홀더 모임",
      avatars: [mateAvatar, emateAvatar, bmcsAvatar],
      isHolder: false,
      holderCount: 120,
      lastMessage: "",
      lastMessageTime: "",
      purchaseUrls: [
        { name: 'OpenSea', url: 'https://opensea.io/mate' },
        { name: 'Magic Eden', url: 'https://magiceden.io/mate' },
        { name: 'X2Y2', url: 'https://x2y2.io/mate' },
      ],
    },
    {
      name: "시고르 참새 홀더 모임",
      avatars: [sparrowAvatar],
      isHolder: false,
      holderCount: 87,
      lastMessage: "",
      lastMessageTime: "",
      purchaseUrls: [
        { name: 'OpenSea', url: 'https://opensea.io/sparrow' },
      ],
    },
    {
      name: "KCD 콩즈 홀더 모임",
      avatars: [kcdKongzAvatar],
      isHolder: true,
      holderCount: 45,
      lastMessage: "방금 들어왔습니다!",
      lastMessageTime: "2025-07-22 14:30",
      purchaseUrls: [
        { name: 'OpenSea', url: 'https://opensea.io/babyping' },
      ],
    },
    {
      name: "베이비핑 홀더 모임",
      avatars: [babypingAvatar],
      isHolder: false,
      holderCount: 60,
      lastMessage: "",
      lastMessageTime: "",
      purchaseUrls: [
        { name: 'OpenSea', url: 'https://opensea.io/babyping' },
      ],
    }
  ];

  for (const nft of nfts) {
    const card = el('ion-card', {
      style: { textAlign: 'center', padding: '12px' }
    });

    const header = el('ion-card-header',
      el('ion-card-title', {
        style: {
          fontSize: '18px',
          fontWeight: '600',
          margin: '0',
        }
      }, nft.name)
    );

    header.style.justifyContent = 'center';
    header.style.display = 'flex';

    const content = el('ion-card-content', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '8px',
        position: 'relative',
        minHeight: '60px',
      }
    });

    if (nft.avatars.length > 1) {
      const overlap = 52;

      nft.avatars.forEach((avatar, index) => {
        const avatarEl = el('ion-avatar', {
          style: {
            width: '60px',
            height: '60px',
            position: 'absolute',
            left: `calc(50% + ${(index - (nft.avatars.length - 1) / 2) * overlap}px)`,
            top: '0',
            transform: 'translateX(-50%)',
            zIndex: `${index}`
          }
        },
          el('img', { src: avatar, alt: nft.name })
        );
        content.appendChild(avatarEl);
      });
    } else {
      const avatarEl = el('ion-avatar', {
        style: {
          width: '60px',
          height: '60px',
          margin: '0 auto',
        }
      },
        el('img', { src: nft.avatars[0], alt: nft.name })
      );
      content.appendChild(avatarEl);
    }

    const infoSection = el('div', {
      style: {
        marginTop: '16px',
        textAlign: 'center',
        fontSize: '14px',
        lineHeight: '1.4',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }
    });

    const holderInfo = el('div', `홀더 ${nft.holderCount}명`);
    infoSection.appendChild(holderInfo);

    if (nft.isHolder && nft.lastMessage) {
      const lastMsg = el('div', {
        style: { color: '#666', fontSize: '12px' }
      }, `💬 ${nft.lastMessage}`);
      infoSection.appendChild(lastMsg);

      if (nft.lastMessageTime) {
        const lastTime = el('div', {
          style: { color: '#999', fontSize: '11px' }
        }, `🕒 ${nft.lastMessageTime}`);
        infoSection.appendChild(lastTime);
      }
    }

    const button = el('ion-button', {
      style: { marginTop: '8px' },
      expand: 'block',
      color: nft.isHolder ? 'primary' : 'secondary'
    }, nft.isHolder ? '입장하기' : 'NFT 구매하기');

    if (!nft.isHolder) {
      button.addEventListener('click', () => {

        alert('구매 기능은 준비 중입니다.');
        return;

        if (!nft.purchaseUrls || nft.purchaseUrls.length === 0) {
          alert("구매 가능한 경로가 없습니다.");
          return;
        }

        const sheet = el('ion-action-sheet');
        sheet.header = `${nft.name} 구매처 선택`;
        sheet.buttons = [...nft.purchaseUrls.map(p => ({
          text: p.name,
          handler: () => { window.open(p.url, '_blank') }
        })), { text: '취소', role: 'cancel' }];

        document.body.appendChild(sheet);
        sheet.present();
      });
    }

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(infoSection);
    card.appendChild(button);
    list.appendChild(card);
  }

  return {
    el: list,
    remove() {
      list.remove();
    }
  };
}

export { createChatRooms };
