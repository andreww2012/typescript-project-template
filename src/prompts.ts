import {parseArgs} from 'node:util';
import * as prompts from '@clack/prompts';
import {DEFAULT_OPTIONS, LANGUAGES, OPTION_FLAGS, TOOLS, readNodeVersionRanges} from './options.js';

const TOOL_HINTS: Record<(typeof TOOLS)[number], string> = {
  knip: 'unused files, exports and dependencies',
  cspell: 'spell checking',
  commitlint: 'commit message linting',
  lefthook: 'Git hooks',
  vitest: 'unit tests',
};

const PARSE_ARGS_OPTIONS = {
  ...Object.fromEntries(Object.keys(OPTION_FLAGS).map((key) => [key, {type: 'string' as const}])),
  help: {type: 'boolean'},
  version: {type: 'boolean'},
} as const;

/**
 * Asks the questions Bingo can't ask on its own.
 * @returns Flags with the answers to pass to Bingo, or `null` if the user cancelled
 */
export const promptForOptions = async (cliArguments: string[]) => {
  const {values} = parseArgs({args: cliArguments, options: PARSE_ARGS_OPTIONS, strict: false});
  if (values.help || values.version) {
    return [];
  }

  const answers = new Map(
    Object.entries(values).flatMap(([key, value]) =>
      typeof value === 'string' ? [[key, value]] : [],
    ),
  );
  const nodeVersionRanges = await readNodeVersionRanges();

  const questions: {
    key: keyof typeof OPTION_FLAGS;
    when?: () => boolean;
    ask: () => Promise<string | string[] | typeof prompts.CANCEL_SYMBOL>;
  }[] = [
    {
      key: 'kind',
      ask: () =>
        prompts.select({
          message: 'Is it a published library or an app?',
          options: [
            {value: 'lib', label: 'Published library'},
            {value: 'app', label: 'App'},
          ],
          initialValue: DEFAULT_OPTIONS.kind,
        }),
    },
    {
      key: 'changesets',
      when: () => answers.get('kind') === 'lib',
      ask: () =>
        prompts.select({
          message: 'Set up changesets?',
          options: [
            {value: 'none', label: 'No'},
            {value: 'github', label: 'Yes, with @changesets/changelog-github'},
            {value: 'default', label: 'Yes, with the default changelog format'},
          ],
          initialValue: DEFAULT_OPTIONS.changesets,
        }),
    },
    {
      key: 'contributors',
      when: () => answers.get('kind') === 'lib',
      ask: () =>
        prompts.select({
          message: 'Set up all-contributors?',
          options: [
            {value: 'no', label: 'No'},
            {value: 'yes', label: 'Yes'},
          ],
          initialValue: DEFAULT_OPTIONS.contributors,
        }),
    },
    {
      key: 'node',
      ask: () =>
        prompts.select({
          message: 'Which Node.js versions to support?',
          options: Array.from(nodeVersionRanges, ([major, range]) => ({
            value: major,
            label: `${major} or later (${range})`,
          })),
        }),
    },
    {
      key: 'pnpm',
      ask: () =>
        prompts.select({
          message: 'Which pnpm version?',
          options: [
            {value: '12', label: '12 (written in Rust)'},
            {value: '11', label: '11 (written in JavaScript)'},
          ],
          initialValue: DEFAULT_OPTIONS.pnpm,
        }),
    },
    {
      key: 'formatter',
      ask: () =>
        prompts.select({
          message: 'Which formatter?',
          options: [
            {value: 'oxfmt', label: 'oxfmt'},
            {value: 'prettier', label: 'Prettier'},
          ],
          initialValue: DEFAULT_OPTIONS.formatter,
        }),
    },
    {
      key: 'tools',
      ask: () =>
        prompts.multiselect({
          message: 'Which tools to set up?',
          options: TOOLS.map((tool) => ({value: tool, label: tool, hint: TOOL_HINTS[tool]})),
          initialValues: DEFAULT_OPTIONS.tools,
          required: false,
        }),
    },
    {
      key: 'languages',
      when: () => answers.get('tools')?.split(',').includes('cspell') === true,
      ask: () =>
        prompts.multiselect({
          message: 'Which extra dictionaries should CSpell use?',
          options: LANGUAGES.map(({id, name}) => ({value: id, label: name})),
          initialValues: DEFAULT_OPTIONS.languages,
          required: false,
        }),
    },
    {
      key: 'updater',
      ask: () =>
        prompts.select({
          message: 'Which tool should update dependencies?',
          options: [
            {value: 'ncu', label: 'ncu', hint: 'npm-check-updates, run by hand with `nr u`'},
            {value: 'dependabot', label: 'Dependabot', hint: 'built into GitHub'},
            {value: 'renovate', label: 'Renovate', hint: 'needs the Renovate GitHub app'},
            {value: 'none', label: 'None'},
          ],
          initialValue: DEFAULT_OPTIONS.updater,
        }),
    },
    {
      key: 'ci',
      ask: () =>
        prompts.select({
          message: 'Set up CI with GitHub Actions?',
          options: [
            {value: 'yes', label: 'Yes'},
            {value: 'no', label: 'No'},
          ],
          initialValue: DEFAULT_OPTIONS.ci,
        }),
    },
    {
      key: 'lychee',
      when: () => answers.get('ci') === 'yes',
      ask: () =>
        prompts.select({
          message: 'Check links with lychee in CI?',
          options: [
            {value: 'no', label: 'No'},
            {value: 'yes', label: 'Yes'},
          ],
          initialValue: DEFAULT_OPTIONS.lychee,
        }),
    },
    {
      key: 'guidelines',
      ask: () =>
        prompts.select({
          message: 'How should AGENTS.md link the AI guidelines?',
          options: [
            {value: 'local', label: 'Local', hint: 'copy the guidelines into the project'},
            {value: 'remote', label: 'Remote', hint: 'link the file on GitHub'},
          ],
          initialValue: DEFAULT_OPTIONS.guidelines,
        }),
    },
  ];

  const flags: string[] = [];
  for (const {key, when, ask} of questions) {
    if (answers.has(key) || when?.() === false) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop -- questions are asked one by one
    const answer = await ask();
    if (prompts.isCancel(answer)) {
      return null;
    }

    const value = Array.isArray(answer) ? answer.join(',') : answer;
    answers.set(key, value);
    flags.push(`--${key}=${value}`);
  }

  return flags;
};
