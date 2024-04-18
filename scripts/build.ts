import dts from 'bun-plugin-dts';

await Bun.build({
  entrypoints: ['src/types.ts', 'src/adapter/localCache.ts', 'src/common/refreshCache.ts'],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  sourcemap: 'external',
  plugins: [dts()],
});
