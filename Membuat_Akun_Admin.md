## Cara membuat akun admin tanpa instalasi

Aplikasi ini memang tidak punya halaman instalasi. Ada tiga cara, pilih salah satu:

1. **Lewat `.env` (paling mudah, tanpa terminal).**
   - Buka cPanel → File Manager, edit `.env`, lalu isi `ADMIN_EMAILS=email.anda@umrah.ac.id`.
   - Daftar di situs dengan email itu dan verifikasi emailnya. Akun Anda langsung berperan admin.
   - Untuk beberapa admin, pisahkan emailnya dengan koma.
   - Syaratnya pengiriman email sudah berjalan (`MAIL_DRIVER=smtp`).
2. **Lewat Terminal cPanel** (alat baru `tools/make-admin.php`):
   ```
   cd ~/sdgs-mapper
   php tools/make-admin.php promote email.anda@umrah.ac.id
   php tools/make-admin.php create email.anda@umrah.ac.id "Nama Anda"
   php tools/make-admin.php list
   ```
   - `promote` menjadikan akun yang sudah terdaftar sebagai admin.
   - `create` membuat akun admin baru tanpa verifikasi email. Kata sandi diminta langsung di terminal.
   - Alat ini hanya bisa dijalankan dari terminal, tidak bisa dari browser.
3. **Lewat phpMyAdmin:** daftar dulu di situs, lalu jalankan:
   ```sql
   UPDATE user_accounts SET role='admin', email_verified=1 WHERE email='email.anda@umrah.ac.id';
   ```

Setelah itu, admin pertama bisa mengangkat admin lain dari **Admin → Manajemen Pengguna → Jadikan admin**.