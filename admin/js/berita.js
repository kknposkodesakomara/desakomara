// ============================================
// DESA KO'MARA — Halaman Kelola Berita
// ============================================

const listBox = document.getElementById('beritaList');
const emptyState = document.getElementById('emptyState');
const modalScrim = document.getElementById('modalScrim');
const modalTitle = document.getElementById('modalTitle');
const beritaForm = document.getElementById('beritaForm');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const previewWrap = document.getElementById('previewWrap');
const previewImg = document.getElementById('previewImg');
const fGambar = document.getElementById('fGambar');

let cache = [];

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
}

function formatTanggal(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

async function renderList() {
  try {
    cache = await getBeritaList();
  } catch (err) {
    showToast(err.message);
    return;
  }

  if (cache.length === 0) {
    listBox.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  listBox.innerHTML = cache.map(b => `
    <div class="berita-row">
      ${b.gambar
        ? `<img src="${urlGambar(b.gambar)}" alt="">`
        : `<div class="no-img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg></div>`}
      <div class="berita-row-body">
        <h4>${escapeHtml(b.judul)}</h4>
        <p>${escapeHtml(b.isi)}</p>
        <div class="berita-row-meta">${formatTanggal(b.created_at)} &middot; ${b.dilihat || 0} dilihat</div>
        <div class="berita-row-actions">
          <button class="icon-btn" title="Ubah" onclick="openEdit(${b.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button class="icon-btn danger" title="Hapus" onclick="confirmDelete(${b.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openModal(title) {
  modalTitle.textContent = title;
  modalScrim.classList.add('open');
}
function closeModal() {
  modalScrim.classList.remove('open');
  beritaForm.reset();
  document.getElementById('fId').value = '';
  previewWrap.style.display = 'none';
  previewImg.src = '';
}

document.getElementById('btnAdd').addEventListener('click', () => { closeModal(); openModal('Tambah Berita'); });
document.getElementById('btnAddEmpty').addEventListener('click', () => { closeModal(); openModal('Tambah Berita'); });
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
modalScrim.addEventListener('click', (e) => { if (e.target === modalScrim) closeModal(); });

fGambar.addEventListener('change', () => {
  const file = fGambar.files[0];
  if (!file) { previewWrap.style.display = 'none'; return; }
  previewImg.src = URL.createObjectURL(file);
  previewWrap.style.display = 'block';
});

window.openEdit = function (id) {
  const b = cache.find(x => x.id === id);
  if (!b) return;
  document.getElementById('fId').value = b.id;
  document.getElementById('fJudul').value = b.judul;
  document.getElementById('fIsi').value = b.isi;
  if (b.gambar) {
    previewImg.src = urlGambar(b.gambar);
    previewWrap.style.display = 'block';
  }
  openModal('Ubah Berita');
};

window.confirmDelete = async function (id) {
  const b = cache.find(x => x.id === id);
  if (!confirm(`Hapus berita "${b ? b.judul : ''}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  try {
    await deleteBerita(id);
    await renderList();
    showToast('Berita berhasil dihapus.');
  } catch (err) {
    showToast(err.message);
  }
};

beritaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('fId').value;
  const submitBtn = document.getElementById('btnSubmit');

  const formData = new FormData();
  if (id) formData.append('id', id);
  formData.append('judul', document.getElementById('fJudul').value.trim());
  formData.append('isi', document.getElementById('fIsi').value.trim());
  if (fGambar.files[0]) formData.append('gambar', fGambar.files[0]);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    await saveBerita(formData, !!id);
    closeModal();
    await renderList();
    showToast(id ? 'Berita berhasil diperbarui.' : 'Berita baru berhasil ditambahkan.');
  } catch (err) {
    showToast(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Simpan Berita';
  }
});

(async () => {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('userName').textContent = session.nama;
  document.getElementById('userRole').textContent = session.role;
  document.getElementById('userAvatar').textContent = initials(session.nama);
  document.getElementById('topbarRole').textContent = session.role;
  document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
  document.getElementById('menuToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

  await renderList();
})();