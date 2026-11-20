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
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const panel = document.getElementById('records')!;
  const note = document.getElementById('tab-note')!;
  const table = panel.querySelector('table')!;
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-row]'));
  const search = document.getElementById('search') as HTMLInputElement;
  const sort = document.getElementById('sort') as HTMLSelectElement;
  const count = document.getElementById('result-count')!;
  const empty = document.getElementById('empty')!;

  let activeTab = tabs[0];
  /** Whether a row belongs in a tab: tabs filter by type, and course tabs also by provider. */
  const inTab = (row: HTMLElement, tab: HTMLElement) =>
    (!tab.dataset.tabType || row.dataset.type === tab.dataset.tabType) &&
    (!tab.dataset.tabProvider || row.dataset.provider === tab.dataset.tabProvider);

  // ---- searching, sorting and tab filtering ----
  function update(): void {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = rows.filter((row) => words.every((word) => row.dataset.search!.includes(word)));

    // Each tab's count shows how many search matches it holds.
    for (const tab of tabs) {
      tab.querySelector('[data-tab-count]')!.textContent = String(matches.filter((row) => inTab(row, tab)).length);
    }

    let visible = 0;
    for (const row of rows) {
      row.hidden = !(matches.includes(row) && inTab(row, activeTab));
      if (!row.hidden) visible++;
    }
    [...rows].sort(comparators[sort.value as SortMode]).forEach((row) => table.append(row));

    const total = rows.filter((row) => inTab(row, activeTab)).length;
    const records = total === 1 ? 'record' : 'records';
    count.textContent = visible === total ? `${total} ${records}` : `${visible} of ${total} ${records}`;
    empty.hidden = visible > 0;
  }

  function selectTab(id: string, focus = false): void {
    const target = tabs.find((tab) => tab.dataset.tab === id) ?? tabs[0];
    activeTab = target;
    for (const tab of tabs) {
      const selected = tab === target;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', target.id);
    note.textContent = target.dataset.note ?? '';
    if (focus) target.focus();
    // On narrow screens, slide the tab row so the selected tab is in view (without scrolling the page).
    const bar = target.parentElement!;
    if (target.offsetLeft < bar.scrollLeft || target.offsetLeft + target.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollLeft = target.offsetLeft - 16;
    }
    update();
  }

  /** Keeps the open tab in the address (?tab=datacamp) so a link can point straight at it. */
  function rememberTab(): void {
    const url = new URL(location.href);
    if (activeTab === tabs[0]) url.searchParams.delete('tab');
    else url.searchParams.set('tab', activeTab.dataset.tab!);
    history.replaceState(null, '', url);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      selectTab(tab.dataset.tab!);
      rememberTab();
    });
    // Arrow keys, Home and End move between tabs, as in the standard tabs pattern.
    tab.addEventListener('keydown', (event) => {
      const moves: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      const next = moves[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[(next + tabs.length) % tabs.length].dataset.tab!, true);
      rememberTab();
    });
  });

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
      history.replaceState(null, '', open ? `${location.pathname}${location.search}#${row.id}` : location.pathname + location.search);
    });
  }

  // ---- start up ----
  markExpired(document);
  const linked = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const requested = tabs.find((tab) => tab.dataset.tab === new URLSearchParams(location.search).get('tab')) ?? tabs[0];
  // A link to one certificate opens a tab that contains it.
  selectTab((linked?.matches('[data-row]') && !inTab(linked, requested) ? tabs[0] : requested).dataset.tab!);
  if (linked?.matches('[data-row]')) {
    setOpen(linked, true);
    linked.scrollIntoView({ block: 'start' });
  }
}
