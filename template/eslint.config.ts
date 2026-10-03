import {eslintConfig} from 'eslint-config-un';
// @if oxfmt
import {
  GLOB_JS_TS_X_EXTENSION,
  GLOB_MARKDOWN,
  GLOB_YML_YAML_EXTENSION,
} from 'eslint-config-un/globs';
import oxfmtConfig from './oxfmt.config.js';
// @endif

export default eslintConfig({
  // @if changesets
  ignores: ['.agents/style-guide.md', 'CHANGELOG.md'],
  // @endif
  // @if !changesets
  ignores: ['.agents/style-guide.md'],
  // @endif
  // @if lib
  mode: 'lib',
  // @endif
  // typeInfoRules: {
  //   allowDefaultProject: ['*.config.*ts'],
  // },
  defaultConfigsStatus: 'misc-enabled',
  configs: {
    fileProgress: true,
    // @if oxfmt
    format: {
      files: [
        // TODO replace with `GLOB_MARKDOWN_SUPPORTED_CODE_BLOCKS` from eslint-config-un once it's exported
        `${GLOB_MARKDOWN}/**/*.{${GLOB_JS_TS_X_EXTENSION},json,jsonc,json5,${GLOB_YML_YAML_EXTENSION}}`,
      ],
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
      // @if changesets
      configSentencesPerLine: {
        // Putting every sentence on its own line causes line wraps in the changelog
        ignores: ['.changeset/**/*.md'],
      },
      // @endif
      // @if !changesets
      configSentencesPerLine: true,
      // @endif
    },
    // @if oxfmt
    noPrettierIncompatibleRules: true,
    // @endif
    sonar: true,

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
