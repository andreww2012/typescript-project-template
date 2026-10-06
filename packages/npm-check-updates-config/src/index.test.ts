import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {RcOptions} from 'npm-check-updates';
import {type NcuConfigOptions, ncuConfig} from './index.js';

const CACHE_DIRECTORY = 'node_modules/.cache/npm-check-updates';

const createProject = (files: Record<string, unknown> = {}) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-check-updates-config-'));
  onTestFinished(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  for (const [fileName, content] of Object.entries(files)) {
    fs.writeFileSync(
      path.join(directory, fileName),
      typeof content === 'string' ? content : JSON.stringify(content),
    );
  }

  return directory;
};

const createConfig = (options: NcuConfigOptions = {}, files: Record<string, unknown> = {}) =>
  ncuConfig({cwd: createProject(files), ...options});

const getTarget = ({target}: RcOptions, packageName: string) =>
  typeof target === 'function' ? target(packageName, []) : target;

const filterResult = (
  {filterResults}: RcOptions,
  packageName: string,
  currentVersion: string,
  upgradedVersion: string,
) =>
  filterResults?.(packageName, {
    currentVersion,
    currentVersionSemver: [],
    upgradedVersion,
    upgradedVersionSemver: {},
  });

const getGroup = ({groupFunction}: RcOptions, packageName: string) =>
  groupFunction?.(packageName, 'minor', [], [], null);

describe('targets', () => {
  it('updates `@types/node` within its major version by default', () => {
    const config = createConfig();

    expect(getTarget(config, '@types/node')).toBe('minor');
    expect(filterResult(config, '@types/node', '24.19.1', '24.20.0')).toBe(true);
    expect(filterResult(config, '@types/node', '24.19.1', '25.0.0')).toBe(false);
  });

  it('uses `target` for other packages', () => {
    expect(getTarget(createConfig(), 'zod')).toBe('latest');
    expect(getTarget(createConfig({target: 'semver'}), 'zod')).toBe('semver');
    expect(
      getTarget(
        createConfig({target: (packageName) => (packageName === 'zod' ? '@next' : 'latest')}),
        'zod',
      ),
    ).toBe('@next');
  });

  it('merges `targets` with the default ones', () => {
    const config = createConfig({
      target: 'semver',
      targets: {'@types/node': false, 'eslint-config-un': 'greatest'},
    });

    expect(getTarget(config, 'eslint-config-un')).toBe('greatest');
    expect(getTarget(config, '@types/node')).toBe('semver');
    expect(filterResult(config, '@types/node', '24.19.1', '25.0.0')).toBe(true);
  });

  it.each([
    {target: 'minor', currentVersion: '1.2.3', upgradedVersion: '1.9.0', isAllowed: true},
    {target: 'minor', currentVersion: '1.2.3', upgradedVersion: '2.0.0', isAllowed: false},
    {target: 'minor', currentVersion: '^1.2.3', upgradedVersion: '^2.0.0', isAllowed: false},
    {target: 'patch', currentVersion: '1.2.3', upgradedVersion: '1.2.9', isAllowed: true},
    {target: 'patch', currentVersion: '1.2.3', upgradedVersion: '1.3.0', isAllowed: false},
    {target: 'latest', currentVersion: '1.2.3', upgradedVersion: '2.0.0', isAllowed: true},
  ] as const)(
    'keeps `$target` target from $currentVersion to $upgradedVersion: $isAllowed',
    ({target, currentVersion, upgradedVersion, isAllowed}) => {
      const config = createConfig({targets: {foo: target}});

      expect(filterResult(config, 'foo', currentVersion, upgradedVersion)).toBe(isAllowed);
    },
  );

  it('uses real package names of aliases', () => {
    const config = createConfig();

    expect(
      filterResult(config, '@types/node24', 'npm:@types/node@24.19.1', 'npm:@types/node@25.0.0'),
    ).toBe(false);
    expect(
      filterResult(config, '@types/node24', 'npm:@types/node@24.19.1', 'npm:@types/node@24.20.0'),
    ).toBe(true);
  });
});

describe('blockedVersions', () => {
  it('skips updates to blocked versions only', () => {
    const config = createConfig({blockedVersions: {foo: '>=2.0.0 <2.0.3'}});

    expect(filterResult(config, 'foo', '1.0.0', '2.0.1')).toBe(false);
    expect(filterResult(config, 'foo', '2.0.1', '2.0.2')).toBe(false);
    expect(filterResult(config, 'foo', '2.0.1', '2.0.3')).toBe(true);
    expect(filterResult(config, 'bar', '1.0.0', '2.0.1')).toBe(true);
  });

  it('uses real package names of aliases', () => {
    const config = createConfig({blockedVersions: {'@types/node': '24.20.0'}});

    expect(filterResult(config, '@types/node24', 'npm:@types/node@24.19.1', '24.20.0')).toBe(false);
  });
});

describe('filterResults', () => {
  it('runs after the checks of the config', () => {
    const config = createConfig({
      blockedVersions: {foo: '2.0.0'},
      filterResults: (packageName) => packageName !== 'bar',
    });

    expect(filterResult(config, 'foo', '1.0.0', '2.0.0')).toBe(false);
    expect(filterResult(config, 'foo', '1.0.0', '2.0.1')).toBe(true);
    expect(filterResult(config, 'bar', '1.0.0', '2.0.1')).toBe(false);
  });
});

