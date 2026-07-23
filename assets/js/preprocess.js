// assets/js/preprocess.js

function renderManualMarkdown(source, md, documentMeta = {}) {
  const coverDefaults = window.ManualKitPageCover?.defaults || {};

  const meta = {
    ...coverDefaults,

    title: "Operation & Maintenance Manual",
    subtitle: "Progressive Cavity Pump",
    documentNumber: "MONAS-OM-001",
    revision: "Rev. 0",
    issueDate: "",
    companyName: "MONAS",
    logoSrc: "assets/logos/company.svg",
    productType: "Pump",
    artworkSrc: "",
    insideFrontArtworkSrc: "",
    insideBackArtworkSrc: "",

    ...(window.manualDocumentMeta || {}),
    ...documentMeta,
  };
  
  const numbering = {
    chapter: null,
    enabled: false,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
  };

  const bodySources = source.split(/^%page\s*$/gm);
  let currentH1 = "";

  const bodyPages = bodySources.map((pageSource) => {
    const pageH1 = findFirstH1Title(pageSource, md);
    if (pageH1) currentH1 = pageH1;

    const processed = preprocessManualMarkdown(
      pageSource.trim(),
      md,
      numbering,
    );

    return {
      type: "body",
      headerTitle: currentH1,
      content: applyManualIndentState(md.render(processed)),
    };
  });

  const pageModels = [
    { type: "front-cover", render: () => window.ManualKitPageCover.renderFront(meta) },
    { type: "front-inside", render: () => window.ManualKitPageCover.renderInside(meta, "front") },
    ...bodyPages,
    { type: "back-inside", render: () => window.ManualKitPageCover.renderInside(meta, "back") },
    { type: "back-cover", render: () => window.ManualKitPageCover.renderBack(meta) },
  ];

  const totalPages = pageModels.length;

  return pageModels.map((page, index) => {
    const pageNumber = index + 1;
    const showLogo = pageNumber % 2 === 1;

    if (page.type === "body") {
      return renderBodyPage({
        content: page.content,
        headerTitle: page.headerTitle,
        meta,
        pageNumber,
        totalPages,
        showLogo,
      });
    }

    return renderSpecialPage({
      html: page.render(),
      pageNumber,
      totalPages,
      type: page.type,
    });
  }).join("");
}

function renderBodyPage({
  content,
  headerTitle,
  meta,
  pageNumber,
  totalPages,
  showLogo,
}) {
  const header = window.ManualKitPageHeader.render({
    title: headerTitle,
    logoSrc: meta.logoSrc,
    companyName: meta.companyName,
    showLogo,
  });

  const footer = window.ManualKitPageFooter.render({
    pageNumber,
    totalPages,
    documentTitle: meta.title,
    documentNumber: meta.documentNumber,
    revision: meta.revision,
  });

  return `
    <div class="page-view" data-page-index="${pageNumber}" data-page-type="body">
      <section class="page">
        ${header}
        <main class="page-body">${content}</main>
        ${footer}
      </section>
      <div class="preview-page-number">${pageNumber} / ${totalPages}</div>
    </div>
  `;
}

function renderSpecialPage({ html, pageNumber, totalPages, type }) {
  return `
    <div class="page-view" data-page-index="${pageNumber}" data-page-type="${type}">
      ${html}
      <div class="preview-page-number">${pageNumber} / ${totalPages}</div>
    </div>
  `;
}

function findFirstH1Title(source, md) {
  const lines = source.split(/\r?\n/);
  let inFence = false;

  for (const originalLine of lines) {
    const trimmed = originalLine.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) continue;

    const match = originalLine.match(/^#\s+(.+?)\s*$/);
    if (!match) continue;

    const template = document.createElement("template");
    template.innerHTML = md.renderInline(match[1].trim());
    return template.content.textContent.trim();
  }

  return "";
}

function preprocessManualMarkdown(source, md, numbering) {
  const lines = source.split(/\r?\n/);
  const output = [];
  let inFence = false;

  output.push(
    numbering.enabled
      ? '<div class="manual-indent-on"></div>'
      : '<div class="manual-indent-off"></div>',
  );
  output.push("");

  for (const originalLine of lines) {
    const trimmed = originalLine.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      output.push(originalLine);
      continue;
    }

    if (inFence) {
      output.push(originalLine);
      continue;
    }

    const chapterMatch = trimmed.match(/^%chapter\s+([0-9]+)\s*$/i);

    if (chapterMatch) {
      const nextChapter = chapterMatch[1];

      if (numbering.chapter !== nextChapter) {
        numbering.chapter = nextChapter;
        resetManualHeadingNumbers(numbering);
      }

      numbering.enabled = true;
      output.push('<div class="manual-indent-on"></div>');
      output.push("");
      continue;
    }

    if (/^%sub\s*$/i.test(trimmed)) {
      numbering.enabled = false;
      output.push('<div class="manual-indent-off"></div>');
      output.push("");
      continue;
    }

    const headingMatch = originalLine.match(/^(#{1,6})\s+(.+?)\s*$/);

    if (headingMatch) {
      const level = headingMatch[1].length;

      if (numbering.chapter === null || !numbering.enabled) {
        output.push(originalLine);
        continue;
      }

      const title = md.renderInline(headingMatch[2].trim());
      const number = getManualHeadingNumber(level, numbering);

      output.push(
        `<h${level} class="manual-heading manual-heading-${level}">` +
          `<span class="manual-heading-number">${number}</span>` +
          `<span class="manual-heading-title">${title}</span>` +
        `</h${level}>`,
      );
      output.push("");
      continue;
    }

    output.push(originalLine);
  }

  return output.join("\n");
}

function applyManualIndentState(html) {
  const template = document.createElement("template");
  template.innerHTML = html;

  let indentEnabled = false;
  const indentTargets = new Set(["P", "UL", "OL", "BLOCKQUOTE", "PRE", "TABLE"]);

  for (const element of Array.from(template.content.children)) {
    if (element.classList.contains("manual-indent-on")) {
      indentEnabled = true;
      element.remove();
      continue;
    }

    if (element.classList.contains("manual-indent-off")) {
      indentEnabled = false;
      element.remove();
      continue;
    }

    if (indentEnabled && indentTargets.has(element.tagName)) {
      element.classList.add("manual-content-indent");
    }
  }

  return template.innerHTML;
}

function resetManualHeadingNumbers(numbering) {
  numbering.h2 = 0;
  numbering.h3 = 0;
  numbering.h4 = 0;
  numbering.h5 = 0;
  numbering.h6 = 0;
}

function getManualHeadingNumber(level, numbering) {
  if (level === 1) {
    resetManualHeadingNumbers(numbering);
    return numbering.chapter;
  }

  numbering[`h${level}`] += 1;

  for (let i = level + 1; i <= 6; i += 1) {
    numbering[`h${i}`] = 0;
  }

  const parts = [numbering.chapter];

  for (let i = 2; i <= level; i += 1) {
    parts.push(numbering[`h${i}`]);
  }

  return parts.join(".");
}
