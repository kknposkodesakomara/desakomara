# Menyiapkan Supabase untuk Desa Ko'Mara

Frontend situs ini tetap berupa HTML/CSS/JavaScript statis dan dapat di-host di Vercel. Data dipanggil langsung melalui `supabase-js`; backend PHP tidak diperlukan. **Jangan pernah memasukkan `service_role` / `sb_secret` ke frontend.**

## 1. Buat project dan jalankan skema

1. Buat project di Supabase.
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu jalankan.
3. Skema tersebut membuat tabel konten, tabel penduduk privat, policy RLS, fungsi statistik publik, profil admin, serta bucket Storage `desa-public`.
4. Periksa halaman **Database → Tables** dan **Storage** setelah skrip selesai.

SQL MySQL yang dikirim sebelumnya **jangan ditempel langsung** ke Supabase. `schema.sql` di folder ini adalah versi PostgreSQL yang sudah disesuaikan: `AUTO_INCREMENT` menjadi `IDENTITY`, `ENUM` menjadi teks yang divalidasi, dan perintah `CREATE DATABASE` / `USE` MySQL dihilangkan. Daftar lima dusun awal dimasukkan; enam contoh penduduk dari SQL MySQL sengaja tidak dimasukkan.

> Jangan mengubah tabel `penduduk` menjadi bisa dibaca `anon`. RLS dan grant dalam skema sengaja membatasi NIK, No. KK, alamat, tanggal lahir, serta informasi keluarga untuk admin yang aktif.

## 2. Simpan kredensial di Vercel Environment Variables

Di Supabase **Project Settings → API Keys** (atau panel **Connect**), salin **Project URL** dan **Publishable key**. Di Vercel buka **Project → Settings → Environment Variables**, tambahkan:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://PROJECT_REF.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | key `sb_publishable_...` dari Supabase |

Pilih environment yang dipakai (**Production**, dan juga **Preview/Development** jika perlu), lalu **redeploy**. Halaman akan memuat `/api/config`; Vercel Function di `api/config.js` membaca Environment Variables dan mengirim konfigurasi client ke browser. Jadi tidak perlu menempelkan key ke `js/config.js`.

Catatan penting: **Publishable key memang akan terlihat di browser** karena dipakai oleh Supabase JS. Menaruhnya di Vercel Environment Variables menjaga agar tidak tertulis di source repo, tetapi tidak menjadikannya rahasia. Keamanan data tetap bergantung pada RLS. Jangan pernah memakai `service_role` / `sb_secret` sebagai `SUPABASE_PUBLISHABLE_KEY`.

Untuk uji lokal, Live Server biasa tidak menyediakan endpoint `/api/config`. Gunakan `vercel dev` (dengan project terhubung dan Environment Variables ditarik ke lokal) agar Vercel Function ikut berjalan.

## 3. Login admin tanpa email pribadi

Panel menerima username lalu mengubahnya menjadi alias Supabase Auth default berbentuk:

```text
username@login.desa-komara.invalid
```

Kalau kamu ingin username sudah berbentuk alamat alias penuh (misalnya `nama@desa.komara.local`), login juga menerima alamat itu apa adanya. Buat user Auth dengan alamat yang **persis sama** di **Authentication → Users**, lalu tandai email sebagai terkonfirmasi di dashboard. Domain alias tersebut bukan mailbox; reset password lewat email tidak akan berfungsi. Nonaktifkan pendaftaran publik di pengaturan Auth. Trigger database menyimpan bagian sebelum `@` sebagai `profiles.username` dan membuat profil dalam keadaan **nonaktif**.

Aktifkan akun pertama (dan jadikan super admin) melalui SQL Editor. Ganti `username` sesuai username akun yang dibuat:

```sql
update public.profiles
set nama = 'Nama Admin', role = 'Super Admin', is_active = true
where username = 'username';
```

Akun aparat berikutnya dibuat di Authentication → Users dengan alias `username@login.desa-komara.invalid`, lalu diaktifkan lewat SQL, misalnya:

```sql
update public.profiles
set nama = 'Nama Aparat', role = 'Aparat', is_active = true
where username = 'username';
```

Karena alias bukan email sungguhan, fitur reset kata sandi melalui email tidak tersedia. Kata sandi dapat diganti oleh user yang sudah login di halaman **Profil**, atau di-reset oleh pengelola project lewat Supabase Dashboard. Password/hash akun MySQL lama tidak bisa dipindahkan langsung ke Supabase Auth.

## 4. Upload berita, foto, struktur, dan dokumen

Frontend menyimpan file baru ke bucket publik `desa-public`; akses baca file bersifat publik agar halaman website dapat menampilkan gambar/dokumen. Kebijakan Storage membatasi upload, perubahan, dan penghapusan hanya untuk profil admin aktif.

Untuk memindahkan file lama, upload folder media lama ke bucket `desa-public`, pertahankan path objeknya, lalu pastikan kolom `gambar`, `foto`, dan `file_path` berisi path object tersebut (contoh: `berita/nama-file.jpg`). Jangan simpan kredensial hosting lama dalam metadata.

## 5. Migrasi database MySQL lama

Repo yang di-clone tidak berisi backend PHP, dump database, maupun folder `uploads`; ia hanya berisi frontend yang sebelumnya memanggil endpoint PHP. Skema PostgreSQL awal dibuat mengikuti field yang dipakai form HTML.

SQL yang dikirim mencakup `dusun`, `penduduk`, `aparat`, `saran`, `berita`, `pengumuman`, dan `galeri`. Frontend repo saat ini juga memiliki halaman dokumen, profil/informasi desa, geografi, sejarah, dan struktur; tabel kosongnya disiapkan di `schema.sql`, tetapi definisi/data MySQL untuk bagian itu tidak ada pada SQL yang dikirim. Jika tabel-tabel tersebut ada di phpMyAdmin, ekspor strukturnya juga agar pemetaan lengkap.

Untuk migrasi data lama, cocokkan kolom/tabel MySQL dengan `schema.sql`. Cara aman untuk mulai memetakan adalah mengekspor **struktur saja** dari phpMyAdmin (tanpa baris `INSERT`), atau mengirim daftar kolom dan contoh yang sudah disamarkan. Data NIK/No. KK/alamat/tanggal lahir adalah data pribadi—jangan unggah dump berisi data warga ke chat. Setelah pemetaan selesai, data dapat diimpor langsung ke Supabase Table Editor atau lewat skrip migrasi lokal.

Tabel MySQL `aparat` tidak dipakai untuk login setelah cutover. Supabase Auth menyimpan kredensialnya sendiri; password hash PHP lama tidak dipindah. Buat ulang akun Auth, lalu petakan nama/role/status ke `profiles`.

## 6. Deploy ke Vercel

1. Hubungkan repository ini ke Vercel sebagai static site.
2. Tidak perlu build command; root directory berisi `index.html`.
3. Setelah URL Supabase dan publishable key diisi di `js/config.js`, push perubahan ke GitHub agar Vercel redeploy.
4. Tes website publik, login admin, upload file, kirim saran, dan cek bahwa halaman publik tidak dapat mengakses `penduduk`/`saran`.
