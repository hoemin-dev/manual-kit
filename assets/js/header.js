document.addEventListener("DOMContentLoaded", async () => {

    const res = await fetch("components/header.html");

    document.getElementById("header").innerHTML =
        await res.text();

});

document.addEventListener("DOMContentLoaded", async () => {

    const res = await fetch("components/header.html");

    document.getElementById("header").innerHTML =
        await res.text();

    document.dispatchEvent(new Event("headerLoaded"));

});