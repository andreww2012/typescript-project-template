import fs from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';

const NODE_MAJOR_VERSION_REGEX = /\d+/;

export const SNAPSHOT_PATH = path.join(import.meta.dirname, '../dist/files.json');

export const UTILITY_LIBRARY = '@andreww2012/unutils';

export const TOOLS = ['knip', 'cspell', 'commitlint', 'lefthook', 'vitest'] as const;

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

const SNAPSHOT_PACKAGE_JSON_SCHEMA = z.object({files: z.object({'package.json': z.string()})});

const PACKAGE_JSON_ENGINES_SCHEMA = z.object({engines: z.object({node: z.string()})});

const commaSeparatedList = <const Values extends readonly string[]>(values: Values) =>
  z
    .string()
    .transform((list) => list.split(',').filter(Boolean))
    .pipe(z.array(z.literal(values)));

// Options asked by our own prompts, because Bingo can't ask conditional and multi-select questions
export const OPTIONS_SCHEMA = z.object({
  kind: z.literal(['app', 'lib']).default('app'),
  changesets: z.literal(['none', 'github', 'default']).default('none'),
  contributors: z.literal(['no', 'yes']).default('no'),
  // Its values and default come from `engines.node` of `template/package.json`
  node: z.string().optional(),
  pnpm: z.literal(['12', '11']).default('12'),
  formatter: z.literal(['oxfmt', 'prettier']).default('oxfmt'),
  tools: commaSeparatedList(TOOLS).default(['knip', 'cspell', 'commitlint', 'lefthook']),
  languages: commaSeparatedList(LANGUAGES.map(({id}) => id)).default([]),
  updater: z.literal(['ncu', 'dependabot', 'renovate', 'none']).default('ncu'),
  ci: z.literal(['yes', 'no']).default('yes'),
  lychee: z.literal(['no', 'yes']).default('no'),
});

export const DEFAULT_OPTIONS = OPTIONS_SCHEMA.parse({});

// Bingo passes the raw flag values to `produce`, so these only describe the flags
export const OPTION_FLAGS = {
  changesets: OPTIONS_SCHEMA.shape.changesets
    .optional()
    .describe('changesets setup with the GitHub or the default changelog format (only for `lib`)'),
  ci: OPTIONS_SCHEMA.shape.ci.optional().describe('whether to set up CI with GitHub Actions'),
  contributors: OPTIONS_SCHEMA.shape.contributors
    .optional()
    .describe('whether to set up all-contributors (only for `lib`)'),
  formatter: OPTIONS_SCHEMA.shape.formatter.optional().describe('code formatter'),
  kind: OPTIONS_SCHEMA.shape.kind.optional().describe('project kind: app or published library'),
  languages: z
    .string()
    .optional()
    .describe(`comma-separated extra CSpell languages (${LANGUAGES.map(({id}) => id).join(', ')})`),
  lychee: OPTIONS_SCHEMA.shape.lychee
    .optional()
    .describe('whether to check links with lychee in CI (only with `--ci yes`)'),
  node: OPTIONS_SCHEMA.shape.node.describe(
    'lowest supported Node.js major version, out of those in `engines.node` of this template (defaults to the lowest one)',
  ),
  pnpm: OPTIONS_SCHEMA.shape.pnpm.optional().describe('major version of pnpm'),
  tools: z
    .string()
    .optional()
    .describe(`comma-separated tools to set up (${TOOLS.join(', ')})`),
  updater: OPTIONS_SCHEMA.shape.updater.optional().describe('dependency updater'),
};

// Supported version ranges by the lowest supported major version, from the lowest one
export const readNodeVersionRanges = async () => {
  const {files} = SNAPSHOT_PACKAGE_JSON_SCHEMA.parse(
    JSON.parse(await fs.readFile(SNAPSHOT_PATH, 'utf8')),
  );
  const {engines} = PACKAGE_JSON_ENGINES_SCHEMA.parse(JSON.parse(files['package.json']));
  const ranges = engines.node.split('||').map((range) => range.trim());

  return new Map(
    ranges.map((range, index) => [
      NODE_MAJOR_VERSION_REGEX.exec(range)?.[0] || range,
      ranges.slice(index).join(' || '),
    ]),
  );
};
