// deploy/inline.cjs — inlines index.html into worker.js as a JSON string constant.
// Run: node deploy/inline.cjs   (before sites_deploy)
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const workerPath = path.join(dir, "worker.js");
let js = fs.readFileSync(workerPath, "utf8");
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
// Drop previous inlined constant or import
js = js.replace(/^const indexHtml = .*?;\n/m, "");
js = js.replace(/^import indexHtml from .*?;\n/m, "");
js = "const indexHtml = " + JSON.stringify(html) + ";\n" + js;
fs.writeFileSync(workerPath, js);
console.log("inlined index.html -> worker.js, size:", js.length);
