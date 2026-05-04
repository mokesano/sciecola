import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Mengarahkan Vite untuk membaca folder public milik web root Anda
  publicDir: '../public',
})