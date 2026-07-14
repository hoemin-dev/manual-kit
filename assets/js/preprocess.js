// assets/js/preprocess.js

function renderManualMarkdown(source, md) {
  const pages = source.split(/^%page\s*$/gm);
  const total = pages.length;

  const numbering = {
    chapter: null,
    enabled: false,
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
    // - 새로운 챕터: 번호 초기화 후 번호 모드 시작
    // - 같은 챕터 재선언: 기존 번호를 유지한 채 번호 모드 재개
    //================================================

    const chapterMatch = trimmed.match(/^%chapter\s+([0-9]+)\s*$/i);

    if (chapterMatch) {
      const nextChapter = chapterMatch[1];
      const isNewChapter = numbering.chapter !== nextChapter;

      if (isNewChapter) {
        numbering.chapter = nextChapter;
        resetManualHeadingNumbers(numbering);
      }

      numbering.enabled = true;

      // %chapter 줄 자체는 출력하지 않음
      continue;
    }

    //================================================
    // %sub
    // - 이후 Markdown 제목의 번호 출력을 중지
    // - 같은 %chapter 번호를 다시 쓰면 카운터를 유지한 채 재개
    //================================================

    if (/^%sub\s*$/i.test(trimmed)) {
      numbering.enabled = false;

      // %sub 줄 자체는 출력하지 않음
      continue;
    }

    //================================================
    // Markdown 제목
    // - 번호 모드에서는 번호 계산 및 출력
    // - %sub 이후에는 번호와 카운터를 건드리지 않음
    // - 번호가 없어도 번호 영역은 비워 두어 정렬 유지
    //================================================

    const headingMatch = originalLine.match(/^(#{1,6})\s+(.+?)\s*$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = md.renderInline(headingMatch[2].trim());
      const shouldNumber =
        numbering.enabled && numbering.chapter !== null;
      const number = shouldNumber
        ? getManualHeadingNumber(level, numbering)
        : "";

      output.push(
        `<h${level} class="manual-heading manual-heading-${level}">` +
          `<span class="manual-heading-number">${number}</span>` +
          `<span class="manual-heading-title">${title}</span>` +
        `</h${level}>`
      );

      output.push("");

      continue;
    }

    output.push(originalLine);
  }

  return output.join("\n");
}


//==================================================
// 제목 번호 초기화
//==================================================

function resetManualHeadingNumbers(numbering) {
  numbering.h2 = 0;
  numbering.h3 = 0;
  numbering.h4 = 0;
  numbering.h5 = 0;
  numbering.h6 = 0;
}


//==================================================
// 제목 번호 계산
//==================================================

function getManualHeadingNumber(level, numbering) {
  const chapter = numbering.chapter;

  // # 제목은 chapter 번호 자체
  if (level === 1) {
    resetManualHeadingNumbers(numbering);
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
