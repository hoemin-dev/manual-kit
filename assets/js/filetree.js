// assets/js/filetree.js

async function loadFileTreeComponent() {
  const mount = document.getElementById("filetreeMount");
  if (!mount) return;

  const res = await fetch("components/filetree.html");
  const html = await res.text();
  mount.innerHTML = html;

  initFileTree();
}

function initFileTree() {
    const openFolderBtn = document.getElementById("openFolderBtn");
    const fileTreeBody = document.getElementById("fileTreeBody");

    const toggleFiletreeBtn = document.getElementById("toggleFiletreeBtn");
    const filetreeMount = document.getElementById("filetreeMount");

    if (toggleFiletreeBtn && filetreeMount) {
        toggleFiletreeBtn.addEventListener("click", () => {
            filetreeMount.classList.toggle("collapsed");

            toggleFiletreeBtn.textContent =
                filetreeMount.classList.contains("collapsed") ? "›" : "‹";

            if (window.editor && typeof window.editor.refresh === "function") {
                setTimeout(() => window.editor.refresh(), 180);
            }
        });
    }

    if (!openFolderBtn || !fileTreeBody) return;

    openFolderBtn.addEventListener("click", async () => {
        if (!window.showDirectoryPicker) {
            fileTreeBody.innerHTML = `
                <div class="filetree-empty">
                    This browser does not support folder access.
                </div>
            `;
            return;
        }

        const dirHandle = await window.showDirectoryPicker();
        fileTreeBody.innerHTML = "";

        await renderDirectory(dirHandle, fileTreeBody);
    });
}

async function renderDirectory(dirHandle, container) {
  const entries = [];

  for await (const [name, handle] of dirHandle.entries()) {
    entries.push({ name, handle });
  }

  entries.sort((a, b) => {
    if (a.handle.kind !== b.handle.kind) {
      return a.handle.kind === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const entry of entries) {
    if (entry.handle.kind === "directory") {
      const folderEl = document.createElement("div");
      folderEl.className = "filetree-item";
      folderEl.textContent = `▸ ${entry.name}`;

      const childrenEl = document.createElement("div");
      childrenEl.className = "filetree-children";
      childrenEl.hidden = true;

      let loaded = false;

      folderEl.addEventListener("click", async () => {
        childrenEl.hidden = !childrenEl.hidden;
        folderEl.textContent = `${childrenEl.hidden ? "▸" : "▾"} ${entry.name}`;

        if (!loaded) {
          await renderDirectory(entry.handle, childrenEl);
          loaded = true;
        }
      });

      container.appendChild(folderEl);
      container.appendChild(childrenEl);
    }

    if (entry.handle.kind === "file") {
      const fileEl = document.createElement("div");
      fileEl.className = "filetree-item";
      fileEl.textContent = getFileIcon(entry.name) + " " + entry.name;

      fileEl.addEventListener("click", async () => {
        document
          .querySelectorAll(".filetree-item.active")
          .forEach((el) => el.classList.remove("active"));

        fileEl.classList.add("active");

        const file = await entry.handle.getFile();
        const text = await file.text();

        if (typeof window.openEditorFile === "function") {
          window.openEditorFile({
            name: entry.name,
            handle: entry.handle,
            text,
          });
        }
      });

      container.appendChild(fileEl);
    }
  }
}

function getFileIcon(name) {
  if (name.endsWith(".md")) return "📄";
  if (name.endsWith(".tbl")) return "▦";
  if (name.endsWith(".tss")) return "🎨";
  if (name.endsWith(".html")) return "🌐";
  if (name.endsWith(".css")) return "#";
  if (name.endsWith(".js")) return "JS";
  return "•";
}

document.addEventListener("DOMContentLoaded", loadFileTreeComponent);
