import type {CSpellSettings} from 'cspell';

const GLOBALLY_IGNORED_WORDS = {
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
} satisfies Record<string, string[]>;

export default {
  useGitignore: true,
  enableGlobDot: true,
  // @if contributors
  ignorePaths: [
    '**/.gitignore',
    '**/.git/**',
    '**/pnpm-lock.yaml',
    'patches/**',
    '.all-contributorsrc',
  ],
  // @endif
  // @if !contributors
  ignorePaths: ['**/.gitignore', '**/.git/**', '**/pnpm-lock.yaml', 'patches/**'],
  // @endif
  dictionaries: ['npm', 'node', 'typescript', 'fullstack'],
  words: Object.values(GLOBALLY_IGNORED_WORDS).flat(),
  overrides: [],
} satisfies CSpellSettings;
