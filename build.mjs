import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    'lib/index.js',
    'lib/main.js',
    'lib/console.js',
    'lib/div.js',
    'lib/http.js',
    'lib/ui.js',
    'lib/worker.js',
  ],
  bundle: false,
  format: 'esm',
  target: 'es2018',
  outdir: 'dist',
  logLevel: 'info',
})
