// assets/js/preprocess.js

function renderManualMarkdown(source, md) {
  const pages = source.split(/^%page\s*$/gm);
  const total = pages.length;

  const numbering = {
    chapter: null,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0
  };

  return pages
    .map((page, index) => {
      const processed = preprocessManualMarkdown(page.trim(), md, numbering);
      const content = md.render(processed);
      const isNumbered = numbering.chapter !== null;

      return `
        <div class="page-view">
          <div class="page">
            ${content}
          </div>

          <div class="preview-page-number">
            ${index + 1} / ${total}
          </div>
        </div>
      `;
    })
    .join("");
}


//==================================================
// Manual Kit 전용 문법 전처리
//==================================================

function preprocessManualMarkdown(source, md, numbering) {
  const lines = source.split(/\r?\n/);
  const output = [];

  let inFence = false;

  for (const originalLine of lines) {
    const trimmed = originalLine.trim();

    // 코드 블록 안에서는 전용 문법을 처리하지 않음
    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      output.push(originalLine);
      continue;
    }

    if (inFence) {
      output.push(originalLine);
      continue;
    }

    //================================================
    // %chapter 4
    //================================================

    const chapterMatch = trimmed.match(/^%chapter\s+([0-9]+)\s*$/i);

    if (chapterMatch) {
      numbering.chapter = chapterMatch[1];

      numbering.h2 = 0;
      numbering.h3 = 0;
      numbering.h4 = 0;
      numbering.h5 = 0;
      numbering.h6 = 0;

      // %chapter 줄 자체는 출력하지 않음
      continue;
    }

    //================================================
    // %sub single shot
    //================================================

    const subMatch = trimmed.match(/^%sub\s+(.+)$/i);

    if (subMatch) {
      const title = md.renderInline(subMatch[1].trim());

      output.push(
        `<div class="manual-subheading">${title}</div>`
      );

      continue;
    }

    //================================================
    // 번호가 붙는 Markdown 제목
    //================================================

    const headingMatch = originalLine.match(/^(#{1,6})\s+(.+?)\s*$/);

    if (headingMatch && numbering.chapter !== null) {
      const level = headingMatch[1].length;
      const title = md.renderInline(headingMatch[2].trim());
      const number = getManualHeadingNumber(level, numbering);

      output.push(
        `<h${level} class="manual-heading manual-heading-${level}">` +
          `<span class="manual-heading-number">${number}</span>` +
          `<span class="manual-heading-title">${title}</span>` +
        `</h${level}>`
      );

      continue;
    }

    output.push(originalLine);
  }

  return output.join("\n");
}


//==================================================
// 제목 번호 계산
//==================================================

function getManualHeadingNumber(level, numbering) {
  const chapter = numbering.chapter;

  // # 제목은 chapter 번호 자체
  if (level === 1) {
    numbering.h2 = 0;
    numbering.h3 = 0;
    numbering.h4 = 0;
    numbering.h5 = 0;
    numbering.h6 = 0;

    return chapter;
  }

  numbering[`h${level}`] += 1;

  // 현재 제목보다 하위 단계 초기화
  for (let i = level + 1; i <= 6; i++) {
    numbering[`h${i}`] = 0;
  }

  const parts = [chapter];

  for (let i = 2; i <= level; i++) {
    parts.push(numbering[`h${i}`]);
  }

  return parts.join(".");
}