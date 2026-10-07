import {eslintConfig} from 'eslint-config-un';
// @if oxfmt
import {GLOB_MARKDOWN_SUPPORTED_CODE_BLOCKS} from 'eslint-config-un/globs';
import oxfmtConfig from './oxfmt.config.js';
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
    // @if oxfmt
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
    // @endif
    markdown: {
      configSentencesPerLine: true,
      // @if oxfmt
      // `eslint-config-un` comes with Prettier, which would format code blocks too
      configFormatFencedCodeBlocks: false,
      // @endif
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
