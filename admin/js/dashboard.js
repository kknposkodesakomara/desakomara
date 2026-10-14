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

        <div style="margin-top:14px;text-align:right;">
          <button type="button" class="btn btn-primary btn-sm" id="btnCetakKK">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align:-3px;margin-right:4px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Cetak / Simpan sebagai PDF
          </button>
        </div>
      `;

      document.getElementById('btnCetakKK').addEventListener('click', () => {
        cetakKartuKeluarga(kk, res.anggota);
      });
    };
  }

  async function cetakKartuKeluarga(kk, anggota) {
    let profil = {};
    try { profil = await getProfilDesa(); } catch { /* pakai nilai default kalau gagal */ }

    const namaDesa   = profil.nama_desa || "Desa Ko'Mara";
    const kecamatan  = profil.kecamatan || '-';
    const kabupaten  = profil.kabupaten || '-';
    const provinsi   = profil.provinsi || '-';

    const baris = anggota.map((a, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${escapeHtml(a.nama || '-')}</td>
        <td>${escapeHtml(a.nik || '-')}</td>
        <td class="c">${a.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
        <td>${escapeHtml(a.tempat_lahir || '-')}, ${formatTanggal(a.tanggal_lahir)}</td>
        <td>${escapeHtml(a.agama || '-')}</td>
        <td>${escapeHtml(a.pendidikan || '-')}</td>
        <td>${escapeHtml(a.pekerjaan || '-')}</td>
        <td>${escapeHtml(a.status_kawin || '-')}</td>
        <td>${escapeHtml(a.status_hubungan || '-')}</td>
        <td class="c">${escapeHtml(a.kewarganegaraan || 'WNI')}</td>
        <td>${escapeHtml(a.nama_ayah || '-')}</td>
        <td>${escapeHtml(a.nama_ibu || '-')}</td>
      </tr>
    `).join('');

    const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Kartu Keluarga - ${escapeHtml(kk.no_kk || '')}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, serif; color: #111; margin: 0; padding: 0; }
  .kop { text-align:center; margin-bottom: 14px; }
  .kop h1 { font-size: 16px; margin: 0; letter-spacing: 1px; }
  .kop h2 { font-size: 20px; margin: 4px 0 2px; text-decoration: underline; letter-spacing: 2px; }
  .kop .nokk { font-size: 13px; margin-top: 2px; }
  .info { width:100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12.5px; }
  .info td { padding: 2px 4px; vertical-align: top; }
  .info td.label { width: 170px; }
  .info td.titik { width: 14px; text-align:center; }
  table.anggota { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.anggota th, table.anggota td { border: 1px solid #000; padding: 4px 5px; text-align: left; }
  table.anggota th { text-align:center; background:#f0f0f0; font-weight:700; }
  table.anggota td.c { text-align:center; }
  .footer { display:flex; justify-content:space-between; margin-top: 40px; font-size: 12.5px; }
  .ttd { text-align:center; width: 260px; }
  .ttd .space { height: 55px; }
  .print-btn { margin: 16px 0; text-align:center; }
  .print-btn button { font-family: system-ui, sans-serif; padding: 10px 22px; background:#17603c; color:#fff; border:none; border-radius: 6px; font-weight:700; cursor:pointer; font-size: 14px; }
  @media print { .print-btn { display:none; } }
</style>
</head>
<body>

<div class="print-btn">
  <button onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
</div>

<div class="kop">
  <h1>PEMERINTAH KABUPATEN ${escapeHtml(kabupaten).toUpperCase()}</h1>
  <h1>KECAMATAN ${escapeHtml(kecamatan).toUpperCase()} — ${escapeHtml(namaDesa).toUpperCase()}</h1>
  <h2>KARTU KELUARGA</h2>
  <div class="nokk">No. ${escapeHtml(kk.no_kk || '-')}</div>
</div>

<table class="info">
  <tr>
    <td class="label">Nama Kepala Keluarga</td><td class="titik">:</td><td>${escapeHtml(kk.kepala_keluarga || '-')}</td>
    <td class="label">Kecamatan</td><td class="titik">:</td><td>${escapeHtml(kecamatan)}</td>
  </tr>
  <tr>
    <td class="label">Alamat</td><td class="titik">:</td><td>${escapeHtml(kk.alamat || '-')}</td>
    <td class="label">Kabupaten/Kota</td><td class="titik">:</td><td>${escapeHtml(kabupaten)}</td>
  </tr>
  <tr>
    <td class="label">RT/RW</td><td class="titik">:</td><td>${escapeHtml(kk.rt || '-')}/${escapeHtml(kk.rw || '-')}</td>
    <td class="label">Provinsi</td><td class="titik">:</td><td>${escapeHtml(provinsi)}</td>
  </tr>
  <tr>
    <td class="label">Desa/Kelurahan</td><td class="titik">:</td><td>${escapeHtml(namaDesa)} (Dusun ${escapeHtml(kk.nama_dusun || '-')})</td>
    <td class="label">Kode Pos</td><td class="titik">:</td><td>${escapeHtml(kk.kode_pos || '-')}</td>
  </tr>
</table>

<table class="anggota">
  <thead>
    <tr>
      <th>No</th><th>Nama Lengkap</th><th>NIK</th><th>Jenis<br>Kelamin</th>
      <th>Tempat &amp; Tgl Lahir</th><th>Agama</th><th>Pendidikan</th>
      <th>Jenis Pekerjaan</th><th>Status<br>Perkawinan</th>
      <th>Status Hubungan<br>dalam Keluarga</th><th>Kewarga-<br>negaraan</th>
      <th>Nama Ayah</th><th>Nama Ibu</th>
    </tr>
  </thead>
  <tbody>${baris}</tbody>
</table>

<div class="footer">
  <div></div>
  <div class="ttd">
    <div>${escapeHtml(namaDesa)}, ${tglCetak}</div>
    <div>Kepala ${escapeHtml(namaDesa)}</div>
    <div class="space" style="position:relative;">
      <img src="data:image/png;base64,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" alt="Tanda tangan & cap Kepala Desa" style="max-width:130px;max-height:52px;position:absolute;left:50%;top:12px;transform:translateX(-50%);">
    </div>
    <div style="border-top:1px solid #000; padding-top:2px; font-weight:700;">Ruslam Adiputra, ST.</div>
  </div>
</div>

</body>
</html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
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
