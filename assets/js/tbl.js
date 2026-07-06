//==================================================
// Manual Kit - tbl.js
//==================================================

async function renderTables() {
  const tables = document.querySelectorAll("table.tbl[data-src]");

  for (const table of tables) {
    const src = table.dataset.src;

    if (!src) continue;

    try {
      const response = await fetch(src);

      if (!response.ok) {
        throw new Error(response.status);
      }

      const text = await response.text();

      renderTable(table, text);
    } catch (err) {
      console.error(err);

      table.innerHTML = `<tr><td>Failed to load : ${src}</td></tr>`;
    }
  }
}


//==================================================
// Parse tbl
//==================================================

function renderTable(table, text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return;

  const rows = lines.map(line =>
    line.split("|").map(cell => cell.trim())
  );

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  rows[0].forEach(cell => {
    const th = document.createElement("th");
    th.textContent = cell;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");

  for (let i = 2; i < rows.length; i++) {
    const tr = document.createElement("tr");

    rows[i].forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  table.innerHTML = "";
  table.appendChild(thead);
  table.appendChild(tbody);
}