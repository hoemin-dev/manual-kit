//==================================================
// Manual Kit Command Wheel
//==================================================

function initCwheel(cm) {
  const wheel = document.getElementById("cwheel");

  if (!wheel || !cm) {
    return;
  }

  if (!wheel.classList.contains("is-open")) {
    toggleCwheel(wheel);
  }

  const toggle = wheel.querySelector(".cwheel__toggle");
  const commands = wheel.querySelector(".cwheel__commands");
  const items = [...wheel.querySelectorAll(".cwheel__item")];

  if (!toggle || !commands || items.length === 0) {
    return;
  }

  toggle.addEventListener("click", () => {
    toggleCwheel(wheel);
  });

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const command = item.dataset.command;
      const commandType = item.dataset.commandType || "argument";

      if (!command) {
        return;
      }

      insertCwheelCommand(cm, command, commandType);
    });
  });

  document.addEventListener("keydown", (event) => {
    const isShortcut =
      event.ctrlKey && event.altKey && event.key.toLowerCase() === "m";

    if (isShortcut) {
      event.preventDefault();
      toggleCwheel(wheel);
      return;
    }

    if (event.key === "Escape" && wheel.classList.contains("is-open")) {
      event.preventDefault();
      closeCwheel(wheel);
      cm.focus();
    }
  });
}

function toggleCwheel(wheel) {
  const isOpen = wheel.classList.toggle("is-open");
  updateCwheelState(wheel, isOpen);
}

function closeCwheel(wheel) {
  wheel.classList.remove("is-open");
  updateCwheelState(wheel, false);
}

function updateCwheelState(wheel, isOpen) {
  const toggle = wheel.querySelector(".cwheel__toggle");
  const commands = wheel.querySelector(".cwheel__commands");

  toggle?.setAttribute("aria-expanded", String(isOpen));
  toggle?.setAttribute(
    "aria-label",
    isOpen ? "특수 명령어 닫기" : "특수 명령어 열기",
  );

  commands?.setAttribute("aria-hidden", String(!isOpen));
}

function insertCwheelCommand(cm, command, commandType) {
  const selections = cm.listSelections();

  // 다중 커서는 첫 번째 커서 기준으로 단순 처리
  const cursor = selections[0].head;
  const lineText = cm.getLine(cursor.line) || "";
  const before = lineText.slice(0, cursor.ch);
  const after = lineText.slice(cursor.ch);

  let text = "";
  let cursorTextLength = 0;

  if (before.trim().length > 0) {
    text += "\n";
  }

  text += command;
  cursorTextLength = text.length;

  if (commandType === "line") {
    text += "\n";
    cursorTextLength = text.length;
  } else if (after.trim().length > 0) {
    text += "\n";
  }

  cm.replaceRange(text, cursor);

  const newCursor = getCursorAfterText(cursor, text.slice(0, cursorTextLength));

  cm.setCursor(newCursor);
  cm.focus();
}

function getCursorAfterText(start, text) {
  const lines = text.split("\n");

  if (lines.length === 1) {
    return {
      line: start.line,
      ch: start.ch + lines[0].length,
    };
  }

  return {
    line: start.line + lines.length - 1,
    ch: lines[lines.length - 1].length,
  };
}
