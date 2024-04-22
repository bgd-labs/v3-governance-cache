import dts from 'bun-plugin-dts';

await Bun.build({
  entrypoints: [
    'src/index.ts',
    'src/adapter/localCache.ts',
    'src/adapter/noCache.ts',
    'src/adapter/githubHybrid.ts',
    'src/common/refreshCache.ts',
  ],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  sourcemap: 'external',
  plugins: [dts()],
});
