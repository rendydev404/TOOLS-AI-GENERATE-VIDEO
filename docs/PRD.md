# PRD — Rangkai (nama kerja)

> **Web app SaaS** yang menyusun **prompt video profesional & kompleks** untuk Google Flow dari jawaban sederhana, lalu **memandu user langkah demi langkah** untuk copy-paste prompt itu ke Google Flow milik mereka sendiri. Rangkai **tidak** menjalankan atau mengotomasi Flow.

| | |
|---|---|
| Status | v0.4 Final (21 Nov 2026) |
| Platform | Web app responsif (desktop & HP), browser modern |
| Pengguna | Publik, langsung pakai tanpa daftar/login |
| Hosting | VPS pemilik lewat Coolify (Docker 1 container ringan, tanpa database) |
| Generate video | Dilakukan **user sendiri** di Google Flow (akun Google AI Pro/Ultra mereka) |

### Riwayat keputusan
- v0.1 aplikasi desktop yang mengotomasi Flow → v0.2 web app + ekstensi Chrome → v0.3 web app Go + Postgres → **v0.4 (berlaku): web app React + Vite + TypeScript tanpa database & tanpa login, ditambah proxy server tipis Hono hanya untuk menyembunyikan API Key LLM pemilik server.** Seluruh proyek, pustaka, dan progres panduan disimpan instan di browser (`IndexedDB` + `localStorage`).

---

## 1. Masalah
1. Hasil bagus di Google Flow butuh prompt panjang dan teknis (aksi, kamera, lensa, cahaya, suara, gaya) untuk setiap klip.
2. Orang awam tidak tahu cara menulisnya, dan tidak tahu urutan kerja di Flow (bikin aset dulu, Frames vs Ingredients, model mana, cara menyambung scene).
3. Klip yang dibuat terpisah sering tidak konsisten (produk/karakter berubah).
4. Membuat banyak video berarti menulis ulang prompt berkali-kali.

## 2. Tujuan
| Tujuan | Ukuran keberhasilan |
|---|---|
| Awam bisa menghasilkan video pertama di Flow dengan panduan Rangkai | ≥80% user menyelesaikan semua langkah panduan proyek pertama |
| Tidak perlu menulis prompt | 0 kolom prompt wajib; semua prompt siap salin |
| Prompt menghasilkan video konsisten | ≥80% user menilai "produk/karakter tetap sama" |
| Cepat | Paket prompt jadi ≤20 dtk setelah wizard (LLM) / ≤1 dtk (mode offline) |
| Banyak produk | Mode massal: 1 CSV → paket prompt untuk ≤100 produk |
| Server hemat | API p95 < 150 ms (di luar panggilan LLM); 1 VPS 2 vCPU/4 GB melayani ribuan user |

## 3. Non-goal
- Mengotomasi/menjalankan Google Flow, ekstensi browser, menyimpan login Google.
- Generate gambar/video di server.
- Merakit video di server (panduan menjelaskan cara merakit di Flow Scenebuilder / unduh).
- Billing (disiapkan kuota per user, pembayaran menyusul).

## 4. Persona
Pemilik UMKM, affiliate/content creator, admin sosmed/agensi kecil, pemula. Semua punya (atau akan berlangganan) Google AI Pro/Ultra.

## 5. Prinsip produk
1. **Pilih, bukan ketik.** Kartu, chip, segmen; teks bebas opsional.
2. **Salin satu klik.** Setiap prompt punya tombol Salin dan status "Tersalin ✓".
3. **Satu langkah, satu tindakan.** Panduan memecah pekerjaan di Flow menjadi langkah kecil dengan nama tombol persis seperti di Flow.
4. **Konsisten otomatis.** Deskripsi produk/karakter yang sama disisipkan ke setiap prompt + langkah membuat aset referensi (Ingredients).
5. **Jujur soal credit.** Setiap langkah generate menampilkan perkiraan credit Flow.
6. **Bahasa awam** untuk penjelasan; prompt tetap dalam bahasa Inggris (hasil Veo terbaik), dialog/narasi bisa Bahasa Indonesia.

---

## 6. Arsitektur
```
Browser (desktop/HP)                         VPS (Coolify, Docker)
React SPA  ◄──── HTTPS JSON ────►  rangkai-server (Go, satu binary)
                                      ├─ Auth (email+password, sesi cookie)
                                      ├─ Director: paket prompt (offline template + LLM opsional)
                                      ├─ Proyek, scene, progres panduan, pustaka, batch (per user)
                                      └─ Ekspor (TXT/Markdown/CSV)
                                   PostgreSQL (Coolify)
```
| Bagian | Pilihan | Alasan |
|---|---|---|
| Server | Go `net/http`, satu binary, UI di-embed | Cepat, hemat RAM, satu origin |
| DB | PostgreSQL (`pgx`) | Multi-user; dev lokal pakai embedded-postgres |
| UI | React + Vite + TypeScript + Tailwind | Komponen sesuai design v3 |
| Director | Offline (template JSON, deterministik) + LLM (Anthropic, key di server) dengan fallback | Selalu jalan walau LLM mati |
| Panduan Flow | Langkah & label tombol disimpan sebagai data (JSON), bukan hard-code | UI Flow sering berubah → cukup ubah data |

---

