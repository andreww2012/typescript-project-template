import {eslintConfig} from 'eslint-config-un';
import oxfmtConfig from './oxfmt.config.ts';

export default eslintConfig({
  ignores: [
    // This only works with `--config` passed explicitly,
    // otherwise ESLint lints template files with the template's own config
    'template/',
    '.agents/guidelines.md',
    'CHANGELOG.md',
  ],
  defaultConfigsStatus: 'misc-enabled',
  configs: {
    eslintComments: {
      requireDescriptions: true,
    },
    format: {
      files: [],
      configFencedCodeBlocks: {
        formatter: [
          'oxfmt',
          {
            bracketSpacing: oxfmtConfig.bracketSpacing,
            printWidth: oxfmtConfig.printWidth,
            singleQuote: oxfmtConfig.singleQuote,
          },
        ],
      },
    },
    import: {
      requireModuleExtensions: true,
    },
    markdown: {
      configSentencesPerLine: {
        ignores: [
          // Putting every sentence on its own line causes line wraps in the changelog
          '.changeset/**/*.md',
          'packages/*/LICENSE.md',
        ],
      },
    },
    pnpm: {
      configPackageJson: {
        enforceCatalog: true,
      },
    },
    un: {
      overrides: {
        'un/no-type-assertion': 2,
        'un/prefer-array-for-each': 2,
        'un/prefer-logical-or': 2,
      },
    },
    vitest: {
      vitestGlobalsImporting: 'disallow',
    },
    zod: {
      configCore: false,
      configMini: false,
    },
  },
  extraConfigs: [
    {
      // The lockfile of the workspace is in the root
      files: ['packages/*/package.json'],
      rules: {
        'lockfile/tracked': 'off',
      },
    },
  ],
});
