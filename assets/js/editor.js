//==================================================
// Manual Kit Editor
//==================================================

// Markdown-it
const md = window.markdownit({
  html: true
});

// Elements
const textarea = document.getElementById("markdownEditor");
const preview = document.getElementById("preview");
const previewToggle = document.getElementById("previewToggle");
const editorMain = document.querySelector(".editor-main");
const cursorStatus = document.getElementById("cursorStatus");
const saveStatus = document.getElementById("saveStatus");

// CodeMirror
const cm = CodeMirror.fromTextArea(textarea, {
  mode: "markdown",
  lineNumbers: true,
  gutters: ["CodeMirror-linenumbers"],
  lineWrapping: true,
  styleActiveLine: true,
  theme: "material-darker"
});

function renderPreview() {
  const html = md.render(cm.getValue());
  preview.innerHTML = html;
  saveStatus.textContent = "Preview Updated";
}

function updateCursorStatus() {
  const cursor = cm.getCursor();
  const ln = cursor.line + 1;
  const col = cursor.ch + 1;

  cursorStatus.textContent = `Ln ${ln}, Col ${col}`;
}

cm.on("change", () => {
  renderPreview();
  updateCursorStatus();
});

cm.on("cursorActivity", () => {
  updateCursorStatus();
});

document.addEventListener("headerLoaded", () => {
  const previewToggle = document.getElementById("previewToggle");

  if (!previewToggle) return;

  previewToggle.addEventListener("click", () => {
    previewToggle.classList.toggle("active");

    const visible = previewToggle.classList.contains("active");

    editorMain.classList.toggle("preview-off", !visible);

    setTimeout(() => {
      cm.refresh();
    }, 0);
  });
});

window.openEditorFile = function ({ name, handle, text }) {
  window.currentFileHandle = handle;
  window.currentFileName = name;

  if (window.editor) {
    window.editor.setValue(text);
  }

  if (typeof updatePreview === "function") {
    updatePreview();
  }
};

renderPreview();
updateCursorStatus();
cm.refresh();