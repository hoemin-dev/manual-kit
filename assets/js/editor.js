//==================================================
// Manual Kit Editor
//==================================================

//==================================================
// Elements
//==================================================

const textarea = document.getElementById("markdownEditor");
const preview = document.getElementById("preview");
const editorMain = document.querySelector(".editor-main");
const cursorStatus = document.getElementById("cursorStatus");
const saveStatus = document.getElementById("saveStatus");

//==================================================
// Markdown-it
//==================================================

const md = window.markdownit({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

md.use(window.markdownItKatexPlugin); //katex
md.use(window.markdownItTaskList); //checklist

//==================================================
// CodeMirror
//==================================================

const cm = CodeMirror.fromTextArea(textarea, {
  mode: "markdown",
  lineNumbers: true,
  gutters: ["CodeMirror-linenumbers"],
  lineWrapping: true,
  styleActiveLine: true,
  theme: "material-darker",
});

loadFormatToolbar().then(function () {
  initFormatToolbar(cm);
});

// 다른 컴포넌트에서 현재 CodeMirror를 사용할 수 있게 공개
window.manualEditor = cm;
window.editor = cm;

// 현재 열려 있는 파일 정보
window.currentFileHandle = null;
window.currentFileName = "Untitled.md";

// 마지막으로 저장된 문서 내용
let savedContent = cm.getValue();

// 문서 초기화 과정인지 여부
let isInitializing = true;

//==================================================
// Preview
//==================================================

function renderPreview() {
  if (!preview) return;

  const source = cm.getValue();
  const html = renderManualMarkdown(source, md);

  preview.innerHTML = html;

  document.dispatchEvent(
    new CustomEvent("manualkit:previewRendered", {
      detail: {
        source,
        html,
      },
    })
  );
}

//==================================================
// Cursor Status
//==================================================

function updateCursorStatus() {
  if (!cursorStatus) return;

  const cursor = cm.getCursor();
  const line = cursor.line + 1;
  const column = cursor.ch + 1;

  cursorStatus.textContent = `Ln ${line}, Col ${column}`;
}

//==================================================
// Save Status
//==================================================

function setSaveStatus(state) {
  if (saveStatus) {
    if (state === "saved") {
      saveStatus.textContent = "Saved";
    } else if (state === "saving") {
      saveStatus.textContent = "Saving...";
    } else {
      saveStatus.textContent = "Unsaved";
    }
  }

  document.dispatchEvent(
    new CustomEvent("manualkit:saveStateChanged", {
      detail: {
        state,
        fileName: window.currentFileName,
      },
    })
  );
}

function updateSaveStatus() {
  const currentContent = cm.getValue();

  if (currentContent === savedContent) {
    setSaveStatus("saved");
  } else {
    setSaveStatus("unsaved");
  }
}

function markDocumentSaved() {
  savedContent = cm.getValue();
  setSaveStatus("saved");
}

// 툴바나 파일 저장 코드에서 사용할 수 있게 공개
window.markDocumentSaved = markDocumentSaved;
window.updateEditorSaveStatus = updateSaveStatus;

//==================================================
// Preview Visibility
//==================================================

function setPreviewVisible(visible) {
  if (!editorMain) return;

  editorMain.classList.toggle("preview-off", !visible);

  const toolbarToggle = document.getElementById("toolbarPreview");

  if (toolbarToggle) {
    toolbarToggle.classList.toggle("is-active", visible);
    toolbarToggle.setAttribute("aria-pressed", String(visible));
  }

  requestAnimationFrame(() => {
    cm.refresh();
  });

  document.dispatchEvent(
    new CustomEvent("manualkit:previewVisibilityChanged", {
      detail: {
        visible,
      },
    })
  );
}

function togglePreview() {
  if (!editorMain) return;

  const currentlyVisible =
    !editorMain.classList.contains("preview-off");

  setPreviewVisible(!currentlyVisible);
}

// 다른 컴포넌트에서도 사용할 수 있게 공개
window.setPreviewVisible = setPreviewVisible;
window.toggleEditorPreview = togglePreview;

//==================================================
// Command Wheel Component
//==================================================

async function loadCwheel() {
  const mount = document.getElementById("cwheelMount");

  if (!mount) {
    console.warn("[cwheel] #cwheelMount 요소가 없습니다.");
    return;
  }

  const response = await fetch("components/cwheel.html");

  if (!response.ok) {
    throw new Error(`cwheel 로드 실패: ${response.status}`);
  }

  mount.innerHTML = await response.text();

  if (typeof initCwheel === "function") {
    initCwheel(cm);
  } else {
    console.warn(
      "[cwheel] assets/js/cwheel.js가 로드되지 않았습니다."
    );
  }
}

//==================================================
// Editor Events
//==================================================

cm.on("change", () => {
  renderPreview();
  updateCursorStatus();

  if (!isInitializing) {
    updateSaveStatus();

    document.dispatchEvent(
      new CustomEvent("manualkit:changed", {
        detail: {
          content: cm.getValue(),
          fileName: window.currentFileName,
        },
      })
    );
  }
});

cm.on("cursorActivity", () => {
  updateCursorStatus();
});

//==================================================
// Manual Kit Command Highlight
//==================================================

const manualCommands = new Set([
  "%page",
  "%chapter",
  "%sub",
]);

cm.addOverlay({
  token(stream) {
    if (stream.sol()) {
      // 줄 시작의 %부터 첫 공백 전까지 읽음
      const match = stream.match(/^%\S+/);

      if (match) {
        return manualCommands.has(match[0])
          ? "mk-command"
          : "mk-command-invalid";
      }
    }

    stream.next();
    return null;
  },
});

//==================================================
// Toolbar Events
//==================================================

document.addEventListener("toolbarLoaded", () => {
  const previewButton =
    document.getElementById("toolbarPreview");

  if (!previewButton) return;

  const previewVisible =
    !editorMain?.classList.contains("preview-off");

  previewButton.classList.toggle(
    "is-active",
    previewVisible
  );

  previewButton.setAttribute(
    "aria-pressed",
    String(previewVisible)
  );

  previewButton.addEventListener("click", togglePreview);
});

//==================================================
// Format-Toolbar Events
//==================================================

async function loadFormatToolbar() {
  const mount = document.getElementById("formatToolbarMount");

  if (!mount) {
    return;
  }

  const response = await fetch("components/format-toolbar.html");

  if (!response.ok) {
    throw new Error("format-toolbar.html 로드 실패");
  }

  mount.innerHTML = await response.text();
}

//==================================================
// External File Open
//==================================================

window.openEditorFile = function ({
  name = "Untitled.md",
  handle = null,
  text = "",
}) {
  window.currentFileHandle = handle;
  window.currentFileName = name;

  isInitializing = true;

  cm.setValue(text);
  cm.clearHistory();

  savedContent = text;

  renderPreview();
  updateCursorStatus();
  markDocumentSaved();

  isInitializing = false;

  cm.focus();

  requestAnimationFrame(() => {
    cm.refresh();
  });

  document.dispatchEvent(
    new CustomEvent("manualkit:fileOpened", {
      detail: {
        name,
        handle,
      },
    })
  );
};

//==================================================
// New Document
//==================================================

window.createNewEditorDocument = function () {
  window.currentFileHandle = null;
  window.currentFileName = "Untitled.md";

  isInitializing = true;

  cm.setValue("");
  cm.clearHistory();

  savedContent = "";

  renderPreview();
  updateCursorStatus();
  markDocumentSaved();

  isInitializing = false;

  cm.focus();

  document.dispatchEvent(
    new CustomEvent("manualkit:fileOpened", {
      detail: {
        name: "Untitled.md",
        handle: null,
      },
    })
  );
};

//==================================================
// Before Unload
//==================================================

window.addEventListener("beforeunload", event => {
  if (cm.getValue() === savedContent) return;

  event.preventDefault();
  event.returnValue = "";
});

//==================================================
// Init
//==================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadCwheel();
  } catch (error) {
    console.error("[cwheel]", error);
  }

  renderPreview();
  updateCursorStatus();

  savedContent = cm.getValue();
  setSaveStatus("saved");

  isInitializing = false;

  requestAnimationFrame(() => {
    cm.refresh();
  });

  initEditorSplitResizer();
});

