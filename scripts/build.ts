await Bun.build({
    entrypoints: ["src/adapter/localCache.ts"],
    outdir: './dist',
    target: 'node',
    format: 'esm',
    sourcemap: 'external',
});