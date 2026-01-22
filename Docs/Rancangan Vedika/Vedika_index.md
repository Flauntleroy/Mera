# Dokumentasi Halaman Index Vedika

> Halaman daftar klaim BPJS yang **belum diproses**

---

## 1. Informasi Umum

| Item | Nilai |
|------|-------|
| **URL** | `/admin/vedika/index/{type}/{page}` |
| **Template** | `view/admin/index.html` |
| **Controller** | `Admin.php` → method `anyIndex()` |
| **Type** | `ralan` (Rawat Jalan) atau `ranap` (Rawat Inap) |

---

## 2. Fungsi Halaman

Halaman ini menampilkan daftar pasien BPJS yang:
- ✅ Sudah selesai perawatan (status registrasi bukan "Batal")
- ✅ Cara bayar sesuai konfigurasi BPJS (`vedika.carabayar`)
- ❌ **Belum ada** di tabel `mlite_vedika` (belum diproses)

**Query Filter:**
```sql
WHERE reg_periksa.no_rawat NOT IN (SELECT no_rawat FROM mlite_vedika)
```

---

## 3. Layout Halaman

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Panel Header: "Kelola e-Vedika"                    [📅 Pilihan dan Pemilahan]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Jumlah: XX                                              [🔍 Search Box]    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┐ │
│ │ Aksi dan    │ Data        │ Data        │ Data        │ Berkas          │ │
│ │ Proses      │ Pasien      │ Registrasi  │ Kunjungan   │ Digital         │ │
│ ├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────┤ │
│ │ [Tombol]    │ No.Rawat    │ Tgl.Reg     │ No.Kunjungan│ [Upload]        │ │
│ │ [SEP]       │ No.RM       │ Poliklinik  │ No.Kartu    │ - Berkas 1      │ │
│ │ [PDF]       │ Nama        │ Dokter      │ Dx.Utama    │ - Berkas 2      │ │
│ │ [Status]    │ Umur        │ Status      │ Pros.Utama  │ [Resume]        │ │
│ │ [Hapus]     │ JK, Alamat  │             │             │                 │ │
│ └─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┘ │
│                                                                             │
│                        [« Prev] [1] [2] [3] [Next »]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Komponen Header

### 4.1 Dropdown "Pilihan dan Pemilahan"

| Komponen | Tipe | Fungsi |
|----------|------|--------|
| Start Date | Datepicker | Filter tanggal awal |
| End Date | Datepicker | Filter tanggal akhir |
| Tab Rawat Jalan | Button Link | Switch ke `/admin/vedika/index/ralan` |
| Tab Rawat Inap | Button Link | Switch ke `/admin/vedika/index/ranap` |
| Submit | Button | Terapkan filter tanggal |

### 4.2 Info Bar

| Komponen | Posisi | Fungsi |
|----------|--------|--------|
| "Jumlah: XX" | Kiri | Menampilkan total record |
| Search Box | Kanan | Cari berdasarkan: no_rkm_medis, no_rawat, nm_pasien |

---

## 5. Kolom Tabel

### 5.1 Kolom "Aksi dan Proses"

Berisi tombol-tombol aksi untuk setiap baris data.

| Tombol | Warna | Icon | Fungsi | Kondisi Tampil |
|--------|-------|------|--------|----------------|
| "Ambil SEP dari Vclaim" | 🔵 btn-info | `fa-download` | Buka modal form SEP | Jika `no_sep` kosong |
| [Nomor SEP] | 🔵 btn-info | `fa-file-o` | Menampilkan nomor SEP | Jika `no_sep` ada |
| "Lihat Data Klaim" | 🔵 btn-primary | `fa-print` | Buka PDF di tab baru | Selalu tampil |
| "Status" (disabled) | 🟡 btn-warning | `fa-check` | Button disabled | Jika `no_sep` kosong |
| "Status" | 🟢 btn-success | `fa-check` | Buka modal set status | Jika `no_sep` ada |
| Badge Status | 🟢/🟡/🔴 | - | Menampilkan status terkini | Jika sudah pernah diproses |
| "Hapus" | 🔴 btn-danger | `fa-trash` | Hapus data dari mlite_vedika | Jika `no_sep` ada |

**Catatan:** Tombol "Status" tidak bisa diklik jika belum ada SEP. User harus ambil SEP dulu.

---

## 5.A Detail Tombol-Tombol Aksi

### 🔵 Tombol 1: "Ambil SEP dari Vclaim"

**Tampilan:** Button biru dengan icon `fa-download`

**Fungsi:** Mengambil data SEP (Surat Eligibilitas Peserta) dari API VClaim BPJS dan menyimpan ke database lokal.

**Kondisi Tampil:** Hanya muncul jika pasien **belum memiliki SEP** di tabel `bridging_sep`.

**Modal Form (`form.sepvclaim.html`):**

| Field | Tipe | Keterangan |
|-------|------|------------|
| Nomor SEP | Text Input | Masukkan nomor SEP dari BPJS |
| Asal Rujukan | Select | Pilih: Faskes 1 atau Faskes 2 |
| Tanggal Rujukan | Datepicker | Format: YYYY-MM-DD |
| Kode Diagnosa | Text Input | Kode ICD-10 |
| Poli Tujuan | Select | Dari tabel `poliklinik` |
| Dokter PJ | Select | Dari tabel `dokter` |

**Proses:**
1. User mengisi form SEP
2. Sistem memanggil API VClaim BPJS
3. Data SEP disimpan ke tabel `bridging_sep`
4. Tombol SEP berubah menjadi menampilkan nomor SEP

---

### 🔵 Tombol 2: "Lihat Data Klaim" ⭐ (PENTING)

**Tampilan:** Button biru dengan icon `fa-print` dan label "Lihat Data Klaim"

**Fungsi:** Membuka halaman PDF lengkap di tab baru yang berisi **SEMUA data klaim** pasien.

**URL:** `/admin/vedika/pdf/{no_rawat_encoded}`

**Controller:** `Admin.php` → method `getPDF($id)`

**Template:** `view/admin/pdf.html` (78 KB, 2071 baris)

---

