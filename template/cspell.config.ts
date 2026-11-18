import {cspellConfig} from '@andreww2012/cspell-config';

const GLOBALLY_IGNORED_WORDS: Readonly<Record<string, string[]>> = {
  // @if utilery
  names: ['andreww', 'utilery'],
  // @endif
  // @if !utilery
  names: ['andreww'],
  // @endif
  // @if lychee
  misc: ['knipignore', 'smol'],
  // @endif
  // @if !lychee
  misc: ['knipignore'],
  // @endif
  englishIshWords: [],
};

export default cspellConfig({
  cwd: import.meta.dirname,
  // @if local-guidelines
  // @if contributors
  ignorePaths: ['.agents/guidelines.md', '.all-contributorsrc'],
  // @endif
  // @if !contributors
  ignorePaths: ['.agents/guidelines.md'],
  // @endif
  // @endif
  // @if !local-guidelines
  // @if contributors
  ignorePaths: ['.all-contributorsrc'],
  // @endif
  // @endif
  words: GLOBALLY_IGNORED_WORDS,
  overrides: [],
});
