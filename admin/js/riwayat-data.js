// Data layer riwayat kepala desa.
async function getRiwayatList() {
  const { data, error } = await getSupabaseClient().from('riwayat')
    .select('*').order('urutan', { ascending: true }).order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function saveRiwayat(record) {
  const payload = {
    nama: record.nama,
    mulai: record.mulai,
    akhir: record.akhir,
    keterangan: record.keterangan || '',
    urutan: Number(record.urutan || 0),
  };
  const result = record.id
    ? await getSupabaseClient().from('riwayat').update(payload).eq('id', record.id).select().single()
    : await getSupabaseClient().from('riwayat').insert(payload).select().single();
  if (result.error) throw result.error;
  return result.data;
}

async function deleteRiwayat(id) {
  const { error } = await getSupabaseClient().from('riwayat').delete().eq('id', id);
  if (error) throw error;
  return { message: 'Data riwayat berhasil dihapus.' };
}
