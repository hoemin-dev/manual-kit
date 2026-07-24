// assets/js/page-footer.js
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
    pageNumber = "",
    totalPages = "",
    documentTitle = "",
    documentNumber = "",
    revision = "",
    isEven = false,
  } = {}) {
    const pageText =
      pageNumber !== "" && totalPages !== ""
        ? `${pageNumber} / ${totalPages}`
        : "";

    const documentMeta = [documentNumber, revision].filter(Boolean).join("  ");

    const left = isEven ? pageText : documentMeta;
    const right = isEven ? documentMeta : pageText;

    return `
<footer class="page-footer">
  <div class="page-footer__left">${esc(left)}</div>
  <div class="page-footer__center">${esc(documentTitle)}</div>
  <div class="page-footer__right">${esc(right)}</div>
</footer>
`;
  }

  window.ManualKitPageFooter = { render };
})();
