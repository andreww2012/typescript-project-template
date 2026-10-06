import type {UserConfig} from '@commitlint/types';

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [0],
    'footer-leading-blank': [2, 'always'],
    'header-max-length': [2, 'always', 120],
    'subject-full-stop': [0], // Sometimes full stop is used for shorthands
    // `sentence-case`, `start-case` sometimes useful if commit message starts with a proper name
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
  },
} satisfies UserConfig;
