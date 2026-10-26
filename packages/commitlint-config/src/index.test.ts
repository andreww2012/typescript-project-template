// cspell:ignore scoep featuer bodyy droped
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import lint from '@commitlint/lint';
import load from '@commitlint/load';
import {RuleConfigSeverity} from '@commitlint/types';
import {type CommitlintConfigOptions, commitlintConfig} from './index.ts';

const loadConfig = (options?: CommitlintConfigOptions, packageJson?: unknown) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'commitlint-config-'));
  onTestFinished(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });
  // Otherwise commitlint would look for a config in the parent and global directories
  fs.writeFileSync(path.join(directory, '.commitlintrc.json'), '{}'); // cspell:disable-line
  if (packageJson != null) {
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(packageJson));
  }

  return load(commitlintConfig({cwd: directory, ...options}), {cwd: directory});
};

const getLintOutcome = async (message: string, options?: CommitlintConfigOptions) => {
  const {rules, parserPreset, plugins} = await loadConfig(options);
  const parserOpts = parserPreset?.parserOpts;
  assert.ok(typeof parserOpts === 'object' && parserOpts != null);

  return await lint(message, rules, {parserOpts, plugins});
};

const lintMessage = async (message: string, options?: CommitlintConfigOptions) => {
  const {errors, warnings} = await getLintOutcome(message, options);
  const [errorRules, warningRules] = [errors, warnings].map((outcomes) =>
    outcomes.map(({name}) => name).toSorted(),
  );
  return {errors: errorRules, warnings: warningRules};
};

describe('default config', () => {
  it('has no warnings', async () => {
    const {rules} = await loadConfig();

    expect(
      Object.values(rules).filter((rule) => rule?.[0] === RuleConfigSeverity.Warning),
    ).toStrictEqual([]);
  });

  it.each([
    'feat: add a feature',
    'feat(scope)!: drop Node.js 22',
    'fix(foo,bar): Vue support in docs, etc.',
    `docs: ${'a'.repeat(114)}`,
    `chore: update\n\n${'a'.repeat(200)}`,
  ])('accepts %j', async (message) => {
    await expect(lintMessage(message)).resolves.toStrictEqual({errors: [], warnings: []});
  });

  it.each([
    {message: 'Feat: add a feature', errors: ['type-case', 'type-enum']},
    {message: 'wip: add a feature', errors: ['type-enum']},
    {message: 'feat(foo, bar): add a feature', errors: ['scope-no-whitespace']},
    {message: 'feat: ADD A FEATURE', errors: ['subject-case']},
    {message: 'feat:add a feature', errors: ['subject-empty', 'type-empty']},
    {message: 'feat: add a feature ', errors: ['header-trim']},
    {message: `docs: ${'a'.repeat(115)}`, errors: ['header-max-length']},
    {message: 'feat: add a feature\nbody', errors: ['body-leading-blank']},
    {
      message: 'feat: add a feature\n\nbody\nBREAKING CHANGE: foo',
      errors: ['footer-leading-blank'],
    },
    {
      message: `feat: add a feature\n\nbody\n\nBREAKING CHANGE: ${'a'.repeat(84)}`,
      errors: ['footer-max-line-length'],
    },
  ])('rejects $message with errors', async ({message, errors}) => {
    await expect(lintMessage(message)).resolves.toStrictEqual({errors, warnings: []});
  });
});

describe('lengths', () => {
  it.each([
    {message: `docs: ${'a'.repeat(44)}`, errors: []},
    {message: `docs: ${'a'.repeat(45)}`, errors: ['header-max-length']},
    {message: `docs: update\n\n${'a'.repeat(73)}`, errors: ['body-max-line-length']},
    {message: 'docs: fix', errors: ['subject-min-length']},
  ])('sets and adds length rules: $message', async ({message, errors}) => {
    const lengths = {header: {max: 50}, body: {maxLine: 72}, subject: {min: 5}};

    await expect(lintMessage(message, {lengths})).resolves.toStrictEqual({errors, warnings: []});
  });

  it('merges lengths of a part with the default ones', async () => {
    const lengths = {header: {min: 10}};

    await expect(lintMessage('docs: fix', {lengths})).resolves.toStrictEqual({
      errors: ['header-min-length'],
      warnings: [],
    });
    await expect(lintMessage(`docs: ${'a'.repeat(115)}`, {lengths})).resolves.toStrictEqual({
      errors: ['header-max-length'],
      warnings: [],
    });
  });

  it('disables length rules with `false`', async () => {
    await expect(
      lintMessage(`docs: ${'a'.repeat(200)}`, {lengths: {header: {max: false}}}),
    ).resolves.toStrictEqual({errors: [], warnings: []});
  });

  it('turns all lengths into existing rules', async () => {
    const partLengths = {min: 1, max: 1000};
    const multilinePartLengths = {...partLengths, maxLine: 1000};
    const lengths = {
      header: partLengths,
      type: partLengths,
      scope: partLengths,
      subject: partLengths,
      body: multilinePartLengths,
      footer: multilinePartLengths,
    };

    // commitlint throws on unknown rules
    await expect(
      lintMessage('feat(scope): add a feature\n\nbody\n\nBREAKING CHANGE: foo', {lengths}),
    ).resolves.toStrictEqual({errors: [], warnings: []});
  });
});

