import {eslintConfig} from 'eslint-config-un';
// @if oxfmt
// @if ts-extensions
import oxfmtConfig from './oxfmt.config.ts';
// @endif
// @if !ts-extensions
import oxfmtConfig from './oxfmt.config.js';
// @endif
// @endif

export default eslintConfig({
  // @if changesets
  ignores: ['.agents/guidelines.md', 'CHANGELOG.md'],
  // @endif
  // @if !changesets
  ignores: ['.agents/guidelines.md'],
  // @endif
  // @if lib
  mode: 'lib',
  // @endif
  // typeInfoRules: {
  //   allowDefaultProject: ['*.config.*ts'],
  // },
  defaultConfigsStatus: 'misc-enabled',
  configs: {
    format: {
      files: [],
      // @if oxfmt
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
      // @endif
      // @if prettier
      configFencedCodeBlocks: true,
      // @endif
    },
    // @if ts-extensions
    import: {
      requireModuleExtensions: true,
    },
    // @endif
    markdown: {
      configSentencesPerLine: true,
    },
    // @if save-exact
    // @if !catalogs
    nodeDependencies: {
      enforceAbsoluteVersion: true,
    },
    // @endif
    // @endif
    // @if catalogs
    pnpm: {
      configPackageJson: {
        enforceCatalog: true,
      },
    },
    // @endif
    // @if vitest
    vitest: {
      vitestGlobalsImporting: 'disallow',
    },
    // @endif
  },
  // @if lychee
  extraConfigs: [
    {
      files: ['lychee.toml'],
      rules: {
        // The `#:schema` directive must not have a space after `#`
        'toml/spaced-comment': 0,
      },
    },
  ],
  // @endif
});
