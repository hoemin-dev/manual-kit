// assets/js/markdown-katex.js

(function () {
  "use strict";

  function markdownItKatexPlugin(md, options = {}) {
    const settings = {
      throwOnError: false,
      strict: false,
      trust: false,
      ...options
    };

    function renderKatex(content, displayMode) {
      if (!window.katex || typeof window.katex.renderToString !== "function") {
        return `<span class="katex-error">KaTeX is not loaded.</span>`;
      }

      try {
        return window.katex.renderToString(content, {
          ...settings,
          displayMode
        });
      } catch (error) {
        return `<span class="katex-error">${md.utils.escapeHtml(
          error.message || content
        )}</span>`;
      }
    }

    // ==========================================
    // Inline math: $...$
    // ==========================================

    function mathInlineRule(state, silent) {
      const start = state.pos;

      if (state.src[start] !== "$") {
        return false;
      }

      // $$는 블록 수식으로 처리
      if (state.src[start + 1] === "$") {
        return false;
      }

      // \$는 일반 문자
      if (start > 0 && state.src[start - 1] === "\\") {
        return false;
      }

      let end = start + 1;

      while (end < state.posMax) {
        if (
          state.src[end] === "$" &&
          state.src[end - 1] !== "\\"
        ) {
          break;
        }

        end += 1;
      }

      if (end >= state.posMax) {
        return false;
      }

      const content = state.src.slice(start + 1, end);

      if (!content.trim()) {
        return false;
      }

      if (!silent) {
        const token = state.push("math_inline", "math", 0);
        token.content = content;
        token.markup = "$";
      }

      state.pos = end + 1;
      return true;
    }

    md.inline.ruler.after("escape", "math_inline", mathInlineRule);

    md.renderer.rules.math_inline = function (tokens, index) {
      return renderKatex(tokens[index].content, false);
    };

    // ==========================================
    // Block math:
    //
    // $$
    // E = mc^2
    // $$
    //
    // 또는
    //
    // $$E = mc^2$$
    // ==========================================

    function mathBlockRule(state, startLine, endLine, silent) {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const firstLine = state.src.slice(start, max).trim();

      if (!firstLine.startsWith("$$")) {
        return false;
      }

      if (silent) {
        return true;
      }

      let nextLine = startLine;
      let content = "";
      let found = false;

      // 한 줄 블록: $$ E = mc^2 $$
      if (
        firstLine.length > 4 &&
        firstLine.endsWith("$$")
      ) {
        content = firstLine.slice(2, -2).trim();
        found = true;
      } else {
        // 여러 줄 블록
        const firstContent = firstLine.slice(2).trim();

        if (firstContent) {
          content += firstContent;
        }

        nextLine += 1;

        while (nextLine < endLine) {
          const lineStart =
            state.bMarks[nextLine] + state.tShift[nextLine];
          const lineEnd = state.eMarks[nextLine];
          const line = state.src.slice(lineStart, lineEnd);

          if (line.trim().endsWith("$$")) {
            const closingIndex = line.lastIndexOf("$$");
            const beforeClose = line.slice(0, closingIndex);

            if (beforeClose) {
              content += `${content ? "\n" : ""}${beforeClose}`;
            }

            found = true;
            break;
          }

          content += `${content ? "\n" : ""}${line}`;
          nextLine += 1;
        }
      }

      if (!found) {
        return false;
      }

      const token = state.push("math_block", "math", 0);
      token.block = true;
      token.content = content.trim();
      token.map = [startLine, nextLine + 1];
      token.markup = "$$";

      state.line = nextLine + 1;
      return true;
    }

    md.block.ruler.after(
      "blockquote",
      "math_block",
      mathBlockRule,
      {
        alt: ["paragraph", "reference", "blockquote", "list"]
      }
    );

    md.renderer.rules.math_block = function (tokens, index) {
      return `<div class="katex-display">${renderKatex(
        tokens[index].content,
        true
      )}</div>\n`;
    };
  }

  window.markdownItKatexPlugin = markdownItKatexPlugin;
})();