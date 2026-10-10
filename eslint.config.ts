import {eslintConfig} from 'eslint-config-un';
import {GLOB_MARKDOWN_SUPPORTED_CODE_BLOCKS} from 'eslint-config-un/globs';
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
    fileProgress: true,
    format: {
      files: [GLOB_MARKDOWN_SUPPORTED_CODE_BLOCKS],
      formatter: [
        'oxfmt',
        {
          bracketSpacing: oxfmtConfig.bracketSpacing,
          printWidth: oxfmtConfig.printWidth,
          singleQuote: oxfmtConfig.singleQuote,
        },
      ],
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
      // `eslint-config-un` comes with Prettier, which would format code blocks too
      configFormatFencedCodeBlocks: false,
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