#### 📑 STRUKTUR LENGKAP PDF DATA KLAIM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STRUKTUR PDF DATA KLAIM                              │
│                    (12+ Halaman, Tergantung Data Pasien)                     │
└─────────────────────────────────────────────────────────────────────────────┘

📄 SECTION 1: SURAT ELIGIBILITAS PESERTA (SEP)
├── Header BPJS + Logo Instansi
├── PRB (Program Rujuk Balik) Status
├── Barcode Nomor SEP
├── No. SEP, Tgl. SEP
├── No. Kartu BPJS + No. RM
├── Nama Peserta, COB
├── Tgl. Lahir, Jenis Kelamin, Jenis Rawat
├── No. Telepon, Kelas Rawat, Kelas Hak
├── Spesialis/Sub Spesialis (Poli Tujuan)
├── DPJP Yang Melayani
├── Faskes Perujuk
├── Diagnosa Awal
├── Catatan
├── Masa Berlaku Rujukan
└── QR Code + Tanda Tangan Peserta

📄 SECTION 2: SOAP DAN RIWAYAT PERAWATAN
├── Data Pasien Lengkap:
│   ├── No.RM, Nama Pasien, Alamat
│   ├── Umur, Jenis Kelamin
│   ├── Tempat & Tanggal Lahir
│   ├── Ibu Kandung
│   ├── Golongan Darah
│   ├── Status Nikah
│   ├── Agama
│   ├── Pendidikan Terakhir
│   └── Pertama Daftar (Tanggal)
├── Data Registrasi:
│   ├── No.Rawat, No.Registrasi
│   ├── Tanggal Registrasi + Jam
│   ├── Unit/Poliklinik
│   ├── Dokter (Single untuk Ralan, Multiple DPJP untuk Ranap)
│   ├── Cara Bayar
│   ├── Penanggung Jawab
│   ├── Alamat P.J.
│   ├── Hubungan P.J.
│   └── Status (Ralan/Ranap)
├── Diagnosa/Penyakit/ICD-10:
│   └── Tabel: Kode | Nama Penyakit
├── Prosedur Tindakan/ICD-9:
│   └── Tabel: Kode | Nama Tindakan
├── Pemeriksaan Rawat Jalan (SOAP):
│   └── Tabel:
│       ├── Tanggal + Jam
│       ├── Suhu (°C), Tensi, Nadi, RR, Tinggi, Berat
│       ├── GCS (E,V,M), Kesadaran
│       ├── Subjek (Keluhan)
│       ├── Objek (Pemeriksaan)
│       ├── Asesmen (Penilaian)
│       ├── Plan (RTL)
│       ├── Instruksi
│       ├── Evaluasi
│       └── Alergi
└── Pemeriksaan Rawat Inap (SOAP):
    └── (Format sama dengan Rawat Jalan)

📄 SECTION 3: TINDAKAN MEDIS
├── Tindakan Rawat Jalan Dokter:
│   └── Tabel: Tanggal | Kode | Nama Tindakan | Dokter
├── Tindakan Rawat Jalan Paramedis:
│   └── Tabel: Tanggal | Kode | Nama Tindakan | Perawat
├── Tindakan Rawat Jalan Dokter & Perawat:
│   └── Tabel: Tanggal | Kode | Nama Tindakan | Dokter | Petugas
├── Tindakan Rawat Inap Dokter:
│   └── Tabel: Tanggal | Kode | Nama Tindakan | Dokter
├── Tindakan Rawat Inap Perawat:
│   └── Tabel: Tanggal | Kode | Nama Tindakan | Petugas
├── Tindakan Rawat Inap Dokter & Perawat:
│   └── Tabel: Tanggal | Kode | Nama Tindakan | Dokter | Petugas
└── Data Kamar Inap (jika Ranap):
    └── Tabel: Tgl Masuk | Tgl Keluar | Lama Inap | Kamar | Status Pulang

📄 SECTION 4: OPERASI (jika ada)
├── Tabel Operasi:
│   └── Tanggal | Kode Paket | Nama Tindakan | Jenis Anastesi
└── Resume Laporan Operasi:
    ├── Nomor Rawat
    ├── Operasi Mulai
    ├── Selesai Operasi
    ├── Diagnosa Preop
    ├── Diagnosa Postop
    ├── Jaringan Dieksekusi
    ├── Permintaan PA
    ├── Laporan Operasi
    └── QR Code DPJP

📄 SECTION 5: TINDAKAN RADIOLOGI (jika ada)
├── Tabel Tindakan:
│   └── Tanggal+Jam | Kode | Nama Tindakan | Dokter | Petugas
├── Hasil Radiologi/Interpretasi:
│   └── Tanggal+Jam | Hasil Pemeriksaan
├── Klinis
├── Judul, Kesan, Saran
└── Gambar Radiologi (embedded images)

📄 SECTION 6: PEMERIKSAAN LABORATORIUM (jika ada)
└── Tabel Hasil Lab:
    ├── Tanggal Periksa
    ├── Nama Tindakan (Header)
    └── Detail per Parameter:
        ├── Pemeriksaan
        ├── Nilai + Satuan
        ├── Nilai Rujukan
        └── Keterangan

📄 SECTION 7: OBAT & FARMASI
├── Pemberian Obat:
│   └── Tabel: Tanggal+Jam | Kode | Nama Obat | Jumlah + Satuan
├── Obat Operasi:
│   └── Tabel: Tanggal | Kode | Nama Obat | Jumlah
└── Resep Pulang:
    └── Tabel: Tanggal+Jam | Kode | Nama Obat | Jumlah+Satuan | Dosis

