import {cspellConfig} from '@andreww2012/cspell-config';

export default cspellConfig({
  cwd: import.meta.dirname,
  ignorePaths: ['template/', '.agents/guidelines.md', '**/CHANGELOG.md'],
  words: {
    names: ['andreww', 'unutils', 'utilery', 'verkit'],
    aiTools: [
      'bito',
      'coderabbit',
      'coderabbitai',
      'greptile',
      'junie',
      'kiro',
      'opencode',
      'openhands',
      'qodo',
      'qwen',
      'roomote',
      'trae',
    ],
    misc: ['knipignore', 'ncurc'],
    englishIshWords: [],
  },
});
