import fs from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';

const NODE_MAJOR_VERSION_REGEX = /\d+/;

export const SNAPSHOT_PATH = path.join(import.meta.dirname, '../dist/files.json');

export const UTILITY_LIBRARY = '@andreww2012/unutils';

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

const snapshotPackageJsonSchema = z.object({files: z.object({'package.json': z.string()})});

const packageJsonEnginesSchema = z.object({engines: z.object({node: z.string()})});

const commaSeparatedList = <const Values extends readonly string[]>(values: Values) =>
  z
    .string()
    .transform((list) => list.split(',').filter(Boolean))
    .pipe(z.array(z.literal(values)));

// Options asked by our own prompts, because Bingo can't ask conditional and multi-select questions
export const optionsSchema = z.object({
  kind: z.literal(['app', 'lib']).default('app'),
  changesets: z.literal(['none', 'github', 'default']).default('none'),
  contributors: z.literal(['no', 'yes']).default('no'),
  // Its values and default come from `engines.node` of `template/package.json`
  node: z.string().optional(),
  pnpm: z.literal(['12', '11']).default('12'),
  formatter: z.literal(['oxfmt', 'prettier']).default('oxfmt'),
  'ts-extensions': z.literal(['yes', 'no']).default('yes'),
  tools: commaSeparatedList(TOOLS).default(['knip', 'cspell', 'commitlint', 'lefthook', 'publint']),
  languages: commaSeparatedList(LANGUAGES.map(({id}) => id)).default([]),
  updater: z.literal(['ncu', 'dependabot', 'renovate', 'none']).default('ncu'),
  ci: z.literal(['yes', 'no']).default('yes'),
  lychee: z.literal(['no', 'yes']).default('no'),
  guidelines: z.literal(['local', 'remote']).default('local'),
});

export const DEFAULT_OPTIONS = Object.freeze(optionsSchema.parse({}));

// Bingo passes the raw flag values to `produce`, so these only describe the flags
export const OPTION_FLAGS = {
  changesets: optionsSchema.shape.changesets
    .optional()
    .describe('changesets setup with the GitHub or the default changelog format (only for `lib`)'),
  ci: optionsSchema.shape.ci.optional().describe('whether to set up CI with GitHub Actions'),
  contributors: optionsSchema.shape.contributors
    .optional()
    .describe('whether to set up all-contributors (only for `lib`)'),
  formatter: optionsSchema.shape.formatter.optional().describe('code formatter'),
  guidelines: optionsSchema.shape.guidelines
    .optional()
    .describe(
      'how `AGENTS.md` links the AI guidelines: copied into the project (`local`) or on GitHub (`remote`)',
    ),
  kind: optionsSchema.shape.kind.optional().describe('project kind: app or published library'),
  languages: z
    .string()
    .optional()
    .describe(`comma-separated extra CSpell languages (${LANGUAGES.map(({id}) => id).join(', ')})`),
  lychee: optionsSchema.shape.lychee
    .optional()
    .describe('whether to check links with lychee in CI (only with `--ci yes`)'),
  node: optionsSchema.shape.node.describe(
    'lowest supported Node.js major version, out of those in `engines.node` of this template (defaults to the lowest one)',
  ),
  pnpm: optionsSchema.shape.pnpm.optional().describe('major version of pnpm'),
  tools: z
    .string()
    .optional()
    .describe(
      `comma-separated tools to set up (${TOOLS.join(', ')}; ${[...LIB_ONLY_TOOLS].join(', ')} only for \`lib\`)`,
    ),
  'ts-extensions': optionsSchema.shape['ts-extensions']
    .optional()
    .describe('whether to use `.ts` extensions in imports, enforced by ESLint'),
  updater: optionsSchema.shape.updater.optional().describe('dependency updater'),
} as const;

// Supported version ranges by the lowest supported major version, from the lowest one
export const readNodeVersionRanges = async () => {
  const {files} = snapshotPackageJsonSchema.parse(
    JSON.parse(await fs.readFile(SNAPSHOT_PATH, 'utf8')),
  );
  const {engines} = packageJsonEnginesSchema.parse(JSON.parse(files['package.json']));
  const ranges = engines.node.split('||').map((range) => range.trim());

  return new Map(
    ranges.map((range, index) => [
      NODE_MAJOR_VERSION_REGEX.exec(range)?.[0] || range,
      ranges.slice(index).join(' || '),
    ]),
  );
};
