const template =
    fs.readFileSync("templates/temp.html","utf8");

const temp =
    fs.readFileSync("docs/template.html","utf8");

const body =
    temp.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];

const html =
    template.replace("{{CONTENT}}", body);

fs.writeFileSync("docs/manual.html", html);