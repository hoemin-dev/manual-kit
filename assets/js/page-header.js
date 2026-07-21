// assets/js/page-header.js

(function () {
  "use strict";

  /**
   * 페이지 헤더 DOM을 생성한다.
   *
   * @param {Object} options
   * @param {string} [options.title=""]
   * @param {string} [options.logoSrc=""]
   * @param {boolean} [options.showLogo=false]
   * @param {string} [options.logoAlt="Company logo"]
   * @returns {HTMLElement}
   */
  function createPageHeader(options = {}) {
    const {
      title = "",
      logoSrc = "",
      showLogo = false,
      logoAlt = "Company logo",
    } = options;

    const hasLogo = showLogo && logoSrc;

    const header = document.createElement("header");

    header.className = hasLogo
      ? "page-header page-header--with-logo"
      : "page-header page-header--without-logo";

    header.setAttribute("aria-label", "Page header");

    const titleElement = document.createElement("div");

    titleElement.className = "page-header__title";

    titleElement.textContent = title;

    const logoArea = document.createElement("div");

    logoArea.className = "page-header__logo-area";

    if (hasLogo) {
      const logo = document.createElement("img");

      logo.className = "page-header__logo";

      logo.src = logoSrc;
      logo.alt = logoAlt;

      logoArea.appendChild(logo);
    }

    header.append(titleElement, logoArea);

    return header;
  }

  /**
   * preprocess.js의 문자열 조립에서 사용한다.
   *
   * @param {Object} options
   * @returns {string}
   */
  function renderPageHeader(options = {}) {
    return createPageHeader(options).outerHTML;
  }

  window.PageHeader = {
    create: createPageHeader,
    render: renderPageHeader,
  };
})();
