import {eslintConfig} from 'eslint-config-un';

export default eslintConfig({
  ignores: [
    // This only works with `--config` passed explicitly,
    // otherwise ESLint lints template files with the template's own config
    'template/',
    '.agents/style-guide.md',
    'CHANGELOG.md',
  ],
  defaultConfigsStatus: 'misc-enabled',
  configs: {
    fileProgress: true,
    markdown: {
      configSentencesPerLine: {
        ignores: [
          // Putting every sentence on its own line causes line wraps in the changelog
          '.changeset/**/*.md',
        ],
      },
    },

    // False positives:
    zod: false,
  },
  extraConfigs: [],
});
