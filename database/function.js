const fs = require('fs');
const path = require('path');

// Lokasi file database JSON
const dbPath = path.join(__dirname, 'user.json');

/**
 * Membaca dan mengembalikan isi dari file JSON.
 * @param {string} fp - Path file JSON yang akan dibaca.
 * @param {string} enc - Encoding yang digunakan (default: 'utf8').
 * @returns {Object} - Isi file JSON yang sudah di-parse menjadi objek.
 */
function baca(fp, enc = 'utf8') {
  const file = fs.readFileSync(fp, enc);
  return JSON.parse(file);
}

/**
 * Menulis data ke dalam file JSON.
 * @param {string} fp - Path file JSON yang akan ditulis.
 * @param {Object} data - Data yang akan disimpan ke file JSON.
 */
function tulis(fp, data) {
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Menambahkan entri baru ke dalam database JSON.
 * Jika nomor telepon belum ada, akan dibuatkan entri baru.
 * @param {string} telp - Nomor telepon (key) yang akan ditambahkan atau diperbarui.
 * @param {Object} dataBaru - Data baru yang ingin ditambahkan (misalnya, sesiBantuan, nama).
 */
function tambah(telp, dataBaru) {
  let db = baca(dbPath);

  // Jika nomor telepon belum ada, buatkan array baru untuk menyimpan data.
  if (!db[telp]) {
    db[telp] = [];
  }

  // Tambahkan data baru ke dalam array pengguna berdasarkan nomor telepon.
  db[telp].push(dataBaru);
  tulis(dbPath, db);

  console.log(`Data untuk ${telp} berhasil ditambahkan!`);
}

/**
 * Memperbarui data tertentu dalam entri nomor telepon yang sudah ada.
 * @param {string} telp - Nomor telepon yang akan diperbarui.
 * @param {string} kunci - Kunci data yang ingin diubah (misalnya, sesiBantuan).
 * @param {*} nilai - Nilai baru untuk kunci yang ingin diubah.
 */
function ubah(telp, kunci, nilai) {
  let db = baca(dbPath);

  // Jika nomor telepon ditemukan, perbarui data sesuai dengan kunci yang diberikan.
  if (db[telp]) {
    db[telp] = db[telp].map(item => {
      if (item[kunci] !== undefined) {
        item[kunci] = nilai;
      }
      return item;
    });

    tulis(dbPath, db);
    console.log(`Data ${kunci} untuk ${telp} berhasil diperbarui!`);
  } else {
    console.log(`Nomor ${telp} tidak ditemukan!`);
  }
}

/**
 * Menghapus seluruh entri dari database berdasarkan nomor telepon.
 * @param {string} telp - Nomor telepon yang datanya ingin dihapus.
 */
function hapus(telp) {
  let db = baca(dbPath);

  // Jika nomor telepon ditemukan, hapus entri tersebut dari database.
  if (db[telp]) {
    delete db[telp];
    tulis(dbPath, db);
    console.log(`Data untuk ${telp} berhasil dihapus!`);
  } else {
    console.log(`Nomor ${telp} tidak ditemukan!`);
  }
}

/**
 * Menghapus kunci tertentu dari entri berdasarkan nomor telepon.
 * @param {string} telp - Nomor telepon yang ingin diubah datanya.
 * @param {string} kunci - Kunci yang ingin dihapus dari entri.
 */
function hapusKey(telp, kunci) {
  let db = baca(dbPath);

  // Jika nomor telepon ditemukan, hapus kunci tertentu dari entri.
  if (db[telp]) {
    db[telp] = db[telp].map(item => {
      delete item[kunci];
      return item;
    });

    tulis(dbPath, db);
    console.log(`Kunci ${kunci} untuk ${telp} berhasil dihapus!`);
  } else {
    console.log(`Nomor ${telp} tidak ditemukan!`);
  }
}

/**
 * Membaca data pengguna berdasarkan nomor telepon (m.sender).
 * @param {string} telp - Nomor telepon yang ingin dibaca datanya.
 * @returns {Object|null} - Data pengguna atau null jika tidak ditemukan.
 */
function bacaPengguna(telp) {
  let db = baca(dbPath);

  if (db[telp]) {
    return db[telp];
  } else {
    return false;
  }
}

// Objek database yang diekspor untuk mengelola fungsi CRUD.
const database = {
  tambah,
  ubah,
  hapus,
  hapusKey,
  baca,
  bacaPengguna
};

module.exports = database;