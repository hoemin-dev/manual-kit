let helpLoaded = false;

async function initHelp() {
  const mount = document.getElementById("helpMount");

  if (!mount) {
    console.error("helpMount를 찾을 수 없습니다.");
    return;
  }

  try {
    const response = await fetch("components/help-panel.html");

    if (!response.ok) {
      throw new Error(`Help panel load failed: ${response.status}`);
    }

    mount.innerHTML = await response.text();
    bindHelpEvents();
  } catch (error) {
    console.error(error);
  }
}

function bindHelpEvents() {
  document.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-help-open]");

    if (openButton) {
      openHelp();
      return;
    }

    const closeButton = event.target.closest("#helpCloseBtn");

    if (closeButton) {
      closeHelp();
      return;
    }

    const pageButton = event.target.closest("#helpApp [data-page]");

    if (pageButton) {
      loadHelpPage(pageButton.dataset.page);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "F1") {
      event.preventDefault();
      openHelp();
    }

    if (event.key === "Escape") {
      const helpApp = document.getElementById("helpApp");

      if (helpApp && !helpApp.hidden) {
        closeHelp();
      }
    }
  });
}

async function openHelp() {
  const helpApp = document.getElementById("helpBackdrop");

  if (!helpApp) {
    return;
  }

  helpApp.hidden = false;

   if (!helpLoaded) {
    await loadHelpPage("getting-started.md");
    helpLoaded = true;
  }
}

function closeHelp() {
  const helpApp = document.getElementById("helpBackdrop");

  if (!helpApp) {
    return;
  }

  helpApp.hidden = true;
}

async function loadHelpPage(page) {
  const helpViewer = document.getElementById("helpViewer");

  if (!helpViewer) {
    return;
  }

  try {
    const response = await fetch(`help/${page}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const source = await response.text();

    if (window.markdownit) {
      const md = window.markdownit({
        html: true,
        linkify: true,
        typographer: true,
      });

      helpViewer.innerHTML = md.render(source);
    } else {
      helpViewer.textContent = source;
    }
  } catch (error) {
    helpViewer.innerHTML = `
            <h2>도움말을 불러오지 못했습니다.</h2>
            <p>${error.message}</p>
        `;
  }
}

initHelp();
