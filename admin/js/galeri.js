// ============================================
// DESA KO'MARA — Halaman Kelola Galeri
// ============================================

const grid = document.getElementById('galeriGrid');
const emptyState = document.getElementById('emptyState');
const modalScrim = document.getElementById('modalScrim');
const galeriForm = document.getElementById('galeriForm');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const previewWrap = document.getElementById('previewWrap');
const previewImg = document.getElementById('previewImg');
const fGambar = document.getElementById('fGambar');

let cache = [];

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
}

function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function urlGambar(path) {
  if (!path) return '';
  return publicAssetUrl(path);
}

async function renderGrid() {
  try {
    cache = await getGaleriList();
  } catch (err) {
    showToast(err.message);
    return;
  }

  if (cache.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  grid.innerHTML = cache.map(g => `
    <div class="galeri-admin-item">
      <img src="${urlGambar(g.gambar)}" alt="${escapeHtml(g.judul || '')}">
      <div class="overlay">
        <span>${escapeHtml(g.judul || '')}</span>
        <button title="Hapus" onclick="confirmDelete(${g.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function openModal() { modalScrim.classList.add('open'); }
function closeModal() {
  modalScrim.classList.remove('open');
  galeriForm.reset();
  previewWrap.style.display = 'none';
  previewImg.src = '';
}

document.getElementById('btnAdd').addEventListener('click', () => { closeModal(); openModal(); });
document.getElementById('btnAddEmpty').addEventListener('click', () => { closeModal(); openModal(); });
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
modalScrim.addEventListener('click', (e) => { if (e.target === modalScrim) closeModal(); });

fGambar.addEventListener('change', () => {
  const file = fGambar.files[0];
  if (!file) { previewWrap.style.display = 'none'; return; }
  previewImg.src = URL.createObjectURL(file);
  previewWrap.style.display = 'block';
});

window.confirmDelete = async function (id) {
  if (!confirm('Hapus foto ini dari galeri? Tindakan ini tidak dapat dibatalkan.')) return;
  try {
    await deleteGaleri(id);
    await renderGrid();
    showToast('Foto berhasil dihapus.');
  } catch (err) {
    showToast(err.message);
  }
};

galeriForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('btnSubmit');

  if (!fGambar.files[0]) {
    showToast('Pilih foto terlebih dahulu.');
    return;
  }

  const formData = new FormData();
  formData.append('judul', document.getElementById('fJudul').value.trim());
  formData.append('gambar', fGambar.files[0]);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Mengunggah...';

  try {
    await saveGaleri(formData);
    closeModal();
    await renderGrid();
    showToast('Foto berhasil ditambahkan ke galeri.');
  } catch (err) {
    showToast(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Unggah Foto';
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

  await renderGrid();
})();
