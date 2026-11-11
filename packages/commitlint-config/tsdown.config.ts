import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  dts: true,
  unbundle: true,
  publint: {strict: true},
  attw: {level: 'error'},
  deps: {
    onlyBundle: ['utilery'],
  },
});
