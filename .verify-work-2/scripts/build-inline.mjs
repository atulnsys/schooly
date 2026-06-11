import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
const outputPath = path.join(distDir, "index-inline.html");
let html = await readFile(indexPath, "utf8");

const stylesheetPattern = /<link\s+rel="stylesheet"\s+crossorigin\s+href="([^"]+)"\s*\/?>/g;
for (const match of [...html.matchAll(stylesheetPattern)]) {
  const assetPath = path.join(distDir, match[1].replace(/^\.\//, ""));
  const css = await readFile(assetPath, "utf8");
  html = html.replace(match[0], `<style>${css}</style>`);
}

const modulePattern = /<script\s+type="module"\s+crossorigin\s+src="([^"]+)"><\/script>/g;
for (const match of [...html.matchAll(modulePattern)]) {
  const assetPath = path.join(distDir, match[1].replace(/^\.\//, ""));
  const javascript = await readFile(assetPath, "utf8");
  html = html.replace(match[0], `<script type="module">${javascript}</script>`);
}

await writeFile(outputPath, html, "utf8");
console.log(`Generated ${outputPath}`);
