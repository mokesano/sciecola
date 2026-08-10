import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';

// Deployment target is controlled by DEPLOY_TARGET at build time.
// - 'php' (default): built app is served under /app/ alongside the PHP entry
//   point in public/. Matches the existing on-prem hosting layout.
// - 'cloudflare': built app is served from the site root. Use this when
//   uploading the build output to Cloudflare Pages or any static host that
//   serves the app at /. Set `DEPLOY_TARGET=cloudflare` (or VITE_BASE=/) in
//   the Cloudflare Pages build env.
const deployTarget = (process.env.DEPLOY_TARGET || 'php').toLowerCase();
const explicitBase = process.env.VITE_BASE;
const buildBase    = explicitBase || (deployTarget === 'cloudflare' ? '/' : '/app/');

export default defineConfig(({ command }) => ({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    css: false,
  },
  plugins: [
    mdx({ remarkPlugins: [remarkGfm, remarkFrontmatter] }),
    react(),
  ],

  publicDir: command === 'build' ? false : '../public',

  base: command === 'build' ? buildBase : '/',

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },

  build: {
    outDir: '../public/app',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'sciecola-app.js',
        assetFileNames: 'sciecola-app.[ext]',
        chunkFileNames: 'sciecola-app-chunk.js',
      },
    },
  },
}));
