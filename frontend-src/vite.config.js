import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';

export default defineConfig(({ command }) => ({
  plugins: [
    mdx({ remarkPlugins: [remarkGfm, remarkFrontmatter] }),
    react(),
  ],

  publicDir: '../public',

  base: command === 'build' ? '/assets/sicola-ui/' : '/',

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },

  build: {
    outDir: '../public/assets/sicola-ui',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'sicola-app.js',
        assetFileNames: 'sicola-app.[ext]',
        chunkFileNames: 'sicola-app-chunk.js',
      },
    },
  },
}));
