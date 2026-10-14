// Data layer dokumen desa — file PDF disimpan di Supabase Storage.
async function getDokumenList() {
  const { data, error } = await getSupabaseClient().from('dokumen')
    .select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function saveDokumen(formData, isUpdate = false) {
  const client = getSupabaseClient();
  const id = formData.get('id');
  const file = formData.get('file');
  const payload = {
    judul: String(formData.get('judul') || '').trim(),
    deskripsi: String(formData.get('deskripsi') || '').trim(),
    updated_at: new Date().toISOString(),
  };
  let oldPath = null;
  let newPath = null;

  if (id && file instanceof File && file.size) {
    const { data, error } = await client.from('dokumen').select('file_path').eq('id', id).single();
    if (error) throw error;
    oldPath = data.file_path;
  }
  if (file instanceof File && file.size) {
    newPath = await uploadPublicAsset(file, 'dokumen', 10 * 1024 * 1024);
    payload.file_path = newPath;
    payload.file_size = file.size;
  }

  const result = id
    ? await client.from('dokumen').update(payload).eq('id', id).select().single()
    : await client.from('dokumen').insert({ ...payload, file_path: newPath, file_size: file.size }).select().single();
  if (result.error) {
    if (newPath) await removePublicAsset(newPath).catch(() => {});
    throw result.error;
  }
  if (oldPath && newPath && oldPath !== newPath) await removePublicAsset(oldPath).catch(console.warn);
  return result.data;
}

async function deleteDokumen(id) {
  const client = getSupabaseClient();
  const { data: row, error: readError } = await client.from('dokumen').select('file_path').eq('id', id).single();
  if (readError) throw readError;
  const { error } = await client.from('dokumen').delete().eq('id', id);
  if (error) throw error;
  if (row.file_path) await removePublicAsset(row.file_path).catch(console.warn);
  return { message: 'Dokumen berhasil dihapus.' };
}

function urlDokumen(path) {
  return publicAssetUrl(path);
}

function formatUkuranFile(bytes) {
  if (!bytes) return '-';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
