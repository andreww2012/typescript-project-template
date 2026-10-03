import fs from 'node:fs/promises';
import path from 'node:path';
import {text} from 'node:stream/consumers';
import {parse as parseToml} from 'smol-toml';

const configPaths = process.argv.slice(2);
if (configPaths.length === 0) {
  throw new Error('Expected one or more lychee config paths to read `extensions` from');
}

const allowedExtensions = new Set<string>();
for (const configPath of configPaths) {
  const {extensions} = parseToml(await fs.readFile(configPath, 'utf8'));
  if (Array.isArray(extensions)) {
    for (const extension of extensions) {
      if (typeof extension === 'string') {
        allowedExtensions.add(extension.toLowerCase());
      }
    }
  }
}

if (allowedExtensions.size === 0) {
  throw new Error(
    `None of the configs (${configPaths.join(', ')}) declare \`extensions\`, so the lychee default list would apply, which is not replicated here`,
  );
}

const inputPaths = (await text(process.stdin)).split('\n');

process.stdout.write(
  inputPaths
    .filter((inputPath) => allowedExtensions.has(path.extname(inputPath).slice(1).toLowerCase()))
    .map((inputPath) => `${inputPath}\n`)
    .join(''),
);
