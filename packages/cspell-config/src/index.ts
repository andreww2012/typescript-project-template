import path from 'node:path';
import type {CSpellSettings} from 'cspell';
import {type ReadGitignoreOptions, readGitignoreSync} from 'gitignore-reader-x';
import type {MaybeFn, OmitStrict} from 'utilery';

type Dictionaries = NonNullable<CSpellSettings['dictionaries']>;
type IgnorePaths = NonNullable<CSpellSettings['ignorePaths']>;
type IgnorePatterns = NonNullable<CSpellSettings['ignoreRegExpList']>;

export interface CspellConfigOptions extends OmitStrict<
  CSpellSettings,
  'dictionaries' | 'enableGlobDot' | 'ignorePaths' | 'ignoreRegExpList' | 'words'
> {
  /**
   * Directory to read the gitignore rules for, usually the directory of the config file
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * Whether to skip the files that git ignores.
   * An object turns it on with these options of
   * [gitignore-reader-x](https://npmx.dev/gitignore-reader-x)
   * @default true
   */
  gitignore?: boolean | OmitStrict<ReadGitignoreOptions, 'cwd'>;

  /**
   * Whether to check the files and directories that start with a dot
   * @default true
   */
  enableGlobDot?: boolean;

  /**
   * Glob patterns of the files to skip, relative to `globRoot` of the config file.
   * An array is added to the default ones and to the files that git ignores (see `gitignore`).
   * A function gets all of those and returns the patterns to use instead
   */
  ignorePaths?: MaybeFn<IgnorePaths, [defaultPaths: IgnorePaths]>;

  /**
   * Patterns of the text to skip: regular expressions or names of
   * [CSpell patterns](https://cspell.org/configuration/patterns).
   * An array is added to the default ones.
   * A function gets the default ones and returns the patterns to use instead
   */
  ignoreRegExpList?: MaybeFn<IgnorePatterns, [defaultPatterns: IgnorePatterns]>;

  /**
   * Words to allow.
   * In the object form, the keys are only names of word groups, and the values are the words
   */
  words?: readonly string[] | Readonly<Record<string, readonly string[]>>;

  /**
   * Dictionaries to use.
   * An array is added to the default ones.
   * A function gets the default ones and returns the dictionaries to use instead
   */
  dictionaries?: MaybeFn<Dictionaries, [defaultDictionaries: Dictionaries]>;
}

const DEFAULT_DICTIONARIES: readonly string[] = ['npm', 'node', 'typescript', 'fullstack'];

const DEFAULT_IGNORE_PATHS: readonly string[] = [
  '**/.gitignore',
  '**/.git/**',
  '**/.vscode/extensions.json',
  '**/pnpm-lock.yaml',
  'patches/*.patch',
];

// Without the `g` flag, CSpell only skips the first match
const DEFAULT_IGNORE_REGEXES: readonly RegExp[] = [
  // GitHub advisory ids, like `GHSA-xxxx-xxxx-xxxx`
  // cspell:disable-next-line
  /\bGHSA(?:-[2-9cfghjmpqrvwx]{4}){3}\b/gu,
  // Code point escapes, like `\u{FEFF}`: unlike in `\uFEFF`, CSpell checks their digits as a word
  /\\u\{[\da-f]+\}/giu,
];

// An array is added to the default values, and a function replaces them with what it returns
const resolveList = <Item>(defaults: Item[], option: MaybeFn<Item[], [defaults: Item[]]>) =>
  typeof option === 'function' ? option(defaults) : [...defaults, ...option];

/**
 * Creates a [CSpell](https://npmx.dev/cspell) config.
 *
 * By default, the gitignore rules are read for the current directory of the process, which is
 * fine when CSpell is started inside the project.
 * If it may be started elsewhere, for example by an editor extension, the files that git ignores
 * are checked, and a big directory (like the home directory) may be read, which is slow.
 * To avoid that, pass `import.meta.dirname` as `cwd`: CSpell calls config functions without
 * arguments, so the directory of the config file can't be found here
 */
export const cspellConfig = ({
  cwd = process.cwd(),
  gitignore = true,
  words,
  dictionaries = [],
  ignorePaths = [],
  ignoreRegExpList = [],
  ...cspellSettings
}: CspellConfigOptions = {}): CSpellSettings => {
  const root = path.resolve(cwd);
  // With their own root, the paths stay right if the config file isn't in `cwd` or `globRoot` is set
  const gitignorePaths: IgnorePaths = gitignore
    ? readGitignoreSync({...(typeof gitignore === 'object' && gitignore), cwd: root})
        .toCspellIgnorePaths()
        .map((glob) => ({glob, root}))
    : [];

  return {
    enableGlobDot: true,
    ...cspellSettings,
    ignorePaths: resolveList([...gitignorePaths, ...DEFAULT_IGNORE_PATHS], ignorePaths),
    ignoreRegExpList: resolveList<IgnorePatterns[number]>(
      [...DEFAULT_IGNORE_REGEXES],
      ignoreRegExpList,
    ),
    dictionaries: resolveList([...DEFAULT_DICTIONARIES], dictionaries),
    // For an array, `Object.values` returns its items
    ...(words && {words: Object.values(words).flat()}),
  };
};