describe('groups', () => {
  it.each([
    {packageName: 'pnpm', group: '0. 📦 Package manager'},
    {packageName: 'yarn', group: '0. 📦 Package manager'},
    {packageName: 'eslint', group: '3. 📁 ESLint'},
    {packageName: '@eslint/js', group: '3. 📁 ESLint'},
    {packageName: 'eslint-config-un', group: '3. 📁 ESLint'},
    {packageName: '@cspell/dict-en_us', group: '3. 📁 cspell'},
    {packageName: 'vitest', group: '3. 📁 vitest'},
    {packageName: '@vitest/ui', group: '3. 📁 vitest'},
  ])('puts $packageName into "$group" by default', ({packageName, group}) => {
    expect(getGroup(createConfig(), packageName)).toBe(group);
  });

  it('splits other packages into direct and dev dependencies', () => {
    const config = createConfig({}, {'package.json': {devDependencies: {typescript: '6.0.0'}}});

    expect(getGroup(config, 'typescript')).toBe('2. 🧑‍💻 Dev dependencies');
    expect(getGroup(config, 'zod')).toBe('1. 📦 Direct dependencies');
    expect(getGroup(createConfig(), 'typescript')).toBe('1. 📦 Direct dependencies');
  });

  it('merges `groups` with the default ones', () => {
    const config = createConfig({
      groups: {
        '@eslint': {packages: ['eslint']},
        '@cspell': false,
        'Package manager': {priority: null},
        '@vue': {packages: ['vue'], name: 'Vue', icon: '💚'},
        prettier: {},
      },
    });

    expect(getGroup(config, '@eslint/js')).toBe('3. 📁 ESLint');
    expect(getGroup(config, 'eslint-config-un')).toBe('1. 📦 Direct dependencies');
    expect(getGroup(config, 'cspell')).toBe('1. 📦 Direct dependencies');
    expect(getGroup(config, 'pnpm')).toBe('📦 Package manager');
    expect(getGroup(config, 'vue')).toBe('3. 💚 Vue');
    expect(getGroup(config, '@vue/compiler-sfc')).toBe('3. 💚 Vue');
    expect(getGroup(config, 'prettier')).toBe('3. 📁 prettier');
  });

  it('uses `groupFunction` for other packages', () => {
    const config = createConfig({groupFunction: (_packageName, defaultGroup) => defaultGroup});

    expect(getGroup(config, 'zod')).toBe('minor');
    expect(getGroup(config, 'pnpm')).toBe('0. 📦 Package manager');
  });
});

describe('workspaces', () => {
  it.each([
    {
      name: 'a pnpm workspace with the root',
      files: {'pnpm-workspace.yaml': 'packages:\n  - ./\n  - packages/*\n'},
      expected: {workspaces: true, root: false},
    },
    {
      name: 'a pnpm workspace without the root',
      files: {'pnpm-workspace.yaml': 'packages:\n  - packages/*\n'},
      expected: {workspaces: true, root: true},
    },
    {
      name: 'workspaces in `package.json`',
      files: {'package.json': {workspaces: ['packages/*']}},
      expected: {workspaces: true, root: true},
    },
    {
      name: 'workspaces with packages in `package.json`',
      files: {'package.json': {workspaces: {packages: ['packages/*']}}},
      expected: {workspaces: true, root: true},
    },
    {
      name: '`pnpm-workspace.yaml` without packages',
      files: {'pnpm-workspace.yaml': 'minimumReleaseAge: 960\n'},
      expected: {workspaces: undefined, root: undefined},
    },
    {
      name: 'no workspaces',
      files: {'package.json': {}},
      expected: {workspaces: undefined, root: undefined},
    },
  ])('detects $name', ({files, expected}) => {
    const {workspaces, root} = createConfig({}, files);

    expect({workspaces, root}).toStrictEqual(expected);
  });

  it('lets options override the detected ones', () => {
    const config = createConfig(
      {workspaces: false},
      {'pnpm-workspace.yaml': 'packages:\n  - ./\n'},
    );

    expect(config.workspaces).toBe(false);
  });
});

describe('cache', () => {
  it('creates the directory of the default cache file', () => {
    const cwd = createProject();
    const config = ncuConfig({cwd});

    expect(config.cacheFile).toBe(path.join(cwd, CACHE_DIRECTORY, 'cache.json'));
    expect(fs.existsSync(path.join(cwd, CACHE_DIRECTORY))).toBe(true);
  });

  it('creates no directories without the default cache file', () => {
    const cwd = createProject();
    ncuConfig({cwd, cache: false});
    ncuConfig({cwd, cacheFile: path.join(cwd, 'cache/cache.json')});

    expect(fs.readdirSync(cwd)).toStrictEqual([]);
  });
});

it('passes ncu options and drops the extra ones', () => {
  const config = createConfig({
    format: ['repo'],
    interactive: false,
    targets: {},
    blockedVersions: {},
    groups: {},
  });

  expect(config).toMatchObject({format: ['repo'], interactive: false});
  expect(config).not.toHaveProperty('cwd');
  expect(config).not.toHaveProperty('targets');
  expect(config).not.toHaveProperty('blockedVersions');
  expect(config).not.toHaveProperty('groups');
});
