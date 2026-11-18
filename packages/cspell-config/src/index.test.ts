// cspell:ignore FEFF mistaek vjpf wmvr
import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import type {CSpellSettings} from 'cspell';
import {spellCheckDocument} from 'cspell-lib';
import {cspellConfig} from './index.ts';

const createProject = (files: Record<string, string> = {}) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cspell-config-'));
  onTestFinished(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  Object.entries(files).forEach(([fileName, content]) => {
    const filePath = path.join(directory, fileName);
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
    fs.writeFileSync(filePath, content);
  });

  return directory;
};

const getUnknownWords = async (text: string, settings: CSpellSettings) => {
  const {issues} = await spellCheckDocument(
    {uri: 'file:///text.txt', text, languageId: 'plaintext'},
    {generateSuggestions: false, noConfigSearch: true},
    settings,
  );
  return issues.map((issue) => issue.text);
};

// The defaults are taken from the config itself, so that the tests don't repeat them
const {
  dictionaries: defaultDictionaries = [],
  ignorePaths: defaultIgnorePaths = [],
  ignoreRegExpList: defaultIgnoreRegexes = [],
} = cspellConfig({gitignore: false});

describe('defaults', () => {
  it('skips all GitHub advisory ids', async () => {
    const config = cspellConfig({gitignore: false});
    const text = 'Fixed GHSA-ch52-4w7c-c8xp, GHSA-fc5q-39xc-vjpf and GHSA-ph4m-gq5x-wmvr';

    await expect(getUnknownWords(text, config)).resolves.toStrictEqual([]);
    await expect(getUnknownWords(text, {...config, ignoreRegExpList: []})).resolves.toStrictEqual([
      'vjpf',
      'wmvr',
    ]);
  });

  it('skips all code point escapes', async () => {
    const config = cspellConfig({gitignore: false});
    const text = String.raw`Removes \u{FEFF} and \u{feff}`;

    await expect(getUnknownWords(text, config)).resolves.toStrictEqual([]);
    await expect(getUnknownWords(text, {...config, ignoreRegExpList: []})).resolves.toStrictEqual([
      'FEFF',
      'feff',
    ]);
  });
});

describe('words', () => {
  it.each([{words: ['foo', 'bar']}, {words: {names: ['foo'], misc: ['bar'], empty: []}}])(
    'passes $words',
    ({words}) => {
      expect(cspellConfig({gitignore: false, words}).words).toStrictEqual(['foo', 'bar']);
    },
  );
});

describe('dictionaries', () => {
  it('adds `dictionaries` to the default ones', () => {
    expect(cspellConfig({gitignore: false, dictionaries: ['ru_ru']}).dictionaries).toStrictEqual([
      ...defaultDictionaries,
      'ru_ru',
    ]);
  });

  it('replaces the default ones with what a function returns', () => {
    const dictionaries = vi.fn<() => string[]>(() => ['ru_ru']);

    expect(cspellConfig({gitignore: false, dictionaries}).dictionaries).toStrictEqual(['ru_ru']);
    expect(dictionaries).toHaveBeenCalledExactlyOnceWith(defaultDictionaries);
  });
});

