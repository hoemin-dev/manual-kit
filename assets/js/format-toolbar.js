// assets/js/format-toolbar.js

(function () {
  let formatToolbarEditor = null;
  let formatToolbarInitialized = false;

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
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeHeadingMenu();
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
          return bStart - aStart;
        })
        .forEach(function (selection) {
          const from = minPos(selection.anchor, selection.head);
          const to = maxPos(selection.anchor, selection.head);
          const selectedText = cm.getRange(from, to);

          if (selectedText) {
            const hasMarkers =
              selectedText.startsWith(openMarker) &&
              selectedText.endsWith(closeMarker) &&
              selectedText.length >= openMarker.length + closeMarker.length;

            if (hasMarkers) {
              const unwrapped = selectedText.slice(
                openMarker.length,
                selectedText.length - closeMarker.length
              );
              cm.replaceRange(unwrapped, from, to);
              cm.setSelection(
                from,
                advancePosition(from, unwrapped)
              );
            } else {
              const wrapped = openMarker + selectedText + closeMarker;
              cm.replaceRange(wrapped, from, to);
              cm.setSelection(
                advancePosition(from, openMarker),
                advancePosition(from, openMarker + selectedText)
              );
            }
          } else {
            const inserted = openMarker + placeholder + closeMarker;
            cm.replaceRange(inserted, from);
            cm.setSelection(
              advancePosition(from, openMarker),
              advancePosition(from, openMarker + placeholder)
            );
          }
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