📄 SECTION 8: RESUME MEDIS
├── Resume Rawat Jalan (jika Ralan):
│   ├── Diagnosa (Utama + Sekunder 1-4)
│   ├── Prosedur/Tindakan (Utama + Sekunder 1-3)
│   ├── Laporan Tindakan:
│   │   ├── Keluhan
│   │   ├── Pemeriksaan
│   │   ├── Tensi, Respirasi, Nadi
│   ├── Dirawat Inapkan: Ya/Tidak
│   ├── Kunjungan Awal: Ya/Tidak
│   ├── Kunjungan Lanjutan: Ya/Tidak
│   ├── Observasi
│   ├── Post Operasi
│   └── QR Code Dokter
└── Resume Rawat Inap (jika Ranap):
    ├── Dokter DPJP
    ├── Nomor Rawat
    ├── Diagnosa Masuk
    ├── Keluhan Utama + Riwayat Penyakit
    ├── Jalannya Penyakit Selama Perawatan
    ├── Pemeriksaan Fisik
    ├── Pemeriksaan Penunjang
    ├── Pemeriksaan Laboratorium
    ├── Diagnosa (Utama + Sekunder 1-4)
    ├── Prosedur/Tindakan (Utama + Sekunder 1-3)
    ├── Obat-obatan Waktu Pulang/Nasihat
    ├── Kondisi Pulang
    └── QR Code DPJP

📄 SECTION 9: BILLING / RINCIAN BIAYA
├── Mode Legacy (tabel `billing`):
│   └── Tabel: No | Nama Perawatan | Pemisah | Biaya | Jumlah | Tambahan | Total
│
├── Mode mLite Rawat Jalan:
│   ├── I. Biaya Pendaftaran Poliklinik
│   ├── II. Biaya Obat & BHP
│   ├── III. Jasa Dokter
│   ├── IV. Jasa Perawat
│   ├── V. Jasa Dokter & Perawat
│   ├── VI. Jasa Laboratorium
│   ├── VII. Jasa Radiologi
│   ├── VIII. Jasa Operasi
│   ├── IX. Obat dan BHP Operasi
│   ├── Jumlah, Potongan, Jumlah Bayar
│   └── Terbilang
│
├── Mode mLite Rawat Inap:
│   ├── I. Biaya Kamar
│   ├── II. Biaya Obat & BHP
│   ├── III - IX. (sama dengan Ralan)
│   ├── X. Biaya Tambahan
│   ├── Jumlah, Potongan, Jumlah Bayar
│   └── Terbilang
│
├── QR Code Keluarga Pasien
└── QR Code Kasir

📄 SECTION 10: SPRI - SURAT PERINTAH RAWAT INAP (jika ada)
├── Header BPJS + Logo
├── No. Surat, Tgl. Surat
├── Kepada (Nama Dokter BPJS, Poli BPJS)
├── Barcode Nomor Surat
├── No. Kartu BPJS
├── Nama Pasien, Jenis Kelamin
├── Tgl. Lahir
├── Diagnosa Awal
├── Tgl. Entri/Rencana
├── QR Code Nama Pasien
└── Tgl. Cetak

📄 SECTION 11: BERKAS DIGITAL - IDENTITAS PASIEN (jika ada)
└── Galeri gambar berkas identitas:
    ├── Kartu BPJS
    ├── KTP
    ├── KK
    └── dll.

📄 SECTION 12: BERKAS DIGITAL - RADIOLOGI (jika ada)
└── Galeri gambar hasil radiologi

📄 SECTION 13: BERKAS DIGITAL - PERAWATAN (jika ada)
└── Galeri gambar berkas perawatan:
    ├── SEP
    ├── SKDP / Form DPJP
    ├── Hasil Lab
    ├── Laporan Operasi
    ├── Resume Medis
    └── dll.
