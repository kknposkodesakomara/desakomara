// Data layer berita — Postgres + Supabase Storage.
async function getBeritaList(limit = 50) {
  const { data, error } = await getSupabaseClient().from('berita')
    .select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

async function saveBerita(formData, isUpdate = false) {
  const client = getSupabaseClient();
  const id = formData.get('id');
  const record = {
    judul: String(formData.get('judul') || '').trim(),
    isi: String(formData.get('isi') || '').trim(),
    updated_at: new Date().toISOString(),
  };
  const file = formData.get('gambar');
  let oldPath = null;
  let newPath = null;

  if (id && file instanceof File && file.size) {
    const { data, error } = await client.from('berita').select('gambar').eq('id', id).single();
    if (error) throw error;
    oldPath = data.gambar;
  }
  if (file instanceof File && file.size) {
    newPath = await uploadPublicAsset(file, 'berita', 5 * 1024 * 1024);
    record.gambar = newPath;
  }

  const result = id
    ? await client.from('berita').update(record).eq('id', id).select().single()
    : await client.from('berita').insert(record).select().single();
  if (result.error) {
    if (newPath) await removePublicAsset(newPath).catch(() => {});
    throw result.error;
  }
  if (oldPath && newPath && oldPath !== newPath) await removePublicAsset(oldPath).catch(console.warn);
  return result.data;
}

async function deleteBerita(id) {
  const client = getSupabaseClient();
  const { data: row, error: readError } = await client.from('berita').select('gambar').eq('id', id).single();
  if (readError) throw readError;
  const { error } = await client.from('berita').delete().eq('id', id);
  if (error) throw error;
  if (row.gambar) await removePublicAsset(row.gambar).catch(console.warn);
  return { message: 'Berita berhasil dihapus.' };
}

function urlGambar(path) {
  return publicAssetUrl(path);
}
