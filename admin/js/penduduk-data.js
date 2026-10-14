// Data layer data penduduk. Seluruh operasi memerlukan sesi admin aktif;
// RLS di Supabase menjadi kontrol keamanan sebenarnya.
async function getPendudukList(params = {}) {
  const client = getSupabaseClient();
  const limit = Math.max(1, Math.min(Number(params.limit) || 100, 500));
  let query = client.from('penduduk')
    .select('*, dusun(nama_dusun)', { count: 'exact' })
    .order('nama', { ascending: true })
    .range(0, limit - 1);

  if (params.dusun_id) query = query.eq('dusun_id', Number(params.dusun_id));
  if (params.jenis_kelamin) query = query.eq('jenis_kelamin', params.jenis_kelamin);
  if (params.search) {
    const term = String(params.search).trim().replace(/[%,_*()]/g, ' ');
    if (term) query = query.or(`nama.ilike.%${term}%,nik.ilike.%${term}%`);
  }
  const { data, error, count } = await query;
  if (error) throw error;
  const rows = (data || []).map(row => ({ ...row, nama_dusun: row.dusun?.nama_dusun || '' }));
  return { data: rows, pagination: { total: count || 0 } };
}

async function savePenduduk(record) {
  const payload = { ...record };
  delete payload.id;
  payload.dusun_id = payload.dusun_id ? Number(payload.dusun_id) : null;
  payload.updated_at = new Date().toISOString();
  const result = record.id
    ? await getSupabaseClient().from('penduduk').update(payload).eq('id', record.id).select().single()
    : await getSupabaseClient().from('penduduk').insert(payload).select().single();
  if (result.error) throw result.error;
  return result.data;
}

async function deletePenduduk(id) {
  const { error } = await getSupabaseClient().from('penduduk').delete().eq('id', id);
  if (error) throw error;
  return { message: 'Data penduduk berhasil dihapus.' };
}

async function getDaftarDusun() {
  const { data, error } = await getSupabaseClient().from('dusun')
    .select('id, nama_dusun, kepala_dusun, keterangan').order('nama_dusun');
  if (error) throw error;
  return data || [];
}

async function getKeluargaByNoKK(noKK) {
  const client = getSupabaseClient();
  const { data, error } = await client.from('penduduk')
    .select('*, dusun(nama_dusun)')
    .eq('no_kk', noKK)
    .order('nama', { ascending: true });
  if (error) throw error;
  const anggota = (data || []).map(row => ({ ...row, nama_dusun: row.dusun?.nama_dusun || '' }));
  const first = anggota[0] || {};
  return {
    kartu_keluarga: {
      no_kk: noKK,
      alamat: first.alamat || '',
      kepala_keluarga: anggota.find(a => a.status_hubungan === 'Kepala Keluarga')?.nama || first.nama || '',
    },
    anggota,
    jumlah_anggota: anggota.length,
  };
}

async function getPendudukStats() {
  const { data, error } = await getSupabaseClient().rpc('public_population_stats');
  if (error) throw error;
  return data || { total_penduduk: 0, total_laki_laki: 0, total_perempuan: 0, total_kartu_keluarga: 0 };
}