```

---

#### 🗃️ DETAIL TABEL DATABASE & FIELD

##### Section 1: SEP (Surat Eligibilitas Peserta)

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `bridging_sep` | `no_sep`, `no_rawat`, `tglsep`, `no_kartu`, `nomr`, `nama_pasien`, `peserta`, `tanggal_lahir`, `jkel`, `jnspelayanan`, `notelep`, `klsrawat`, `klsnaik`, `nmpolitujuan`, `nmdpdjp`, `nmppkrujukan`, `nmdiagnosaawal`, `catatan`, `tglrujukan`, `cob` | Data utama SEP dari VClaim |
| `bpjs_prb` | `no_sep`, `prb` | Status Program Rujuk Balik |

**Relasi:**
```
bridging_sep.no_rawat → reg_periksa.no_rawat
bridging_sep.no_sep → bpjs_prb.no_sep
```

##### Section 2: Data Pasien & Registrasi

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `pasien` | `no_rkm_medis`, `nm_pasien`, `alamat`, `jk`, `tmp_lahir`, `tgl_lahir`, `nm_ibu`, `gol_darah`, `stts_nikah`, `agama`, `pnd`, `tgl_daftar`, `kd_kec`, `kd_kab` | Master data pasien |
| `kecamatan` | `kd_kec`, `nm_kec` | Referensi kecamatan |
| `kabupaten` | `kd_kab`, `nm_kab` | Referensi kabupaten |
| `reg_periksa` | `no_rawat`, `no_reg`, `no_rkm_medis`, `tgl_registrasi`, `jam_reg`, `kd_dokter`, `kd_poli`, `kd_pj`, `status_lanjut`, `stts`, `p_jawab`, `almt_pj`, `hubunganpj`, `status_poli` | Data registrasi kunjungan |
| `dokter` | `kd_dokter`, `nm_dokter` | Master data dokter |
| `poliklinik` | `kd_poli`, `nm_poli`, `registrasi` | Master data poliklinik |
| `penjab` | `kd_pj`, `png_jawab` | Penanggung jawab/cara bayar |
| `dpjp_ranap` | `no_rawat`, `kd_dokter`, `nomor` | DPJP untuk rawat inap (multiple) |

**Relasi:**
```
pasien.no_rkm_medis → reg_periksa.no_rkm_medis
pasien.kd_kec → kecamatan.kd_kec
pasien.kd_kab → kabupaten.kd_kab
reg_periksa.kd_dokter → dokter.kd_dokter
reg_periksa.kd_poli → poliklinik.kd_poli
reg_periksa.kd_pj → penjab.kd_pj
dpjp_ranap.no_rawat → reg_periksa.no_rawat
dpjp_ranap.kd_dokter → dokter.kd_dokter
```

##### Section 2: Diagnosa & Prosedur

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `diagnosa_pasien` | `no_rawat`, `kd_penyakit`, `status`, `prioritas` | Link diagnosa ke rawat |
| `penyakit` | `kd_penyakit`, `nm_penyakit` | Master ICD-10 |
| `prosedur_pasien` | `no_rawat`, `kode`, `status`, `prioritas` | Link prosedur ke rawat |
| `icd9` | `kode`, `deskripsi_panjang` | Master ICD-9 |

**Relasi:**
```
diagnosa_pasien.no_rawat → reg_periksa.no_rawat
diagnosa_pasien.kd_penyakit → penyakit.kd_penyakit
prosedur_pasien.no_rawat → reg_periksa.no_rawat
prosedur_pasien.kode → icd9.kode
```

##### Section 2: Pemeriksaan SOAP

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `pemeriksaan_ralan` | `no_rawat`, `tgl_perawatan`, `jam_rawat`, `suhu_tubuh`, `tensi`, `nadi`, `respirasi`, `tinggi`, `berat`, `gcs`, `kesadaran`, `keluhan`, `pemeriksaan`, `penilaian`, `rtl`, `instruksi`, `evaluasi`, `alergi` | SOAP rawat jalan |
| `pemeriksaan_ranap` | (field sama dengan ralan) | SOAP rawat inap |

**Relasi:**
```
pemeriksaan_ralan.no_rawat → reg_periksa.no_rawat
pemeriksaan_ranap.no_rawat → reg_periksa.no_rawat
```

##### Section 3: Tindakan Medis

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `rawat_jl_dr` | `no_rawat`, `kd_jenis_prw`, `kd_dokter`, `tgl_perawatan`, `biaya_rawat` | Tindakan ralan oleh dokter |
| `rawat_jl_pr` | `no_rawat`, `kd_jenis_prw`, `nip`, `tgl_perawatan`, `biaya_rawat` | Tindakan ralan oleh perawat |
| `rawat_jl_drpr` | `no_rawat`, `kd_jenis_prw`, `kd_dokter`, `nip`, `tgl_perawatan`, `biaya_rawat` | Tindakan ralan dokter+perawat |
| `rawat_inap_dr` | (field sama dengan rawat_jl_dr) | Tindakan ranap oleh dokter |
| `rawat_inap_pr` | (field sama dengan rawat_jl_pr) | Tindakan ranap oleh perawat |
| `rawat_inap_drpr` | (field sama dengan rawat_jl_drpr) | Tindakan ranap dokter+perawat |
| `jns_perawatan` | `kd_jenis_prw`, `nm_perawatan` | Master jenis perawatan ralan |
| `jns_perawatan_inap` | `kd_jenis_prw`, `nm_perawatan` | Master jenis perawatan ranap |
| `petugas` | `nip`, `nama` | Master data petugas/perawat |

**Relasi:**
```
rawat_jl_dr.kd_jenis_prw → jns_perawatan.kd_jenis_prw
rawat_jl_dr.kd_dokter → dokter.kd_dokter
rawat_jl_pr.nip → petugas.nip
rawat_inap_dr.kd_jenis_prw → jns_perawatan_inap.kd_jenis_prw
```

##### Section 3: Kamar Inap

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `kamar_inap` | `no_rawat`, `kd_kamar`, `tgl_masuk`, `jam_masuk`, `tgl_keluar`, `jam_keluar`, `lama`, `stts_pulang`, `trf_kamar`, `ttl_biaya` | Data rawat inap |
| `kamar` | `kd_kamar`, `kd_bangsal` | Master kamar |
| `bangsal` | `kd_bangsal`, `nm_bangsal` | Master bangsal |

**Relasi:**
```
kamar_inap.no_rawat → reg_periksa.no_rawat
kamar_inap.kd_kamar → kamar.kd_kamar
kamar.kd_bangsal → bangsal.kd_bangsal
```

##### Section 4: Operasi

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `operasi` | `no_rawat`, `tgl_operasi`, `kode_paket`, `jenis_anasthesi`, `status`, `biayaoperator1`, `biayaoperator2`, `biayaoperator3`, `biayaasisten_operator1`, `biayaasisten_operator2`, `biayadokter_anak`, `biayaperawaat_resusitas`, `biayadokter_anestesi`, `biayaasisten_anestesi`, `biayabidan`, `biayaperawat_luar` | Data operasi + breakdown biaya |
| `paket_operasi` | `kode_paket`, `nm_perawatan` | Master paket operasi |
| `laporan_operasi` | `no_rawat`, `tanggal`, `selesaioperasi`, `diagnosa_preop`, `diagnosa_postop`, `jaringan_dieksekusi`, `permintaan_pa`, `laporan_operasi` | Resume laporan operasi |

**Relasi:**
```
operasi.no_rawat → reg_periksa.no_rawat
operasi.kode_paket → paket_operasi.kode_paket
laporan_operasi.no_rawat → reg_periksa.no_rawat
```

##### Section 5: Radiologi

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `periksa_radiologi` | `no_rawat`, `tgl_periksa`, `jam`, `kd_jenis_prw`, `kd_dokter`, `nip`, `biaya`, `status` | Data pemeriksaan radiologi |
| `jns_perawatan_radiologi` | `kd_jenis_prw`, `nm_perawatan` | Master jenis radiologi |
| `hasil_radiologi` | `no_rawat`, `tgl_periksa`, `jam`, `hasil`, `klinis`, `kesan`, `saran`, `judul` | Hasil interpretasi radiologi |
| `gambar_radiologi` | `no_rawat`, `lokasi_gambar` | Gambar hasil radiologi |

**Relasi:**
```
periksa_radiologi.kd_jenis_prw → jns_perawatan_radiologi.kd_jenis_prw
periksa_radiologi.kd_dokter → dokter.kd_dokter
periksa_radiologi.nip → petugas.nip
hasil_radiologi.no_rawat → reg_periksa.no_rawat
gambar_radiologi.no_rawat → reg_periksa.no_rawat
```

##### Section 6: Laboratorium

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `periksa_lab` | `no_rawat`, `tgl_periksa`, `jam`, `kd_jenis_prw`, `biaya`, `status` | Data pemeriksaan lab |
| `jns_perawatan_lab` | `kd_jenis_prw`, `nm_perawatan` | Master jenis lab |
| `detail_periksa_lab` | `no_rawat`, `kd_jenis_prw`, `id_template`, `nilai`, `nilai_rujukan`, `satuan`, `keterangan` | Detail hasil lab per parameter |
| `template_laboratorium` | `id_template`, `Pemeriksaan` | Master template parameter lab |

**Relasi:**
```
periksa_lab.kd_jenis_prw → jns_perawatan_lab.kd_jenis_prw
detail_periksa_lab.id_template → template_laboratorium.id_template
detail_periksa_lab.no_rawat + kd_jenis_prw → periksa_lab.no_rawat + kd_jenis_prw
```

##### Section 7: Obat & Farmasi

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `detail_pemberian_obat` | `no_rawat`, `tgl_perawatan`, `jam`, `kode_brng`, `jml`, `biaya_obat`, `total`, `status` | Pemberian obat ke pasien |
| `databarang` | `kode_brng`, `nama_brng`, `kode_sat` | Master databarang/obat |
| `beri_obat_operasi` | `no_rawat`, `tanggal`, `kd_obat`, `jumlah`, `hargasatuan` | Obat yang dipakai saat operasi |
| `obatbhp_ok` | `kd_obat`, `nm_obat` | Master obat/BHP kamar operasi |
| `resep_pulang` | `no_rawat`, `tgl_perawatan`, `jam`, `kode_brng`, `jml_barang`, `dosis` | Resep obat pulang |

**Relasi:**
```
detail_pemberian_obat.kode_brng → databarang.kode_brng
beri_obat_operasi.kd_obat → obatbhp_ok.kd_obat
resep_pulang.kode_brng → databarang.kode_brng
```

##### Section 8: Resume Medis

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `resume_pasien` | `no_rawat`, `kd_dokter`, `diagnosa_utama`, `diagnosa_sekunder`, `diagnosa_sekunder2`, `diagnosa_sekunder3`, `diagnosa_sekunder4`, `prosedur_utama`, `prosedur_sekunder`, `prosedur_sekunder2`, `prosedur_sekunder3` | Resume rawat jalan |
| `resume_pasien_ranap` | `no_rawat`, `kd_dokter`, `diagnosa_awal`, `keluhan_utama`, `jalannya_penyakit`, `pemeriksaan_fisik`, `pemeriksaan_penunjang`, `hasil_laborat`, `diagnosa_utama`, `diagnosa_sekunder*`, `prosedur_utama`, `prosedur_sekunder*`, `obat_pulang`, `kondisi_pulang` | Resume rawat inap |

**Relasi:**
```
resume_pasien.no_rawat → reg_periksa.no_rawat
resume_pasien.kd_dokter → dokter.kd_dokter
resume_pasien_ranap.no_rawat → reg_periksa.no_rawat
resume_pasien_ranap.kd_dokter → dokter.kd_dokter
```

##### Section 9: Billing

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `billing` | `no_rawat`, `no`, `nm_perawatan`, `pemisah`, `biaya`, `jumlah`, `tambahan`, `totalbiaya` | Billing format legacy |
| `mlite_billing` | `id_billing`, `kd_billing`, `no_rawat`, `id_user`, `jumlah_total`, `potongan`, `jumlah_harus_bayar` | Billing format mLite |
| `tambahan_biaya` | `no_rawat`, `nama_biaya`, `besar_biaya` | Biaya tambahan ranap |

**Relasi:**
```
billing.no_rawat → reg_periksa.no_rawat
mlite_billing.no_rawat → reg_periksa.no_rawat
tambahan_biaya.no_rawat → reg_periksa.no_rawat
```

##### Section 10: SPRI (Surat Perintah Rawat Inap)

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `bridging_surat_pri_bpjs` | `no_surat`, `no_rawat`, `no_kartu`, `tgl_surat`, `tgl_rencana`, `nm_dokter_bpjs`, `nm_poli_bpjs`, `diagnosa` | Data SPRI dari VClaim |

**Relasi:**
```
bridging_surat_pri_bpjs.no_rawat → reg_periksa.no_rawat
```

##### Section 11-13: Berkas Digital

| Tabel | Field Utama | Keterangan |
|-------|-------------|------------|
| `berkas_digital_perawatan` | `no_rawat`, `kode`, `lokasi_file` | Berkas perawatan per kunjungan |
| `master_berkas_digital` | `kode`, `nama` | Master kategori berkas |

**Relasi:**
```
berkas_digital_perawatan.no_rawat → reg_periksa.no_rawat
berkas_digital_perawatan.kode → master_berkas_digital.kode
```

---

#### 🔗 ENTITY RELATIONSHIP DIAGRAM (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ERD DATA KLAIM VEDIKA                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   pasien     │
                              │─────────────-│
                              │ no_rkm_medis │◄───────────────────────────────┐
                              │ nm_pasien    │                                │
                              │ ...          │                                │
                              └──────┬───────┘                                │
                                     │                                        │
                                     │ 1:N                                    │
                                     ▼                                        │
┌─────────────┐              ┌──────────────┐              ┌─────────────────┐│
│ bridging_sep│◄─────────────│  reg_periksa │─────────────►│ diagnosa_pasien ││
│─────────────│   1:1        │──────────────│   1:N        │─────────────────││
│ no_sep      │              │ no_rawat(PK) │              │ kd_penyakit     ││
│ no_rawat    │              │ no_rkm_medis │              └────────┬────────┘│
│ ...         │              │ kd_dokter    │                       │         │
└─────────────┘              │ kd_poli      │                       │         │
                              │ kd_pj        │              ┌────────▼────────┐│
                              │ status_lanjut│              │    penyakit     ││
                              └──────┬───────┘              │─────────────────││
                                     │                      │ kd_penyakit     ││
           ┌─────────────────────────┼─────────────────────┐│ nm_penyakit     ││
           │                         │                     │└─────────────────┘│
           ▼                         ▼                     ▼                   │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│ pemeriksaan_    │    │   rawat_jl_dr   │    │  kamar_inap     │             │
│ ralan/ranap     │    │   rawat_jl_pr   │    │─────────────────│             │
│─────────────────│    │   rawat_jl_drpr │    │ kd_kamar        │             │
│ keluhan         │    │   rawat_inap_*  │    │ tgl_masuk       │             │
│ pemeriksaan     │    │─────────────────│    │ tgl_keluar      │             │
│ penilaian       │    │ kd_jenis_prw    │    └────────┬────────┘             │
│ rtl             │    │ biaya_rawat     │             │                      │
│ instruksi       │    └────────┬────────┘             ▼                      │
│ evaluasi        │             │            ┌─────────────────┐              │
│ alergi          │             ▼            │     kamar       │              │
└─────────────────┘    ┌─────────────────┐   │─────────────────│              │
                        │ jns_perawatan*  │   │ kd_bangsal      │              │
                        │─────────────────│   └────────┬────────┘              │
                        │ nm_perawatan    │            │                       │
                        └─────────────────┘            ▼                       │
                                           ┌─────────────────┐                 │
       ┌─────────────────┐                 │    bangsal      │                 │
       │    operasi      │                 │─────────────────│                 │
       │─────────────────│                 │ nm_bangsal      │                 │
       │ kode_paket      │◄────┐           └─────────────────┘                 │
       │ tgl_operasi     │     │                                              │
       │ jenis_anasthesi │     │           ┌─────────────────┐                 │
       └────────┬────────┘     │           │   periksa_lab   │                 │
                │              │           │─────────────────│◄────────────────┤
                ▼              │           │ kd_jenis_prw    │                 │
       ┌─────────────────┐     │           └────────┬────────┘                 │
       │ laporan_operasi │     │                    │                          │
       │─────────────────│     │                    ▼                          │
       │ diagnosa_preop  │     │           ┌─────────────────┐                 │
       │ diagnosa_postop │     │           │detail_periksa_lab│                │
       │ laporan_operasi │     │           │─────────────────│                 │
       └─────────────────┘     │           │ nilai           │                 │
                               │           │ nilai_rujukan   │                 │
       ┌─────────────────┐     │           └─────────────────┘                 │
       │  paket_operasi  │─────┘                                              │
       │─────────────────│                 ┌─────────────────┐                 │
       │ nm_perawatan    │                 │ resume_pasien   │◄────────────────┤
       └─────────────────┘                 │ resume_pasien_  │                 │
                                           │ ranap           │                 │
       ┌─────────────────┐                 │─────────────────│                 │
       │detail_pemberian_│◄────────────────│ diagnosa_utama  │                 │
       │obat             │                 │ prosedur_utama  │                 │
       │─────────────────│                 │ kondisi_pulang  │                 │
       │ kode_brng       │                 └─────────────────┘                 │
       │ jml             │                                                     │
       └────────┬────────┘                 ┌─────────────────┐                 │
                │                          │ mlite_billing   │◄────────────────┤
                ▼                          │─────────────────│                 │
       ┌─────────────────┐                 │ jumlah_total    │                 │
       │   databarang    │                 │ potongan        │                 │
       │─────────────────│                 │ jumlah_harus_   │                 │
       │ nama_brng       │                 │ bayar           │                 │
       │ kode_sat        │                 └─────────────────┘                 │
       └─────────────────┘                                                     │
                                           ┌─────────────────┐                 │
                                           │berkas_digital_  │◄────────────────┘
                                           │perawatan        │
                                           │─────────────────│
                                           │ lokasi_file     │
                                           │ kode            │
                                           └────────┬────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │master_berkas_   │
                                           │digital          │
                                           │─────────────────│
                                           │ nama            │
                                           └─────────────────┘
```

