async function loadTabsComponent() {
    const mount = document.getElementById("tabsMount");
    if (!mount) return;

    const res = await fetch("components/tabs.html");
    mount.innerHTML = await res.text();

    initTabs();
}

function initTabs() {
    const tabList = document.getElementById("tabList");
    const newTabBtn = document.getElementById("newTabBtn");

    if (!tabList) return;

    tabList.addEventListener("click", (event) => {
        const closeBtn = event.target.closest(".tab-close");
        const tab = event.target.closest(".tab-item");

        if (!tab) return;

        if (closeBtn) {
            tab.remove();
            return;
        }

        document
            .querySelectorAll(".tab-item.active")
            .forEach((el) => el.classList.remove("active"));

        tab.classList.add("active");
    });

    if (newTabBtn) {
        newTabBtn.addEventListener("click", () => {
            const tab = document.createElement("button");
            tab.className = "tab-item";
            tab.type = "button";
            tab.innerHTML = `
                <span class="tab-icon">📄</span>
                <span class="tab-title">untitled.md</span>
                <span class="tab-close">×</span>
            `;

            tabList.appendChild(tab);
        });
    }
}

document.addEventListener("DOMContentLoaded", loadTabsComponent);