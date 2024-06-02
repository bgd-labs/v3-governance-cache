import dts from 'bun-plugin-dts';

await Bun.build({
  entrypoints: [
    'src/index.ts',
    'src/providers/customStorageProvider.ts',
    'src/providers/storage/fileSystem.ts',
    'src/providers/rpcProvider.ts',
    'src/providers/fallbackProvider.ts',
    'src/providers/githubPagesProvider.ts',
    'src/common/refreshCache.ts',
  ],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  sourcemap: 'external',
  plugins: [dts()],
});
