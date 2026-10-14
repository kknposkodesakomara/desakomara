// Data layer pengumuman.
async function getPengumumanList(limit = 50) {
  const { data, error } = await getSupabaseClient().from('pengumuman')
    .select('*').order('tanggal', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

async function savePengumuman(record) {
  const client = getSupabaseClient();
  const payload = {
    judul: record.judul,
    tanggal: record.tanggal,
    isi: record.isi,
    updated_at: new Date().toISOString(),
  };
  const result = record.id
    ? await client.from('pengumuman').update(payload).eq('id', record.id).select().single()
    : await client.from('pengumuman').insert(payload).select().single();
  if (result.error) throw result.error;
  return result.data;
}

async function deletePengumuman(id) {
  const { error } = await getSupabaseClient().from('pengumuman').delete().eq('id', id);
  if (error) throw error;
  return { message: 'Pengumuman berhasil dihapus.' };
}
