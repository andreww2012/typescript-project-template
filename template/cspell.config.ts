import type {CSpellSettings} from 'cspell';

const GLOBALLY_IGNORED_WORDS: Record<string, string[]> = {
  // @if unutils
  names: ['andreww', 'unutils', 'verkit'],
  // @endif
  // @if !unutils
  names: ['andreww', 'verkit'],
  // @endif
  // @if lychee
  misc: ['knipignore', 'smol'],
  // @endif
  // @if !lychee
  misc: ['knipignore'],
  // @endif
  englishIshWords: [],
};

export default {
  useGitignore: true,
  enableGlobDot: true,
  ignorePaths: [
    '**/.gitignore',
    '**/.git/**',
    '**/pnpm-lock.yaml',
    'patches/**',
    '.agents/guidelines.md',
    // @if contributors
    '.all-contributorsrc',
    // @endif
  ],
  dictionaries: ['npm', 'node', 'typescript', 'fullstack'],
  words: Object.values(GLOBALLY_IGNORED_WORDS).flat(),
  overrides: [],
} satisfies CSpellSettings;
