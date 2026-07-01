// ======================================================
// Manual Kit
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    updatePageNumber();

});


// ======================================================
// Page Number
// ======================================================

function updatePageNumber() {

    const pages = document.querySelectorAll(".page");

    pages.forEach((page, index) => {

        const pageNo = page.querySelector(".page-no");

        if (!pageNo) return;

        pageNo.textContent = `${index + 1} / ${pages.length}`;

    });

}