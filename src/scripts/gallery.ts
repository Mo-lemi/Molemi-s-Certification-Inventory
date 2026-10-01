type SortMode = 'newest' | 'oldest' | 'title';

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
};

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

export function initGallery(): void {
  const main = document.querySelector('main')!;
  const nav = document.getElementById('category-nav')!;
  const chipRow = nav.firstElementChild as HTMLElement;
  const chips = Array.from(nav.querySelectorAll<HTMLButtonElement>('[data-jump]'));
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-card]'));
  const search = document.getElementById('search') as HTMLInputElement;
  const sort = document.getElementById('sort') as HTMLSelectElement;
  const count = document.getElementById('result-count')!;
  const empty = document.getElementById('empty')!;
  const dialog = document.getElementById('cert-dialog') as HTMLDialogElement;
  const dialogBody = document.getElementById('dialog-body')!;

  // ---- searching and sorting (within each section) ----
  function update(): void {
    const words = search.value.toLowerCase().trim().split(/s+/).filter(Boolean);
    let visible = 0;

    for (const section of sections) {
      const grid = section.querySelector<HTMLElement>('[data-grid]')!;
      const sectionCards = Array.from(grid.querySelectorAll<HTMLElement>('[data-card]'));
      let shown = 0;
      for (const card of sectionCards) {
        card.hidden = !words.every((word) => card.dataset.search!.includes(word));
        if (!card.hidden) shown++;
      }
      sectionCards.sort(comparators[sort.value as SortMode]).forEach((card) => grid.append(card));

      // Hide sections with no matches, and grey out their chip.
      section.hidden = shown === 0;
      section.querySelector('[data-section-count]')!.textContent = String(shown);
      const chip = chips.find((c) => c.dataset.jump === section.dataset.section)!;
      chip.disabled = shown === 0;
      chip.querySelector('[data-chip-count]')!.textContent = String(shown);
      visible += shown;
    }

    count.textContent = `Showing ${visible} of ${cards.length} certificates`;
    empty.hidden = visible > 0;
    highlightCurrentSection();
  }

  search.addEventListener('input', update);
  sort.addEventListener('change', update);

  // ---- category chips: jump to a section ----
  function setActiveChip(id: string): void {
    for (const chip of chips) {
      const active = chip.dataset.jump === id;
      chip.setAttribute('aria-current', String(active));
      // On narrow screens the chip row scrolls sideways; keep the active chip in view.
      if (active) chipRow.scrollTo({ left: chip.offsetLeft - chipRow.offsetLeft - 16, behavior: scrollBehavior() });
    }
  }

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      const id = chip.dataset.jump!;
      const target = id === 'all' ? main : document.getElementById(`section-${id}`)!;
      setActiveChip(id);
      // Don't let the scroll-follow highlight flicker through the sections we glide past.
      jumpingUntil = Date.now() + 1000;
      target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    }),
  );

  // As the visitor scrolls, highlight the chip of the section they're looking at.
  let jumpingUntil = 0;
  function highlightCurrentSection(): void {
    if (Date.now() < jumpingUntil) return;
    const line = nav.getBoundingClientRect().bottom + 40;
    let current = 'all';
    for (const section of sections) {
      if (!section.hidden && section.getBoundingClientRect().top <= line) current = section.dataset.section!;
    }
    const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
    if (atBottom) current = sections.filter((s) => !s.hidden).at(-1)?.dataset.section ?? current;
    if (chips.find((c) => c.getAttribute('aria-current') === 'true')?.dataset.jump !== current) setActiveChip(current);
  }

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        highlightCurrentSection();
        ticking = false;
      });
    },
    { passive: true },
  );
  window.addEventListener('scrollend', () => {
    jumpingUntil = 0;
    highlightCurrentSection();
  });

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
