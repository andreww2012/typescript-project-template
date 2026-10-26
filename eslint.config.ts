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
    format: {
      // Only Markdown code blocks, other files are formatted by oxfmt itself
      files: [],
      configFencedCodeBlocks: true,
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
    },
    nodeDependencies: {
      enforceAbsoluteVersion: {
        dependencies: 'always',
        devDependencies: 'always',
        overridePackages: {
          '@andreww2012/ai-guidelines': 'ignore',
        },
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
