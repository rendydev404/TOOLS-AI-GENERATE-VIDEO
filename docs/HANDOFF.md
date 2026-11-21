# HANDOFF — Rangkai

> Dokumen serah terima & ringkasan implementasi akhir (v0.4 — 21 Nov 2026).

## Ringkasan Produk & Keputusan Arsitektur (v0.4)
**Web app penyusun paket prompt video profesional untuk Google Flow + pemandu langkah demi langkah.**
- **Tanpa Otomasi Flow**: User menyalin prompt 1-klik ke akun Google Flow mereka sendiri (`https://flow.google.com/?hl=en`).
- **Tanpa Database & Tanpa Login**: Langsung pakai begitu web dibuka. Semua proyek, progres centang panduan, pustaka produk/karakter, preset brand, dan pengaturan disimpan cepat di sisi browser (`IndexedDB` + `localStorage` fallback + Ekspor/Impor `.json`).
- **Proxy API Tipis Stateless (`Hono` + Node.js)**: Hanya melayani file statis SPA hasil build Vite serta endpoint `/api/director/enrich` & `/api/director/variation` untuk menyembunyikan API Key AI pemilik server (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, atau `OPENAI_API_KEY`) lengkap dengan rate-limit per IP dan fallback otomatis ke mesin deterministik offline (<5 ms).
- **UI/UX**: Mengikuti sistem desain `rangkai-design-v3` (`#2B59FF` electric blue, cool neutrals, mode Terang & Gelap, 100% custom controls tanpa `<select>`/native browser dialog, 0 warna gradien, 0 emoji — seluruhnya ikon SVG `lucide-react`).

## Struktur Repo
```text
docs/        PRD.md (v0.4), HANDOFF.md, FLOW-DRIVER-NOTES.md
design/      FigCraft design v3 + skrip referensi desain
shared/      Mesin Director deterministik, 8 template cerita JSON, data tombol UI Flow, eksportir TXT/MD/CSV
server/      Proxy API tipis Hono + static SPA server (dist/server/index.mjs)
src/         Frontend React 19 + Vite + TypeScript + Tailwind CSS v4
tests/       Unit & integration test Vitest untuk Director & eksportir
deploy/      Panduan deploy Coolify (+ Dockerfile & docker-compose.yml di root)
```

## Status Fase
| Fase | Status | Catatan |
|---|---|---|
| 1. Dokumentasi & Arsitektur v0.4 | Selesai | Disederhanakan ke Full TypeScript tanpa DB & tanpa login + proxy AI tipis |
| 2. Mesin Director & 8 Template | Selesai | 8 template aktif (15/20/30 dtk), kunci konsistensi produk/karakter, klausa anti-teks Veo |
| 3. Proxy Server Hono | Selesai | Mendukung Gemini, Anthropic, OpenAI-compatible + rate limit + fallback offline |
| 4. UI Lengkap + Fitur V1 | Selesai | Beranda, Wizard 4 langkah, Paket Prompt + Scene Inspector, Mode Panduan, Proyek, Galeri Template, Pustaka & Brand, Mode Massal CSV, Pengaturan, Command Palette (`Ctrl+K`) |
| 5. Docker + Coolify | Selesai | `Dockerfile` multi-stage Node 22 Alpine + `docker-compose.yml` + `deploy/COOLIFY.md` |
| 6. Uji Otomatis & Verifikasi Visual | Selesai | Vitest lulus (16 ms), bundle awal ~125 KB gzip (<150 KB target) |

## Cara Menjalankan
```bash
# Mode development (UI Vite di :5173 + API Proxy di :8787)
npm run dev

# Menjalankan tes otomatis & pengecekan tipe TypeScript
npm test
npm run typecheck

# Build & jalankan mode produksi satu server (:8787)
npm run build
npm start
```
