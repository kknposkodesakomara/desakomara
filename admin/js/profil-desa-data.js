// Data layer profil dan informasi desa (masing-masing satu baris id=1).
async function getProfilDesa() {
  return getSingletonRow('profil_desa');
}

async function updateProfilDesa(data) {
  return saveSingletonRow('profil_desa', data);
}

async function getInfoDesa() {
  return getSingletonRow('info_desa');
}

async function updateInfoDesa(data) {
  return saveSingletonRow('info_desa', data);
}
