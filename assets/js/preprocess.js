// assets/js/preprocess.js

function renderManualMarkdown(source, md) {
  const pages = source.split(/^%page\s*$/gm);

  return pages
    .map(page => {
      const pageHtml = md.render(page.trim());

      return `<div class="page">${pageHtml}</div>`;
    })
    .join("");
}