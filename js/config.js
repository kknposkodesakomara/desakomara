// Desa Ko'Mara — client bootstrap.
// URL dan publishable key diisi oleh Vercel Function /api/config dari Environment Variables.
// Untuk keamanan, jangan pernah mengirim SUPABASE_SECRET_KEY / service_role ke browser.

window.DESAKOMARA_SUPABASE_URL = window.DESAKOMARA_SUPABASE_URL || '';
window.DESAKOMARA_SUPABASE_PUBLISHABLE_KEY = window.DESAKOMARA_SUPABASE_PUBLISHABLE_KEY || '';
window.DESAKOMARA_STORAGE_BUCKET = window.DESAKOMARA_STORAGE_BUCKET || 'desa-public';

(function initSupabase() {
  const url = window.DESAKOMARA_SUPABASE_URL;
  const key = window.DESAKOMARA_SUPABASE_PUBLISHABLE_KEY;
  const configured = Boolean(url && key && /^https:\/\/.+\.supabase\.co$/.test(url));

  window.supabaseConfigured = configured;
  window.supabaseClient = null;

  if (!configured) {
    console.info('Supabase belum dikonfigurasi. Pastikan Environment Variables Vercel tersedia lewat /api/config.');
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase JS belum termuat. Pastikan CDN supabase-js dimuat sebelum js/config.js.');
    return;
  }

  window.supabaseClient = window.supabase.createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})();

function getSupabaseClient() {
  if (!window.supabaseClient) {
    throw new Error('Supabase belum siap. Isi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY di Environment Variables Vercel.');
  }
  return window.supabaseClient;
}

async function unwrapSupabase(result) {
  if (result && result.error) throw result.error;
  return result ? result.data : null;
}

function publicAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const client = window.supabaseClient;
  if (!client) return '';
  const bucket = window.DESAKOMARA_STORAGE_BUCKET || 'desa-public';
  return client.storage.from(bucket).getPublicUrl(String(path).replace(/^\/+/, '')).data.publicUrl;
}

async function uploadPublicAsset(file, folder, maxBytes = 10 * 1024 * 1024) {
  if (!(file instanceof File)) throw new Error('File yang dipilih tidak valid.');
  if (file.size > maxBytes) throw new Error(`Ukuran file melewati batas ${Math.round(maxBytes / 1024 / 1024)} MB.`);

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) throw new Error('Format file tidak didukung.');

  const client = getSupabaseClient();
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
  const unique = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${Date.now()}-${unique}-${safeName}`;
  const { data, error } = await client.storage
    .from(window.DESAKOMARA_STORAGE_BUCKET || 'desa-public')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (error) throw error;
  return data.path;
}

async function removePublicAsset(path) {
  if (!path || /^https?:\/\//i.test(path)) return;
  const client = getSupabaseClient();
  const { error } = await client.storage
    .from(window.DESAKOMARA_STORAGE_BUCKET || 'desa-public')
    .remove([String(path).replace(/^\/+/, '')]);
  if (error) throw error;
}
