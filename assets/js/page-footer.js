// assets/js/page-footer.js

(function () {
  "use strict";

  /**
   * 페이지 푸터 DOM을 생성한다.
   *
   * @param {Object} options
   * @param {number|string} [options.pageNumber=""]
   * @param {number|string} [options.totalPages=""]
   * @param {string} [options.documentTitle=""]
   * @param {string} [options.documentNumber=""]
   * @param {string} [options.revision=""]
   * @returns {HTMLElement}
   */
  function createPageFooter(options = {}) {
    const {
      pageNumber = "",
      totalPages = "",
      documentTitle = "",
      documentNumber = "",
      revision = "",
    } = options;

    const footer = document.createElement("footer");
    footer.className = "page-footer";
    footer.setAttribute("aria-label", "Page footer");

    const left = document.createElement("div");
    left.className = "page-footer__left";
    left.textContent = formatPageNumber(
      pageNumber,
      totalPages,
    );

    const center = document.createElement("div");
    center.className = "page-footer__center";
    center.textContent = documentTitle;

    const right = document.createElement("div");
    right.className = "page-footer__right";
    right.textContent = formatDocumentReference(
      documentNumber,
      revision,
    );

    footer.append(left, center, right);

    return footer;
  }

  /**
   * preprocess.js의 문자열 조립에서 사용한다.
   *
   * @param {Object} options
   * @returns {string}
   */
  function renderPageFooter(options = {}) {
    return createPageFooter(options).outerHTML;
  }

  function formatPageNumber(
    pageNumber,
    totalPages,
  ) {
    if (
      pageNumber === "" &&
      totalPages === ""
    ) {
      return "";
    }

    if (totalPages === "") {
      return String(pageNumber);
    }

    return `${pageNumber} / ${totalPages}`;
  }

  function formatDocumentReference(
    documentNumber,
    revision,
  ) {
    const values = [
      documentNumber,
      revision,
    ].filter(Boolean);

    return values.join(" / ");
  }

  window.PageFooter = {
    create: createPageFooter,
    render: renderPageFooter,
  };
})();