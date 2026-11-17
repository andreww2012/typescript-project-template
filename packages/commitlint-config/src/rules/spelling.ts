import type {AsyncRule} from '@commitlint/types';
import {allUnionMembers, arrayUnique, invariant, objectEntriesUnsafe} from 'utilery';

export type SpellingPart = 'header' | 'type' | 'scope' | 'subject' | 'body' | 'footer';

export const SPELLING_PARTS = allUnionMembers<SpellingPart, {readonly: true}>()([
  'header',
  'type',
  'scope',
  'subject',
  'body',
  'footer',
]);

type BuiltInIgnore = 'code' | 'trailers' | 'mentions' | 'issues';

export interface SpellingRuleOptions {
  /** Words to allow in commit messages, in addition to the CSpell config of the project */
  ignoreWords?: readonly string[];

  /** Regular expressions of text to skip, in addition to the built-in ones and the CSpell config */
  ignorePatterns?: readonly RegExp[];

  /**
   * Built-in patterns of text to skip: `false` turns off all of them, and an object only some of them
   * @default true
   */
  builtInIgnores?: boolean | Partial<Record<BuiltInIgnore, boolean>>;
}

// Text that CSpell would report. It already skips URLs, emails, commit hashes, etc.
const BUILT_IN_IGNORE_REGEXES: Readonly<Record<BuiltInIgnore, readonly RegExp[]>> = {
  code: [
    // Inline code, like `foo` and `` `foo` ``. It can't span lines, as otherwise a missing backtick
    // would make the spell checker skip the text up to the next code
    /(?<!`)(`+)(?!`)[^\n]+?(?<!`)\1(?!`)/gu,
    // Code blocks, which may have no closing fence
    /^[\t ]*(`{3,})[^\n`]*\n[\s\S]*?(?:^[\t ]*\1`*[\t ]*$|(?![\s\S]))/gmu,
  ],
  // Like `Co-authored-by: Name <email>` and `Signed-off-by: Name <email>`
  trailers: [/^[\w-]+-by[\t ]*:.*$/gimu],
  // GitHub mentions and scoped packages, like `@user` and `@scope/name`
  mentions: [/(?<![\w@])@[\w-]+(?:\/[\w\-.]+)?/gu],
  // Issues of other repositories, like `owner/repo#123` and `group/subgroup/repo#123`
  issues: [/(?<![\w\-./])(?:[\w\-.]+\/)+[\w\-.]+#\d+/gu],
};

const getBuiltInIgnoreRegexes = (builtInIgnores: SpellingRuleOptions['builtInIgnores'] = true) => {
  if (typeof builtInIgnores === 'boolean') {
    return builtInIgnores ? Object.values(BUILT_IN_IGNORE_REGEXES).flat() : [];
  }
  Object.keys(builtInIgnores).forEach((name) => {
    invariant(
      Object.hasOwn(BUILT_IN_IGNORE_REGEXES, name),
      `Unknown built-in ignore \`${name}\`, the known ones are: ${Object.keys(BUILT_IN_IGNORE_REGEXES).join(', ')}`,
    );
  });
  return objectEntriesUnsafe(BUILT_IN_IGNORE_REGEXES)
    .filter(([name]) => builtInIgnores[name] !== false)
    .flatMap(([, regexes]) => regexes);
};

// Without the `g` flag, CSpell only skips the first match
const toGlobalRegex = (regex: RegExp) =>
  regex.global ? regex : new RegExp(regex, `${regex.flags}g`);

export const createSpellingRule =
  (part: SpellingPart): AsyncRule<SpellingRuleOptions> =>
  async (commit, _when, {ignoreWords = [], ignorePatterns = [], builtInIgnores} = {}) => {
    const ignoreRegexes = [
      ...getBuiltInIgnoreRegexes(builtInIgnores),
      ...ignorePatterns.map(toGlobalRegex),
    ];
    const text = commit[part];
    if (!text) {
      return [true];
    }

    // The parser may start the footer in a code block of the body, at a line like `key: value`.
    // With the body before it, the code block is skipped as a whole
    const textBefore = part === 'footer' && commit.body ? `${commit.body}\n` : '';
    const {spellCheckDocument} = await import('cspell-lib');
    const {issues} = await spellCheckDocument(
      {
        // With an empty URI, CSpell looks for its config in the current directory
        uri: '',
        text: textBefore + text,
        languageId: 'plaintext',
      },
      {generateSuggestions: false},
      {ignoreWords: [...ignoreWords], ignoreRegExpList: ignoreRegexes},
    );
    const words = issues
      .filter((issue) => issue.offset >= textBefore.length)
      .map((issue) => issue.text);
    return [words.length === 0, `unknown words in ${part}: ${arrayUnique(words).join(', ')}`];
  };