---

#### ⚙️ LOGIKA CONTROLLER `getPDF()`

**File:** `Admin.php` (baris 1439-1895)

**Alur Proses:**
1. Decode `no_rawat` dari URL
2. Cek mode billing (legacy `billing` atau `mlite_billing`)
3. Jika mode mLite:
   - Cek `status_lanjut` (Ralan/Ranap)
   - Query data billing sesuai tipe rawat
4. Query data SEP dari `bridging_sep` + `bpjs_prb`
5. Query data SPRI dari `bridging_surat_pri_bpjs`
6. Query Resume Medis (`resume_pasien` atau `resume_pasien_ranap`)
7. Query Data Pasien + Registrasi
8. Query DPJP Ranap (jika ranap)
9. Query Diagnosa + Prosedur
10. Query Pemeriksaan SOAP (Ralan/Ranap)
11. Query Tindakan Medis (6 jenis)
12. Query Kamar Inap
13. Query Operasi + Laporan Operasi
14. Query Radiologi (Tindakan + Hasil + Gambar)
15. Query Laboratorium (Header + Detail per Parameter)
16. Query Obat (Pemberian + Operasi + Resep Pulang)
17. Query Berkas Digital
18. Render template `pdf.html`

**Pengaturan Billing:**
```php
$this->settings->get('vedika.billing')
// Nilai: 'mlite' atau kosong (legacy)
```

