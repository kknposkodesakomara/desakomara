# Website Desa Ko'Mara

Situs statis HTML/CSS/JavaScript untuk deploy ke Vercel. Backend data menggunakan Supabase (Postgres, Auth, Storage); tidak memerlukan PHP.

## Mulai

1. Jalankan `supabase/schema.sql` di Supabase SQL Editor.
2. Tambahkan `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` di Vercel Project Settings → Environment Variables.
3. Ikuti `supabase/SETUP.md` untuk membuat/aktivasi user admin dan kebijakan keamanan.
4. Deploy ke Vercel. Untuk menjalankan Vercel Function `/api/config` secara lokal, gunakan `vercel dev`; Live Server biasa tidak menjalankan Function.

**Jangan pernah menaruh `service_role` / `sb_secret` di frontend.** Tabel penduduk berisi data pribadi dan hanya bisa diakses user aktif yang lolos RLS. Public key bukan pengganti RLS.
