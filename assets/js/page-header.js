// assets/js/page-header.js
(function () {
  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render({
    title = "",
    logoSrc = "",
    companyName = "",
    showLogo = false,
  } = {}) {
    const modifier = showLogo
      ? "page-header--with-logo"
      : "page-header--without-logo";

    return `
      <header class="page-header ${modifier}">
        <div class="page-header__title">${esc(title)}</div>
        <div class="page-header__logo-area">
          ${showLogo && logoSrc ? `<img class="page-header__logo" src="${esc(logoSrc)}" alt="${esc(companyName)}">` : ""}
        </div>
      </header>
    `;
  }

  window.ManualKitPageHeader = { render };
})();
