import fs from 'node:fs';
import path from 'node:path';
import type configConventional from '@commitlint/config-conventional';
import {
  type AsyncRule,
  type Plugin,
  RuleConfigSeverity,
  type RuleConfigTuple,
  type RulesConfig,
  type UserConfig,
} from '@commitlint/types';
import createConventionalCommitsPreset from 'conventional-changelog-conventionalcommits';
import {
  allUnionMembers,
  arrayUnique,
  isPlainObject,
  isPropertyNotNullish,
  mapEntries,
  objectEntriesUnsafe,
  toKebabCase,
} from 'utilery';

/** Lengths in characters, `false` disables a rule */
export interface PartLengths {
  min?: number | false;
  max?: number | false;
}

export interface MultilinePartLengths extends PartLengths {
  /** Max length of each line */
  maxLine?: number | false;
}

export interface Lengths {
  header?: PartLengths;
  type?: PartLengths;
  scope?: PartLengths;
  subject?: PartLengths;
  body?: MultilinePartLengths;
  footer?: MultilinePartLengths;
}

type SpellingPart = 'header' | 'type' | 'scope' | 'subject' | 'body' | 'footer';

const SPELLING_PARTS = allUnionMembers<SpellingPart, {readonly: true}>()([
  'header',
  'type',
  'scope',
  'subject',
  'body',
  'footer',
]);

export interface SpellingOptions {
  /**
   * Parts to check: `true` reports errors, `'warn'` reports warnings and `false` skips a part.
   * Merged with the default ones: all parts except `header`
   */
  check?: Partial<Record<SpellingPart, boolean | 'warn'>>;

  /** Words to allow in commit messages, in addition to the CSpell config of the project */
  ignoreWords?: string[];
}

export interface CommitlintConfigOptions extends UserConfig {
  /**
   * Directory with `package.json`
   * @default process.cwd()
   */
  cwd?: string;

  /** Lengths of the commit message parts, merged with the default ones */
  lengths?: Lengths;

  /**
   * Spell checking with CSpell and the CSpell config of the project, `true` uses the default options.
   * Enabled by default if `cspell` is in `dependencies` or `devDependencies` of `package.json`.
   * Needs `cspell-lib`, an optional peer dependency
   */
  spelling?: boolean | SpellingOptions;

  /** Commit types to add (`true`) to the default ones or remove (`false`) from them */
  types?: Record<string, boolean>;
}

const DEFAULT_TYPES: Readonly<
  Record<keyof (typeof configConventional)['prompt']['questions']['type']['enum'], true>
> = {
  build: true,
  chore: true,
  ci: true,
  docs: true,
  feat: true,
  fix: true,
  perf: true,
  refactor: true,
  revert: true,
  style: true,
  test: true,
};

const DEFAULT_LENGTHS: Readonly<Lengths> = {
  header: {max: 120},
  body: {maxLine: false},
  footer: {maxLine: 100},
};

const WHITESPACE_REGEX = /\s/u;

const DEFAULT_SPELLING_CHECK: Readonly<Record<SpellingPart, boolean | 'warn'>> = {
  // It has `type`, `scope` and `subject` in it, so their mistakes would be reported twice
  header: false,
  type: true,
  scope: true,
  subject: true,
  body: true,
  footer: true,
};

const SPELLING_SEVERITIES: ReadonlyMap<unknown, RuleConfigSeverity> = new Map<
  unknown,
  RuleConfigSeverity
>([
  [true, RuleConfigSeverity.Error],
  ['warn', RuleConfigSeverity.Warning],
]);

// Words to ignore are passed as the rule value
const createSpellingRule =
  (part: SpellingPart): AsyncRule<readonly string[]> =>
  async (commit, _when, ignoreWords = []) => {
    const text = commit[part];
    if (!text) {
      return [true];
    }

    const {spellCheckDocument} = await import('cspell-lib');
    const {issues} = await spellCheckDocument(
      {
        // With an empty URI, CSpell looks for its config in the current directory
        uri: '',
        text,
        languageId: 'plaintext',
      },
      {generateSuggestions: false},
      {ignoreWords: [...ignoreWords]},
    );
    return [
      issues.length === 0,
      `unknown words in ${part}: ${arrayUnique(issues.map((issue) => issue.text)).join(', ')}`,
    ];
  };

const PLUGIN_RULES: Readonly<Plugin['rules']> = {
  'scope-no-whitespace': ({scope}) => [
    scope == null || !WHITESPACE_REGEX.test(scope),
    'scopes must be separated with `,` only, without spaces',
  ],
  ...Object.fromEntries(
    SPELLING_PARTS.map((part) => [`${part}-spelling`, createSpellingRule(part)]),
  ),
};

