//==================================================
// Manual Kit Document Search
//==================================================

(() => {
  "use strict";

  const state = {
    cm: null,
    mount: null,
    panel: null,
    input: null,
    count: null,
    caseButton: null,
    findButton: null,
    previousButton: null,
    nextButton: null,
    closeButton: null,
    caseSensitive: false,
    matches: [],
    marks: [],
    currentIndex: -1,
    changeTimer: null,
    loadPromise: null,
    initialized: false,
  };

  async function waitForToolbar() {
    const existing = document.getElementById("searchMount");
    if (existing) return existing;

    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        const mount = document.getElementById("searchMount");
        if (!mount) return;

        observer.disconnect();
        resolve(mount);
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    });
  }

  async function loadSearchComponent() {
    if (state.panel) return;
    if (state.loadPromise) return state.loadPromise;

    state.loadPromise = (async () => {
      state.mount = await waitForToolbar();

      const response = await fetch("/components/search.html");

      if (!response.ok) {
        throw new Error(`Search component load failed: ${response.status}`);
      }

      state.mount.innerHTML = await response.text();
      state.panel = document.getElementById("toolbarSearchPanel");
    })();

    return state.loadPromise;
  }

  async function initializeSearch() {
    if (state.initialized) return true;

    try {
      await loadSearchComponent();
    } catch (error) {
      console.error("[search]", error);
      return false;
    }

    state.cm = window.manualEditor;
    state.findButton = document.getElementById("toolbarFind");
    state.input = document.getElementById("toolbarSearchInput");
    state.count = document.getElementById("toolbarSearchCount");
    state.caseButton = document.getElementById("toolbarSearchCase");
    state.previousButton = document.getElementById("toolbarSearchPrevious");
    state.nextButton = document.getElementById("toolbarSearchNext");
    state.closeButton = document.getElementById("toolbarSearchClose");

    if (
      !state.cm ||
      !state.panel ||
      !state.findButton ||
      !state.input ||
      !state.count ||
      !state.caseButton ||
      !state.previousButton ||
      !state.nextButton ||
      !state.closeButton
    ) {
      console.error("[search] 필요한 요소를 찾지 못했습니다.");
      return false;
    }

    bindEvents();
    updateCount();
    state.initialized = true;
    return true;
  }

  function bindEvents() {
    state.findButton.addEventListener("click", openSearch);
    state.closeButton.addEventListener("click", closeSearch);
    state.previousButton.addEventListener("click", movePrevious);
    state.nextButton.addEventListener("click", moveNext);

    state.caseButton.addEventListener("click", () => {
      state.caseSensitive = !state.caseSensitive;
      state.caseButton.classList.toggle("is-active", state.caseSensitive);
      state.caseButton.setAttribute(
        "aria-pressed",
        String(state.caseSensitive)
      );

      refreshMatches({ preserveNearest: true });
      state.input.focus();
    });

    state.input.addEventListener("input", () => {
      refreshMatches({ startFromCursor: true });
    });

    state.input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.shiftKey ? movePrevious() : moveNext();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
    });

    state.cm.on("change", () => {
      if (state.panel.hidden || !state.input.value) return;

      window.clearTimeout(state.changeTimer);
      state.changeTimer = window.setTimeout(() => {
        refreshMatches({ preserveNearest: true });
      }, 80);
    });
  }

  async function openSearch({ useSelection = true } = {}) {
    if (!(await initializeSearch())) return;

    state.panel.hidden = false;
    state.findButton.classList.add("is-active");
    state.findButton.setAttribute("aria-expanded", "true");

    if (useSelection) {
      const selected = state.cm.getSelection();

      if (selected && !selected.includes("\n") && selected.length <= 120) {
        state.input.value = selected;
      }
    }

    refreshMatches({ startFromCursor: true });
    state.input.focus();
    state.input.select();
  }

  function closeSearch() {
    if (!state.initialized) return;

    state.panel.hidden = true;
    state.findButton.classList.remove("is-active");
    state.findButton.setAttribute("aria-expanded", "false");

    clearMarks();
    state.matches = [];
    state.currentIndex = -1;
    updateCount();
    state.cm.focus();
  }

  function refreshMatches({
    startFromCursor = false,
    preserveNearest = false,
  } = {}) {
    clearMarks();
    state.matches = collectMatches();

    if (state.matches.length === 0) {
      state.currentIndex = -1;
      updateCount();
      return;
    }

    if (startFromCursor) {
      state.currentIndex = findIndexAtOrAfter(state.cm.getCursor("from"));
    } else if (preserveNearest) {
      state.currentIndex = findNearestIndex(state.cm.getCursor("from"));
    } else {
      state.currentIndex = Math.min(
        Math.max(state.currentIndex, 0),
        state.matches.length - 1
      );
    }

    renderMarks();
    updateCount();
  }

  function collectMatches() {
    const query = state.input.value;
    if (!query) return [];

    const documentText = state.cm.getValue();
    const haystack = state.caseSensitive
      ? documentText
      : documentText.toLocaleLowerCase();
    const needle = state.caseSensitive
      ? query
      : query.toLocaleLowerCase();

    if (!needle) return [];

    const matches = [];
    let fromIndex = 0;

    while (fromIndex <= haystack.length - needle.length) {
      const foundIndex = haystack.indexOf(needle, fromIndex);
      if (foundIndex === -1) break;

      matches.push({
        from: state.cm.posFromIndex(foundIndex),
        to: state.cm.posFromIndex(foundIndex + query.length),
      });

      // 겹치는 결과도 검색한다. 예: "aaa"에서 "aa" 두 건.
      fromIndex = foundIndex + 1;
    }

    return matches;
  }

  function renderMarks() {
    state.marks = state.matches.map((match, index) => {
      const className = index === state.currentIndex
        ? "cm-manual-search-current"
        : "cm-manual-search-match";

      return state.cm.markText(match.from, match.to, { className });
    });
  }

  function clearMarks() {
    state.marks.forEach(mark => mark.clear());
    state.marks = [];
  }

  async function moveNext() {
    if (!(await initializeSearch())) return;

    if (state.panel.hidden) {
      await openSearch();
      return;
    }

    if (!state.matches.length) {
      refreshMatches({ startFromCursor: true });
      if (!state.matches.length) return;
    } else {
      state.currentIndex = (state.currentIndex + 1) % state.matches.length;
      redrawCurrentMark();
    }

    revealCurrent();
  }

  async function movePrevious() {
    if (!(await initializeSearch())) return;

    if (state.panel.hidden) {
      await openSearch();
      return;
    }

    if (!state.matches.length) {
      refreshMatches({ startFromCursor: true });
      if (!state.matches.length) return;
    } else {
      state.currentIndex =
        (state.currentIndex - 1 + state.matches.length) % state.matches.length;
      redrawCurrentMark();
    }

    revealCurrent();
  }

  function redrawCurrentMark() {
    clearMarks();
    renderMarks();
    updateCount();
  }

  function revealCurrent() {
    const match = state.matches[state.currentIndex];
    if (!match) return;

    state.cm.setSelection(match.from, match.to);
    state.cm.scrollIntoView({ from: match.from, to: match.to }, 80);
    state.input.focus();
  }

  function findIndexAtOrAfter(position) {
    const cursorIndex = state.cm.indexFromPos(position);
    const found = state.matches.findIndex(match => {
      return state.cm.indexFromPos(match.from) >= cursorIndex;
    });

    return found === -1 ? 0 : found;
  }

  function findNearestIndex(position) {
    const cursorIndex = state.cm.indexFromPos(position);
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    state.matches.forEach((match, index) => {
      const distance = Math.abs(
        state.cm.indexFromPos(match.from) - cursorIndex
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  function updateCount() {
    if (!state.count || !state.panel) return;

    const hasQuery = Boolean(state.input?.value);
    const total = state.matches.length;
    const current = total > 0 ? state.currentIndex + 1 : 0;

    state.count.textContent = `${current} / ${total}`;
    state.panel.classList.toggle("is-empty", !hasQuery);
    state.panel.classList.toggle("is-no-match", hasQuery && total === 0);
  }

  async function handleGlobalKeydown(event) {
    const ctrlOrCommand = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (ctrlOrCommand && key === "f") {
      event.preventDefault();
      await openSearch();
      return;
    }

    if (event.key === "F3") {
      event.preventDefault();
      event.shiftKey ? await movePrevious() : await moveNext();
      return;
    }

    if (
      event.key === "Escape" &&
      state.initialized &&
      !state.panel.hidden
    ) {
      event.preventDefault();
      closeSearch();
    }
  }

  async function handleMenuClick(event) {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.id === "menuFind") {
      await openSearch();
    } else if (button.id === "menuFindNext") {
      await moveNext();
    } else if (button.id === "menuFindPrevious") {
      await movePrevious();
    }
  }

  window.manualSearch = {
    open: openSearch,
    close: closeSearch,
    next: moveNext,
    previous: movePrevious,
  };

  document.addEventListener("keydown", handleGlobalKeydown, true);
  document.addEventListener("click", handleMenuClick);
  document.addEventListener("DOMContentLoaded", initializeSearch);
})();
