// Data layer profil aparat. User Auth dibuat melalui Supabase Dashboard;
// pengelolaan role/status dilindungi policy khusus Super Admin.
async function gantiPasswordSendiri(passwordLama, passwordBaru) {
  const client = getSupabaseClient();
  const { data: userResult, error: userError } = await client.auth.getUser();
  if (userError || !userResult.user) throw new Error('Sesi login sudah berakhir. Silakan login kembali.');
  const user = userResult.user;
  const { error: verifyError } = await client.auth.signInWithPassword({
    email: user.email,
    password: passwordLama,
  });
  if (verifyError) throw new Error('Kata sandi lama tidak sesuai.');
  const { error } = await client.auth.updateUser({ password: passwordBaru });
  if (error) throw error;
  return { message: 'Kata sandi berhasil diganti.' };
}

async function getDaftarAparat() {
  const { data, error } = await getSupabaseClient().from('profiles')
    .select('id, username, nama, role, is_active, created_at')
    .order('nama', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function tambahAparat() {
  throw new Error('Buat user baru melalui Supabase Dashboard > Authentication > Users, lalu aktifkan profilnya.');
}

async function toggleAktifAparat(id, aktif) {
  const { error } = await getSupabaseClient().from('profiles')
    .update({ is_active: Boolean(aktif) }).eq('id', id);
  if (error) throw error;
}
