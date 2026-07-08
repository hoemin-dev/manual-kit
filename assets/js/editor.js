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

previewToggle.addEventListener("change", () => {
  editorMain.classList.toggle("preview-off", !previewToggle.checked);

  // Preview 껐다 켰을 때 CodeMirror 폭 재계산
  setTimeout(() => {
    cm.refresh();
  }, 0);
});

renderPreview();
updateCursorStatus();
cm.refresh();