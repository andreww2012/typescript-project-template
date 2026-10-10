import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {arrayPartition, setByPath} from '@andreww2012/unutils';
import type {Creation} from 'bingo';

const TEMPLATE_DIRECTORY = path.join(import.meta.dirname, '../template');
const OUTPUT_PATH = path.join(import.meta.dirname, '../dist/files.json');

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
    return stats ? {absolutePath, filePath, stats} : [];
  });

const [symlinkEntries, fileEntries] = arrayPartition(entries, ({stats}) => stats.isSymbolicLink());

const snapshot = {
  files: fileEntries.reduce<Creation['files']>((root, {absolutePath, filePath, stats}) => {
    const content = fs.readFileSync(absolutePath, 'utf8');
    return setByPath(
      root,
      filePath.split('/'),
      stats.mode & fs.constants.S_IXUSR ? [content, {executable: true}] : content,
      // Keeps existing directories, while the default turns numeric names into arrays
      Object,
    );
  }, {}),
  symlinks: Object.fromEntries(
    symlinkEntries.map(({absolutePath, filePath}) => [filePath, fs.readlinkSync(absolutePath)]),
  ),
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), {recursive: true});
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot));
