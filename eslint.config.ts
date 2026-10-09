import {eslintConfig} from 'eslint-config-un';

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
    fileProgress: true,
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

    // False positives:
    zod: false,
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
