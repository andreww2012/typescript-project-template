import type {SyncRule} from '@commitlint/types';
import {invariant, mapValues, regexEscape} from 'utilery';

/**
 * Emails that AI tools put in `Co-authored-by` trailers.
 * GitHub accounts of AI review bots get there when their suggestions are applied in pull requests
 */
const AI_CO_AUTHOR_EMAILS = {
  aider: ['aider@aider.chat', 'noreply@aider.chat'],
  amp: ['amp@ampcode.com'],
  augment: ['noreply@augmentcode.com'],
  bito: ['bito-code-review[bot]@users.noreply.github.com'],
  claude: ['claude[bot]@users.noreply.github.com', 'noreply@anthropic.com'],
  cline: ['cline-cloud[bot]@users.noreply.github.com', 'noreply@cline.bot'],
  codex: [
    'chatgpt-codex-connector[bot]@users.noreply.github.com',
    'codex@openai.com',
    'noreply@openai.com',
  ],
  coderabbit: ['coderabbitai[bot]@users.noreply.github.com'],
  continue: ['noreply@continue.dev'],
  copilot: [
    'copilot@github.com',
    'Copilot@users.noreply.github.com',
    'github-advanced-security[bot]@users.noreply.github.com', // Copilot Autofix
  ],
  crush: ['crush@charm.land'],
  cursor: ['cursor[bot]@users.noreply.github.com', 'cursoragent@cursor.com'],
  devin: [
    'devin-ai-integration[bot]@users.noreply.github.com',
    'cascade@windsurf.ai', // Windsurf, which is now Devin Desktop
    'noreply@windsurf.com',
    'windsurf-bot[bot]@users.noreply.github.com',
  ],
  ellipsis: ['ellipsis-dev[bot]@users.noreply.github.com'],
  factory: [
    'droid@factory.ai',
    'factory-droid[bot]@users.noreply.github.com',
    'noreply@factory.ai',
  ],
  gemini: ['gemini-code-assist[bot]@users.noreply.github.com', 'noreply@google.com'],
  goose: ['goose@aaif.dev', 'goose@block.xyz', 'noreply@goose-docs.ai'],
  greptile: ['greptile-apps[bot]@users.noreply.github.com'],
  jules: ['google-labs-jules[bot]@users.noreply.github.com'],
  junie: ['junie@jetbrains.com'],
  kilo: ['agent@kilocode.ai', 'kilo-code-bot[bot]@users.noreply.github.com', 'noreply@kilo.ai'],
  kiro: ['noreply@kiro.dev'],
  opencode: ['noreply@opencode.ai', 'opencode-agent[bot]@users.noreply.github.com'],
  openhands: ['openhands@all-hands.dev'],
  qodo: ['qodo-code-review[bot]@users.noreply.github.com'],
  qwen: ['qwen-coder@alibabacloud.com'],
  roomote: ['roomote@roocode.com', 'roomote[bot]@users.noreply.github.com'],
  trae: ['noreply@bytedance.com', 'traecli@bytedance.com'],
  warp: ['agent@warp.dev', 'oz-agent@warp.dev'],
} as const satisfies Record<string, string[]>;

type CoAuthorPattern = RegExp | 'ai' | keyof typeof AI_CO_AUTHOR_EMAILS;

export interface CoAuthorsOptions {
  /**
   * Co-authors to forbid, all of them by default.
   * Regular expressions are matched against trailer values, like `Name <email>`.
   * Presets match the emails of AI tools, like `'claude'`, and `'ai'` matches all of them
   */
  deny?: readonly CoAuthorPattern[];

  /** Co-authors to allow even if they match `deny`, in the same format */
  allow?: readonly CoAuthorPattern[];
}

// Git also allows whitespace before the colon
const CO_AUTHORED_BY_REGEX = /^co-authored-by[\t ]*:(.*)$/gimu;

// GitHub accounts have emails like `<id>+<name>@users.noreply.github.com`
const createCoAuthorEmailsRegex = (emails: readonly string[]) =>
  new RegExp(String.raw`<(?:\d+\+)?(?:${emails.map(regexEscape).join('|')})>$`, 'iu');

const CO_AUTHOR_PRESETS: ReadonlyMap<string, RegExp> = new Map(
  Object.entries(
    mapValues(
      {ai: Object.values(AI_CO_AUTHOR_EMAILS).flat(), ...AI_CO_AUTHOR_EMAILS},
      createCoAuthorEmailsRegex,
    ),
  ),
);

const createCoAuthorMatcher = (patterns: readonly CoAuthorPattern[]) => {
  const regexes = patterns.map((pattern) => {
    if (typeof pattern === 'string') {
      const regex = CO_AUTHOR_PRESETS.get(pattern);
      invariant(
        regex,
        `Unknown co-author preset \`${pattern}\`, the known ones are: ${[...CO_AUTHOR_PRESETS.keys()].join(', ')}`,
      );
      return regex;
    }
    return pattern;
  });
  // Unlike `test`, `search` doesn't depend on `lastIndex` of patterns with the `g` flag
  return (coAuthor: string) => regexes.some((regex) => coAuthor.search(regex) !== -1);
};

export const coAuthoredByRule: SyncRule<CoAuthorsOptions> = (
  {body, footer},
  _when,
  {deny, allow = []} = {},
) => {
  const isDenied = deny ? createCoAuthorMatcher(deny) : () => true;
  const isAllowed = createCoAuthorMatcher(allow);
  const coAuthors = Array.from(
    [body, footer].join('\n').matchAll(CO_AUTHORED_BY_REGEX),
    ([, coAuthor = '']) => coAuthor.trim(),
  ).filter((coAuthor) => isDenied(coAuthor) && !isAllowed(coAuthor));
  return [coAuthors.length === 0, `co-authors are not allowed: ${coAuthors.join(', ')}`];
};
