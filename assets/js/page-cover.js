// assets/js/page-cover.js
(function () {
  const defaults = {
    title: "Operation & Maintenance Manual",
    subtitle: "Progressive Cavity Pump",
    documentNumber: "",
    revision: "",
    issueDate: "",
    companyName: "MONAS",
    logoSrc: "assets/logos/company.svg",
    productType: "pump",
    artworkSrc: "",
    insideFrontArtworkSrc: "",
    insideBackArtworkSrc: "",
  };

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderArtwork(src, label) {
    if (src) {
      return `
        <div class="cover-artwork-wrap">
          <img class="cover-artwork" src="${esc(src)}" alt="${esc(label)}">
        </div>
      `;
    }

    return `
      <div class="cover-artwork-wrap">
        <div class="cover-artwork-placeholder">
          <span></span>
          <strong>${esc(label)}</strong>
          <span></span>
        </div>
      </div>
    `;
  }

  function renderFront(meta = {}) {
    const data = { ...defaults, ...meta };

    return `
      <section class="cover-page cover-page-front">
        <div class="cover-front-logo-wrap">
          <img
            class="cover-front-logo"
            src="${esc(data.logoSrc)}"
            alt="${esc(data.companyName)}"
          >
        </div>

        <div class="cover-front-title-wrap">
          <div class="cover-front-kicker">${esc(data.productType)}</div>
          <h1 class="cover-front-title">${esc(data.title)}</h1>

          ${
            data.subtitle
              ? `<div class="cover-front-subtitle">${esc(data.subtitle)}</div>`
              : ""
          }

          ${
            data.documentNumber
              ? `<div class="cover-front-document-number">${esc(data.documentNumber)}</div>`
              : ""
          }
        </div>

        ${renderArtwork(data.artworkSrc, data.productType)}
        <div class="cover-front-bottom-line"></div>
      </section>
    `;
  }

  function renderInside(meta = {}, side = "front") {
    const data = { ...defaults, ...meta };
    const isBack = side === "back";
    const artworkSrc = isBack
      ? (data.insideBackArtworkSrc || data.artworkSrc)
      : (data.insideFrontArtworkSrc || data.artworkSrc);

    return `
      <section class="cover-page inside-cover inside-cover-${isBack ? "back" : "front"}">
        ${renderArtwork(artworkSrc, data.productType)}

        <div class="inside-cover-label">
          ${esc(data.productType)}
        </div>
      </section>
    `;
  }

  function renderBack(meta = {}) {
    const data = { ...defaults, ...meta };

    return `
      <section class="cover-page cover-page-back">
        <div class="cover-back-content">
          <img
            class="cover-back-logo"
            src="${esc(data.logoSrc)}"
            alt="${esc(data.companyName)}"
          >

          <div class="cover-back-company">${esc(data.companyName)}</div>

          <div class="cover-back-meta">
            <span>${esc(data.documentNumber)}</span>
            <span>${esc(data.revision)}</span>
          </div>
        </div>
      </section>
    `;
  }

  window.ManualKitPageCover = {
    defaults,
    renderFront,
    renderInside,
    renderBack,
  };
})();
