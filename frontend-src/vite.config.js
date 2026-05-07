import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Perhatikan penambahan ({ command }) di baris ini
export default defineConfig(({ command }) => ({
  plugins: [react()],
  
  publicDir: '../public',

  // BASE DINAMIS: Penyelamat localhost Anda
  base: command === 'build' ? '/assets/sicola-ui/' : '/',

  build: {
    outDir: '../public/assets/sicola-ui',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'sicola-app.js',
        assetFileNames: 'sicola-app.[ext]',
        chunkFileNames: 'sicola-app-chunk.js',
      }
    }
  }
}))