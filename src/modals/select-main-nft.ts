import { el } from '@webtaku/el';

export type NftItem = {
  id: string;
  name?: string;
  image?: string | null;
  contractAddr?: string;
};

type Labels = {
  title?: string;
  description?: string;
  cancel?: string;
  confirm?: string;
  loading?: string;
  empty?: string;
  loadError?: string;
  unnamed?: string;
};

type SelectMainNftOptions = {
  loadItems: () => Promise<NftItem[]>;
  onSelected: (contractAddr: string, tokenId: string) => Promise<void> | void;
  preselectedId?: string | null;
  labels?: Labels;
  columns?: number;
  cardImageHeight?: number;
  defaultContractAddr?: string;
};

export function createSelectMainNftModal(options: SelectMainNftOptions) {
  const {
    loadItems,
    onSelected,
    preselectedId = null,
    labels: L = {},
    columns = 2,
    cardImageHeight = 140,
    defaultContractAddr,
  } = options;

  const t = {
    title: L.title ?? '메인 NFT 선택',
    description: L.description ?? '프로필 이미지로 사용할 NFT를 선택하세요.',
    cancel: L.cancel ?? '취소',
    confirm: L.confirm ?? '확인',
    loading: L.loading ?? '불러오는 중…',
    empty: L.empty ?? '표시할 NFT가 없습니다.',
    loadError: L.loadError ?? 'NFT를 불러오지 못했습니다.',
    unnamed: L.unnamed ?? '이름 없음',
  };

  const modal = el('ion-modal');

  /* ---------- Header ---------- */
  const header = el('ion-header',
    el('ion-toolbar',
      el('ion-title', t.title),
      el('ion-buttons', { slot: 'end' },
        el('ion-button', { onclick: () => (modal as any).dismiss?.() }, '닫기'),
      ),
    ),
  );

  /* ---------- Content ---------- */
  // ⬇️ ion-content 기본 패딩을 줄였습니다(상하좌우 8px).
  const content = el(
    'ion-content',
    {
      style: `
        --padding-start:8px;
        --padding-end:8px;
        --padding-top:8px;
        --padding-bottom:8px;
      `,
    }
  );

  // ⬇️ 설명 하단 여백 축소
  const desc = el('p', {
    style: 'margin-bottom:8px;color:var(--ion-color-medium)'
  }, t.description);

  // ⬇️ 카드 간격(gap)과 전체 아래 여백 축소
  const grid = el('div', {
    style: `
      display:grid;
      grid-template-columns: repeat(${Math.max(1, columns)}, minmax(0, 1fr));
      gap:8px;                 /* 기존 12px -> 8px */
      margin-bottom:12px;      /* 기존 16px -> 12px */
    `,
  });

  const statusRow = el('div', {
    style: 'grid-column:1/-1;text-align:center;color:var(--ion-color-medium)'
  }, t.loading);

  grid.append(statusRow);

  // ⬇️ 푸터 버튼 간격 축소 + 상단 여백 조금만
  const footer = el('div', {
    style: 'display:flex;gap:6px;justify-content:flex-end;margin-top:4px'
  });

  const cancelBtn = el('ion-button', { fill: 'outline', onclick: () => (modal as any).dismiss?.() }, t.cancel);
  const confirmBtn = el('ion-button', { disabled: true }, t.confirm);
  footer.append(cancelBtn, confirmBtn);

  content.append(desc, grid, footer);
  modal.append(header, content);

  /* ---------- 내부 상태 ---------- */
  let selected: { id: string; contract: string } | null = preselectedId
    ? { id: preselectedId, contract: defaultContractAddr ?? '' }
    : null;

  function applySelectedStyles() {
    Array.from(grid.children).forEach((c: any) => {
      if (!c || typeof c.style === 'undefined') return;
      c.style.border = '2px solid transparent';
      c.style.boxShadow = '';
    });
    if (!selected?.id) return;
    const selectedCard = grid.querySelector<HTMLElement>(`[data-id="${selected.id}"]`);
    if (selectedCard) {
      selectedCard.style.border = '2px solid var(--ion-color-primary)';
      selectedCard.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.04) inset';
    }
  }

  function renderItemCard(item: NftItem) {
    const imageHeight = `${cardImageHeight}px`;

    const img = el('ion-img', {
      src: item.image || '',
      alt: item.name || item.id,
      style: `width:100%;height:${imageHeight};object-fit:cover;background:#111;border-bottom:1px solid rgba(255,255,255,.06)`,
    });

    const onImgError = () => {
      const ph = el('div', {
        style: `
          width:100%;
          height:${imageHeight};
          display:flex;flex-direction:column;gap:6px;
          align-items:center;justify-content:center;
          background:#111;border-bottom:1px solid rgba(255,255,255,.06);
          color:var(--ion-color-medium);font-size:12px;
        `
      },
        el('ion-icon', { name: 'image' }),
        el('div', '이미지를 불러올 수 없습니다'),
      );
      (img as any).replaceWith?.(ph);
    };
    (img as any).addEventListener?.('ionError', onImgError);
    (img as any).onerror = onImgError as any;

    const nameText = item.name || t.unnamed;

    // ⬇️ 카드 내부 패딩 축소 + 숫자 배지 제거
    const card = el('ion-card',
      {
        dataset: { id: item.id, contract: item.contractAddr ?? '' },
        style: `
          cursor:pointer;
          transition: box-shadow .2s, transform .05s, border-color .2s;
          border:2px solid transparent;
          user-select:none;
        `,
        onclick: () => {
          const contract = item.contractAddr ?? defaultContractAddr ?? '';
          if (!contract) {
            confirmBtn.disabled = true;
            console.warn('contractAddr가 지정되지 않았습니다. defaultContractAddr 옵션을 설정하거나 아이템에 contractAddr을 제공하세요.');
            applySelectedStyles();
            return;
          }
          selected = { id: item.id, contract };
          confirmBtn.disabled = false;
          applySelectedStyles();
        },
      },
      img,
      el('ion-card-content',
        {
          style: `
            --padding-start:10px;
            --padding-end:10px;
            --padding-top:8px;
            --padding-bottom:8px;
          `
        },
        el('div', { style: 'display:flex;align-items:center;justify-content:flex-start' },
          el('strong', nameText),
        ),
      ),
    ) as HTMLElement;

    return card;
  }

  /* ---------- 데이터 로드 ---------- */
  (async () => {
    try {
      const items = await loadItems();
      grid.innerHTML = '';

      if (!items || items.length === 0) {
        grid.append(
          el('div', {
            style: 'grid-column:1/-1;text-align:center;color:var(--ion-color-medium)'
          }, t.empty)
        );
        confirmBtn.disabled = true;
        return;
      }

      for (const item of items) grid.append(renderItemCard(item));

      if (selected?.id) {
        const exists = items.some(i => i.id === selected!.id);
        if (!exists) selected = null;
      }
      confirmBtn.disabled = !selected?.id || !selected?.contract;
      applySelectedStyles();
    } catch (e) {
      console.error('Failed to load items', e);
      grid.innerHTML = '';
      grid.append(
        el('div', {
          style: 'grid-column:1/-1;text-align:center;color:var(--ion-color-danger)'
        }, t.loadError)
      );
      confirmBtn.disabled = true;
    }
  })();

  /* ---------- 확인 ---------- */
  confirmBtn.onclick = async () => {
    if (!selected?.id || !selected?.contract) return;
    (confirmBtn as any).disabled = true;
    try {
      await onSelected(selected.contract, selected.id);
      await (modal as any).dismiss?.();
    } catch (e) {
      console.error('Failed to set main NFT', e);
      (confirmBtn as any).disabled = false;
      content.append(
        el('p', { style: 'color:var(--ion-color-danger)' }, '메인 NFT 설정에 실패했습니다. 다시 시도해 주세요.')
      );
    }
  };

  return modal;
}
