import { el } from '@webtaku/el';

export type NftItem = {
  id: string;
  name?: string;
  image?: string | null;       // 이미지 URL(상대/절대)
  contractAddr?: string;       // ✅ 아이템별 컨트랙트 주소(없으면 defaultContractAddr 사용)
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
  /** 현재 컨텍스트(콜렉션)에서 아이템 로드 */
  loadItems: () => Promise<NftItem[]>;
  /** 선택 완료 콜백: (컨트랙트 주소, 토큰 ID) */
  onSelected: (contractAddr: string, tokenId: string) => Promise<void> | void;
  /** 미리 선택되어 있어야 하는 id(선택 강조용, 선택 유지) */
  preselectedId?: string | null;
  /** 표시 문구 커스터마이즈 */
  labels?: Labels;
  /** 격자 열 수 (기본 2) */
  columns?: number;
  /** 카드 이미지 높이 (기본 140px) */
  cardImageHeight?: number;
  /** ✅ 아이템에 contractAddr가 없을 때 사용할 기본 컨트랙트 주소 */
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

  // 한글 디폴트 레이블
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
  const content = el('ion-content.ion-padding');

  const desc = el('p', {
    style: 'margin-bottom:12px;color:var(--ion-color-medium)'
  }, t.description);

  const grid = el('div', {
    style: `
      display:grid;
      grid-template-columns: repeat(${Math.max(1, columns)}, minmax(0, 1fr));
      gap:12px;
      margin-bottom:16px;
    `,
  });

  const statusRow = el('div', {
    style: 'grid-column:1/-1;text-align:center;color:var(--ion-color-medium)'
  }, t.loading);

  grid.append(statusRow);

  const footer = el('div', {
    style: 'display:flex;gap:8px;justify-content:flex-end'
  });

  const cancelBtn = el('ion-button', { fill: 'outline', onclick: () => (modal as any).dismiss?.() }, t.cancel);
  const confirmBtn = el('ion-button', { disabled: true }, t.confirm);
  footer.append(cancelBtn, confirmBtn);

  content.append(desc, grid, footer);
  modal.append(header, content);

  /* ---------- 내부 상태 ---------- */
  // ✅ 선택 상태를 (토큰ID + 컨트랙트 주소)로 관리
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

    // 이미지 로드 실패 시 플레이스홀더
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
    (img as any).onerror = onImgError as any; // native fallback

    const nameText = item.name || t.unnamed;
    const idBadge = item.id.length > 10 ? `${item.id.slice(0, 6)}…${item.id.slice(-4)}` : item.id;

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
          // 컨트랙트 주소가 없으면 선택 불가 처리
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
        el('div', {
          style: 'display:flex;align-items:center;justify-content:space-between;gap:8px'
        },
          el('strong', nameText),
          el('ion-badge', idBadge),
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

      // 미리 선택된 항목 강조
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
      await onSelected(selected.contract, selected.id); // ✅ 컨트랙트+토큰ID 함께 전달
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
