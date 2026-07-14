//==================================================
// Manual Kit Toolbar
//==================================================

document.addEventListener("DOMContentLoaded", async () => {
  await loadToolbar();

  const cm = window.manualEditor;

  if (!cm) {
    console.error("Manual Kit editor instance not found.");
    return;
  }

  const fileInput = document.getElementById("markdownFileInput");

  const newButton = document.getElementById("toolbarNew");
  const openButton = document.getElementById("toolbarOpen");
  const saveButton = document.getElementById("toolbarSave");
  const undoButton = document.getElementById("toolbarUndo");
  const redoButton = document.getElementById("toolbarRedo");
  const previewButton = document.getElementById("toolbarPreview");
  const exportButton = document.getElementById("toolbarExport");

  const documentName = document.getElementById("toolbarDocumentName");
  const saveState = document.getElementById("toolbarSaveState");
  const saveStateText = saveState.querySelector(".toolbar-state-text");
  const statusbarSaveState = document.getElementById("saveStatus");

  let currentFileName = "Untitled.md";
  let savedContent = cm.getValue();
  let isDirty = false;

  //================================================
  // State
  //================================================

  function setFileName(fileName) {
    currentFileName = fileName || "Untitled.md";
    documentName.textContent = currentFileName;
    document.title = `${currentFileName} - Manual Kit`;
  }

  function setSaveState(state) {
    saveState.classList.remove(
      "is-saved",
      "is-unsaved",
      "is-saving"
    );

    if (state === "saved") {
      isDirty = false;
      saveState.classList.add("is-saved");
      saveStateText.textContent = "Saved";

      if (statusbarSaveState) {
        statusbarSaveState.textContent = "Saved";
      }

      return;
    }

    if (state === "saving") {
      saveState.classList.add("is-saving");
      saveStateText.textContent = "Saving...";

      if (statusbarSaveState) {
        statusbarSaveState.textContent = "Saving...";
      }

      return;
    }

    isDirty = true;
    saveState.classList.add("is-unsaved");
    saveStateText.textContent = "Unsaved";

    if (statusbarSaveState) {
      statusbarSaveState.textContent = "Unsaved";
    }
  }

  function markCurrentContentAsSaved() {
    savedContent = cm.getValue();
    setSaveState("saved");
  }

  function updateDirtyState() {
    if (cm.getValue() === savedContent) {
      setSaveState("saved");
    } else {
      setSaveState("unsaved");
    }
  }

  //================================================
  // New
  //================================================

  function createNewDocument() {
    if (
      isDirty &&
      !window.confirm(
        "저장하지 않은 변경사항이 있습니다.\n새 문서를 만들까요?"
      )
    ) {
      return;
    }

    cm.setValue("");
    cm.clearHistory();
    cm.focus();

    setFileName("Untitled.md");
    markCurrentContentAsSaved();
  }

  //================================================
  // Open
  //================================================

  function openDocument() {
    fileInput.value = "";
    fileInput.click();
  }

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      isDirty &&
      !window.confirm(
        "저장하지 않은 변경사항이 있습니다.\n다른 문서를 열까요?"
      )
    ) {
      fileInput.value = "";
      return;
    }

    try {
      const content = await file.text();

      cm.setValue(content);
      cm.clearHistory();
      cm.focus();

      setFileName(file.name);
      markCurrentContentAsSaved();
    } catch (error) {
      console.error(error);
      window.alert("파일을 열지 못했습니다.");
    }
  }

  //================================================
  // Save
  //================================================

  function saveDocument() {
    setSaveState("saving");

    const markdown = cm.getValue();
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = normalizeMarkdownFileName(currentFileName);

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    markCurrentContentAsSaved();
  }

  function normalizeMarkdownFileName(fileName) {
    if (!fileName || fileName === "Untitled.md") {
      return "manual.md";
    }

    if (/\.(md|markdown)$/i.test(fileName)) {
      return fileName;
    }

    return `${fileName}.md`;
  }

  //================================================
  // Preview
  //================================================

  function togglePreview() {
    const editorMain = document.querySelector(".editor-main");

    if (!editorMain) {
      return;
    }

    const previewIsOff =
      editorMain.classList.toggle("preview-off");

    previewButton.classList.toggle("is-active", !previewIsOff);
    previewButton.setAttribute(
      "aria-pressed",
      String(!previewIsOff)
    );

    cm.refresh();
  }

  //================================================
  // Export
  //================================================

  function exportHtml() {
    const preview = document.getElementById("preview");

    if (!preview) {
      window.alert("미리보기 영역을 찾지 못했습니다.");
      return;
    }

    const html = createExportHtml(preview.innerHTML);
    const blob = new Blob([html], {
      type: "text/html;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = currentFileName.replace(
      /\.(md|markdown|txt)$/i,
      ""
    ) + ".html";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function createExportHtml(content) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(currentFileName)}</title>

  <link rel="stylesheet" href="assets/css/manual.css">
  <link rel="stylesheet" href="assets/css/tbl.css">
</head>
<body>
  <main class="manual">
${content}
  </main>
</body>
</html>`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  //================================================
  // Events
  //================================================

  newButton.addEventListener("click", createNewDocument);
  openButton.addEventListener("click", openDocument);
  saveButton.addEventListener("click", saveDocument);

  undoButton.addEventListener("click", () => {
    cm.undo();
    cm.focus();
  });

  redoButton.addEventListener("click", () => {
    cm.redo();
    cm.focus();
  });

  previewButton.addEventListener("click", togglePreview);
  exportButton.addEventListener("click", exportHtml);

  fileInput.addEventListener("change", handleFileSelected);

  cm.on("change", updateDirtyState);

  document.addEventListener("keydown", event => {
    const ctrlOrCommand = event.ctrlKey || event.metaKey;

    if (!ctrlOrCommand) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "s") {
      event.preventDefault();
      saveDocument();
      return;
    }

    if (key === "o") {
      event.preventDefault();
      openDocument();
      return;
    }

    if (key === "n") {
      event.preventDefault();
      createNewDocument();
    }
  });

  window.addEventListener("beforeunload", event => {
    if (!isDirty) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });

  setFileName(currentFileName);
  markCurrentContentAsSaved();
});

//==================================================
// Load Toolbar Component
//==================================================

async function loadToolbar() {
  const mount = document.getElementById("toolbarMount");

  if (!mount) {
    console.error("#toolbarMount not found.");
    return;
  }

  try {
    const response = await fetch(
      "/components/toolbar.html"
    );

    if (!response.ok) {
      throw new Error(
        `Toolbar load failed: ${response.status}`
      );
    }

    mount.innerHTML = await response.text();

    document.dispatchEvent(new CustomEvent("toolbarLoaded"));
  } catch (error) {
    console.error(error);
    mount.innerHTML = `
      <div class="toolbar-load-error">
        Toolbar could not be loaded.
      </div>
    `;
  }
}