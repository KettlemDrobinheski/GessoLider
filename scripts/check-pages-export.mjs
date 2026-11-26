import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const outputDirectory = resolve('dist');
const basePath = '/GessoLider/';

function checkFile(path) {
  const file = statSync(path, { throwIfNoEntry: false });
  if (!file?.isFile() || file.size === 0) {
    throw new Error(`Missing or empty export file: ${path}`);
  }
}

checkFile(resolve(outputDirectory, 'index.html'));

for (const entry of readdirSync(outputDirectory, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

  const htmlPath = resolve(entry.parentPath, entry.name);
  const html = readFileSync(htmlPath, 'utf8');
  const resources = new Set();

  for (const [tag] of html.matchAll(/<(?:link|script)\b[^>]*>/gi)) {
    const reference = tag.match(/\s(?:href|src)=["']([^"']+)["']/i)?.[1];
    if (!reference || /^(?:https?:)?\/\//i.test(reference)) continue;

    const resourcePath = reference.split(/[?#]/, 1)[0];
    const extension = resourcePath.match(/\.(js|css|ico)$/i)?.[1].toLowerCase();
    if (!extension) continue;

    if (!resourcePath.startsWith(basePath)) {
      throw new Error(`${htmlPath} references ${reference} outside ${basePath}`);
    }

    const filePath = resolve(outputDirectory, decodeURIComponent(resourcePath.slice(basePath.length)));
    if (!filePath.startsWith(outputDirectory + sep)) {
      throw new Error(`${htmlPath} references ${reference} outside the export directory`);
    }

    checkFile(filePath);
    resources.add(extension);
  }

  for (const extension of ['js', 'css', 'ico']) {
    if (!resources.has(extension)) {
      throw new Error(`${htmlPath} does not reference a local .${extension} file`);
    }
  }
}

console.log(`Web export verified for ${basePath}`);
