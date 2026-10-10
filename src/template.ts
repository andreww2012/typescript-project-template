import fs from 'node:fs/promises';
import path from 'node:path';
import {getInstruction, readDocument} from '@andreww2012/ai-guidelines';
import {type Creation, createTemplate} from 'bingo';
import {z} from 'zod';
import {
  LANGUAGES,
  OPTION_FLAGS,
  SNAPSHOT_PATH,
  UTILITY_LIBRARY,
  isToolAvailable,
  optionsSchema,
  readNodeVersionRanges,
} from './options.ts';

type CreatedEntry = Creation['files'][string];

const PNPM_11_VERSION = '11.28.5';

const TYPES_NODE = '@types/node';

// Like `npm:@types/node@24.0.0`
const NPM_ALIAS_REGEX = /^npm:(@?[^@]+)@(.+)$/;

// From https://github.com/tsconfig/bases, by the lowest supported Node.js major version
const NODE_TSCONFIG_OPTIONS: Readonly<Record<string, {target: string; lib: string[]}>> = {
  22: {target: 'es2022', lib: ['es2024', 'ESNext.Array', 'ESNext.Collection', 'ESNext.Iterator']},
  24: {
    target: 'es2024',
    lib: [
      'es2024',
      'ESNext.Array',
      'ESNext.Collection',
      'ESNext.Error',
      'ESNext.Iterator',
      'ESNext.Promise',
    ],
  },
  26: {target: 'es2025', lib: ['es2025', 'ESNext.Collection', 'ESNext.Temporal']},
};

const TSCONFIG_TARGET_REGEX = /"target": "[^"]*"/;

// The first item of `lib` is the ECMAScript version, like in `"lib": ["es2022", "dom"]`
const TSCONFIG_LIB_REGEX = /(?<="lib": \[)"[^"]*"/g;

const LICENSE_COPYRIGHT_REGEX = /^Copyright \(c\) .*$/m;

// Default of the `node-version` input of the CI prepare action, like `default: '22'`
const CI_DEFAULT_NODE_VERSION_REGEX = /(?<=default: )'\d+'/;

// Node.js versions in the CI test matrix, like `node-version: [22, 24, 26]`
const CI_NODE_VERSIONS_REGEX = /(?<=node-version: )\[[\d ,]+\]/;

// Like `lefthook@1.2.3:` in `allowBuilds` of `pnpm-workspace.yaml`
const LEFTHOOK_ALLOW_BUILDS_KEY_REGEX = /lefthook@[^\s:]+:/;

// Same as `printWidth` in the formatter configs of the template
const PRINT_WIDTH = 100;

// Run with `node -e` instead of `ln -sfn` to work on Windows too.
// Bingo runs scripts without a shell and splits them by spaces, unless escaped by a backslash
const CREATE_SYMLINK_SCRIPT = [
  'const [link, target] = process.argv.slice(1);',
  'fs.rmSync(link, {force: true});',
  'fs.mkdirSync(path.dirname(link), {recursive: true});',
  'fs.symlinkSync(target, link);',
]
  .join(' ')
  .replaceAll(' ', String.raw`\ `);