---

#### 📌 CATATAN PENTING

1. **QR Code**: Setiap section penting memiliki QR Code untuk verifikasi digital (SEP, DPJP, Kasir)

2. **Page Break**: Template menggunakan `page-break-before:always` untuk memisahkan section saat dicetak

3. **Kondisional**: Section hanya tampil jika data tersedia (contoh: Operasi hanya tampil jika `$operasi` tidak kosong)

4. **Mode Billing**:
   - **Legacy**: Menggunakan tabel `billing` (Khanza)
   - **mLite**: Menggunakan tabel `mlite_billing` dengan breakdown detail per kategori

5. **Status Filter**: 
   - Diagnosa/Prosedur filter berdasarkan `status` = 'Ralan' atau 'Ranap'
   - Pemberian obat filter berdasarkan `status` = 'Ralan' atau 'Ranap'

6. **Multiple DPJP**: Untuk rawat inap, dokter PJ bisa lebih dari satu (dari tabel `dpjp_ranap`)

#### Kegunaan:
1. **Review data** sebelum mengajukan klaim
2. **Cetak dokumen** untuk arsip fisik
3. **Validasi kelengkapan** data medis dan administrasi
4. **Dokumen pendukung** untuk verifikasi BPJS

---

### 🟢 Tombol 3: "Status"

**Tampilan:** 
- 🟡 Kuning (disabled) jika belum ada SEP
- 🟢 Hijau (aktif) jika sudah ada SEP

**Fungsi:** Mengubah status klaim dan menambahkan catatan.