describe('other options', () => {
  it('adds `ignorePaths` and `ignoreRegExpList` to the default ones', () => {
    const config = cspellConfig({
      gitignore: false,
      ignorePaths: ['template/**', {glob: 'foo/**', root: '/'}],
      ignoreRegExpList: [/foo/gu, 'Urls'],
    });

    expect(config.ignorePaths).toStrictEqual([
      ...defaultIgnorePaths,
      'template/**',
      {glob: 'foo/**', root: '/'},
    ]);
    expect(config.ignoreRegExpList).toStrictEqual([...defaultIgnoreRegexes, /foo/gu, 'Urls']);
  });

  it('replaces the default `ignorePaths` and `ignoreRegExpList` with what a function returns', () => {
    const ignorePaths = vi.fn<() => string[]>(() => ['template/**']);
    const ignoreRegExpList = vi.fn<() => RegExp[]>(() => [/foo/gu]);
    const config = cspellConfig({gitignore: false, ignorePaths, ignoreRegExpList});

    expect(ignorePaths).toHaveBeenCalledExactlyOnceWith(defaultIgnorePaths);
    expect(ignoreRegExpList).toHaveBeenCalledExactlyOnceWith(defaultIgnoreRegexes);
    expect(config.ignorePaths).toStrictEqual(['template/**']);
    expect(config.ignoreRegExpList).toStrictEqual([/foo/gu]);
  });

  it('passes other options, replacing the default ones', () => {
    const config = cspellConfig({
      gitignore: false,
      enableGlobDot: false,
      language: 'en,ru',
      useGitignore: true,
    });

    expect(cspellConfig({gitignore: false}).enableGlobDot).toBe(true);
    expect(config).toMatchObject({enableGlobDot: false, language: 'en,ru', useGitignore: true});
    expect(config).not.toHaveProperty('cwd');
    expect(config).not.toHaveProperty('gitignore');
  });
});

describe('gitignore', () => {
  const FILES = {
    '.gitignore': 'dist/\n*.log\n',
    'debug.log': '',
    'dist/index.js': '',
    'src/index.ts': '',
  };

  it('skips the files git ignores in `cwd`', () => {
    const directory = createProject(FILES);

    expect(cspellConfig({cwd: directory}).ignorePaths).toStrictEqual([
      {glob: '/debug.log', root: directory},
      {glob: '/dist', root: directory},
      ...defaultIgnorePaths,
    ]);
  });

  it('passes the files git ignores to the `ignorePaths` function', () => {
    const directory = createProject(FILES);

    expect(
      cspellConfig({cwd: directory, ignorePaths: (paths) => paths.slice(0, 2)}).ignorePaths,
    ).toStrictEqual([
      {glob: '/debug.log', root: directory},
      {glob: '/dist', root: directory},
    ]);
  });

  it('passes the options to gitignore-reader-x', () => {
    const directory = createProject({...FILES, '.eslintignore': 'src/\n'});

    expect(
      cspellConfig({cwd: directory, gitignore: {sources: {files: ['.eslintignore']}}}).ignorePaths,
    ).toStrictEqual([
      {glob: '/debug.log', root: directory},
      {glob: '/dist', root: directory},
      {glob: '/src', root: directory},
      ...defaultIgnorePaths,
    ]);
  });

  it('can be turned off', () => {
    expect(cspellConfig({cwd: createProject(FILES), gitignore: false}).ignorePaths).toStrictEqual(
      defaultIgnorePaths,
    );
  });

  it('works with CSpell when the config file is not in `cwd`', () => {
    const indexUrl = url.pathToFileURL(path.join(import.meta.dirname, 'index.ts')).href;
    const directory = createProject({
      '.gitignore': 'ignored.txt\n',
      'ignored.txt': 'Ignored mistaek\n',
      'checked.txt': 'Checked mistaek\n',
      // Unlike `.config`, CSpell resolves the paths in this config relative to its own directory
      'configs/cspell.config.mjs': [
        "import path from 'node:path';",
        `import {cspellConfig} from ${JSON.stringify(indexUrl)};`,
        'export default cspellConfig({cwd: path.dirname(import.meta.dirname)});',
      ].join('\n'),
    });

    const {stdout, stderr, status} = childProcess.spawnSync(
      process.execPath,
      [
        url.fileURLToPath(import.meta.resolve('cspell/bin.mjs')),
        '--config',
        'configs/cspell.config.mjs',
        '--no-progress',
        '--no-summary',
        '--no-color',
        '*.txt',
      ],
      {cwd: directory, encoding: 'utf8'},
    );

    // Lines like `checked.txt:1:9 - Unknown word (mistaek)`
    const filesWithIssues = stdout.split('\n').flatMap((line) => line.split(':', 1)[0] || []);

    expect({filesWithIssues, stderr, status}).toStrictEqual({
      filesWithIssues: ['checked.txt'],
      stderr: '',
      status: 1,
    });
  });
});
