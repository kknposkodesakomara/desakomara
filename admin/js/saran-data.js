// Data layer saran/aduan warga.
async function getSaranList() {
  const { data, error } = await getSupabaseClient().from('saran')
    .select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateSaranStatus(id, status) {
  const allowed = ['Baru', 'Diproses', 'Selesai'];
  if (!allowed.includes(status)) throw new Error('Status saran tidak valid.');
  const { error } = await getSupabaseClient().from('saran').update({ status }).eq('id', id);
  if (error) throw error;
}
