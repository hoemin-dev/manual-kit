//==================================================
// Manual Kit
//==================================================

document.addEventListener("DOMContentLoaded", async () => {
  await loadTemplateHtml();

  if (typeof renderTables === "function") {
    await renderTables();
  }

  updatePageNumber();
});


//==================================================
// Load MPE Export HTML
//==================================================

async function loadTemplateHtml() {
  const root = document.getElementById("manual-root");

  if (!root) {
    console.error("#manual-root not found");
    return;
  }

  const response = await fetch("template.html");

  if (!response.ok) {
    root.innerHTML = `<p>Failed to load template.html</p>`;
    throw new Error(`Failed to load template.html: ${response.status}`);
  }

  const html = await response.text();

  const doc = new DOMParser().parseFromString(html, "text/html");

  const preview = doc.querySelector(".markdown-preview");

  if (!preview) {
    root.innerHTML = `<p>.markdown-preview not found in template.html</p>`;
    throw new Error(".markdown-preview not found");
  }

  root.innerHTML = preview.innerHTML;
}


//==================================================
// Page Number
//==================================================

function updatePageNumber() {
  const pages = document.querySelectorAll(".page");

  pages.forEach((page, index) => {
    const pageNo = page.querySelector(".page-no");
    if (!pageNo) return;

    pageNo.textContent = `${index + 1} / ${pages.length}`;
  });
}