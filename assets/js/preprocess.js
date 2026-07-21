// assets/js/preprocess.js

function renderManualMarkdown(source, md) {
  const pages = source.split(/^%page\s*$/gm);
  const totalPages = pages.length;

  const numbering = {
    chapter: null,
    enabled: false,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
  };

  /*
   * 메타데이터 기능을 붙이기 전까지 사용하는 임시 문서 정보.
   *
   * 나중에는 YAML 또는 GUI 설정값으로 교체한다.
   */
  const documentInfo = {
    title: "K-Series Installation Manual",
    documentNumber: "MK-K-001",
    revision: "Rev. A",
    logoSrc: "./assets/logos/company.svg",
  };

  /*
   * 이전 페이지의 H1을 다음 페이지까지 유지한다.
   */
  let currentHeaderTitle = "";

  return pages
    .map((pageSource, index) => {
      const pageNumber = index + 1;

      const processed =
        preprocessManualMarkdown(
          pageSource.trim(),
          md,
          numbering,
        );

      const rendered = md.render(processed);

      const content =
        applyManualIndentState(rendered);

      /*
       * 현재 페이지에 H1이 있으면
       * 해당 H1을 이후 Header 제목으로 사용한다.
       *
       * H1이 없으면 이전 페이지의 제목을 계속 사용한다.
       */
      const pageH1 =
        findFirstHeadingTitle(content, 1);

      if (pageH1) {
        currentHeaderTitle = pageH1;
      }

      /*
       * 홀수 페이지는 오른쪽 페이지로 보고 로고 표시.
       * 짝수 페이지에는 로고를 표시하지 않는다.
       */
      const showLogo =
        pageNumber % 2 === 1;

      const headerHtml =
        PageHeader.render({
          title: currentHeaderTitle,
          logoSrc: documentInfo.logoSrc,
          showLogo,
        });

      const footerHtml =
        PageFooter.render({
          pageNumber,
          totalPages,
          documentTitle: documentInfo.title,
          documentNumber:
            documentInfo.documentNumber,
          revision: documentInfo.revision,
        });

      return `
        <div class="page-view">
          <div class="page">
            ${headerHtml}

            <main class="page-body">
              ${content}
            </main>

            ${footerHtml}
          </div>

          <div class="preview-page-number">
            ${pageNumber} / ${totalPages}
          </div>
        </div>
      `;
    })
    .join("");
}

//==================================================
// 렌더링된 페이지에서 첫 번째 제목 찾기
//==================================================

function findFirstHeadingTitle(
  html,
  level = 1,
) {
  const template =
    document.createElement("template");

  template.innerHTML = html;

  const heading =
    template.content.querySelector(
      `h${level}`,
    );

  if (!heading) {
    return "";
  }

  /*
   * 번호가 붙은 manual-heading에서는
   * 번호를 제외한 제목 텍스트만 사용한다.
   */
  const titleElement =
    heading.querySelector(
      ".manual-heading-title",
    );

  if (titleElement) {
    return titleElement.textContent.trim();
  }

  return heading.textContent.trim();
}

//==================================================
// Manual Kit 전용 문법 전처리
//==================================================