// The rules of `@commitlint/config-conventional` v21.2.3 without the length ones and `type-enum`,
// with errors instead of warnings, and our own rules
const DEFAULT_RULES: Readonly<Partial<RulesConfig>> = {
  'body-leading-blank': [RuleConfigSeverity.Error, 'always'],
  'footer-leading-blank': [RuleConfigSeverity.Error, 'always'],
  'header-trim': [RuleConfigSeverity.Error, 'always'],
  'scope-no-whitespace': [RuleConfigSeverity.Error, 'always'],
  // `sentence-case`, `start-case` sometimes useful if commit message starts with a proper name
  'subject-case': [RuleConfigSeverity.Error, 'never', ['pascal-case', 'upper-case']],
  'subject-empty': [RuleConfigSeverity.Error, 'never'],
  'subject-full-stop': [RuleConfigSeverity.Disabled], // Sometimes full stop is used for shorthands
  'type-case': [RuleConfigSeverity.Error, 'always', 'lower-case'],
  'type-empty': [RuleConfigSeverity.Error, 'never'],
};

// So that `{foo: undefined}` keeps the default `foo`
const omitUndefined = <Value>(object: Readonly<Record<string, Value | undefined>> = {}) =>
  mapEntries(object, (key, value) => (value == null ? undefined : [key, value]));

// Like `['body-max-line-length', [RuleConfigSeverity.Error, 'always', 100]]` for `body.maxLine`
const getLengthRules = (lengths: Lengths = {}) =>
  objectEntriesUnsafe(lengths).flatMap(([part, partLengths = {}]) =>
    objectEntriesUnsafe(partLengths)
      .filter(isPropertyNotNullish(1))
      .map(([kind, length]): [string, RuleConfigTuple<number>] => [
        `${part}-${toKebabCase(kind)}-length`,
        length === false
          ? [RuleConfigSeverity.Disabled]
          : [RuleConfigSeverity.Error, 'always', length],
      ]),
  );

const canImportCspellLib = () => {
  try {
    import.meta.resolve('cspell-lib');
    return true;
  } catch {
    return false;
  }
};

const getSpellingRules = (spelling: boolean | SpellingOptions) => {
  if (!spelling) {
    return [];
  }
  if (!canImportCspellLib()) {
    throw new Error(
      'Spell checking (the `spelling` option, enabled by default if `cspell` is in `package.json`) ' +
        'needs `cspell-lib` v10, which is usually installed with `cspell`. ' +
        'Install `cspell-lib` or set `spelling` to `false`',
    );
  }

  const {check, ignoreWords = []}: SpellingOptions = spelling === true ? {} : spelling;
  return Object.entries({...DEFAULT_SPELLING_CHECK, ...omitUndefined(check)}).map(
    ([part, severity]): [string, RuleConfigTuple<readonly string[]>] => [
      `${part}-spelling`,
      [SPELLING_SEVERITIES.get(severity) || RuleConfigSeverity.Disabled, 'always', ignoreWords],
    ],
  );
};

const hasCspellDependency = (cwd: string) => {
  const packageJsonPath = path.join(cwd, 'package.json');
  const packageJson: unknown =
    fs.existsSync(packageJsonPath) && JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return (
    isPlainObject(packageJson) &&
    [packageJson.dependencies, packageJson.devDependencies].some(
      (dependencies) => isPlainObject(dependencies) && 'cspell' in dependencies,
    )
  );
};

export const commitlintConfig = ({
  cwd = process.cwd(),
  lengths,
  plugins = [],
  rules,
  spelling = hasCspellDependency(cwd),
  types = {},
  ...config
}: CommitlintConfigOptions = {}): UserConfig => ({
  // A preset name would be resolved from the project, which may not have the preset installed.
  // commitlint only calls the preset function if the name starts with `conventional-changelog-`
  parserPreset: {
    name: 'conventional-changelog-conventionalcommits',
    parserOpts: createConventionalCommitsPreset,
  },
  ...config,
  plugins: [
    ...plugins.filter((plugin) => typeof plugin === 'string'),
    // commitlint only keeps the last plugin object
    {
      rules: {
        ...PLUGIN_RULES,
        ...Object.fromEntries(
          plugins.flatMap((plugin) =>
            typeof plugin === 'string' ? [] : Object.entries(plugin.rules),
          ),
        ),
      },
    },
  ],
  rules: {
    ...DEFAULT_RULES,
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      Object.entries<boolean>({...DEFAULT_TYPES, ...types})
        .filter(([, isAllowed]) => isAllowed)
        .map(([type]) => type)
        .toSorted(),
    ],
    ...Object.fromEntries([...getLengthRules(DEFAULT_LENGTHS), ...getLengthRules(lengths)]),
    ...Object.fromEntries(getSpellingRules(spelling)),
    ...omitUndefined(rules),
  },
});
