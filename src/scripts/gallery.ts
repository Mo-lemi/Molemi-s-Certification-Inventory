type SortMode = 'featured' | 'newest' | 'oldest' | 'title';

/** Shows the "Expired" badge on anything whose expiry date has passed (checked in the visitor's browser, so it's always current). */
function markExpired(root: ParentNode): void {
  const today = new Date().toISOString().slice(0, 10);
  root.querySelectorAll<HTMLElement>('[data-expired-flag]').forEach((flag) => {
    const expiry = flag.dataset.expiry;
    flag.hidden = !expiry || expiry >= today;
  });
}

const comparators: Record<SortMode, (a: HTMLElement, b: HTMLElement) => number> = {
  newest: (a, b) => b.dataset.date!.localeCompare(a.dataset.date!),
  oldest: (a, b) => a.dataset.date!.localeCompare(b.dataset.date!),
  title: (a, b) => a.dataset.title!.localeCompare(b.dataset.title!),
  featured: (a, b) =>
    Number(b.dataset.featured === 'true') - Number(a.dataset.featured === 'true') ||
    comparators.newest(a, b),
};

export function initGallery(): void {
  const grid = document.getElementById('grid')!;
  const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-card]'));
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const search = document.getElementById('search') as HTMLInputElement;
  const sort = document.getElementById('sort') as HTMLSelectElement;
  const count = document.getElementById('result-count')!;
  const empty = document.getElementById('empty')!;
  const dialog = document.getElementById('cert-dialog') as HTMLDialogElement;
  const dialogBody = document.getElementById('dialog-body')!;

  let activeCategory = 'all';

  // ---- filtering, searching and sorting ----
  function update(): void {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;

    for (const card of cards) {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const matchesSearch = words.every((word) => card.dataset.search!.includes(word));
      card.hidden = !(matchesCategory && matchesSearch);
      if (!card.hidden) visible++;
    }

    cards.sort(comparators[sort.value as SortMode]).forEach((card) => grid.append(card));
    count.textContent = `Showing ${visible} of ${cards.length} certificates`;
    empty.hidden = visible > 0;
  }

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.filter!;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      update();
    }),
  );
  search.addEventListener('input', update);
  sort.addEventListener('change', update);

  // ---- certificate detail dialog ----
  function openCertificate(id: string): void {
    const template = document.getElementById(`detail-${id}`) as HTMLTemplateElement | null;
    if (!template) return;
    dialogBody.replaceChildren(template.content.cloneNode(true));
    dialogBody.querySelector('[data-dialog-title]')?.setAttribute('id', 'dialog-heading');
    markExpired(dialogBody);
    dialog.showModal();
    // Put the id in the address bar so a specific certificate can be shared, e.g. …/#java-basic
    history.replaceState(null, '', `#${id}`);
  }

  cards.forEach((card) => card.addEventListener('click', () => openCertificate(card.dataset.id!)));

  dialog.querySelector('[data-close]')!.addEventListener('click', () => dialog.close());
  // Clicking the dark backdrop (outside the dialog box) closes it too.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialogBody.replaceChildren();
    history.replaceState(null, '', location.pathname + location.search);
  });

  // ---- start up ----
  markExpired(document);
  const linkedId = decodeURIComponent(location.hash.slice(1));
  if (linkedId) openCertificate(linkedId);
}