// A trimmed line like `// @if feature`, `# @if !feature` or `<!-- @endif -->`
const MARKER_REGEX = /^(?:\/\/|#|<!--) @(?:if (!?)([\w-]+)|endif)(?: -->)?$/;

// Things that are only created with the given feature
const FILE_FEATURES: Readonly<Record<string, string>> = {
  '.agents/guidelines.md': 'local-guidelines',
  '.all-contributorsrc': 'contributors',
  '.changeset': 'changesets',
  '.github/actions': 'ci',
  '.github/dependabot.yml': 'dependabot',
  '.github/workflows': 'ci',
  '.github/workflows/check-links.yml': 'lychee',
  '.ncurc.js': 'ncu',
  '.prettierignore': 'prettier',
  'commitlint.config.ts': 'commitlint',
  'cspell.config.ts': 'cspell',
  'knip.config.ts': 'knip',
  'lefthook.yml': 'lefthook',
  'lychee.toml': 'lychee',
  'oxfmt.config.ts': 'oxfmt',
  'prettier.config.ts': 'prettier',
  'renovate.json': 'renovate',
  'scripts/filter-lychee-inputs.ts': 'lychee',
  'src/.gitkeep': 'app',
  'src/index.ts': 'lib',
  'tsdown.config.ts': 'lib',
  'vitest.config.ts': 'vitest',
};
const PACKAGE_FEATURES: Readonly<Record<string, string>> = {
  'actions-up': 'actions-up',
  'all-contributors-cli': 'contributors',
  '@andreww2012/npm-check-updates-config': 'ncu',
  [UTILITY_LIBRARY]: 'unutils',
  '@arethetypeswrong/cli': 'lib',
  '@changesets/changelog-github': 'changelog-github',
  '@changesets/cli': 'changesets',
  '@commitlint/cli': 'commitlint',
  '@commitlint/config-conventional': 'commitlint',
  '@commitlint/types': 'commitlint',
  cspell: 'cspell',
  'eslint-plugin-format': 'oxfmt',
  'eslint-plugin-github-action': 'ci',
  knip: 'knip',
  lefthook: 'lefthook',
  'lychee-config-nick2bad4u': 'lychee',
  'npm-check-updates': 'ncu',
  oxfmt: 'oxfmt',
  prettier: 'prettier',
  publint: 'publint',
  'smol-toml': 'lychee', // cspell:disable-line
  tsdown: 'lib',
  vitest: 'vitest',
  '@vitest/coverage-v8': 'vitest',
  '@vitest/eslint-plugin': 'vitest',
  '@vitest/ui': 'vitest',
  ...Object.fromEntries(
    LANGUAGES.flatMap((language) =>
      'dictionary' in language ? [[language.dictionary, language.id]] : [],
    ),
  ),
};
const SCRIPT_FEATURES: Readonly<Record<string, string>> = {
  build: 'lib',
  ch: 'changesets',
  'check:package': 'lib',
  'check:package:attw': 'lib',
  'check:package:publint': 'publint',
  'check:spelling': 'cspell',
  'contrib:add': 'contributors',
  'contrib:gen': 'contributors',
  knip: 'knip',
  'knip:cycles': 'knip',
  'knip:main': 'knip',
  prepack: 'lib',
  prepublishOnly: 'lib',
  release: 'changesets',
  t: 'vitest',
  't:cov': 'vitest',
  't:ui': 'vitest',
  'test:vitest': 'vitest',
  'test:vitest:cov': 'vitest',
  u: 'ncu',
  'u:actions': 'actions-up',
  'u:m': 'ncu',
  'u:pm': 'ncu',
};

const OXFMT_SCRIPTS: Readonly<Record<string, string>> = {
  'check:format': 'oxfmt --check',
  format: 'oxfmt',
};

// Scripts running other scripts, which only exist with the given feature
const SCRIPT_REPLACEMENTS: Readonly<
  Record<string, Record<string, [search: string, replacement: string]>>
> = {
  check: {
    cspell: ['check:(spelling|format)', 'check:format'],
    knip: ['knip|', ''],
  },
  'check:package': {
    publint: [' && nr check:package:publint', ''],
  },
  test: {
    vitest: [' && nr test:vitest', ''],
  },
};

const snapshotSchema = z.object({
  files: z
    .object({
      '.agents': z.record(z.string(), z.custom<CreatedEntry>()),
      'package.json': z.string(),
    })
    .catchall(z.custom<CreatedEntry>()),
  symlinks: z.record(z.string(), z.string()),
});

// Not `looseObject` with known fields, because it would move them first and break the key order
const jsonObjectSchema = z.record(z.string(), z.unknown());

const stringRecordSchema = z.record(z.string(), z.string()).optional();

// `template/package.json` has `@types/node` for every supported Node.js major version,
// with aliases like `"@types/node24": "npm:@types/node@24.0.0"`
const resolveTypesNodeAlias = ([packageName, version]: [string, string]): [string, string] => {
  const [, aliasedPackageName, aliasedVersion = version] = NPM_ALIAS_REGEX.exec(version) || [];
  return aliasedPackageName === TYPES_NODE ? [TYPES_NODE, aliasedVersion] : [packageName, version];
};

const formatArray = (prefix: string, items: string[], suffix: string) => {
  const singleLine = `${prefix}[${items.join(', ')}]${suffix}`;
  return singleLine.length <= PRINT_WIDTH
    ? singleLine
    : [`${prefix}[`, ...items.map((item) => `    ${item},`), `  ]${suffix}`].join('\n');
};

const applyMarkersToText = (text: string, features: ReadonlySet<string>) => {
  const conditions: boolean[] = [];
  return text
    .split('\n')
    .filter((line) => {
      const marker = MARKER_REGEX.exec(line.trim());
      if (marker) {
        const [, negated, feature] = marker;
        if (feature == null) {
          conditions.pop();
        } else {
          conditions.push(features.has(feature) !== Boolean(negated));
        }
        return false;
      }

      return conditions.every(Boolean);
    })
    .join('\n');
};

const updateJson =
  (update: (json: Record<string, unknown>) => Record<string, unknown>) => (text: string) =>
    JSON.stringify(update(jsonObjectSchema.parse(JSON.parse(text))), null, 2);

const hasFeature = (features: ReadonlySet<string>, feature: string | undefined) =>
  feature == null || features.has(feature);

// Drops the files of unused features, then changes the rest by their paths and applies the markers
const createFiles = (
  directory: Creation['files'],
  features: ReadonlySet<string>,
  transforms: Record<string, (text: string) => string>,
  directoryPath = '',
): Creation['files'] =>
  Object.fromEntries(
    Object.entries(directory).flatMap(([name, entry]): [string, CreatedEntry][] => {
      const entryPath = path.posix.join(directoryPath, name);
      if (!hasFeature(features, FILE_FEATURES[entryPath])) {
        return [];
      }

      const createText = (text: string) =>
        applyMarkersToText(transforms[entryPath]?.(text) ?? text, features);
      if (typeof entry === 'string') {
        return [[name, createText(entry)]];
      }

      if (Array.isArray(entry)) {
        const [content, ...metadata] = entry;
        return [[name, [createText(content), ...metadata]]];
      }

      const files = entry && createFiles(entry, features, transforms, entryPath);
      return files && Object.keys(files).length === 0 ? [] : [[name, files]];
    }),
  );

export const template = createTemplate({
  about: {
    name: 'TypeScript Project Template',
    description: "@andreww2012's personal generic TypeScript project template",
    repository: {
      owner: 'andreww2012',
      repository: 'typescript-project-template',
    },
  },
  options: {
    author: z.string().optional().describe('`package.json` author (defaults to `--owner`)'),
    description: z
      .string()
      .optional()
      .describe('Short description for `package.json` and `README.md`'),
    owner: z.string().describe('GitHub user or organization the repository is under'),
    repository: z.string().describe('Repository name, also used as the package name'),
    ...OPTION_FLAGS,
    // Bingo only prompts for options that are required or have a default.
    // It reads the description from the inner schema, so `describe` must come before `default`.
    // Its CLI flags parser doesn't support `z.enum`, but supports unions of literals
    utils: z
      .union([z.literal(UTILITY_LIBRARY), z.literal('none')])
      .describe('utility library')
      .default(UTILITY_LIBRARY),
  },
  produce: async ({options}) => {
    const {kind, node, pnpm, formatter, tools, updater, ci, ...parsedOptions} =
      optionsSchema.parse(options);
    const [snapshot, nodeVersionRanges, guidelines] = await Promise.all([
      fs.readFile(SNAPSHOT_PATH, 'utf8'),
      readNodeVersionRanges(),
      readDocument('guidelines'),
    ]);
    const {files, symlinks} = snapshotSchema.parse(JSON.parse(snapshot));
    const packageJson = jsonObjectSchema.parse(JSON.parse(files['package.json']));
    const nodeMajors = [...nodeVersionRanges.keys()];
    const nodeMajor = node || nodeMajors[0] || '';
    const nodeVersionRange = nodeVersionRanges.get(nodeMajor);
    if (nodeVersionRange == null) {
      throw new Error(`\`--node\` must be one of: ${nodeMajors.join(', ')}, got ${nodeMajor}`);
    }
    const supportedNodeMajors = nodeMajors.slice(nodeMajors.indexOf(nodeMajor));
    const tsconfigOptions = NODE_TSCONFIG_OPTIONS[nodeMajor];
    if (tsconfigOptions == null) {
      throw new Error(`There are no TypeScript \`target\` and \`lib\` for Node.js ${nodeMajor}`);
    }

    // Bingo defaults the repository to the raw `--directory` value, which can be a path
    const name = path.basename(options.repository);
    const changesets = kind === 'lib' ? parsedOptions.changesets : 'none';
    const spellCheckedLanguages = tools.includes('cspell')
      ? LANGUAGES.filter(({id}) => parsedOptions.languages.includes(id))
      : [];
    const features = new Set<string>([
      kind,
      formatter,
      `pnpm${pnpm}`,
      ...tools.filter((tool) => isToolAvailable(tool, kind)),
      ...spellCheckedLanguages.map(({id}) => id),
      ...(changesets === 'none' ? [] : ['changesets']),
      ...(changesets === 'github' ? ['changelog-github'] : []),
      ...(kind === 'lib' && parsedOptions.contributors === 'yes' ? ['contributors'] : []),
      ...(options.utils === UTILITY_LIBRARY ? ['unutils'] : []),
      ...(updater === 'none' ? [] : [updater]),
      ...(ci === 'yes' ? ['ci'] : []),
      // Dependabot and Renovate update GitHub Actions on their own
      ...(ci === 'yes' && updater === 'ncu' ? ['actions-up'] : []),
      ...(ci === 'yes' && parsedOptions.lychee === 'yes' ? ['lychee'] : []),
      ...(parsedOptions.guidelines === 'local' ? ['local-guidelines'] : []),
      ...(parsedOptions['ts-extensions'] === 'yes' ? ['ts-extensions'] : []),
    ]);
    const author = options.author || options.owner;
    const repositoryUrl = `https://github.com/${options.owner}/${name}`;
    const filterPackages = (packages: unknown) => {
      const entries = Object.entries(stringRecordSchema.parse(packages) || {})
        .filter(([packageName]) => hasFeature(features, PACKAGE_FEATURES[packageName]))
        .map(resolveTypesNodeAlias)
        .filter(
          ([packageName, version]) =>
            packageName !== TYPES_NODE || version.startsWith(`${nodeMajor}.`),
        );
      return entries.length > 0 ? Object.fromEntries(entries) : undefined;
    };
    const devDependencies = filterPackages(packageJson.devDependencies);
    if (devDependencies?.[TYPES_NODE] == null) {
      throw new Error(
        `\`template/package.json\` has no \`${TYPES_NODE}\` for Node.js ${nodeMajor}`,
      );
    }

    const scripts = Object.fromEntries(
      Object.entries(stringRecordSchema.parse(packageJson.scripts) || {})
        .filter(([scriptName]) => hasFeature(features, SCRIPT_FEATURES[scriptName]))
        .map(([scriptName, script]) => [
          scriptName,
          (formatter === 'oxfmt' && OXFMT_SCRIPTS[scriptName]) ||
            Object.entries(SCRIPT_REPLACEMENTS[scriptName] || {}).reduce(
              (result, [feature, [search, replacement]]) =>
                features.has(feature) ? result : result.replace(search, () => replacement),
              script,
            ),
        ]),
    );

    const dictionaries = spellCheckedLanguages.flatMap((language) =>
      'dictionary' in language ? `'${language.dictionary}/cspell-ext.json'` : [],
    );
    const cspellLanguageLines =
      spellCheckedLanguages.length > 0
        ? [
            `  language: '${['en', ...spellCheckedLanguages.map(({id}) => id)].join(',')}',`,
            ...(dictionaries.length > 0 ? [formatArray('  import: ', dictionaries, ',')] : []),
          ]
        : [];

    const transforms: Record<string, (text: string) => string> = {
      '.all-contributorsrc': updateJson((config) => ({
        ...config,
        projectName: name,
        projectOwner: options.owner,
      })),
      '.changeset/config.json': updateJson((config) => ({
        ...config,
        changelog:
          changesets === 'github'
            ? [
                '@changesets/changelog-github',
                {repo: `${options.owner}/${name}`, disableThanks: true},
              ]
            : config.changelog,
      })),
      '.github/actions/prepare/action.yml': (text) =>
        text.replace(CI_DEFAULT_NODE_VERSION_REGEX, () => `'${nodeMajor}'`),
      '.github/workflows/ci.yml': (text) =>
        text.replace(CI_NODE_VERSIONS_REGEX, () => `[${supportedNodeMajors.join(', ')}]`),
      'cspell.config.ts': (text) =>
        text.replace('  dictionaries: [', (dictionariesLine) =>
          [...cspellLanguageLines, dictionariesLine].join('\n'),
        ),
      'LICENSE.md': (text) =>
        text.replace(
          LICENSE_COPYRIGHT_REGEX,
          () => `Copyright (c) ${new Date().getFullYear()} ${author}`,
        ),
      'package.json': updateJson((json) => ({
        ...json,
        name,
        private: kind === 'app' ? json.private : undefined,
        description: options.description,
        homepage: kind === 'lib' ? repositoryUrl : undefined,
        bugs: kind === 'lib' ? {url: `${repositoryUrl}/issues/new`} : undefined,
        repository: kind === 'lib' ? {type: 'git', url: `git+${repositoryUrl}.git`} : undefined,
        author,
        exports: kind === 'lib' ? json.exports : undefined,
        types: kind === 'lib' ? json.types : undefined,
        files: kind === 'lib' ? json.files : undefined,
        scripts,
        dependencies: filterPackages(json.dependencies),
        devDependencies,
        engines: {...stringRecordSchema.parse(json.engines), node: nodeVersionRange},
        devEngines:
          pnpm === '11'
            ? {packageManager: {name: 'pnpm', version: PNPM_11_VERSION}}
            : json.devEngines,
      })),
      // Build scripts are allowed per version, so it must be the installed one
      'pnpm-workspace.yaml': (text) =>
        text.replace(LEFTHOOK_ALLOW_BUILDS_KEY_REGEX, (key) =>
          devDependencies.lefthook ? `lefthook@${devDependencies.lefthook}:` : key,
        ),
      'README.md': (text) => [`# ${name}`, options.description, text].filter(Boolean).join('\n\n'),
      'tsconfig.json': (text) =>
        text
          .replace(TSCONFIG_TARGET_REGEX, () => `"target": "${tsconfigOptions.target}"`)
          .replaceAll(TSCONFIG_LIB_REGEX, () =>
            tsconfigOptions.lib.map((lib) => `"${lib}"`).join(', '),
          ),
    };

    return {
      files: createFiles(
        {
          ...files,
          '.agents': {...files['.agents'], 'guidelines.md': guidelines},
          'AGENTS.md': getInstruction(
            parsedOptions.guidelines === 'local' ? './.agents/guidelines.md' : undefined,
          ),
        },
        features,
        transforms,
      ),
      scripts: Object.entries(symlinks).map(
        ([linkPath, target]) => `node -e ${CREATE_SYMLINK_SCRIPT} ${linkPath} ${target}`,
      ),
      suggestions: [
        'Install dependencies with `pnpm install`',
        'Go through the setup checklist in `README.md`',
      ],
    };
  },
});
