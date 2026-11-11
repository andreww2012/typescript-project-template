import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  dts: true,
  unbundle: true,
  // @if publint
  publint: {strict: true},
  // @endif
  attw: {level: 'error'},
  exports: true,
});
