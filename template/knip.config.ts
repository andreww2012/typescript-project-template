import type {KnipConfig} from 'knip';

export default {
  // @if ncu
  entry: ['.ncurc.js'], // cspell:disable-line
  // @endif
  ignoreDependencies: [
    // Not used yet, but handy for scripts
    'cross-env',
    // @if !lib
    'tsx',
    // @endif
    // @if unutils
    // Nothing uses it until the first code is written
    '@andreww2012/unutils',
    // @endif
    // @if lychee
    // Only passed to lychee in CI
    'lychee-config-nick2bad4u',
    // @endif
  ],
  tags: ['-knipignore'],
  treatConfigHintsAsErrors: true,
} satisfies KnipConfig;
