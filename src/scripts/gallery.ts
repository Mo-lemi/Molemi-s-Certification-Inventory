type SortMode = 'newest' | 'oldest' | 'title';

/** Shows the "expired" note on anything whose expiry date has passed (checked in the visitor's browser, so it's always current). */
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

export function initGallery(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-row]'));
  const search = document.getElementById('search') as HTMLInputElement;
  const sort = document.getElementById('sort') as HTMLSelectElement;
  const count = document.getElementById('result-count')!;
  const empty = document.getElementById('empty')!;

  // ---- searching and sorting (within each section) ----
  function update(): void {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;

    for (const section of sections) {
      const table = section.querySelector('table')!;
      const sectionRows = Array.from(table.querySelectorAll<HTMLElement>('[data-row]'));
      let shown = 0;
      for (const row of sectionRows) {
        row.hidden = !words.every((word) => row.dataset.search!.includes(word));
        if (!row.hidden) shown++;
      }
      sectionRows.sort(comparators[sort.value as SortMode]).forEach((row) => table.append(row));

      section.hidden = shown === 0;
      section.querySelector('[data-section-count]')!.textContent = String(shown);
      visible += shown;
    }

    count.textContent = words.length ? `${visible} of ${rows.length} records` : `${rows.length} records`;
    empty.hidden = visible > 0;
  }

  search.addEventListener('input', update);
  sort.addEventListener('change', update);

  // ---- opening a row in place ----
  function setOpen(row: HTMLElement, open: boolean): void {
    row.querySelector('[data-toggle]')!.setAttribute('aria-expanded', String(open));
    row.querySelector<HTMLElement>('[data-detail]')!.hidden = !open;
    row.querySelector('[data-toggle-icon]')!.textContent = open ? '−' : '+';
  }

  for (const row of rows) {
    const toggle = row.querySelector('[data-toggle]')!;
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      setOpen(row, open);
      // Put the id in the address bar so a specific certificate can be shared, e.g. …/#hackerrank-java-basic
      history.replaceState(null, '', open ? `#${row.id}` : location.pathname + location.search);
    });
  }

  // ---- start up ----
  markExpired(document);
  const linked = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (linked?.matches('[data-row]')) {
    setOpen(linked, true);
    linked.scrollIntoView({ block: 'start' });
  }
}
