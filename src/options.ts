import fs from 'node:fs/promises';
import path from 'node:path';
import {arrayWithoutFalsy} from 'utilery/array';
import {jsonParse} from 'utilery/json';
import * as z from 'zod';

const NODE_MAJOR_VERSION_REGEX = /\d+/;

export const SNAPSHOT_PATH = path.join(import.meta.dirname, '../dist/files.json');

export const UTILITY_LIBRARY = 'utilery';

export const TOOLS = ['knip', 'cspell', 'commitlint', 'lefthook', 'publint', 'vitest'] as const;

const LIB_ONLY_TOOLS: ReadonlySet<string> = new Set(['publint']);

export const isToolAvailable = (tool: string, kind: string | undefined) =>
  kind === 'lib' || !LIB_ONLY_TOOLS.has(tool);

// CSpell only checks American English by default. British English is bundled with it
export const LANGUAGES = [
  {id: 'en-GB', name: 'British English'},
  {id: 'nl', name: 'Dutch', dictionary: '@cspell/dict-nl-nl'},
  {id: 'fr', name: 'French', dictionary: '@cspell/dict-fr-fr'},
  {id: 'de', name: 'German', dictionary: '@cspell/dict-de-de'},
  {id: 'it', name: 'Italian', dictionary: '@cspell/dict-it-it'},
  {id: 'pl', name: 'Polish', dictionary: '@cspell/dict-pl_pl'},
  {id: 'pt', name: 'Portuguese (Brazil)', dictionary: '@cspell/dict-pt-br'},
  {id: 'ru', name: 'Russian', dictionary: '@cspell/dict-ru_ru'},
  {id: 'es', name: 'Spanish', dictionary: '@cspell/dict-es-es'},
  {id: 'tr', name: 'Turkish', dictionary: '@cspell/dict-tr-tr'},
  {id: 'uk', name: 'Ukrainian', dictionary: '@cspell/dict-uk-ua'},
] as const;

const snapshotPackageJsonZod = z.object({files: z.object({'package.json': z.string()})});

const packageJsonEnginesZod = z.object({engines: z.object({node: z.string()})});

// The flag can be repeated, and each of its values can be a comma-separated list
const listFlag = <const Values extends readonly string[]>(values: Values) =>
  z
    .string()
    .array()
    .transform((lists) => arrayWithoutFalsy(lists.flatMap((list) => list.split(','))))
    .pipe(z.literal(values).array());

// Options asked by our own prompts, because Bingo can't ask conditional and multi-select questions
export const optionsZod = z.object({
  kind: z.literal(['app', 'lib']).default('app'),
  changesets: z.literal(['none', 'github', 'default']).default('none'),
  contributors: z.literal(['no', 'yes']).default('no'),
  // Its values and default come from `engines.node` of `template/package.json`
  node: z.string().optional(),
  pnpm: z.literal(['12', '11']).default('12'),
  catalogs: z.literal(['no', 'yes']).default('no'),
  // Defaults to `catalogs`, because ncu only updates catalogs in workspaces
  workspace: z.literal(['no', 'yes']).optional(),
  'save-exact': z.literal(['yes', 'no']).default('yes'),
  formatter: z.literal(['oxfmt', 'prettier']).default('oxfmt'),
  'ts-extensions': z.literal(['yes', 'no']).default('yes'),
  tools: listFlag(TOOLS).default(['knip', 'cspell', 'commitlint', 'lefthook', 'publint']),
  languages: listFlag(LANGUAGES.map(({id}) => id)).default([]),
  updater: z.literal(['ncu', 'dependabot', 'renovate', 'none']).default('ncu'),
  ci: z.literal(['yes', 'no']).default('yes'),
  lychee: z.literal(['no', 'yes']).default('no'),
  guidelines: z.literal(['local', 'remote']).default('local'),
});

export const DEFAULT_OPTIONS: Readonly<z.output<typeof optionsZod>> = optionsZod.parse({});

// Bingo passes the raw flag values to `produce`, so these only describe the flags
export const OPTION_FLAGS = {
  catalogs: optionsZod.shape.catalogs.optional().meta({
    description: 'whether to keep dependency versions in pnpm catalogs, enforced by ESLint',
  }),
  changesets: optionsZod.shape.changesets.optional().meta({
    description:
      'changesets setup with the GitHub or the default changelog format (only for `lib`)',
  }),
  ci: optionsZod.shape.ci
    .optional()
    .meta({description: 'whether to set up CI with GitHub Actions'}),
  contributors: optionsZod.shape.contributors
    .optional()
    .meta({description: 'whether to set up all-contributors (only for `lib`)'}),
  formatter: optionsZod.shape.formatter.optional().meta({description: 'code formatter'}),
  guidelines: optionsZod.shape.guidelines.optional().meta({
    description:
      'how `AGENTS.md` links the AI guidelines: copied into the project (`local`) or on GitHub (`remote`)',
  }),
  kind: optionsZod.shape.kind
    .optional()
    .meta({description: 'project kind: app or published library'}),
  languages: z
    .string()
    .array()
    .optional()
    .meta({
      description: `extra CSpell languages, comma-separated or in repeated flags (${LANGUAGES.map(({id}) => id).join(', ')})`,
    }),
  lychee: optionsZod.shape.lychee
    .optional()
    .meta({description: 'whether to check links with lychee in CI (only with `--ci yes`)'}),
  node: optionsZod.shape.node.meta({
    description:
      'lowest supported Node.js major version, out of those in `engines.node` of this template (defaults to the lowest one)',
  }),
  pnpm: optionsZod.shape.pnpm.optional().meta({description: 'major version of pnpm'}),
  'save-exact': optionsZod.shape['save-exact'].optional().meta({
    description:
      'whether to use exact dependency versions: pnpm saves them and, without catalogs, ESLint requires them in `package.json`',
  }),
  tools: z
    .string()
    .array()
    .optional()
    .meta({
      description: `tools to set up, comma-separated or in repeated flags (${TOOLS.join(', ')}; ${[...LIB_ONLY_TOOLS].join(', ')} only for \`lib\`)`,
    }),
  'ts-extensions': optionsZod.shape['ts-extensions']
    .optional()
    .meta({description: 'whether to use `.ts` extensions in imports, enforced by ESLint'}),
  updater: optionsZod.shape.updater.optional().meta({description: 'dependency updater'}),
  workspace: optionsZod.shape.workspace.meta({
    description:
      'whether to make the project a pnpm workspace with the root as its package (defaults to `--catalogs`): ncu only updates catalogs in workspaces, and changesets tags releases like `name@1.0.0` instead of `v1.0.0`',
  }),
} as const;

// Supported version ranges by the lowest supported major version, from the lowest one
export const readNodeVersionRanges = async () => {
  const {files} = snapshotPackageJsonZod.parse(jsonParse(await fs.readFile(SNAPSHOT_PATH, 'utf8')));
  const {engines} = packageJsonEnginesZod.parse(jsonParse(files['package.json']));
  const ranges = engines.node.split('||').map((range) => range.trim());

  return new Map(
    ranges.map((range, index) => [
      NODE_MAJOR_VERSION_REGEX.exec(range)?.[0] || range,
      ranges.slice(index).join(' || '),
    ]),
  );
};