describe('types', () => {
  const types = {wip: true, style: false};

  it.each([
    {message: 'wip: add a feature', errors: []},
    {message: 'feat: add a feature', errors: []},
    {message: 'style: format the code', errors: ['type-enum']},
  ])('adds and removes types: $message', async ({message, errors}) => {
    await expect(lintMessage(message, {types})).resolves.toStrictEqual({errors, warnings: []});
  });

  it('keeps the types sorted', async () => {
    const {rules} = await loadConfig({types});

    expect(rules['type-enum']).toStrictEqual([
      RuleConfigSeverity.Error,
      'always',
      ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'test', 'wip'],
    ]);
  });
});

// The CSpell config of this repository is used
describe('spelling', () => {
  const MESSAGE = 'feat(scoep): add a featuer\n\nThe bodyy\n\nBREAKING CHANGE: droped Node.js 22';

  it.each([
    {
      name: 'in `devDependencies`',
      packageJson: {devDependencies: {cspell: '1.0.0'}},
      isEnabled: true,
    },
    {name: 'in `dependencies`', packageJson: {dependencies: {cspell: '1.0.0'}}, isEnabled: true},
    {name: 'not in `package.json`', packageJson: {devDependencies: {}}, isEnabled: false},
    {name: 'without `package.json`', packageJson: undefined, isEnabled: false},
  ])('is enabled if `cspell` is $name: $isEnabled', async ({packageJson, isEnabled}) => {
    const {rules} = await loadConfig({}, packageJson);

    expect('subject-spelling' in rules).toBe(isEnabled);
  });

  it.each([
    {spelling: false, packageJson: {devDependencies: {cspell: '1.0.0'}}, isEnabled: false},
    {spelling: true, packageJson: undefined, isEnabled: true},
    {spelling: {}, packageJson: undefined, isEnabled: true},
  ])(
    'is enabled with `spelling: $spelling`: $isEnabled',
    async ({spelling, packageJson, isEnabled}) => {
      const {rules} = await loadConfig({spelling}, packageJson);

      expect('subject-spelling' in rules).toBe(isEnabled);
    },
  );

  it('checks all parts except the header by default', async () => {
    await expect(lintMessage(MESSAGE, {spelling: true})).resolves.toStrictEqual({
      errors: ['body-spelling', 'footer-spelling', 'scope-spelling', 'subject-spelling'],
      warnings: [],
    });
  });

  it('merges `check` with the default one', async () => {
    const spelling = {check: {header: true, scope: false, body: 'warn', footer: false}} as const;

    await expect(lintMessage(MESSAGE, {spelling})).resolves.toStrictEqual({
      errors: ['header-spelling', 'subject-spelling'],
      warnings: ['body-spelling'],
    });
  });

  it('allows `ignoreWords`', async () => {
    const spelling = {ignoreWords: ['scoep', 'featuer']};

    await expect(lintMessage(MESSAGE, {spelling})).resolves.toStrictEqual({
      errors: ['body-spelling', 'footer-spelling'],
      warnings: [],
    });
  });

  it('lists each unknown word once', async () => {
    const {errors} = await getLintOutcome('feat: add featuer and featuer', {spelling: true});

    expect(errors.map(({message}) => message)).toStrictEqual(['unknown words in subject: featuer']);
  });
});

it('merges `rules` with the default ones', async () => {
  const options: CommitlintConfigOptions = {
    lengths: {header: {max: 10}},
    rules: {
      'header-max-length': [RuleConfigSeverity.Disabled],
      'scope-empty': [RuleConfigSeverity.Error, 'never'],
    },
  };

  await expect(lintMessage('Feat: add a feature', options)).resolves.toStrictEqual({
    errors: ['scope-empty', 'type-case', 'type-enum'],
    warnings: [],
  });
});

it('keeps the defaults for `undefined` values', async () => {
  const {rules} = await loadConfig({
    lengths: {header: {max: undefined}},
    rules: {'subject-empty': undefined},
    spelling: {check: {body: undefined}},
  });

  expect([
    rules['header-max-length'],
    rules['subject-empty'],
    rules['body-spelling'],
  ]).toStrictEqual([
    [RuleConfigSeverity.Error, 'always', 120],
    [RuleConfigSeverity.Error, 'never'],
    [RuleConfigSeverity.Error, 'always', []],
  ]);
});

it('merges `plugins` with its own plugin', async () => {
  const options: CommitlintConfigOptions = {
    plugins: [{rules: {'subject-no-foo': ({subject}) => [!subject?.includes('foo'), 'no foo']}}],
    rules: {'subject-no-foo': [RuleConfigSeverity.Error, 'always']},
  };

  await expect(lintMessage('feat(foo, bar): add foo', options)).resolves.toStrictEqual({
    errors: ['scope-no-whitespace', 'subject-no-foo'],
    warnings: [],
  });
});

it('passes other commitlint options', async () => {
  const {helpUrl} = await loadConfig({helpUrl: 'https://example.com'});

  expect(helpUrl).toBe('https://example.com');
});
