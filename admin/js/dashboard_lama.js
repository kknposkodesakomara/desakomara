  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
  }

  function formatTanggal(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function setupPencarian() {
    const input = document.getElementById('dashSearchInput');
    const searchBtn = document.getElementById('dashSearchBtn');
    const resultsBox = document.getElementById('dashSearchResults');
    const detailBox = document.getElementById('dashDetailPanel');
    let debounceTimer = null;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = input.value.trim();
      detailBox.innerHTML = '';
      if (q.length < 2) { resultsBox.innerHTML = ''; return; }
      debounceTimer = setTimeout(() => runSearch(q), 350);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        runSearch(input.value.trim());
      }
    });

    searchBtn.addEventListener('click', () => {
      clearTimeout(debounceTimer);
      runSearch(input.value.trim());
    });

    async function runSearch(q) {
      if (!q) { resultsBox.innerHTML = '<p style="font-size:0.85rem;color:var(--ink-500);">Ketik nama atau NIK terlebih dahulu.</p>'; return; }
      resultsBox.innerHTML = '<p style="font-size:0.85rem;color:var(--ink-500);">Mencari...</p>';
      try {
        const res = await getPendudukList({ search: q, limit: 8 });
        renderResults(res.data);
      } catch (err) {
        resultsBox.innerHTML = `<p style="font-size:0.85rem;color:var(--red-500);">${escapeHtml(err.message)}</p>`;
      }
    }

    function renderResults(list) {
      if (list.length === 0) {
        resultsBox.innerHTML = '<p style="font-size:0.85rem;color:var(--ink-500);">Tidak ada data yang cocok.</p>';
        return;
      }
      resultsBox.innerHTML = list.map(p => `
        <div class="node" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer;" onclick='pilihOrang(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
          <div>
            <div class="cell-name">${escapeHtml(p.nama)}</div>
            <div class="cell-sub">${escapeHtml(p.nik)} &middot; ${escapeHtml(p.nama_dusun)}</div>
          </div>
          <span class="tag ${p.jenis_kelamin === 'L' ? 'tag-l' : 'tag-p'}">${p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
        </div>
      `).join('');
    }

    window.pilihOrang = async function (p) {
      detailBox.innerHTML = '<p style="font-size:0.85rem;color:var(--ink-500);">Memuat detail...</p>';

      if (!p.no_kk) {
        detailBox.innerHTML = `
          <div style="border:1px solid var(--green-100);background:var(--green-50);border-radius:12px;padding:16px 18px;margin-bottom:14px;">
            <div style="font-family:var(--font-display);font-weight:800;color:var(--green-900);font-size:1.05rem;">${escapeHtml(p.nama)}</div>
            <div style="font-size:0.85rem;color:var(--ink-700);margin-top:4px;">NIK: ${escapeHtml(p.nik)} &middot; Dusun: ${escapeHtml(p.nama_dusun)}</div>
          </div>
          <p style="font-size:0.9rem;color:var(--ink-700);">Data ini belum memiliki Nomor KK, jadi anggota keluarga belum bisa ditampilkan.</p>
        `;
        return;
      }

      let res;
      try {
        res = await getKeluargaByNoKK(p.no_kk);
      } catch (err) {
        detailBox.innerHTML = `<p style="font-size:0.85rem;color:var(--red-500);">${escapeHtml(err.message)}</p>`;
        return;
      }

      const kk = res.kartu_keluarga || {};
      const anggotaRows = res.anggota.map(a => `
        <tr${a.id === p.id ? ' style="background:var(--green-50);"' : ''}>
          <td>
            <div class="cell-name">${escapeHtml(a.nama)}${a.id === p.id ? ' <span style="font-weight:400;color:var(--ink-500);">(dicari)</span>' : ''}</div>
            <div class="cell-sub">${escapeHtml(a.nik)}</div>
          </td>
          <td>${a.jenis_kelamin === 'L' ? '<span class="tag tag-l">Laki-laki</span>' : '<span class="tag tag-p">Perempuan</span>'}</td>
          <td>${formatTanggal(a.tanggal_lahir)}</td>
          <td>${escapeHtml(a.status_kawin || '-')}</td>
          <td>${escapeHtml(a.pekerjaan || '-')}</td>
        </tr>
      `).join('');

      detailBox.innerHTML = `
        <div style="border:1px solid var(--green-100);background:var(--green-50);border-radius:12px;padding:16px 18px;margin-bottom:14px;">
          <div style="font-family:var(--font-display);font-weight:800;color:var(--green-900);font-size:1.05rem;">${escapeHtml(p.nama)}</div>
          <div style="font-size:0.85rem;color:var(--ink-700);margin-top:4px;">
            NIK: ${escapeHtml(p.nik)} &middot; Dusun: ${escapeHtml(p.nama_dusun)} &middot; No. KK: ${escapeHtml(p.no_kk)}
          </div>
          <div style="font-size:0.85rem;color:var(--ink-700);margin-top:4px;">
            Alamat Keluarga: ${escapeHtml(kk.alamat || '-')}
          </div>
        </div>

        <p style="font-size:0.9rem;color:var(--ink-700);margin:0 0 10px;">
          Kartu Keluarga ini beranggotakan <b>${res.jumlah_anggota} orang</b>:
        </p>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Nama / NIK</th><th>Jenis Kelamin</th><th>Tgl Lahir</th><th>Status Kawin</th><th>Pekerjaan</th></tr>
            </thead>
            <tbody>${anggotaRows}</tbody>
          </table>
        </div>
      `;
    };
  }

  (async () => {
    const session = await requireAuth();
    if (!session) return;

    document.getElementById('userName').textContent = session.nama;
    document.getElementById('userRole').textContent = session.role;
    document.getElementById('userAvatar').textContent = initials(session.nama);
    document.getElementById('topbarRole').textContent = session.role;

    document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
    document.getElementById('menuToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

    try {
      const [stats, saranRes] = await Promise.all([
        getPendudukStats(),
        getSaranList(),
      ]);

      document.getElementById('kpiTotal').textContent = stats.total_penduduk.toLocaleString('id-ID');
      document.getElementById('kpiL').textContent = stats.total_laki_laki.toLocaleString('id-ID');
      document.getElementById('kpiP').textContent = stats.total_perempuan.toLocaleString('id-ID');
      document.getElementById('kpiSaran').textContent = saranRes.length.toLocaleString('id-ID');
    } catch (err) {
      console.error(err);
      document.querySelectorAll('.kpi-value').forEach(el => el.textContent = '—');
    }

    setupPencarian();
  })();
