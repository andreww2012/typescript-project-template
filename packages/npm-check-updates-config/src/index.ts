import fs from 'node:fs';
import path from 'node:path';
import type {RcOptions} from 'npm-check-updates';
import {coerce, satisfies} from 'verkit';
import {parse as parseYaml} from 'yaml';

type Target = Extract<NonNullable<RcOptions['target']>, string>;

/** Packages shown together with `format: ['group']` */
export interface PackageGroup {
  /**
   * Packages in the group.
   * If the group key is a scope (like `@eslint`), all packages of the scope are in the group too
   */
  packages?: string[];

  /** Shown name, defaults to the group key without `@` */
  name?: string;

  /** @default '📁' */
  icon?: string;

  /**
   * Groups are sorted by this number, shown before their names.
   * Direct dependencies are `1` and dev dependencies are `2`.
   * `null` hides the number, and such groups go last
   * @default 3
   */
  priority?: number | null;
}

export interface NcuConfigOptions extends RcOptions {
  /**
   * Directory with `package.json` (to tell dev dependencies apart and find workspaces),
   * `pnpm-workspace.yaml` (to find workspaces) and `node_modules` (for the cache)
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * Targets by package name, other packages use `target`.
   * `minor` and `patch` are kept even when the target is set on the command line, like `ncu -t latest`.
   * Merged with the default ones, `false` removes a default
   */
  targets?: Record<string, Target | false>;

  /**
   * Semver ranges by package name to never update to, like a known broken release.
   * They don't restrict the version to update from
   */
  blockedVersions?: Record<string, string>;

  /**
   * Groups by name or scope (like `@eslint`).
   * Merged with the default ones by key and then by field, `false` removes a default
   */
  groups?: Record<string, PackageGroup | false>;
}

// Like `npm:@types/node@24.0.0`
const NPM_ALIAS_REGEX = /^npm:(@?[^@]+)@/;

const CACHE_FILE = 'node_modules/.cache/npm-check-updates/cache.json';

const DEFAULT_TARGETS: Readonly<Record<string, Target>> = {
  // Its major version should match the lowest supported Node.js version
  '@types/node': 'minor',
};

const DEFAULT_GROUPS: Readonly<Record<string, PackageGroup>> = {
  'Package manager': {
    packages: ['bun', 'npm', 'pnpm', 'yarn'],
    icon: '📦',
    priority: 0,
  },
  '@eslint': {
    packages: ['eslint', 'eslint-config-un'],
    name: 'ESLint',
  },
  '@cspell': {
    packages: ['cspell'],
  },
  '@vitest': {
    packages: ['vitest'],
  },
};

// Workspace package globs that match the root
const ROOT_PACKAGE_GLOBS: ReadonlySet<unknown> = new Set(['.', './']);

