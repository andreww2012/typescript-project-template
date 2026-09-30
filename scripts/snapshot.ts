import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {Creation} from 'bingo';

type CreatedDirectory = Creation['files'];

const TEMPLATE_DIRECTORY = path.join(import.meta.dirname, '../template');
const OUTPUT_PATH = path.join(import.meta.dirname, '../dist/files.json');

const getOrCreateDirectory = (parent: CreatedDirectory, name: string) => {
  const existing = parent[name];
  if (typeof existing === 'object' && !Array.isArray(existing)) {
    return existing;
  }

  const created: CreatedDirectory = {};
  parent[name] = created;
  return created;
};

const entries = execFileSync(
  // eslint-disable-next-line sonar/no-os-command-from-path
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  {cwd: TEMPLATE_DIRECTORY, encoding: 'utf8'},
)
  .split('\0')
  .filter(Boolean)
  .flatMap((filePath) => {
    const absolutePath = path.join(TEMPLATE_DIRECTORY, filePath);
    // Tracked files deleted from disk are still listed
    const stats = fs.lstatSync(absolutePath, {throwIfNoEntry: false});
    return stats ? [{absolutePath, filePath, stats}] : [];
  });

const snapshot = {
  files: entries
    .filter(({stats}) => !stats.isSymbolicLink())
    .reduce<CreatedDirectory>((root, {absolutePath, filePath, stats}) => {
      const content = fs.readFileSync(absolutePath, 'utf8');
      const directory = filePath.split('/').slice(0, -1).reduce(getOrCreateDirectory, root);
      directory[path.posix.basename(filePath)] =
        stats.mode & fs.constants.S_IXUSR ? [content, {executable: true}] : content;
      return root;
    }, {}),
  symlinks: Object.fromEntries(
    entries
      .filter(({stats}) => stats.isSymbolicLink())
      .map(({absolutePath, filePath}) => [filePath, fs.readlinkSync(absolutePath)]),
  ),
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), {recursive: true});
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot));
