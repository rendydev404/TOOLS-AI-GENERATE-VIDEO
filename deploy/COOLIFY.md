# Panduan Deploy Rangkai di Coolify (Hermes + 9Router VPS 3)

Rangkai berjalan sebagai **1 container ringan tanpa database** (seluruh proyek, pustaka, dan progres panduan tersimpan di browser pengguna, sedangkan server Hono Node.js melayani SPA dan menghubungkan penyusunan prompt ke **Hermes / 9Router di VPS 3**).

## Langkah Deploy di Coolify

1. Buat resource baru di Coolify: **Application** → pilih repositori Git Rangkai.
2. Pilih **Build Pack**: `Dockerfile`.
3. Atur **Ports Exposes**: `8787`.
4. Masuk ke tab **Environment Variables** dan isi detail gateway VPS 3:
   - `AI_PROVIDER_NAME=Hermes · 9Router (VPS 3)`
   - `AI_BASE_URL=https://<domain-atau-ip-9router-vps3>/v1`
   - `AI_API_KEY=<api-key-9router-atau-hermes>`
   - `AI_MODEL=<nama-model-combo-9router>`
   - `AI_TIMEOUT_MS=45000`
   - `RATE_LIMIT_PER_MIN=30`
5. Klik **Deploy**. Setelah aktif, buka menu **Pengaturan** di web Rangkai lalu klik **Tes Koneksi 9Router** untuk memastikan koneksi ke model combo berjalan lancar.
