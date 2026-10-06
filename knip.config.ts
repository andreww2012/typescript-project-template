import type {KnipConfig} from 'knip';

export default {
  workspaces: {
    '.': {
      entry: ['.ncurc.js'],
      ignore: ['template/**'],
    },
  },
  tags: ['-knipignore'],
  treatConfigHintsAsErrors: true,
} satisfies KnipConfig;
