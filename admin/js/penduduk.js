// ============================================
// DESA KO'MARA — Halaman Data Penduduk (CRUD, terhubung ke database)
// ============================================

let dusunOptions = []; // cache daftar dusun dari server
let searchDebounce = null;

const tableBody = document.getElementById('tableBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterDusun = document.getElementById('filterDusun');
const filterJK = document.getElementById('filterJK');
const paginationInfo = document.getElementById('paginationInfo');

const modalScrim = document.getElementById('modalScrim');
const modalTitle = document.getElementById('modalTitle');
const pendudukForm = document.getElementById('pendudukForm');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const fDusunSelect = document.getElementById('fDusun');

function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
}

async function loadDusunOptions() {
  dusunOptions = await getDaftarDusun();

  const filterHtml = '<option value="">Semua Dusun</option>' +
    dusunOptions.map(d => `<option value="${d.id}">${escapeHtml(d.nama_dusun)}</option>`).join('');
  filterDusun.innerHTML = filterHtml;

  const formHtml = '<option value="">Pilih Dusun</option>' +
    dusunOptions.map(d => `<option value="${d.id}">${escapeHtml(d.nama_dusun)}</option>`).join('');
  fDusunSelect.innerHTML = formHtml;
}

async function renderTable() {
  const params = {};
  const q = searchInput.value.trim();
  if (q) params.search = q;
  if (filterDusun.value) params.dusun_id = filterDusun.value;
  if (filterJK.value) params.jenis_kelamin = filterJK.value;
  params.limit = 100; // cukup untuk skala desa; bisa ditambah paginasi UI nanti

  let res;
  try {
    res = await getPendudukList(params);
  } catch (err) {
    showToast(err.message);
    return;
  }

  const list = res.data;
  const total = res.pagination.total;

  // KPI ringkas — dihitung langsung di database (akurat, bukan dari data yang sedang tampil)
  try {
    const stats = await getPendudukStats();
    document.getElementById('kpiTotal').textContent = stats.total_penduduk.toLocaleString('id-ID');
    document.getElementById('kpiL').textContent = stats.total_laki_laki.toLocaleString('id-ID');
    document.getElementById('kpiP').textContent = stats.total_perempuan.toLocaleString('id-ID');
    document.getElementById('kpiKK').textContent = stats.total_kartu_keluarga.toLocaleString('id-ID');
  } catch { /* biarkan KPI diam jika gagal, tabel tetap tampil */ }

  if (list.length === 0) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    paginationInfo.textContent = '';
    return;
  }
  emptyState.style.display = 'none';

  tableBody.innerHTML = list.map(p => `
    <tr>
      <td>
        <div class="cell-name">${escapeHtml(p.nama)}</div>
        <div class="cell-sub">${escapeHtml(p.nik || '-')}</div>
      </td>
      <td>${p.jenis_kelamin === 'L' ? '<span class="tag tag-l">Laki-laki</span>' : '<span class="tag tag-p">Perempuan</span>'}</td>
      <td>${formatTanggal(p.tanggal_lahir)}</td>
      <td>${escapeHtml(p.nama_dusun || '-')}</td>
      <td>${escapeHtml(p.pekerjaan || '-')}</td>
      <td>${escapeHtml(p.status_kawin || '-')}</td>
      <td>${escapeHtml(p.no_kk || '-')}</td>
      <td>
        <div class="row-actions" style="justify-content:flex-end;">
          <button class="icon-btn" title="Ubah" onclick="openEdit(${p.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button class="icon-btn danger" title="Hapus" onclick="confirmDelete(${p.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  paginationInfo.textContent = `Menampilkan ${list.length} dari ${total} data penduduk`;

  // simpan cache untuk dipakai openEdit tanpa fetch ulang
  window.__pendudukCache = list;
}

function openModal(title) {
  modalTitle.textContent = title;
  modalScrim.classList.add('open');
}
function closeModal() {
  modalScrim.classList.remove('open');
  pendudukForm.reset();
  document.getElementById('fId').value = '';
}

document.getElementById('btnAdd').addEventListener('click', () => { closeModal(); openModal('Tambah Penduduk'); });
document.getElementById('btnAddEmpty').addEventListener('click', () => { closeModal(); openModal('Tambah Penduduk'); });
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
modalScrim.addEventListener('click', (e) => { if (e.target === modalScrim) closeModal(); });

function openEdit(id) {
  const p = (window.__pendudukCache || []).find(x => x.id === id);
  if (!p) return;
  document.getElementById('fId').value = p.id;
  document.getElementById('fNama').value = p.nama || '';
  document.getElementById('fNik').value = p.nik || '';
  document.getElementById('fJK').value = p.jenis_kelamin || '';
  document.getElementById('fTempatLahir').value = p.tempat_lahir || '';
  document.getElementById('fTgl').value = p.tanggal_lahir || '';
  document.getElementById('fDusun').value = p.dusun_id || '';
  document.getElementById('fStatus').value = p.status_kawin || '';
  document.getElementById('fAgama').value = p.agama || '';
  document.getElementById('fPendidikan').value = p.pendidikan || '';
  document.getElementById('fPekerjaan').value = p.pekerjaan || '';
  document.getElementById('fKK').value = p.no_kk || '';
  document.getElementById('fAlamat').value = p.alamat || '';
  document.getElementById('fStatusHubungan').value = p.status_hubungan || '';
  document.getElementById('fKewarganegaraan').value = p.kewarganegaraan || 'WNI';
  document.getElementById('fNamaAyah').value = p.nama_ayah || '';
  document.getElementById('fNamaIbu').value = p.nama_ibu || '';
  document.getElementById('fRT').value = p.rt || '';
  document.getElementById('fRW').value = p.rw || '';
  document.getElementById('fKodePos').value = p.kode_pos || '';
  openModal('Ubah Data Penduduk');
}

async function confirmDelete(id) {
  const p = (window.__pendudukCache || []).find(x => x.id === id);
  const nama = p ? p.nama : 'data ini';
  if (!confirm(`Hapus data penduduk atas nama "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;

  try {
    const res = await deletePenduduk(id);
    await renderTable();
    showToast(res.message || 'Data penduduk berhasil dihapus.');
  } catch (err) {
    showToast(err.message);
  }
}

pendudukForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('fId').value;
  const record = {
    id: id ? Number(id) : null,
    nama: document.getElementById('fNama').value.trim(),
    nik: document.getElementById('fNik').value.trim(),
    jenis_kelamin: document.getElementById('fJK').value,
    tempat_lahir: document.getElementById('fTempatLahir').value.trim(),
    tanggal_lahir: document.getElementById('fTgl').value,
    dusun_id: document.getElementById('fDusun').value,
    status_kawin: document.getElementById('fStatus').value,
    agama: document.getElementById('fAgama').value,
    pendidikan: document.getElementById('fPendidikan').value,
    pekerjaan: document.getElementById('fPekerjaan').value.trim(),
    no_kk: document.getElementById('fKK').value.trim(),
    alamat: document.getElementById('fAlamat').value.trim(),
    status_hubungan: document.getElementById('fStatusHubungan').value,
    kewarganegaraan: document.getElementById('fKewarganegaraan').value.trim() || 'WNI',
    nama_ayah: document.getElementById('fNamaAyah').value.trim(),
    nama_ibu: document.getElementById('fNamaIbu').value.trim(),
    rt: document.getElementById('fRT').value.trim(),
    rw: document.getElementById('fRW').value.trim(),
    kode_pos: document.getElementById('fKodePos').value.trim(),
  };

  const submitBtn = pendudukForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    await savePenduduk(record);
    closeModal();
    await renderTable();
    showToast(id ? 'Perubahan data berhasil disimpan.' : 'Data penduduk baru berhasil ditambahkan.');
  } catch (err) {
    showToast(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(renderTable, 350); // debounce supaya tidak fetch tiap huruf
});
filterDusun.addEventListener('change', renderTable);
filterJK.addEventListener('change', renderTable);

(async () => {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('userName').textContent = session.nama;
  document.getElementById('userRole').textContent = session.role;
  document.getElementById('userAvatar').textContent = initials(session.nama);
  document.getElementById('topbarRole').textContent = session.role;
  document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
  document.getElementById('menuToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

  await loadDusunOptions();
  await renderTable();
})();
