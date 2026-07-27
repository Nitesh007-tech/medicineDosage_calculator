import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['backend/server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  alias: {
    '@backend': path.resolve(__dirname, './backend'),
    '@shared': path.resolve(__dirname, './shared'),
    '@': path.resolve(__dirname, './frontend/src')
  },
  packages: 'external'
});