// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'npm-check-updates';
import {satisfies, tryParse} from 'verkit';
import packageJson from './package.json' with {type: 'json'};

const CACHE_DIRECTORY = path.join(import.meta.dirname, 'node_modules/.cache/npm-check-updates');
// eslint-disable-next-line unicorn/no-top-level-side-effects
fs.mkdirSync(CACHE_DIRECTORY, {recursive: true});

/** @type {Set<string>} */
const IGNORED_PACKAGES = new Set();

/**
 * Blocks *updating to* any version matching the given semver range for a package
 * (it does not restrict the version we update *from*). Use to skip a known-broken
 * release until a fix ships. Each entry should document why it is blocked
 * @type {Record<string, string>}
 */
const IGNORED_PACKAGE_RANGES_TO_UPDATE = {};

/** @type {Set<string>} */
const PACKAGES_WITH_PINNED_MAJOR_VERSION = new Set(['@types/node']);

/** Their `latest` dist-tag lags behind the prerelease channel we actually follow. */
const PACKAGES_ON_PRERELEASE_CHANNEL = new Set(['eslint-config-un']);

/**
 * @type {Record<string, {packages: string[]; groupName?: string; icon?: string; priority?: number | null}>}
 */
const PACKAGE_GROUPS = Object.entries({
  'Package manager': {
    packages: ['pnpm'],
    icon: '📦',
    priority: 0,
  },
  '@eslint': {
    packages: ['eslint', 'eslint-config-un'],
    groupName: 'ESLint',
  },
  '@cspell': {
    packages: ['cspell'],
  },
  // '@commitlint': {packages: []},
}).reduce((result, [groupName, {packages: packagesInGroup, ...groupMeta}]) => {
  const isScopedGroup = groupName.startsWith('@');
  const groupInfo = {
    groupName: isScopedGroup ? groupName.slice(1) : groupName,
    ...groupMeta,
  };

  const packagesInCurrentGroup = Object.fromEntries([
    [isScopedGroup ? `${groupName}/*` : groupName, groupInfo],
    ...packagesInGroup.map((packageInGroup) => [packageInGroup, groupInfo]),
  ]);

  return Object.assign(result, packagesInCurrentGroup);
}, {});

export default defineConfig({
  cache: true,
  cacheExpiration: 30,
  cacheFile: path.join(CACHE_DIRECTORY, 'cache.json'),

  target: (packageName) => {
    if (PACKAGES_WITH_PINNED_MAJOR_VERSION.has(packageName)) {
      return 'minor';
    }

    return PACKAGES_ON_PRERELEASE_CHANNEL.has(packageName) ? 'greatest' : 'latest';
  },
  filterResults: (
    packageName,
    {currentVersion: currentVersionRaw, upgradedVersion: upgradedVersionRaw},
  ) => {
    // eslint-disable-next-line sonar/no-empty-collection
    if (IGNORED_PACKAGES.has(packageName)) {
      return false;
    }

    const [currentVersion, upgradedVersion] = [currentVersionRaw, upgradedVersionRaw].map((v) =>
      v.split('@').at(-1),
    );

    const blockedVersionRange = IGNORED_PACKAGE_RANGES_TO_UPDATE[packageName];
    if (blockedVersionRange && satisfies(upgradedVersion || '', blockedVersionRange)) {
      return false;
    }

    const [currentVersionSemver, upgradedVersionSemver] = [currentVersion, upgradedVersion].map(
      (v) => tryParse(v || ''),
    );
    return !(
      PACKAGES_WITH_PINNED_MAJOR_VERSION.has(packageName) &&
      currentVersionSemver?.major !== upgradedVersionSemver?.major
    );
  },

  format: ['group'],
  interactive: true,
  groupFunction: (fullName) => {
    const [nameScope] = fullName.split('/', 1);
    const knownGroup = PACKAGE_GROUPS[fullName] || PACKAGE_GROUPS[`${nameScope}/*`];

    if (knownGroup) {
      const {groupName, icon, priority} = knownGroup;
      return `${priority === null ? '' : `${priority ?? 3}. `}${icon || '📁'} ${groupName}`;
    }

    return fullName in packageJson.devDependencies
      ? '2. 🧑‍💻 Dev dependencies'
      : '1. 📦 Direct dependencies';
  },
});
