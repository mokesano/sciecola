# Panduan Komprehensif: Menjalankan, Mengatur, dan Menghentikan Localhost (Vite/React) di VSCode

Panduan ini mencakup langkah-langkah mulai dari membuka terminal, menjalankan *development server* dengan berbagai opsi tambahan, cara melihat hasilnya, hingga cara menghentikan server dengan aman.

## 1. Persiapan: Akses Terminal & Direktori

Sebelum menjalankan perintah apa pun, pastikan Anda berada di dalam folder yang benar (yaitu folder tempat aplikasi React Anda berada).

1. Buka Terminal terintegrasi di VSCode dengan menekan:
   - **Windows/Linux**: `` Ctrl + ` `` (tombol *backtick*, di bawah tombol Esc)
   - **Mac**: `` Cmd + ` ``
   - Atau dari menu atas: **Terminal > New Terminal**
2. Ketik perintah berikut untuk masuk ke folder frontend, lalu tekan **Enter**:
   ```bash
   cd frontend-src
   ```

## 2. Menjalankan Server Vite (Berbagai Opsi)

Setelah berada di dalam folder `frontend-src`, Anda bisa menyalakan server. Gunakan perintah standar atau tambahkan opsi ("flags") sesuai kebutuhan Anda saat itu.

**Opsi A: Menjalankan Server Standar**
Ini adalah cara paling umum. Server akan berjalan di port *default* (biasanya `5173`) secara diam-diam di latar belakang.
```bash
npm run dev
```

**Opsi B: Menjalankan & Otomatis Membuka Browser**
Gunakan opsi ini jika Anda ingin *browser* (seperti Chrome/Edge) langsung terbuka otomatis begitu server menyala.
```bash
npm run dev -- --open
```

**Opsi C: Menjalankan di Port Spesifik**
Jika port `5173` sedang digunakan oleh aplikasi lain, atau Anda butuh port khusus (misalnya `3000`), gunakan opsi ini:
```bash
npm run dev -- --port 3000
```

**Opsi D: Membuka Akses ke Jaringan Lokal (Network)**
Gunakan opsi ini jika Anda ingin membuka *website* tersebut di HP Anda (untuk tes tampilan *mobile*) asalkan HP dan laptop tersambung ke WiFi yang sama.
```bash
npm run dev -- --host
```
*(Terminal akan menampilkan IP Address lokal Anda, contoh: `[http://192.168.1.5:5173/](http://192.168.1.5:5173/)`. Ketikkan alamat itu di browser HP).*

## 3. Menampilkan Preview Visual

Setelah server berjalan (ditandai dengan munculnya teks hijau berisi URL di terminal), Anda punya dua cara untuk melihat hasilnya:

**Cara 1: Di Browser Eksternal (Chrome/Edge/Firefox)**
- Arahkan kursor tetikus (mouse) ke tulisan `http://localhost:5173/` di terminal.
- Tahan tombol **`Ctrl`** (atau **`Cmd`** di Mac), lalu **Klik Kiri** URL tersebut.

**Cara 2: Di Dalam Tab VSCode (Split Screen / Simple Browser)**
- Tekan **`Ctrl + Shift + P`** (Windows) atau **`Cmd + Shift + P`** (Mac).
- Ketik **`Simple Browser: Show`** dan tekan **Enter**.
- Masukkan alamat `http://localhost:5173/` dan tekan **Enter**.
- Tab *preview* akan muncul, lalu geser tab tersebut ke samping agar bisa berdampingan dengan kode.

## 4. Mengakhiri / Mematikan Server (Quit)

Sangat penting untuk mematikan server jika Anda sudah selesai bekerja agar port tidak terus-menerus terpakai dan membuat RAM laptop penuh.

1. Klik di dalam area **Terminal** VSCode Anda.
2. Tekan kombinasi tombol:
   **`Ctrl + C`**
3. Jika muncul pertanyaan konfirmasi di terminal `Terminate batch job (Y/N)?`, ketik huruf **`Y`** lalu tekan **Enter**.
4. Server sudah mati. Jika Anda me-*refresh* browser, halaman akan menampilkan error *Site can't be reached*.
```