//==================================================
// Editor / Preview Split Resizer
//==================================================

function initEditorSplitResizer() {
  const editorMain = document.querySelector(".editor-main");
  const editorPane = document.getElementById("editorPane");
  const previewPane = document.getElementById("previewPane");
  const divider = document.getElementById("editorDivider");

  if (!editorMain || !editorPane || !previewPane || !divider) {
    console.warn("[split] 분할 영역 요소를 찾지 못했습니다.");
    return;
  }

  const STORAGE_KEY = "manualkit.editorSplitRatio";

  const DEFAULT_RATIO = 0.5;
  const MIN_EDITOR_WIDTH = 280;
  const MIN_PREVIEW_WIDTH = 280;
  const KEYBOARD_STEP = 20;

  let isDragging = false;
  let lastRatio = loadSavedRatio();

  // --------------------------------------------------
  // 저장된 비율 불러오기
  // --------------------------------------------------

  function loadSavedRatio() {
    const stored = Number.parseFloat(
      localStorage.getItem(STORAGE_KEY)
    );

    if (!Number.isFinite(stored)) {
      return DEFAULT_RATIO;
    }

    return Math.min(Math.max(stored, 0.1), 0.9);
  }

  // --------------------------------------------------
  // 비율 저장
  // --------------------------------------------------

  function saveRatio(ratio) {
    try {
      localStorage.setItem(STORAGE_KEY, String(ratio));
    } catch (error) {
      console.warn("[split] 분할 비율 저장 실패", error);
    }
  }

  // --------------------------------------------------
  // 현재 사용 가능한 폭
  // --------------------------------------------------

  function getAvailableWidth() {
    const dividerWidth = divider.getBoundingClientRect().width;

    return Math.max(
      0,
      editorMain.clientWidth - dividerWidth
    );
  }

  // --------------------------------------------------
  // 현재 화면 크기에 맞는 최소/최대 폭 계산
  // --------------------------------------------------

  function getWidthLimits() {
    const availableWidth = getAvailableWidth();

    // 화면이 너무 좁을 경우 양쪽 최소폭을 유동적으로 축소
    const editorMinimum = Math.min(
      MIN_EDITOR_WIDTH,
      availableWidth * 0.45
    );

    const previewMinimum = Math.min(
      MIN_PREVIEW_WIDTH,
      availableWidth * 0.45
    );

    const minWidth = editorMinimum;
    const maxWidth = Math.max(
      minWidth,
      availableWidth - previewMinimum
    );

    return {
      availableWidth,
      minWidth,
      maxWidth,
    };
  }

  // --------------------------------------------------
  // 에디터 폭 적용
  // --------------------------------------------------

  function applyEditorWidth(width, shouldSave = false) {
    const {
      availableWidth,
      minWidth,
      maxWidth,
    } = getWidthLimits();

    if (availableWidth <= 0) {
      return;
    }

    const clampedWidth = Math.min(
      Math.max(width, minWidth),
      maxWidth
    );

    const ratio = clampedWidth / availableWidth;

    editorPane.style.flex = `0 0 ${clampedWidth}px`;
    previewPane.style.flex = "1 1 0";

    divider.setAttribute(
      "aria-valuenow",
      String(Math.round(ratio * 100))
    );

    divider.setAttribute("aria-valuemin", "10");
    divider.setAttribute("aria-valuemax", "90");

    lastRatio = ratio;

    if (shouldSave) {
      saveRatio(ratio);
    }

    refreshCodeMirror();
  }

  // --------------------------------------------------
  // 저장된 비율 적용
  // --------------------------------------------------

  function applyRatio(ratio, shouldSave = false) {
    const availableWidth = getAvailableWidth();

    if (availableWidth <= 0) {
      return;
    }

    applyEditorWidth(
      availableWidth * ratio,
      shouldSave
    );
  }

  // --------------------------------------------------
  // CodeMirror 폭 다시 계산
  // --------------------------------------------------

  function refreshCodeMirror() {
    if (
      typeof cm !== "undefined" &&
      cm &&
      typeof cm.refresh === "function"
    ) {
      requestAnimationFrame(() => {
        cm.refresh();
      });
    }
  }

  // --------------------------------------------------
  // 포인터 위치로 폭 계산
  // --------------------------------------------------

  function resizeFromPointer(clientX) {
    const mainRect = editorMain.getBoundingClientRect();
    const newEditorWidth = clientX - mainRect.left;

    applyEditorWidth(newEditorWidth);
  }

  // --------------------------------------------------
  // 드래그 시작
  // --------------------------------------------------

  function startDragging(event) {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    if (editorMain.classList.contains("preview-off")) {
      return;
    }

    isDragging = true;

    divider.classList.add("is-dragging");
    document.body.classList.add("editor-resizing");

    if (event.pointerId !== undefined) {
      divider.setPointerCapture(event.pointerId);
    }

    resizeFromPointer(event.clientX);

    event.preventDefault();
  }

  // --------------------------------------------------
  // 드래그 이동
  // --------------------------------------------------

  function moveDragging(event) {
    if (!isDragging) {
      return;
    }

    resizeFromPointer(event.clientX);
    event.preventDefault();
  }

  // --------------------------------------------------
  // 드래그 종료
  // --------------------------------------------------

  function stopDragging(event) {
    if (!isDragging) {
      return;
    }

    isDragging = false;

    divider.classList.remove("is-dragging");
    document.body.classList.remove("editor-resizing");

    if (
      event.pointerId !== undefined &&
      divider.hasPointerCapture(event.pointerId)
    ) {
      divider.releasePointerCapture(event.pointerId);
    }

    saveRatio(lastRatio);
    refreshCodeMirror();
  }

  // --------------------------------------------------
  // 더블클릭 시 50:50 복원
  // --------------------------------------------------

  function resetSplitRatio() {
    applyRatio(DEFAULT_RATIO, true);
  }

  // --------------------------------------------------
  // 창 크기 변경 대응
  // --------------------------------------------------

  function handleWindowResize() {
    if (editorMain.classList.contains("preview-off")) {
      return;
    }

    applyRatio(lastRatio);
  }

  // --------------------------------------------------
  // 이벤트 등록
  // --------------------------------------------------

  divider.addEventListener("pointerdown", startDragging);
  divider.addEventListener("pointermove", moveDragging);
  divider.addEventListener("pointerup", stopDragging);
  divider.addEventListener("pointercancel", stopDragging);

  divider.addEventListener(
    "dblclick",
    resetSplitRatio
  );

  window.addEventListener(
    "resize",
    handleWindowResize
  );

  // Preview를 다시 켰을 때 이전 분할 비율 복원
  document.addEventListener(
    "manualkit:previewVisibilityChanged",
    (event) => {
      if (!event.detail?.visible) {
        return;
      }

      requestAnimationFrame(() => {
        applyRatio(lastRatio);
      });
    }
  );

  // 초기 비율 적용
  requestAnimationFrame(() => {
    applyRatio(lastRatio);
  });
}