// Version parts that can't change with the given target
const KEPT_VERSION_PARTS: ReadonlyMap<Target | undefined, ('major' | 'minor')[]> = new Map([
  ['minor', ['major']],
  ['patch', ['major', 'minor']],
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value != null;

const parseFile = (filePath: string, parse: (text: string) => unknown) =>
  fs.existsSync(filePath) ? parse(fs.readFileSync(filePath, 'utf8')) : undefined;

// From `pnpm-workspace.yaml` or `workspaces` of `package.json`, like `{packages: ['./']}` or `['./']`
const getWorkspacePackages = (workspaces: unknown): unknown[] => {
  const packages =
    isRecord(workspaces) && 'packages' in workspaces ? workspaces.packages : workspaces;
  return Array.isArray(packages) ? packages : [];
};

const groupByDependencyType = (packageJson: unknown) => {
  const devDependencies = new Set(
    isRecord(packageJson) && isRecord(packageJson.devDependencies)
      ? Object.keys(packageJson.devDependencies)
      : [],
  );

  return (packageName: string) =>
    devDependencies.has(packageName) ? '2. 🧑‍💻 Dev dependencies' : '1. 📦 Direct dependencies';
};

export const ncuConfig = ({
  cwd = process.cwd(),
  targets = {},
  blockedVersions = {},
  groups = {},
  target = 'latest',
  filterResults = () => true,
  groupFunction,
  ...ncuOptions
}: NcuConfigOptions = {}) => {
  const packageJson = parseFile(path.join(cwd, 'package.json'), JSON.parse);
  const workspacePackages = [
    ...getWorkspacePackages(parseFile(path.join(cwd, 'pnpm-workspace.yaml'), parseYaml)),
    ...getWorkspacePackages(isRecord(packageJson) && packageJson.workspaces),
  ];
  const groupOtherPackage = groupFunction || groupByDependencyType(packageJson);
  const targetsByPackage = new Map(
    Object.entries({...DEFAULT_TARGETS, ...targets}).flatMap(([packageName, packageTarget]) =>
      packageTarget === false ? [] : [[packageName, packageTarget] as const],
    ),
  );
  const blockedVersionsByPackage = new Map(Object.entries(blockedVersions));
  // Scope groups are stored by keys like `@eslint/*`
  const groupLabelsByPackage = new Map(
    Object.entries({...DEFAULT_GROUPS, ...groups}).flatMap(([key, group]) => {
      if (group === false) {
        return [];
      }

      const {packages = [], name, icon = '📁', priority = 3} = {...DEFAULT_GROUPS[key], ...group};
      const isScope = key.startsWith('@');
      const label = `${priority === null ? '' : `${priority}. `}${icon} ${name || (isScope ? key.slice(1) : key)}`;
      return [isScope ? `${key}/*` : key, ...packages].map(
        (packageName) => [packageName, label] as const,
      );
    }),
  );
  const defaultCacheFile = path.join(cwd, CACHE_FILE);

  const config: RcOptions = {
    cache: true,
    cacheExpiration: 30,
    cacheFile: defaultCacheFile,
    format: ['group'],
    interactive: true,
    // Updates workspace packages and pnpm catalogs too
    ...(workspacePackages.length > 0 && {
      workspaces: true,
      // A root listed as a workspace package would be checked twice
      root: workspacePackages.every((glob) => !ROOT_PACKAGE_GLOBS.has(glob)),
    }),
    ...ncuOptions,

    target: (packageName, versionRange) =>
      targetsByPackage.get(packageName) ||
      (typeof target === 'function' ? target(packageName, versionRange) : target),
    filterResults: (packageName, versions) => {
      // Unlike `target`, this gets alias names (like `@types/node24`) instead of real package names
      const [, realPackageName = packageName] = NPM_ALIAS_REGEX.exec(versions.currentVersion) || [];
      const [currentVersion = '', upgradedVersion = ''] = [
        versions.currentVersion,
        versions.upgradedVersion,
      ].map((version) => version.split('@').at(-1));

      const blockedVersionRange = blockedVersionsByPackage.get(realPackageName);
      if (blockedVersionRange && satisfies(upgradedVersion, blockedVersionRange)) {
        return false;
      }

      const [currentSemver, upgradedSemver] = [currentVersion, upgradedVersion].map((version) =>
        coerce(version),
      );
      const keptVersionParts = KEPT_VERSION_PARTS.get(targetsByPackage.get(realPackageName)) || [];
      return (
        keptVersionParts.every((part) => currentSemver?.[part] === upgradedSemver?.[part]) &&
        filterResults(packageName, versions)
      );
    },
    groupFunction: (packageName, ...groupFunctionArguments) => {
      const [scope] = packageName.split('/', 1);
      return (
        groupLabelsByPackage.get(packageName) ||
        groupLabelsByPackage.get(`${scope}/*`) ||
        groupOtherPackage(packageName, ...groupFunctionArguments)
      );
    },
  };

  // ncu doesn't create the directory of the cache file
  if (config.cache && config.cacheFile === defaultCacheFile) {
    fs.mkdirSync(path.dirname(defaultCacheFile), {recursive: true});
  }

  return config;
};