function preprocessManualMarkdown(
  source,
  md,
  numbering,
) {
  const lines = source.split(/\r?\n/);
  const output = [];

  let inFence = false;

  // 이전 페이지에서 이어진 현재 상태를 표시
  // %chapter 상태면 들여쓰기 ON
  // 일반 상태 또는 %sub 상태면 들여쓰기 OFF
  output.push(
    numbering.enabled
      ? '<div class="manual-indent-on"></div>'
      : '<div class="manual-indent-off"></div>',
  );

  output.push("");

  for (const originalLine of lines) {
    const trimmed = originalLine.trim();

    //================================================
    // 코드 블록
    // - 코드 블록 안에서는 전용 문법을 처리하지 않음
    //================================================

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
    //
    // - 새로운 챕터:
    //   챕터 번호 변경
    //   하위 제목 번호 초기화
    //   제목 번호 모드 시작
    //   본문 들여쓰기 시작
    //
    // - 같은 챕터 재선언:
    //   기존 제목 번호를 유지한 채
    //   제목 번호 모드와 본문 들여쓰기 재개
    //================================================

    const chapterMatch = trimmed.match(
      /^%chapter\s+([0-9]+)\s*$/i,
    );

    if (chapterMatch) {
      const nextChapter = chapterMatch[1];

      const isNewChapter =
        numbering.chapter !== nextChapter;

      if (isNewChapter) {
        numbering.chapter = nextChapter;
        resetManualHeadingNumbers(numbering);
      }

      numbering.enabled = true;

      output.push(
        '<div class="manual-indent-on"></div>',
      );

      output.push("");

      // %chapter 줄 자체는 출력하지 않음
      continue;
    }

    //================================================
    // %sub
    //
    // - 제목 번호 모드 중지
    // - 본문 들여쓰기 해제
    // - 이후 제목은 일반 Markdown 제목으로 처리
    // - 같은 %chapter 번호를 다시 쓰면
    //   기존 카운터를 유지한 채 번호 모드 재개
    //================================================

    if (/^%sub\s*$/i.test(trimmed)) {
      numbering.enabled = false;

      output.push(
        '<div class="manual-indent-off"></div>',
      );

      output.push("");

      // %sub 줄 자체는 출력하지 않음
      continue;
    }

    //================================================
    // Markdown 제목
    //
    // %chapter 번호 모드:
    // - manual-heading HTML로 변환
    // - 제목 번호 계산
    //
    // %sub 이후 또는 %chapter 이전:
    // - 일반 Markdown 제목으로 그대로 처리
    //================================================

    const headingMatch = originalLine.match(
      /^(#{1,6})\s+(.+?)\s*$/,
    );

    if (headingMatch) {
      const level =
        headingMatch[1].length;

      // %chapter가 아직 선언되지 않았거나
      // %sub로 번호 모드가 꺼진 상태라면
      // 일반 Markdown 제목으로 처리
      if (
        numbering.chapter === null ||
        !numbering.enabled
      ) {
        output.push(originalLine);
        continue;
      }

      const title = md.renderInline(
        headingMatch[2].trim(),
      );

      const number =
        getManualHeadingNumber(
          level,
          numbering,
        );

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

//==================================================
// 렌더링된 HTML에 본문 들여쓰기 상태 적용
//
// manual-indent-on 이후:
// - p
// - ul
// - ol
// - blockquote
// - pre
// - table
//
// 위 요소에 manual-content-indent 클래스 추가
//
// manual-indent-off 이후:
// - 들여쓰기 클래스 추가하지 않음
//
// hr은 대상에서 제외되므로 항상 전체 너비 유지
//==================================================

function applyManualIndentState(html) {
  const template =
    document.createElement("template");

  template.innerHTML = html;

  let indentEnabled = false;

  const indentTargets = new Set([
    "P",
    "UL",
    "OL",
    "BLOCKQUOTE",
    "PRE",
    "TABLE",
  ]);

  const children = Array.from(
    template.content.children,
  );

  for (const element of children) {
    if (
      element.classList.contains(
        "manual-indent-on",
      )
    ) {
      indentEnabled = true;
      element.remove();
      continue;
    }

    if (
      element.classList.contains(
        "manual-indent-off",
      )
    ) {
      indentEnabled = false;
      element.remove();
      continue;
    }

    if (
      indentEnabled &&
      indentTargets.has(element.tagName)
    ) {
      element.classList.add(
        "manual-content-indent",
      );
    }
  }

  return template.innerHTML;
}

//==================================================
// 제목 번호 초기화
//==================================================

function resetManualHeadingNumbers(
  numbering,
) {
  numbering.h2 = 0;
  numbering.h3 = 0;
  numbering.h4 = 0;
  numbering.h5 = 0;
  numbering.h6 = 0;
}

//==================================================
// 제목 번호 계산
//==================================================

function getManualHeadingNumber(
  level,
  numbering,
) {
  const chapter = numbering.chapter;

  // # 제목은 chapter 번호 자체
  if (level === 1) {
    resetManualHeadingNumbers(numbering);
    return chapter;
  }

  numbering[`h${level}`] += 1;

  // 현재 제목보다 하위 단계 초기화
  for (
    let i = level + 1;
    i <= 6;
    i += 1
  ) {
    numbering[`h${i}`] = 0;
  }

  const parts = [chapter];

  for (
    let i = 2;
    i <= level;
    i += 1
  ) {
    parts.push(numbering[`h${i}`]);
  }

  return parts.join(".");
}