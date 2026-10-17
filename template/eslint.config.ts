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
      // Only Markdown code blocks, other files are formatted by the formatter itself
      files: [],
      configFencedCodeBlocks: true,
      // @if oxfmt
      formatter: [
        'oxfmt',
        {
          bracketSpacing: oxfmtConfig.bracketSpacing,
          printWidth: oxfmtConfig.printWidth,
          singleQuote: oxfmtConfig.singleQuote,
        },
      ],
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

    // False positives:
    // @if contributors
    rxjs: false, // `all-contributors-cli` depends on it
    // @endif
    zod: false,
  },
  // @if lychee
  extraConfigs: [
    {
      files: ['lychee.toml'],
      rules: {
        // Reports TOML `#` comments as malformed `/* */` blocks, and its autofix
        // corrupts them by inserting padding before the last character
        'stylistic/spaced-comment': 0,
        // The `#:schema` directive must not have a space after `#`
        'toml/spaced-comment': 0,
      },
    },
  ],
  // @endif
  // @if !lychee
  extraConfigs: [],
  // @endif
});
