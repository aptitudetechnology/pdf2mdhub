const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./src/index.js'],  // adjust path accordingly
  bundle: true,
  outfile: 'dist/bundle.js',
  external: ['simple-statistics', 'string-similarity', 'uuid'], // <- add this line
  sourcemap: true,
  minify: false,
  platform: 'browser',  // or 'node' if it’s backend
}).catch(() => process.exit(1));

