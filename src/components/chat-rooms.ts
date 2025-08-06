import { tokenManager } from '@gaiaprotocol/client-common';
import { el } from '@webtaku/el';
import Navigo from 'navigo';
import { zeroAddress } from 'viem';
import { fetchNftOwnershipStats } from '../api/nft-ownership-stats';
import babypingAvatar from './chat-rooms-avatars/babyping.png';
import bmcsAvatar from './chat-rooms-avatars/bmcs.png';
import emateAvatar from './chat-rooms-avatars/emate.png';
import kcdKongzAvatar from './chat-rooms-avatars/kcd-kongz.png';
import mateAvatar from './chat-rooms-avatars/mate.png';
import sparrowAvatar from './chat-rooms-avatars/sparrow.png';
import { Component } from './component';

function createChatRooms(router: Navigo): Component {
  const list = el('ion-content', { className: 'chat-rooms' });

  const nfts = [
    {
      ids: ['dogesoundclub-mates', 'dogesoundclub-e-mates', 'dogesoundclub-biased-mates'],
      roomId: 'mates',
      name: '메이트 홀더 모임',
      avatars: [mateAvatar, emateAvatar, bmcsAvatar],
      lastMessage: '',
      lastMessageTime: '',
      purchaseUrls: [
        { name: 'OpenSea', url: 'https://opensea.io/mate' },
        { name: 'Magic Eden', url: 'https://magiceden.io/mate' },
        { name: 'X2Y2', url: 'https://x2y2.io/mate' },
      ],
    },
    {
      ids: ['sigor-sparrows'],
      roomId: 'sigor-sparrows',
      name: '시고르 참새 홀더 모임',
      avatars: [sparrowAvatar],
      lastMessage: '',
      lastMessageTime: '',
      purchaseUrls: [
        { name: 'OpenSea', url: 'https://opensea.io/sparrow' },
      ],
    },
    {
      ids: ['kingcrowndao-kongz'],
      roomId: 'kcd-kongz',
      name: 'KCD 콩즈 홀더 모임',
      avatars: [kcdKongzAvatar],
      lastMessage: '방금 들어왔습니다!',
      lastMessageTime: '2025-07-22 14:30',
      purchaseUrls: [
        { name: 'OpenSea', url: 'https://opensea.io/babyping' },
      ],
    },
    {
      ids: ['babyping'],
      roomId: 'babyping',
      name: '베이비핑 홀더 모임',
      avatars: [babypingAvatar],
      lastMessage: '',
      lastMessageTime: '',
      purchaseUrls: [
        { name: 'OpenSea', url: 'https://opensea.io/babyping' },
      ],
    }
  ];

  const buttons: HTMLIonButtonElement[] = []; // 각 버튼을 담아둡니다

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

    const holderInfo = el('div', `홀더 …명`);
    infoSection.appendChild(holderInfo);

    const button = el('ion-button', {
      style: { marginTop: '8px' },
      expand: 'block',
      disabled: true,
    }, el('ion-spinner', { name: 'circular' }));
    buttons.push(button);

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(infoSection);
    card.appendChild(button);
    list.appendChild(card);
  }

  const address = tokenManager.getAddress() ?? zeroAddress;

  fetchNftOwnershipStats(address).then(result => {
    nfts.forEach((nft, idx) => {
      const btn = buttons[idx];
      const canAccess = nft.ids.some(id => result[id]?.owned);
      const totalHolders = nft.ids.reduce((acc, id) => {
        if (result[id]?.totalHolders) {
          return acc + result[id].totalHolders;
        }
        return acc;
      }, 0);

      const holderInfo = btn.parentElement?.querySelector<HTMLDivElement>('div');
      if (holderInfo) holderInfo.textContent = `홀더 ${totalHolders}명`;

      btn.textContent = canAccess ? '입장하기' : 'NFT 구매하기';
      btn.color = canAccess ? 'primary' : 'secondary';
      btn.disabled = false;

      if (canAccess) {
        btn.onclick = () => router.navigate(`/${nft.roomId}`);
      } else {
        btn.onclick = () => {
          alert('구매 기능은 준비 중입니다.');
          return;

          if (!nft.purchaseUrls?.length) {
            alert('구매 가능한 경로가 없습니다.');
            return;
          }
          const sheet = el('ion-action-sheet');
          sheet.header = `${nft.name} 구매처 선택`;
          sheet.buttons = [
            ...nft.purchaseUrls.map(p => ({
              text: p.name,
              handler: () => { window.open(p.url, '_blank') }
            })),
            { text: '취소', role: 'cancel' }
          ];
          document.body.appendChild(sheet);
          sheet.present();
        };
      }
    });
  }).catch(err => {
    console.error(err);
    buttons.forEach(btn => {
      btn.textContent = '오류 발생';
      btn.color = 'danger';
    });
  });

  return {
    el: list,
    remove() {
      list.remove();
    }
  };
}

export { createChatRooms };
