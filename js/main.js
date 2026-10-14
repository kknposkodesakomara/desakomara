// ============================================
// DESA KO'MARA — shared front-end behaviour
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Live date in topbar
  const dateEl = document.getElementById('topbar-date');
  if (dateEl) {
    const now = new Date();
    const hari = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const tgl = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = `${hari}, ${tgl} | ${jam} WITA`;
  }

  // Mobile nav
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const scrim = document.querySelector('.scrim');
  const closeBtn = document.querySelector('.mobile-nav-close');

  function openNav() {
    mobileNav?.classList.add('open');
    scrim?.classList.add('open');
  }
  function closeNav() {
    mobileNav?.classList.remove('open');
    scrim?.classList.remove('open');
  }

  toggle?.addEventListener('click', openNav);
  closeBtn?.addEventListener('click', closeNav);
  scrim?.addEventListener('click', closeNav);

  // Search box -> simple redirect placeholder
  const searchForm = document.querySelector('.search-box');
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchForm.querySelector('input').value.trim();
    if (q) alert(`Fitur pencarian akan menampilkan hasil untuk: "${q}" (akan aktif setelah database terhubung).`);
  });
});

// ============================================
// Sambungkan info kontak di footer ke Profil Desa (database)
// ============================================
async function muatProfilDesaPublik() {
  try {
    const { data: p, error } = await getSupabaseClient().from('profil_desa')
      .select('jam_pelayanan, alamat_kantor, telepon').eq('id', 1).maybeSingle();
    if (error || !p) return;

    const elJam = document.getElementById('pJamPelayanan');
    if (elJam && p.jam_pelayanan) elJam.textContent = p.jam_pelayanan;

    const elAlamat = document.getElementById('pAlamatKantor');
    if (elAlamat && p.alamat_kantor) elAlamat.textContent = p.alamat_kantor;

    const elTelepon = document.getElementById('pTelepon');
    if (elTelepon && p.telepon) elTelepon.textContent = p.telepon;
  } catch (err) {
    console.error('Gagal memuat profil desa dari Supabase:', err.message);
  }
}
document.addEventListener('DOMContentLoaded', muatProfilDesaPublik);