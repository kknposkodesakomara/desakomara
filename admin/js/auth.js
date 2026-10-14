// Autentikasi Supabase Auth untuk panel admin.
// Username dipetakan ke alias email non-deliverable; tidak ada email pribadi.
const AUTH_ALIAS_DOMAIN = 'login.desa-komara.invalid';

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function usernameToAuthEmail(username) {
  const value = normalizeUsername(username);
  if (value.includes('@')) return value;
  if (!/^[a-z0-9._-]{1,50}$/.test(value)) {
    throw new Error('Username hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.');
  }
  return `${value}@${AUTH_ALIAS_DOMAIN}`;
}

async function readCurrentProfile(userId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('profiles')
    .select('id, username, nama, role, is_active')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function sessionFromProfile(profile) {
  return {
    id: profile.id,
    username: profile.username,
    nama: profile.nama || profile.username || 'Admin',
    role: profile.role || 'Aparat',
  };
}

async function login(username, password) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: usernameToAuthEmail(username),
      password,
    });
    if (error) throw error;

    const profile = await readCurrentProfile(data.user.id);
    if (!profile || !profile.is_active) {
      await client.auth.signOut();
      throw new Error('Akun ini belum diaktifkan. Hubungi Super Admin desa.');
    }
    return { ok: true, user: sessionFromProfile(profile) };
  } catch (err) {
    return { ok: false, message: err.message || 'Login gagal. Periksa username dan kata sandi.' };
  }
}

async function logout() {
  try {
    if (window.supabaseClient) await window.supabaseClient.auth.signOut();
  } finally {
    window.location.href = 'login.html';
  }
}

async function getSession() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return null;

    const profile = await readCurrentProfile(data.session.user.id);
    if (!profile || !profile.is_active) {
      await client.auth.signOut();
      return null;
    }
    return sessionFromProfile(profile);
  } catch {
    return null;
  }
}

async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

function initials(name) {
  return String(name || 'A').split(' ').filter(Boolean).slice(0, 2)
    .map(word => word[0].toUpperCase()).join('');
}
