import {eslintConfig} from 'eslint-config-un';

export default eslintConfig({
  // typeInfoRules: {
  //   allowDefaultProject: ['*.config.*ts'],
  // },
  // defaultConfigsStatus: 'misc-enabled',
  configs: {
    fileProgress: true,
    markdown: {
      configSentencesPerLine: true,
    },
    // noStylisticRules: true,
    // noStylisticRules: {
    //   enableRules: {
    //     rules: true,
    //     disableAllOtherRules: true,
    //   },
    // },
    sonar: true,
    // ts: {
    //   configDisableNoUnsafe: true,
    //   configNoTypeAssertion: true,
    //   overrides: {
    //     'ts/no-explicit-any': 0,
    //   },
    // },

    // False positives:
    // youDontNeedLodashUnderscore: false, // cspell:disable-line
    zod: false,
  },
  extraConfigs: [],
});
