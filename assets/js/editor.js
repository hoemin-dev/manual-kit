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

  const headerToggle = document.getElementById("previewToggle");
  const toolbarToggle = document.getElementById("toolbarPreview");

  if (headerToggle) {
    headerToggle.classList.toggle("active", visible);
    headerToggle.setAttribute("aria-pressed", String(visible));
  }

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
// Header Events
//==================================================

document.addEventListener("headerLoaded", () => {
  const previewToggle = document.getElementById("previewToggle");

  if (!previewToggle) return;

  const previewVisible =
    !editorMain?.classList.contains("preview-off");

  previewToggle.classList.toggle("active", previewVisible);
  previewToggle.setAttribute(
    "aria-pressed",
    String(previewVisible)
  );

  previewToggle.addEventListener("click", togglePreview);
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
});