**Modal Form:** Lihat bagian **6.1 Modal Set Status**.

**Pilihan Status:**
| Status | Warna Badge | Keterangan |
|--------|-------------|------------|
| Lengkap | 🟡 Warning | Berkas lengkap, siap diajukan |
| Pengajuan | 🔵 Primary | Sudah diajukan ke BPJS |
| Perbaiki | 🔴 Error | Perlu perbaikan/koreksi |
| Setuju | 🟢 Success | Klaim disetujui |

---

### 🔴 Tombol 4: "Hapus"

**Tampilan:** Button merah dengan icon `fa-trash`

**Fungsi:** Menghapus data klaim dari tabel `mlite_vedika`.

**Kondisi Tampil:** Hanya muncul jika sudah ada SEP.

**Proses:**
1. Tampil konfirmasi dengan bootbox
2. Jika dikonfirmasi, redirect ke `/admin/vedika/hapus/{no_sep}`
3. Data dihapus dari `mlite_vedika`
4. Pasien kembali muncul di halaman Index

---

### 🔵 Tombol 5: "Unggah Berkas Perawatan"

**Tampilan:** Button biru dengan teks "Unggah Berkas Perawatan"

**Fungsi:** Upload berkas digital pendukung klaim.

**Modal Form:** Lihat bagian **6.2 Modal Berkas Perawatan**.

**Kategori Berkas yang bisa diupload:**
- SEP
- Kartu BPJS
- KTP
- SKDP / Form DPJP
- Hasil Lab
- Hasil Radiologi
- Laporan Operasi
- Resume Medis
- dll (sesuai `master_berkas_digital`)

---

### 🔴 Tombol 6: "Resume"

**Tampilan:** Button merah dengan teks "Resume"

**Fungsi:** Membuka form input resume medis.

**Modal Form:**
- Ralan: `form.resume.html`
- Ranap: `form.resume.ranap.html`

**Isi Form Resume:**
- Anamnesa/Keluhan Utama
- Pemeriksaan Fisik
- Diagnosa Akhir
- Terapi/Tindakan
- Anjuran/Instruksi
- Dokter Penanggung Jawab

---

### 🔗 Link "Dx. Utama" dan "Pros. Utama"

**Tampilan:** Link teks di kolom Data Kunjungan

**Fungsi:** 
- **Dx. Utama** → Buka modal ubah diagnosa (ICD-10)
- **Pros. Utama** → Buka modal ubah prosedur (ICD-9)

**Modal Form:**
- `ubah.diagnosa.html` → Edit/tambah diagnosa
- `ubah.prosedur.html` → Edit/tambah prosedur

### 5.2 Kolom "Data Pasien"

| Field | Sumber Data |
|-------|-------------|
| No.Rawat | `reg_periksa.no_rawat` |
| No.RM | `reg_periksa.no_rkm_medis` |
| Nama Pasien | `pasien.nm_pasien` |
| Umur | `reg_periksa.umurdaftar` + `reg_periksa.sttsumur` |
| Jenis Kelamin | `pasien.jk` (L=Laki-Laki, P=Perempuan) |
| Alamat | `pasien.alamat` (truncated 20 karakter) |

### 5.3 Kolom "Data Registrasi"

| Field | Ralan | Ranap |
|-------|-------|-------|
| **Label Tanggal** | Tgl.Registrasi | Tgl.Pulang |
| **Nilai Tanggal** | `reg_periksa.tgl_registrasi` | `kamar_inap.tgl_keluar` |
| **Label Unit** | Poliklinik | Bangsal/kamar |
| **Nilai Unit** | `poliklinik.nm_poli` | `bangsal.nm_bangsal/kamar.kd_kamar` |
| **Dokter** | `dokter.nm_dokter` (single) | `dpjp_ranap` (multiple) |
| **Status** | `status_lanjut` + `penjab.png_jawab` | `status_lanjut` + `penjab.png_jawab` |

### 5.4 Kolom "Data Kunjungan"

| Field | Sumber Data | Aksi |
|-------|-------------|------|
| No. Kunjungan | `bridging_sep.no_rujukan` | - |
| No. Kartu | `bridging_sep.no_kartu` | - |
| Dx. Utama | `diagnosa_pasien` → `penyakit` | 🔗 Link ke modal "Ubah Diagnosa" |
| Pros. Utama | `prosedur_pasien` → `icd9` | 🔗 Link ke modal "Ubah Prosedur" |

### 5.5 Kolom "Berkas Digital"

| Komponen | Tipe | Fungsi |
|----------|------|--------|
| "Unggah Berkas Perawatan" | 🔵 btn-info | Buka modal upload berkas |
| Daftar Berkas | Link List | Klik untuk preview (lightbox) |
| 🗑️ Hapus | 🔴 btn-danger | Hapus berkas per item |
| "Resume" | 🔴 btn-danger | Buka form resume medis |

---

## 6. Modal Pop-up

### 6.1 Modal Set Status (`setstatus.html`)

**Trigger:** Klik tombol "Status" hijau

**Form Fields:**

| Field | Tipe | Readonly | Value Awal |
|-------|------|----------|------------|
| No. Rekam Medis | Text Input | No | `bridging_sep.nomr` |
| Nomor Rawat | Text Input | No | `bridging_sep.no_rawat` |
| Nomor SEP | Text Input | No | `bridging_sep.no_sep` |
| Status Klaim | Select | No | Options: Lengkap, Pengajuan, Perbaiki, Disetujui |
| Catatan dan Umpan Balik | Textarea | No | Kosong |

**Hidden Fields:**
- `tgl_registrasi` → dari `bridging_sep.tglsep`
- `jnspelayanan` → dari `bridging_sep.jnspelayanan`

**Riwayat Feedback:**
- Ditampilkan di bawah form
- Menampilkan avatar berbeda untuk BPJS vs RS
- Format: Username + Tanggal + Isi Catatan

**Aksi Submit:**
1. Insert/Update ke tabel `mlite_vedika`
2. Insert ke tabel `mlite_vedika_feedback`
3. Refresh halaman

---

### 6.2 Modal Berkas Perawatan (`berkasperawatan.html`)

**Trigger:** Klik tombol "Unggah Berkas Perawatan"

