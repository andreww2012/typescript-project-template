import fs from 'node:fs';
import path from 'node:path';
import type {Creation} from 'bingo';
import {arrayPartition, setByPath} from 'utilery';
import {exec, writeJsonFile} from 'utilery/server';

const TEMPLATE_DIRECTORY = path.join(import.meta.dirname, '../template');
const OUTPUT_PATH = path.join(import.meta.dirname, '../dist/files.json');

const {stdout} = await exec(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  {spawnOptions: {cwd: TEMPLATE_DIRECTORY}},
);
const entries = stdout
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

await writeJsonFile(OUTPUT_PATH, snapshot, {indent: undefined, detectIndent: false});
