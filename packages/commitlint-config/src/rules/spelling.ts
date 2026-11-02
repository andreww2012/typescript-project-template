import type {AsyncRule} from '@commitlint/types';
import {allUnionMembers, arrayUnique} from 'utilery';

export type SpellingPart = 'header' | 'type' | 'scope' | 'subject' | 'body' | 'footer';

export const SPELLING_PARTS = allUnionMembers<SpellingPart, {readonly: true}>()([
  'header',
  'type',
  'scope',
  'subject',
  'body',
  'footer',
]);

// Words to ignore are passed as the rule value
export const createSpellingRule =
  (part: SpellingPart): AsyncRule<readonly string[]> =>
  async (commit, _when, ignoreWords = []) => {
    const text = commit[part];
    if (!text) {
      return [true];
    }

    const {spellCheckDocument} = await import('cspell-lib');
    const {issues} = await spellCheckDocument(
      {
        // With an empty URI, CSpell looks for its config in the current directory
        uri: '',
        text,
        languageId: 'plaintext',
      },
      {generateSuggestions: false},
      {ignoreWords: [...ignoreWords]},
    );
    return [
      issues.length === 0,
      `unknown words in ${part}: ${arrayUnique(issues.map((issue) => issue.text)).join(', ')}`,
    ];
  };