## 7. Alur user
```
Daftar/Masuk → (sekali) "Persiapan": punya Google AI Pro/Ultra, buka Flow, kenali layar Flow
Buat video:  1 Template → 2 Produk → 3 Gaya → 4 Format & bahasa → Paket prompt (bisa edit per scene)
             → Mode Panduan: langkah demi langkah dengan tombol Salin & centang selesai
             → Selesai: cara merakit (Scenebuilder) & unduh, simpan ke proyek
```

### Isi "paket prompt" satu proyek
1. **Persiapan Flow**: buat proyek baru, atur rasio & model.
2. **Aset konsistensi**: prompt gambar (Nano Banana) untuk foto produk/karakter → disimpan sebagai *Ingredients*; atau unggah foto produk asli.
3. **Per scene**: mode (Frames/Ingredients), model, durasi, rasio, **prompt video lengkap** (aksi, kamera, lensa, cahaya, gaya, kunci produk/karakter, audio/dialog, larangan teks), perkiraan credit, tips bila ditolak.
4. **Sambung mulus** (opsional): ambil frame terakhir → jadikan Start frame scene berikutnya.
5. **Rakit & unduh**: Scenebuilder/Download, atau unduh klip lalu gabung di editor; teks penutup (CTA) siap salin untuk caption/overlay.
6. **Caption & hashtag** untuk posting (V1).

---

## 8. Fitur
Prioritas: **MVP** · **V1** · **V2**.

| Area | Fitur | Prioritas |
|---|---|---|
| Akun | Daftar/masuk email+password, sesi aman, data per user | MVP |
| Akun | Lupa kata sandi, masuk dengan Google | V1 |
| Template | Iklan Produk, Before–After, UGC Testimoni, Promo Makanan, Cerita Pendek, Edukasi Singkat, Unboxing, Promo Diskon (data JSON) | MVP: 4 pertama, V1: sisanya |
| Wizard | 4 langkah (template, produk, gaya, format & bahasa) + pratinjau alur | MVP |
| Director | Paket prompt offline + LLM (fallback otomatis) | MVP |
| Paket prompt | Kartu per scene, edit deskripsi/kamera/durasi → prompt disusun ulang, variasi prompt | MVP |
| Panduan | Langkah demi langkah, tombol Salin, centang selesai (tersimpan), progres %, perkiraan credit, tips "kalau ditolak" | MVP |
| Ekspor | Salin semua, unduh .txt / .md | MVP |
| Proyek | Daftar, cari, duplikat, hapus | MVP |
| Pustaka | Produk & karakter tersimpan (deskripsi kunci dipakai ulang) | V1 |
| Brand | Preset brand (nama, gaya, CTA default) | V1 |
| Massal | CSV → banyak paket prompt, ekspor CSV | V1 |
| Admin | Pemakaian, user, kuota | V2 |

---

## 9. Lingkup MVP
Akun; 4 template; wizard; Director (offline + LLM); paket prompt + edit scene; Mode Panduan dengan progres tersimpan; ekspor; daftar proyek; pengaturan dasar; Docker + Coolify.

### Kriteria penerimaan
- [ ] User baru bisa daftar dan mendapat paket prompt pertama ≤3 menit.
- [ ] Setiap langkah panduan punya instruksi + nama tombol Flow + (bila ada) prompt siap salin.
- [ ] Progres centang tersimpan dan muncul lagi di perangkat lain.
- [ ] Data user A tidak pernah terlihat user B (uji otomatis).
- [ ] Tanpa API key LLM, paket prompt tetap jadi (offline).
- [ ] Tampilan rapi di desktop 1440 px dan HP 390 px.

## 10. Kebutuhan non-fungsional
| Area | Target |
|---|---|
| Performa | API p95 < 150 ms; daftar proyek 1 query terpaginasi (keyset); kolom eksplisit; tanpa N+1 |
| Frontend | Bundle awal < 150 KB gzip; data di-cache (React Query `staleTime`); layar berat di-lazy-load |
| Keamanan | bcrypt; cookie HttpOnly+Secure+SameSite=Lax; header CSRF; filter `user_id` di semua query; rate limit login & Director |
| LLM | Timeout 40 dtk, fallback offline, batas panggilan per user/hari |

## 11. Model data (Postgres)
```
users       id, email (unik), password_hash, name, created_at
sessions    token_hash, user_id, expires_at, created_at
projects    id, user_id, name, template_id, status, answers jsonb, pack jsonb, progress jsonb, created_at, updated_at
scenes      id, project_id, idx, role, label, description, prompt, camera, duration_s, mode, updated_at
library     id, user_id, kind, name, lock_text, extra jsonb, created_at      (V1)
settings    user_id, key, value
```

## 12. Risiko
| Risiko | Mitigasi |
|---|---|
| UI Flow berubah → panduan tidak cocok | Langkah & label sebagai data (JSON) yang mudah diubah; tanggal "diperbarui" di panduan |
| Prompt ditolak Flow (kebijakan) | Prompt menghindari teks di video & konten sensitif; tips alternatif per scene |
| Biaya LLM | Fallback offline, kuota per user, cache paket |
| Penyalahgunaan publik | Rate limit, verifikasi email (V1) |

## 13. Metrik
Waktu sampai paket prompt pertama, % langkah panduan selesai, prompt disalin per proyek, proyek per user per minggu, tingkat fallback LLM.

## 14. Tahapan
1. MVP (lingkup §9) → 2. Beta tertutup → 3. V1 (pustaka, brand, massal, template tambahan, lupa kata sandi, OAuth).

## 15. Pertanyaan terbuka
Nama & domain; model bisnis; penyedia LLM & biaya; apakah perlu bahasa Inggris untuk UI.
