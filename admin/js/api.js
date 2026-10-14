// Helper data access untuk admin. Semua operasi database langsung melalui
// supabase-js; hak akses sebenarnya ditegakkan oleh RLS di Supabase.
function adminClient() {
  return getSupabaseClient();
}

async function adminQuery(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message || 'Permintaan ke Supabase gagal.');
  return data;
}

async function getSingletonRow(table) {
  const data = await adminQuery(adminClient().from(table).select('*').eq('id', 1).maybeSingle());
  return data || { id: 1 };
}

async function saveSingletonRow(table, record) {
  return adminQuery(
    adminClient().from(table).upsert({ ...record, id: 1, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select().single()
  );
}
