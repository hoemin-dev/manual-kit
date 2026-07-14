// assets/markdown-it/markdown-it-tasklist.js
(function () {
  "use strict";

  function markdownItTaskList(md, options) {
    const settings = Object.assign(
      {
        enabled: false
      },
      options || {}
    );

    function isTaskItem(content) {
      return /^\[[ xX]\]\s+/.test(content);
    }

    function isChecked(content) {
      return /^\[[xX]\]\s+/.test(content);
    }

    function findListItemOpen(tokens, inlineIndex) {
      for (let i = inlineIndex - 1; i >= 0; i -= 1) {
        if (tokens[i].type === "list_item_open") return tokens[i];
        if (
          tokens[i].type === "list_item_close" ||
          tokens[i].type === "bullet_list_open" ||
          tokens[i].type === "ordered_list_open"
        ) {
          break;
        }
      }
      return null;
    }

    function findParentListOpen(tokens, inlineIndex) {
      for (let i = inlineIndex - 1; i >= 0; i -= 1) {
        if (
          tokens[i].type === "bullet_list_open" ||
          tokens[i].type === "ordered_list_open"
        ) {
          return tokens[i];
        }
      }
      return null;
    }

    function taskListRule(state) {
      const tokens = state.tokens;

      for (let i = 0; i < tokens.length; i += 1) {
        const inlineToken = tokens[i];

        if (
          inlineToken.type !== "inline" ||
          !isTaskItem(inlineToken.content)
        ) {
          continue;
        }

        const checked = isChecked(inlineToken.content);
        const listItemOpen = findListItemOpen(tokens, i);
        const parentListOpen = findParentListOpen(tokens, i);

        if (!listItemOpen || !parentListOpen) continue;

        listItemOpen.attrJoin("class", "task-list-item");
        parentListOpen.attrJoin("class", "contains-task-list");

        inlineToken.content = inlineToken.content.replace(
          /^\[[ xX]\]\s+/,
          ""
        );

        if (!inlineToken.children) continue;

        const firstText = inlineToken.children.find(
          (child) => child.type === "text"
        );

        if (!firstText) continue;

        firstText.content = firstText.content.replace(
          /^\[[ xX]\]\s+/,
          ""
        );

        const checkboxToken = new state.Token("html_inline", "", 0);
        checkboxToken.content =
          '<input class="task-list-item-checkbox" type="checkbox"' +
          (checked ? " checked" : "") +
          (settings.enabled ? "" : " disabled") +
          "> ";

        inlineToken.children.unshift(checkboxToken);
      }
    }

    md.core.ruler.after("inline", "task-lists", taskListRule);
  }

  window.markdownItTaskList = markdownItTaskList;
})();