**Komponen:**

| Bagian | Isi |
|--------|-----|
| **Gallery** | Thumbnail berkas yang sudah diupload (lightbox preview) |
| **Form Upload** | Input file + kategori berkas |

**Form Fields:**

| Field | Tipe | Keterangan |
|-------|------|------------|
| Nomor Rawat | Text Input | Readonly, terisi otomatis |
| Kategori Berkas | Select | Dari tabel `master_berkas_digital` |
| Pilih Berkas | File Input | Upload gambar atau PDF |

**Aksi Submit:**
1. Simpan file ke `webapps/berkasrawat/pages/upload/`
2. Insert ke tabel `berkas_digital_perawatan`

---

## 7. JavaScript Interaktif

### 7.1 Hapus Data Vedika

```javascript
// Trigger: Klik tombol "Hapus" merah
$(\"#display\").on(\"click\", \".hapus_vedika\", function(event){
    // Konfirmasi dengan bootbox
    bootbox.confirm("Apakah Anda yakin ingin menghapus data ini?", function(result){
        if (result){
            // Redirect ke: /admin/vedika/hapus/{no_sep}
        }
    });
});
```

### 7.2 Hapus Berkas Digital

```javascript
// Trigger: Klik icon trash pada berkas
$(\"#display\").on(\"click\", \".hapus_berkas\", function(event){
    // Konfirmasi dengan bootbox
    bootbox.confirm("Apakah Anda yakin ingin menghapus data ini?", function(result){
        if (result){
            // Redirect ke: /admin/vedika/hapusberkas/{no_rawat}/{nama_file}
        }
    });
});
```

### 7.3 Lightbox Gallery

```javascript
// Untuk preview berkas digital
$('.gallery').lightbox();
```

### 7.4 Datepicker

```javascript
// Format tanggal Indonesia
$('.tanggal').datetimepicker({
    defaultDate: 'YYYY-MM-DD',
    format: 'YYYY-MM-DD',
    locale: 'id'
});
```

---

## 8. Query Database

### 8.1 Query Rawat Jalan (Ralan)

```sql
SELECT 
    reg_periksa.*, 
    pasien.*, 
    dokter.nm_dokter, 
    poliklinik.nm_poli, 
    penjab.png_jawab 
FROM reg_periksa, pasien, dokter, poliklinik, penjab 
WHERE reg_periksa.no_rkm_medis = pasien.no_rkm_medis 
  AND reg_periksa.kd_dokter = dokter.kd_dokter 
  AND reg_periksa.kd_poli = poliklinik.kd_poli 
  AND reg_periksa.kd_pj = penjab.kd_pj 
  AND penjab.kd_pj IN ('BPJ','A02','A03')  -- sesuai vedika.carabayar
  AND reg_periksa.tgl_registrasi BETWEEN ? AND ?
  AND reg_periksa.status_lanjut = 'Ralan' 
  AND reg_periksa.no_rawat NOT IN (SELECT no_rawat FROM mlite_vedika)
LIMIT 10 OFFSET 0
```

### 8.2 Query Rawat Inap (Ranap)

```sql
SELECT 
    reg_periksa.*, 
    pasien.*, 
    dokter.nm_dokter, 
    poliklinik.nm_poli, 
    penjab.png_jawab,
    kamar_inap.tgl_keluar, 
    kamar_inap.jam_keluar, 
    kamar_inap.kd_kamar 
FROM reg_periksa, pasien, dokter, poliklinik, penjab, kamar_inap 
WHERE reg_periksa.no_rkm_medis = pasien.no_rkm_medis 
  AND reg_periksa.no_rawat = kamar_inap.no_rawat
  AND reg_periksa.kd_dokter = dokter.kd_dokter 
  AND reg_periksa.kd_poli = poliklinik.kd_poli 
  AND reg_periksa.kd_pj = penjab.kd_pj 
  AND penjab.kd_pj IN ('BPJ','A02','A03')
  AND kamar_inap.tgl_keluar BETWEEN ? AND ?
  AND reg_periksa.status_lanjut = 'Ranap'
LIMIT 10 OFFSET 0
```

---

## 9. Alur Kerja di Halaman Index

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ALUR KERJA HALAMAN INDEX                             │
└─────────────────────────────────────────────────────────────────────────────┘

  [Pasien BPJS Selesai Perawatan]
              │
              ▼
  ┌───────────────────────┐
  │ Muncul di Halaman     │
  │ INDEX (Belum Diproses)│
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐     Tidak ada SEP?     ┌───────────────────┐
  │ Cek apakah ada        │───────────────────────►│ Klik "Ambil SEP   │
  │ Nomor SEP?            │                        │ dari Vclaim"      │
  └───────────┬───────────┘                        └─────────┬─────────┘
              │ Ada SEP                                      │
              ▼                                              ▼
  ┌───────────────────────┐                        ┌───────────────────┐
  │ Klik "Status"         │◄───────────────────────│ SEP berhasil      │
  │ (Tombol Hijau)        │                        │ diambil           │
  └───────────┬───────────┘                        └───────────────────┘
              │
              ▼
  ┌───────────────────────┐
  │ Modal Set Status      │
  │ - Pilih status        │
  │ - Isi catatan         │
  │ - Klik Simpan         │
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ Data tersimpan ke:    │
  │ - mlite_vedika        │
  │ - mlite_vedika_feedback│
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ Data pindah ke        │
  │ halaman sesuai status:│
  │ - LENGKAP             │
  │ - PENGAJUAN           │
  │ - PERBAIKI            │
  └───────────────────────┘
```

---

## 10. Tips Penggunaan

| Tips | Keterangan |
|------|------------|
| 🔍 **Gunakan Search** | Cari cepat dengan no_rawat, no_RM, atau nama pasien |
| 📅 **Filter Tanggal** | Gunakan dropdown untuk filter periode tertentu |
| 📄 **Cek PDF Dulu** | Klik "Lihat Data Klaim" sebelum set status untuk review |
| 📎 **Upload Berkas** | Lengkapi berkas pendukung sebelum ajukan klaim |
| ✍️ **Isi Resume** | Pastikan resume medis sudah terisi lengkap |
