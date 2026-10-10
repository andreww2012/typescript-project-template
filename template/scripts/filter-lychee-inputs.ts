import fs from 'node:fs/promises';
import path from 'node:path';
import {text} from 'node:stream/consumers';
import {parse as parseToml} from 'smol-toml';

const configPaths = process.argv.slice(2);
if (configPaths.length === 0) {
  throw new Error('Expected one or more lychee config paths to read `extensions` from');
}

const configs = await Promise.all(
  configPaths.map(async (configPath) => parseToml(await fs.readFile(configPath, 'utf8'))),
);
const allowedExtensions = new Set(
  configs.flatMap(({extensions}) =>
    Array.isArray(extensions)
      ? extensions.flatMap((extension) =>
          typeof extension === 'string' ? extension.toLowerCase() : [],
        )
      : [],
  ),
);

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
