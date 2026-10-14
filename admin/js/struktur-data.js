// Data layer struktur organisasi — foto disimpan di Supabase Storage.
async function getStrukturList() {
  const { data, error } = await getSupabaseClient().from('struktur')
    .select('*').order('level', { ascending: true }).order('urutan', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function saveStruktur(formData, isUpdate = false) {
  const client = getSupabaseClient();
  const id = formData.get('id');
  const file = formData.get('foto');
  const payload = {
    jabatan: String(formData.get('jabatan') || '').trim(),
    nama: String(formData.get('nama') || '').trim(),
    level: Number(formData.get('level') || 1),
    urutan: Number(formData.get('urutan') || 0),
  };
  let oldPath = null;
  let newPath = null;
  if (id && file instanceof File && file.size) {
    const { data, error } = await client.from('struktur').select('foto').eq('id', id).single();
    if (error) throw error;
    oldPath = data.foto;
  }
  if (file instanceof File && file.size) {
    newPath = await uploadPublicAsset(file, 'struktur', 5 * 1024 * 1024);
    payload.foto = newPath;
  }
  const result = id
    ? await client.from('struktur').update(payload).eq('id', id).select().single()
    : await client.from('struktur').insert(payload).select().single();
  if (result.error) {
    if (newPath) await removePublicAsset(newPath).catch(() => {});
    throw result.error;
  }
  if (oldPath && newPath && oldPath !== newPath) await removePublicAsset(oldPath).catch(console.warn);
  return result.data;
}

async function deleteStruktur(id) {
  const client = getSupabaseClient();
  const { data: row, error: readError } = await client.from('struktur').select('foto').eq('id', id).single();
  if (readError) throw readError;
  const { error } = await client.from('struktur').delete().eq('id', id);
  if (error) throw error;
  if (row.foto) await removePublicAsset(row.foto).catch(console.warn);
  return { message: 'Data struktur berhasil dihapus.' };
}

function urlFotoStruktur(path) {
  return publicAssetUrl(path);
}
