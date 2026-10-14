// Data layer galeri — foto disimpan di Supabase Storage.
async function getGaleriList(limit = 100) {
  const { data, error } = await getSupabaseClient().from('galeri')
    .select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

async function saveGaleri(formData) {
  const client = getSupabaseClient();
  const file = formData.get('gambar');
  if (!(file instanceof File) || !file.size) throw new Error('Pilih foto terlebih dahulu.');
  const path = await uploadPublicAsset(file, 'galeri', 5 * 1024 * 1024);
  const { data, error } = await client.from('galeri').insert({
    judul: String(formData.get('judul') || '').trim(),
    gambar: path,
  }).select().single();
  if (error) {
    await removePublicAsset(path).catch(() => {});
    throw error;
  }
  return data;
}

async function deleteGaleri(id) {
  const client = getSupabaseClient();
  const { data: row, error: readError } = await client.from('galeri').select('gambar').eq('id', id).single();
  if (readError) throw readError;
  const { error } = await client.from('galeri').delete().eq('id', id);
  if (error) throw error;
  if (row.gambar) await removePublicAsset(row.gambar).catch(console.warn);
  return { message: 'Foto berhasil dihapus.' };
}

function urlGambar(path) {
  return publicAssetUrl(path);
}
