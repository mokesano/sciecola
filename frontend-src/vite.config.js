import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Mengarahkan Vite untuk membaca folder public milik web root Anda saat development
  publicDir: '../public',

  // Base URL agar path asset di dalam CSS/JS tidak rusak saat production.
  // WAJIB sama dengan nama folder di bagian outDir bawah.
  base: '/assets/sicola-ui/',

  // Konfigurasi Build (Kompilasi)
  build: {
    // 1. Arahkan output folder ke sub-folder khusus di dalam assets agar aset asli PHP aman
    outDir: '../public/assets/sicola-ui',
    
    // 2. Kosongkan folder build lama setiap kali melakukan build baru
    emptyOutDir: true,
    
    // 3. Rollup Options: Mematikan sistem "hashing" nama file
    // Ini SANGAT PENTING agar nama file selalu statis, 
    // sehingga Anda tidak perlu bolak-balik mengubah link di file PHP setiap kali build.
    rollupOptions: {
      output: {
        // File utama Javascript akan menjadi: sicola-app.js
        entryFileNames: 'sicola-app.js',
        
        // File CSS dan aset lainnya akan menjadi: sicola-app.css, dsb.
        assetFileNames: 'sicola-app.[ext]',
        
        // File pecahan (jika ada) akan menjadi: sicola-app-chunk.js
        chunkFileNames: 'sicola-app-chunk.js',
      }
    }
  }
})