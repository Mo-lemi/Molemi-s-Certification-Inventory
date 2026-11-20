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
  const groups = Array.from(panel.querySelectorAll<HTMLElement>('[data-group]'));
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-row]'));
  const search = document.getElementById('search') as HTMLInputElement;
  const sort = document.getElementById('sort') as HTMLSelectElement;
  const count = document.getElementById('result-count')!;
  const empty = document.getElementById('empty')!;
  const allCertIds = new Set(rows.map((row) => row.dataset.cert!));

  let activeTab = tabs[0];
  // Dropdown state in the All tab. Groups start closed. While searching, groups with matches
  // open by themselves unless the visitor closes them; clearing the search restores openGroups.
  const openGroups = new Set<string>();
  const closedWhileSearching = new Set<string>();
  // Same idea for the "courses completed for this certificate" dropdowns, keyed "group:certificate".
  const openPrograms = new Set<string>();
  const programsClosedWhileSearching = new Set<string>();

  const groupOf = (tab: HTMLElement) => groups.find((group) => group.dataset.group === tab.dataset.tab);

  // ---- searching, sorting and tab filtering ----
  function update(): void {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searching = words.length > 0;
    const isMatch = (row: HTMLElement) => words.every((word) => row.dataset.search!.includes(word));
    const showingAll = activeTab === tabs[0];

    // Matching certificate ids per group. A certificate can sit in two groups, so counts use ids, not rows.
    const matchedIn = new Map<HTMLElement, Set<string>>();
    const allMatched = new Set<string>();

    for (const group of groups) {
      const id = group.dataset.group!;
      const table = group.querySelector('table')!;
      const groupRows = Array.from(table.querySelectorAll<HTMLElement>('[data-row]'));
      const matched = new Set(groupRows.filter(isMatch).map((row) => row.dataset.cert!));
      matchedIn.set(group, matched);
      matched.forEach((cert) => allMatched.add(cert));

      // Top-level rows are sorted; each one's dropdown and included certificates follow it.
      const compare = comparators[sort.value as SortMode];
      const topRows = groupRows.filter((row) => !row.dataset.parent).sort(compare);
      for (const row of topRows) {
        const cert = row.dataset.cert!;
        const children = groupRows.filter((child) => child.dataset.parent === cert).sort(compare);
        const childMatches = children.some((child) => matched.has(child.dataset.cert!));
        // Keep a certificate visible when only its included courses match, so they have context.
        row.hidden = !matched.has(cert) && !childMatches;
        table.append(row);
        if (children.length === 0) continue;

        const key = `${id}:${cert}`;
        const programOpen = searching ? childMatches && !programsClosedWhileSearching.has(key) : openPrograms.has(key);
        const toggle = table.querySelector<HTMLElement>(`[data-program-toggle="${cert}"]`)!;
        toggle.hidden = row.hidden;
        toggle.querySelector('[data-program-button]')!.setAttribute('aria-expanded', String(programOpen));
        toggle.querySelector('[data-program-icon]')!.textContent = programOpen ? '−' : '+';
        table.append(toggle);
        for (const child of children) {
          child.hidden = !programOpen || !matched.has(child.dataset.cert!);
          table.append(child);
        }
      }

      const inView = showingAll || id === activeTab.dataset.tab;
      const open = !showingAll || (searching ? !closedWhileSearching.has(id) : openGroups.has(id));
      group.hidden = !inView || matched.size === 0;
      group.querySelector<HTMLElement>('[data-group-heading]')!.hidden = !showingAll;
      group.querySelector<HTMLElement>('[data-group-note]')!.hidden = !showingAll;
      group.querySelector<HTMLElement>('[data-group-body]')!.hidden = !open;
      group.querySelector('[data-group-toggle]')!.setAttribute('aria-expanded', String(open));
      group.querySelector('[data-group-icon]')!.textContent = open ? '−' : '+';
      group.querySelector('[data-group-count]')!.textContent = String(matched.size);
    }

    // Each tab's count shows how many search matches it holds.
    for (const tab of tabs) {
      const group = groupOf(tab);
      tab.querySelector('[data-tab-count]')!.textContent = String(group ? matchedIn.get(group)!.size : allMatched.size);
    }

    const activeGroup = groupOf(activeTab);
    const visible = activeGroup ? matchedIn.get(activeGroup)!.size : allMatched.size;
    const total = activeGroup
      ? new Set(Array.from(activeGroup.querySelectorAll<HTMLElement>('[data-row]'), (row) => row.dataset.cert!)).size
      : allCertIds.size;
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

  search.addEventListener('input', () => {
    closedWhileSearching.clear();
    programsClosedWhileSearching.clear();
    update();
  });
  sort.addEventListener('change', update);

  /** Opens or closes a dropdown. While searching, the "closed" set is the one that changes. */
  function flip(openSet: Set<string>, closedSet: Set<string>, key: string): void {
    const states = search.value.trim() ? closedSet : openSet;
    if (states.has(key)) states.delete(key);
    else states.add(key);
    update();
  }

  for (const group of groups) {
    const id = group.dataset.group!;
    group.querySelector('[data-group-toggle]')!.addEventListener('click', () => flip(openGroups, closedWhileSearching, id));
    group.querySelectorAll<HTMLElement>('[data-program-toggle]').forEach((toggle) => {
      const key = `${id}:${toggle.dataset.programToggle}`;
      toggle.querySelector('[data-program-button]')!.addEventListener('click', () => flip(openPrograms, programsClosedWhileSearching, key));
    });
  }

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
      const base = location.pathname + location.search;
      history.replaceState(null, '', open ? `${base}#${row.dataset.cert}` : base);
    });
  }

  // ---- start up ----
  markExpired(document);
  const hashTarget = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const linked = hashTarget?.matches('[data-row]') ? hashTarget : null;
  const requested = tabs.find((tab) => tab.dataset.tab === new URLSearchParams(location.search).get('tab')) ?? tabs[0];
  // A link to one certificate opens a tab that contains it, its group's dropdown, and any course dropdown it sits in.
  const linkedGroup = linked?.closest<HTMLElement>('[data-group]');
  if (linkedGroup) {
    openGroups.add(linkedGroup.dataset.group!);
    if (linked!.dataset.parent) openPrograms.add(`${linkedGroup.dataset.group}:${linked!.dataset.parent}`);
  }
  const requestedHasLink = !linkedGroup || requested === tabs[0] || groupOf(requested) === linkedGroup;
  selectTab((requestedHasLink ? requested : tabs[0]).dataset.tab!);
  if (linked) {
    setOpen(linked, true);
    linked.scrollIntoView({ block: 'start' });
  }
}
