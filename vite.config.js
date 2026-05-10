import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup'; 

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), mdx()],
  
  // 1. KUNCI UTAMA: Beri tahu Vite bahwa source code React ada di folder ini
  root: 'frontend-src',

  // 2. Beri tahu Vite di mana folder aset publik asli Anda berada (naik 1 level dari frontend-src)
  publicDir: '../public',

  // 3. Base path dinamis (Root untuk dev, sub-folder untuk production PHP)
  base: command === 'build' ? '/assets/sicola-ui/' : '/',

  build: {
    // 4. Output diarahkan melompat keluar dari frontend-src, masuk ke folder public
    outDir: '../public/assets/sicola-ui',
    emptyOutDir: true,
    
    // Matikan hashing agar PHP mudah memanggilnya
    rollupOptions: {
      output: {
        entryFileNames: 'sicola-app.js',
        assetFileNames: 'sicola-app.[ext]',
        chunkFileNames: 'sicola-app-chunk.js',
      }
    }
  },
  // ← Tambahkan resolve extensions untuk MDX
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mdx', '.md'],
  },
}));