// assets/js/format-toolbar.js

(function () {
  let formatToolbarEditor = null;
  let formatToolbarInitialized = false;

  /**
   * 포맷 툴바 초기화
   *
   * 사용:
   * initFormatToolbar(cm);
   */
  function initFormatToolbar(codeMirrorInstance) {
    const headingButton = document.getElementById("formatHeadingButton");
    const headingMenu = document.getElementById("formatHeadingMenu");

    if (!headingButton || !headingMenu) {
      console.warn("[Format Toolbar] 툴바 HTML을 찾을 수 없습니다.");
      return;
    }

    if (!codeMirrorInstance) {
      console.warn("[Format Toolbar] CodeMirror 인스턴스가 없습니다.");
      return;
    }

    formatToolbarEditor = codeMirrorInstance;

    // HTML을 다시 로드하는 경우 중복 이벤트 방지
    if (formatToolbarInitialized) {
      return;
    }

    formatToolbarInitialized = true;

    headingButton.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleHeadingMenu();
    });

    headingMenu.addEventListener("click", function (event) {
      const menuItem = event.target.closest("[data-heading-level]");

      if (!menuItem) {
        return;
      }

      const level = Number(menuItem.dataset.headingLevel);

      applyHeading(level);
      closeHeadingMenu();
    });

    document.addEventListener("click", function (event) {
      const toolbar = document.getElementById("formatToolbar");

      if (toolbar && !toolbar.contains(event.target)) {
        closeHeadingMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeHeadingMenu();
      }
    });

    formatToolbarEditor.on("cursorActivity", updateHeadingLabel);
    formatToolbarEditor.on("change", updateHeadingLabel);

    updateHeadingLabel();
  }


  // ==================================================
  // Heading Menu
  // ==================================================

  function toggleHeadingMenu() {
    const menu = document.getElementById("formatHeadingMenu");

    if (!menu) {
      return;
    }

    if (menu.hidden) {
      openHeadingMenu();
    } else {
      closeHeadingMenu();
    }
  }

  function openHeadingMenu() {
    const button = document.getElementById("formatHeadingButton");
    const menu = document.getElementById("formatHeadingMenu");

    if (!button || !menu) {
      return;
    }

    menu.hidden = false;
    button.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }

  function closeHeadingMenu() {
    const button = document.getElementById("formatHeadingButton");
    const menu = document.getElementById("formatHeadingMenu");

    if (!button || !menu) {
      return;
    }

    menu.hidden = true;
    button.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }


  // ==================================================
  // Heading 적용
  // ==================================================

  function applyHeading(level) {
    const cm = formatToolbarEditor;

    if (!cm) {
      return;
    }

    const selections = cm.listSelections();

    cm.operation(function () {
      // 아래쪽 선택 영역부터 처리해야 줄 위치가 밀리지 않는다.
      const sortedSelections = selections
        .map(function (selection) {
          return {
            fromLine: Math.min(selection.anchor.line, selection.head.line),
            toLine: Math.max(selection.anchor.line, selection.head.line)
          };
        })
        .sort(function (a, b) {
          return b.fromLine - a.fromLine;
        });

      const processedLines = new Set();

      sortedSelections.forEach(function (selection) {
        for (
          let lineNumber = selection.toLine;
          lineNumber >= selection.fromLine;
          lineNumber -= 1
        ) {
          if (processedLines.has(lineNumber)) {
            continue;
          }

          processedLines.add(lineNumber);
          replaceHeadingOnLine(cm, lineNumber, level);
        }
      });
    });

    cm.focus();
    updateHeadingLabel();
  }

  function replaceHeadingOnLine(cm, lineNumber, level) {
    const lineText = cm.getLine(lineNumber);

    if (typeof lineText !== "string") {
      return;
    }

    /*
     * 지원 형태:
     * # 제목
     *   ## 제목
     * ###제목
     *
     * 기존 제목 기호와 뒤쪽 공백을 제거한다.
     */
    const headingPattern = /^(\s{0,3})#{1,6}(?:[ \t]+|(?=\S)|$)/;
    const match = lineText.match(headingPattern);

    let indentation = "";
    let content = lineText;

    if (match) {
      indentation = match[1] || "";
      content = lineText.slice(match[0].length);
    } else {
      const indentationMatch = lineText.match(/^(\s{0,3})/);
      indentation = indentationMatch ? indentationMatch[1] : "";
      content = lineText.slice(indentation.length);
    }

    // Normal Text
    if (level === 0) {
      const normalLine = indentation + content;

      cm.replaceRange(
        normalLine,
        { line: lineNumber, ch: 0 },
        { line: lineNumber, ch: lineText.length }
      );

      return;
    }

    const headingPrefix = "#".repeat(level) + " ";
    const headingLine = indentation + headingPrefix + content;

    cm.replaceRange(
      headingLine,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: lineText.length }
    );
  }


  // ==================================================
  // 현재 제목 상태 표시
  // ==================================================

  function updateHeadingLabel() {
    const cm = formatToolbarEditor;
    const label = document.getElementById("formatHeadingLabel");

    if (!cm || !label) {
      return;
    }

    const cursor = cm.getCursor();
    const lineText = cm.getLine(cursor.line) || "";
    const headingMatch = lineText.match(/^\s{0,3}(#{1,6})(?:\s+|$)/);

    if (!headingMatch) {
      label.textContent = "Heading";
      return;
    }

    label.textContent = "H" + headingMatch[1].length;
  }


  // 전역에서 사용할 수 있도록 공개
  window.initFormatToolbar = initFormatToolbar;
})();