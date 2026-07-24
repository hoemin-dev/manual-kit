// assets/js/format-toolbar.js

(function () {
  let formatToolbarEditor = null;
  let formatToolbarInitialized = false;

  const FORMAT_COLORS = [
    ["red", "#ff0000"], ["orange", "#ff8000"], ["yellow", "#ffff00"],
    ["lime", "#7cfc00"], ["green", "#00a651"], ["mint", "#98ff98"],
    ["cyan", "#00ffff"], ["sky", "#87ceeb"], ["blue", "#0066ff"],
    ["navy", "#003366"], ["violet", "#8a2be2"], ["pink", "#ff69b4"],
    ["brown", "#8b4513"], ["gold", "#d4af37"], ["grey", "#808080"],
    ["black", "#000000"], ["white", "#ffffff"]
  ];
  const RECENT_COLOR_KEY = "manualkit.recentColors";

  function initFormatToolbar(codeMirrorInstance) {
    const headingButton = document.getElementById("formatHeadingButton");
    const headingMenu = document.getElementById("formatHeadingMenu");
    const toolbar = document.getElementById("formatToolbar");

    if (!headingButton || !headingMenu || !toolbar) {
      console.warn("[Format Toolbar] 툴바 HTML을 찾을 수 없습니다.");
      return;
    }

    if (!codeMirrorInstance) {
      console.warn("[Format Toolbar] CodeMirror 인스턴스가 없습니다.");
      return;
    }

    formatToolbarEditor = codeMirrorInstance;

    if (formatToolbarInitialized) {
      return;
    }

    formatToolbarInitialized = true;

    headingButton.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleHeadingMenu();
    });

    initColorPalette();

    headingMenu.addEventListener("click", function (event) {
      const menuItem = event.target.closest("[data-heading-level]");

      if (!menuItem) {
        return;
      }

      applyHeading(Number(menuItem.dataset.headingLevel));
      closeHeadingMenu();
    });

    toolbar.addEventListener("click", function (event) {
      const button = event.target.closest("[data-format-action]");

      if (!button) {
        return;
      }

      const action = button.dataset.formatAction;
      applyFormatAction(action);
    });

    document.addEventListener("click", function (event) {
      if (!toolbar.contains(event.target)) {
        closeHeadingMenu();
        closeColorMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeHeadingMenu();
        closeColorMenu();
      }
    });

    formatToolbarEditor.on("cursorActivity", updateToolbarState);
    formatToolbarEditor.on("change", updateToolbarState);

    updateToolbarState();
  }

  // ==================================================
  // Menu
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
  // Actions
  // ==================================================

  function applyFormatAction(action) {
    const cm = formatToolbarEditor;

    if (!cm) {
      return;
    }

    switch (action) {
      case "bold":
        wrapSelection("**", "**", "bold text");
        break;

      case "italic":
        wrapSelection("*", "*", "italic text");
        break;

      case "strike":
        wrapSelection("~~", "~~", "strikethrough");
        break;

      case "inline-code":
        wrapSelection("`", "`", "code");
        break;

      case "bullet":
        toggleLinePrefix("bullet");
        break;

      case "number":
        toggleLinePrefix("number");
        break;

      case "task":
        toggleLinePrefix("task");
        break;

      case "quote":
        toggleLinePrefix("quote");
        break;

      case "code-block":
        insertCodeBlock();
        break;

      case "link":
        insertLink();
        break;

      case "image":
        insertImage();
        break;

      default:
        return;
    }

    cm.focus();
    updateToolbarState();
  }

  function wrapSelection(openMarker, closeMarker, placeholder) {
  const cm = formatToolbarEditor;
  const selections = cm.listSelections();

  cm.operation(function () {
    selections
      .slice()
      .sort(function (a, b) {
        const aStart = Math.min(a.anchor.line, a.head.line);
        const bStart = Math.min(b.anchor.line, b.head.line);

        if (aStart !== bStart) {
          return bStart - aStart;
        }

        return Math.max(b.anchor.ch, b.head.ch) -
          Math.max(a.anchor.ch, a.head.ch);
      })
      .forEach(function (selection) {
        const from = minPos(selection.anchor, selection.head);
        const to = maxPos(selection.anchor, selection.head);
        const selectedText = cm.getRange(from, to);

        // 선택 영역이 있는 경우
        if (selectedText) {
          const outerFrom = {
            line: from.line,
            ch: Math.max(0, from.ch - openMarker.length)
          };

          const outerTo = {
            line: to.line,
            ch: to.ch + closeMarker.length
          };

          const beforeMarker =
            from.ch >= openMarker.length
              ? cm.getRange(outerFrom, from)
              : "";

          const afterMarker =
            cm.getRange(to, outerTo);

          // 현재 선택 영역 바깥에 마커가 있으면 제거
          if (
            beforeMarker === openMarker &&
            afterMarker === closeMarker
          ) {
            cm.replaceRange("", to, outerTo);
            cm.replaceRange("", outerFrom, from);

            const unwrappedFrom = outerFrom;
            const unwrappedTo = advancePosition(
              unwrappedFrom,
              selectedText
            );

            cm.setSelection(unwrappedFrom, unwrappedTo);
            return;
          }

          // 선택 자체에 마커가 포함된 경우도 제거
          if (
            selectedText.startsWith(openMarker) &&
            selectedText.endsWith(closeMarker) &&
            selectedText.length >=
              openMarker.length + closeMarker.length
          ) {
            const innerText = selectedText.slice(
              openMarker.length,
              selectedText.length - closeMarker.length
            );

            cm.replaceRange(innerText, from, to);
            cm.setSelection(
              from,
              advancePosition(from, innerText)
            );

            return;
          }

          // 마커가 없으면 새로 감싸기
          const wrapped =
            openMarker + selectedText + closeMarker;

          cm.replaceRange(wrapped, from, to);

          cm.setSelection(
            advancePosition(from, openMarker),
            advancePosition(
              from,
              openMarker + selectedText
            )
          );

          return;
        }

        // 선택 영역이 없는 경우
        const inserted =
          openMarker + placeholder + closeMarker;

        cm.replaceRange(inserted, from);

        cm.setSelection(
          advancePosition(from, openMarker),
          advancePosition(
            from,
            openMarker + placeholder
          )
        );
      });
  });
}

  function toggleLinePrefix(type) {
    const cm = formatToolbarEditor;
    const ranges = getSelectedLineRanges(cm);

    cm.operation(function () {
      ranges
        .slice()
        .sort(function (a, b) {
          return b.fromLine - a.fromLine;
        })
        .forEach(function (range) {
          const lines = [];

          for (let lineNumber = range.fromLine; lineNumber <= range.toLine; lineNumber += 1) {
            lines.push(cm.getLine(lineNumber) || "");
          }

          const allAlreadySame = lines.every(function (line) {
            return lineMatchesType(line, type);
          });

          lines.forEach(function (line, index) {
            const lineNumber = range.fromLine + index;
            const transformed = transformLinePrefix(
              line,
              type,
              allAlreadySame,
              index
            );

            cm.replaceRange(
              transformed,
              { line: lineNumber, ch: 0 },
              { line: lineNumber, ch: line.length }
            );
          });
        });
    });
  }

  function lineMatchesType(line, type) {
    switch (type) {
      case "bullet":
        return /^\s*[-*+]\s+/.test(line) && !/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line);
      case "number":
        return /^\s*\d+[.)]\s+/.test(line);
      case "task":
        return /^\s*[-*+]\s+\[[ xX]\]\s+/.test(line);
      case "quote":
        return /^\s*>\s?/.test(line);
      default:
        return false;
    }
  }

  function transformLinePrefix(line, type, removeMode, index) {
    const indentation = (line.match(/^\s*/) || [""])[0];
    let content = line.slice(indentation.length);

    content = content
      .replace(/^>\s?/, "")
      .replace(/^[-*+]\s+\[[ xX]\]\s+/, "")
      .replace(/^[-*+]\s+/, "")
      .replace(/^\d+[.)]\s+/, "");

    if (removeMode) {
      return indentation + content;
    }

    switch (type) {
      case "bullet":
        return indentation + "- " + content;
      case "number":
        return indentation + String(index + 1) + ". " + content;
      case "task":
        return indentation + "- [ ] " + content;
      case "quote":
        return indentation + "> " + content;
      default:
        return line;
    }
  }

  function insertCodeBlock() {
    const cm = formatToolbarEditor;
    const from = cm.getCursor("from");
    const to = cm.getCursor("to");
    const selectedText = cm.getRange(from, to);

    if (selectedText) {
      const block = "```\n" + selectedText + "\n```";
      cm.replaceRange(block, from, to);
      cm.setSelection(
        advancePosition(from, "```\n"),
        advancePosition(from, "```\n" + selectedText)
      );
      return;
    }

    const block = "```\ncode\n```";
    cm.replaceRange(block, from);
    cm.setSelection(
      advancePosition(from, "```\n"),
      advancePosition(from, "```\ncode")
    );
  }

  function insertLink() {
    const cm = formatToolbarEditor;
    const from = cm.getCursor("from");
    const to = cm.getCursor("to");
    const selectedText = cm.getRange(from, to);
    const label = selectedText || "link text";
    const markdown = "[" + label + "](https://)";

    cm.replaceRange(markdown, from, to);

    if (selectedText) {
      const urlStart = advancePosition(from, "[" + label + "](");
      cm.setSelection(urlStart, advancePosition(urlStart, "https://"));
    } else {
      cm.setSelection(
        advancePosition(from, "["),
        advancePosition(from, "[" + label)
      );
    }
  }

  function insertImage() {
    const cm = formatToolbarEditor;
    const from = cm.getCursor("from");
    const to = cm.getCursor("to");
    const selectedText = cm.getRange(from, to);
    const alt = selectedText || "image description";
    const markdown = "![" + alt + "](image.png)";

    cm.replaceRange(markdown, from, to);

    if (selectedText) {
      const pathStart = advancePosition(from, "![" + alt + "](");
      cm.setSelection(pathStart, advancePosition(pathStart, "image.png"));
    } else {
      cm.setSelection(
        advancePosition(from, "!["),
        advancePosition(from, "![" + alt)
      );
    }
  }

  // ==================================================
  // Heading
  // ==================================================

  function applyHeading(level) {
    const cm = formatToolbarEditor;
    const ranges = getSelectedLineRanges(cm);

    cm.operation(function () {
      ranges
        .slice()
        .sort(function (a, b) {
          return b.fromLine - a.fromLine;
        })
        .forEach(function (range) {
          for (let lineNumber = range.toLine; lineNumber >= range.fromLine; lineNumber -= 1) {
            replaceHeadingOnLine(cm, lineNumber, level);
          }
        });
    });

    cm.focus();
    updateToolbarState();
  }

  function replaceHeadingOnLine(cm, lineNumber, level) {
    const lineText = cm.getLine(lineNumber);

    if (typeof lineText !== "string") {
      return;
    }

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

    const nextLine =
      level === 0
        ? indentation + content
        : indentation + "#".repeat(level) + " " + content;

    cm.replaceRange(
      nextLine,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: lineText.length }
    );
  }

  // ==================================================
  // State
  // ==================================================

  function updateToolbarState() {
    updateHeadingLabel();
    updateColorTarget();
  }

  function updateHeadingLabel() {
    const cm = formatToolbarEditor;
    const label = document.getElementById("formatHeadingLabel");

    if (!cm || !label) {
      return;
    }

    const cursor = cm.getCursor();
    const lineText = cm.getLine(cursor.line) || "";
    const headingMatch = lineText.match(/^\s{0,3}(#{1,6})(?:\s+|$)/);

    label.textContent = headingMatch
      ? "H" + headingMatch[1].length
      : "Heading";
  }

  // ==================================================
  // Color Palette
  // ==================================================

  function initColorPalette() {
    const button = document.getElementById("formatColorButton");
    const menu = document.getElementById("formatColorMenu");
    const grid = document.getElementById("formatColorGrid");
    const recentGrid = document.getElementById("formatRecentColorGrid");
    const otherButton = document.getElementById("formatOtherColor");
    const eyeButton = document.getElementById("formatEyedropper");
    const defaultButton = document.getElementById("formatChapterDefault");
    const input = document.getElementById("formatColorInput");

    if (!button || !menu || !grid || !recentGrid || !input) return;

    grid.innerHTML = "";
    FORMAT_COLORS.forEach(function (entry) {
      grid.appendChild(createColorSwatch(entry[0], entry[1]));
    });
    renderRecentColors();

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      if (menu.hidden) {
        closeHeadingMenu();
        openColorMenu();
      } else {
        closeColorMenu();
      }
    });

    menu.addEventListener("click", function (event) {
      const swatch = event.target.closest("[data-color-token]");
      if (!swatch) return;
      applySelectedColor(swatch.dataset.colorToken, swatch.dataset.colorValue);
    });

    otherButton.addEventListener("click", function () { input.click(); });
    input.addEventListener("input", function () {
      applySelectedColor(input.value.toUpperCase(), input.value.toUpperCase());
    });

    eyeButton.addEventListener("click", async function () {
      if (!("EyeDropper" in window)) {
        input.click();
        return;
      }
      try {
        const result = await new EyeDropper().open();
        applySelectedColor(result.sRGBHex.toUpperCase(), result.sRGBHex.toUpperCase());
      } catch (error) {
        if (error && error.name !== "AbortError") console.warn("[Format Toolbar] 스포이트 실패", error);
      }
    });

    defaultButton.addEventListener("click", function () {
      applyChapterDefaultColor();
    });
  }

  function createColorSwatch(token, value) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "format-color-swatch";
    button.dataset.colorToken = token;
    button.dataset.colorValue = value;
    button.dataset.colorName = token;
    button.style.background = value;
    button.title = token;
    button.setAttribute("aria-label", token + " 색상");
    return button;
  }

  function openColorMenu() {
    const button = document.getElementById("formatColorButton");
    const menu = document.getElementById("formatColorMenu");
    if (!button || !menu) return;
    updateColorTarget();
    renderRecentColors();
    menu.hidden = false;
    button.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }

  function closeColorMenu() {
    const button = document.getElementById("formatColorButton");
    const menu = document.getElementById("formatColorMenu");
    if (!button || !menu) return;
    menu.hidden = true;
    button.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  function isChapterLine() {
    const cm = formatToolbarEditor;
    if (!cm) return false;
    return /^\s*%chapter(?:\s|$)/i.test(cm.getLine(cm.getCursor().line) || "");
  }

  function updateColorTarget() {
    const target = document.getElementById("formatColorTarget");
    const defaultButton = document.getElementById("formatChapterDefault");
    if (!target || !defaultButton || !formatToolbarEditor) return;
    const chapter = isChapterLine();
    target.textContent = chapter ? "챕터 번호 색상" : "텍스트 색상";
    defaultButton.hidden = !chapter;
  }

  function applySelectedColor(token, value) {
    const cm = formatToolbarEditor;
    if (!cm) return;

    if (isChapterLine()) {
      applyChapterColor(token);
    } else {
      applyInlineColor(token);
    }

    rememberRecentColor(value);
    const indicator = document.getElementById("formatColorIndicator");
    if (indicator) indicator.style.background = value;
    closeColorMenu();
    cm.focus();
  }

  function applyChapterColor(token) {
    const cm = formatToolbarEditor;
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line) || "";
    const match = line.match(/^(\s*)%chapter(?:\s+(\d+))?(?:\s+(?:[a-z]+|#[0-9a-f]{6}))?\s*$/i);
    if (!match) return;
    const replacement = match[1] + "%chapter" + (match[2] ? " " + match[2] : "") + " " + token;
    cm.replaceRange(replacement, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: line.length });
    cm.setCursor({ line: cursor.line, ch: replacement.length });
  }

  function applyChapterDefaultColor() {
    const cm = formatToolbarEditor;
    if (!cm || !isChapterLine()) return;
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line) || "";
    const match = line.match(/^(\s*)%chapter(?:\s+(\d+))?(?:\s+(?:[a-z]+|#[0-9a-f]{6}))?\s*$/i);
    if (!match) return;
    const replacement = match[1] + "%chapter" + (match[2] ? " " + match[2] : "");
    cm.replaceRange(replacement, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: line.length });
    cm.setCursor({ line: cursor.line, ch: replacement.length });
    closeColorMenu();
    cm.focus();
  }

  function applyInlineColor(token) {
    const cm = formatToolbarEditor;
    const from = cm.getCursor("from");
    const to = cm.getCursor("to");
    const selected = cm.getRange(from, to);

    if (selected) {
      const wholeMatch = selected.match(/^%(?:[a-z]+|#[0-9a-f]{6})\[([\s\S]*)\]$/i);
      const content = wholeMatch ? wholeMatch[1] : selected;
      const replacement = "%" + token + "[" + content + "]";
      cm.replaceRange(replacement, from, to);
      const contentStart = advancePosition(from, "%" + token + "[");
      cm.setSelection(contentStart, advancePosition(contentStart, content));
      return;
    }

    const line = cm.getLine(from.line) || "";
    const enclosing = findEnclosingColorExpression(line, from.ch);
    if (enclosing) {
      const replacement = "%" + token + "[" + enclosing.content + "]";
      cm.replaceRange(replacement,
        { line: from.line, ch: enclosing.start },
        { line: from.line, ch: enclosing.end });
      cm.setCursor({ line: from.line, ch: enclosing.start + replacement.length });
      return;
    }

    const placeholder = "text";
    const replacement = "%" + token + "[" + placeholder + "]";
    cm.replaceRange(replacement, from);
    cm.setSelection(
      advancePosition(from, "%" + token + "["),
      advancePosition(from, "%" + token + "[" + placeholder)
    );
  }

  function findEnclosingColorExpression(line, ch) {
    const pattern = /%(?:[a-z]+|#[0-9a-f]{6})\[([^\]\n]*)\]/gi;
    let match;
    while ((match = pattern.exec(line))) {
      const start = match.index;
      const end = start + match[0].length;
      if (ch >= start && ch <= end) return { start: start, end: end, content: match[1] };
    }
    return null;
  }

  function rememberRecentColor(value) {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return;
    const normalized = value.toUpperCase();
    const colors = getRecentColors().filter(function (color) { return color !== normalized; });
    colors.unshift(normalized);
    try { localStorage.setItem(RECENT_COLOR_KEY, JSON.stringify(colors.slice(0, 6))); } catch (_) {}
    renderRecentColors();
  }

  function getRecentColors() {
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENT_COLOR_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(function (c) { return /^#[0-9a-f]{6}$/i.test(c); }).slice(0, 6) : [];
    } catch (_) { return []; }
  }

  function renderRecentColors() {
    const grid = document.getElementById("formatRecentColorGrid");
    if (!grid) return;
    grid.innerHTML = "";
    getRecentColors().forEach(function (value) {
      grid.appendChild(createColorSwatch(value, value));
    });
  }

  // ==================================================
  // Helpers
  // ==================================================

  function getSelectedLineRanges(cm) {
    return cm.listSelections().map(function (selection) {
      let fromLine = Math.min(selection.anchor.line, selection.head.line);
      let toLine = Math.max(selection.anchor.line, selection.head.line);

      if (
        selection.anchor.line !== selection.head.line &&
        selection.head.ch === 0 &&
        selection.head.line === toLine
      ) {
        toLine -= 1;
      }

      return { fromLine: fromLine, toLine: Math.max(fromLine, toLine) };
    });
  }

  function minPos(a, b) {
    if (a.line < b.line) return a;
    if (a.line > b.line) return b;
    return a.ch <= b.ch ? a : b;
  }

  function maxPos(a, b) {
    if (a.line > b.line) return a;
    if (a.line < b.line) return b;
    return a.ch >= b.ch ? a : b;
  }

  function advancePosition(start, text) {
    const parts = text.split("\n");

    if (parts.length === 1) {
      return {
        line: start.line,
        ch: start.ch + text.length
      };
    }

    return {
      line: start.line + parts.length - 1,
      ch: parts[parts.length - 1].length
    };
  }

  window.initFormatToolbar = initFormatToolbar;
})();
