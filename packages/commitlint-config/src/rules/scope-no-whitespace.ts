import type {SyncRule} from '@commitlint/types';

const WHITESPACE_REGEX = /\s/u;

export const scopeNoWhitespaceRule: SyncRule = ({scope}) => [
  scope == null || !WHITESPACE_REGEX.test(scope),
  'scopes must be separated with `,` only, without spaces',
];
