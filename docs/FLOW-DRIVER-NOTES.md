# Flow Driver Notes (spec port flow-mcp → Go/chromedp)

Sumber: `C:/Users/Creator MPB/flow-mcp` (commit `b64538a` + perubahan lokal di `src/flow.ts`: toggle Agent kini
`/^(Flow )?Agent$/`). Semua selector/string di bawah disalin verbatim. Referensi `file:line` relatif ke repo itu.
Cara flow-mcp mencari elemen: **Playwright `getByRole(role, {name})`** = role ARIA + *accessible name* (bukan CSS).
Di Go, siapkan helper `ByRole(role, name, exact)` berbasis CDP `Accessibility.queryAXTree` (lihat §10).

Aturan dasar penulis (CLAUDE.md:14-23): jangan menebak selector (petakan dari halaman live), apa pun yang
memakan kredit butuh OK pengguna, jangan pernah mengetik kredensial Google, **tidak ada penghindaran bot-detection**
(halaman memakai reCAPTCHA invisible; cukup jalankan UI asli dengan tempo manusia).

---

## 1. Chrome: launch / attach

| Item | Nilai | Ref |
|---|---|---|
| URL Flow | `https://flow.google.com/` (bukan `labs.google/fx/tools/flow`) | chrome.ts:7 |
| Host yang dianggap tab Flow | regex `^https:\/\/(flow\.google\.com\|labs\.google\/fx)` | chrome.ts:17 |
| Paksa bahasa Inggris | setiap load: set query `hl=en` (`inEnglish`) | chrome.ts:12-16 |
| Home dir | env `FLOW_MCP_HOME` atau `~/.flow-mcp` | chrome.ts:18 |
| Profile | `<HOME>/chrome-profile` (profil khusus, bukan profil harian) | chrome.ts:19 |
| Port CDP | env `FLOW_MCP_CDP_PORT` atau **9333**, `http://127.0.0.1:<port>` | chrome.ts:20-21 |

Discovery executable (urutan, ambil yang pertama `existsSync`) — chrome.ts:23-31, 46-50:
1. env `FLOW_MCP_CHROME`
2. `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
3. `/usr/bin/google-chrome`
4. `C:\Program Files\Google\Chrome\Application\chrome.exe`
5. `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
6. `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`
Gagal → error `"Google Chrome not found. Set FLOW_MCP_CHROME to the Chrome executable path."`

Flag launch (chrome.ts:55-65), proses `detached`, stdio ignore, `unref()`:
```
--user-data-dir=<PROFILE_DIR>  --remote-debugging-port=<CDP_PORT>
--no-first-run  --no-default-browser-check  https://flow.google.com/?hl=en
```
Tidak ada `--headless`, tidak ada flag stealth/automation. Chrome asli, berjendela.

Reuse instance (chrome.ts:35-42, 67-79):
- `cdpUp()` = `GET http://127.0.0.1:9333/json/version`, timeout **1500 ms**, ok → sudah jalan → **attach saja**
  (`connectOverCDP`). Kalau belum: launch, lalu poll `cdpUp` **40× tiap 500 ms** (20 s) → error
  `Chrome started but CDP port <port> never came up.`
- Browser yang sudah terhubung dipakai ulang (`browser.isConnected()`).
- `getFlowPage()` (chrome.ts:81-94): context pertama; cari tab yang URL-nya cocok FLOW_HOSTS → pakai; kalau
  tidak ada → tab baru `goto(inEnglish(FLOW_URL), waitUntil:"domcontentloaded")`. Selalu `ensureEnglish`.
- `ensureEnglish` (chrome.ts:98-112): hanya untuk `flow.google.com`; baca `document.documentElement.lang`;
  jika bukan `^en` → reload dengan `hl=en`, tunggu `lang` terisi (timeout **15 s**); masih asing → error.
  `hl` hilang pada full reload, jadi **setiap `goto` harus lewat `inEnglish()`**.
- Login manual: `src/login.ts` hanya membuka tab Flow dan menyuruh user sign-in sendiri.

Port Go: `chromedp.NewRemoteAllocator(ctx, "http://127.0.0.1:9333")` jika `/json/version` hidup, kalau tidak
`exec.Command(chrome, flags...)` + poll, lalu remote allocator (jangan `NewExecAllocator` — ia mematikan Chrome
saat ctx selesai dan menambah flag automation default). **Catatan:** user-data-dir terkunci oleh satu Chrome; jangan
berbagi profil/port dengan flow-mcp yang sedang jalan (pakai port & profil sendiri, mis. `~/.rangkai/chrome-profile`).

---

## 2. Login/sesi, plan, kredit

`getFlowState` (flow.ts:26-41):
- `signedIn = !/\/about|accounts\.google\.com/.test(url)` — tamu dilempar ke `/about` atau sign-in Google
  (CLAUDE.md:27). Tidak ada cek elemen; murni URL.
- `inProject = /\/project\//.test(url)`.
- Hint: belum login → minta login manual; login tapi bukan project → "open or create a project".
- `detailed` (JANGAN saat generate berjalan, flow.ts:25; core.ts:515 memakai `detailed && !queue.busy`):
  - **plan**: `getByRole("button", {name:"Account details"}).innerText()` → `trim().split("\n")[0]` (flow.ts:36).
    Teks persisnya (mis. "Pro"/"Ultra") tidak terdokumentasi — ambil baris pertama apa adanya.
  - **credits_remaining**: `readCredits` (flow.ts:90-103): dismissOverlays → scrollToTop → klik
    `button "Account details"` (timeout 5 s) → tunggu `link` name `/Google Flow credits/` visible (5 s) →
    `Number(innerText.replace(/[^\d]/g,""))` → finally dismissOverlays + 300 ms. Panel ini berisi "Sign out":
    **jangan sentuh apa pun selain itu**. Panel ditutup via `button "Close account panel"` (tidak menutup dgn Escape).
  - **composer**: innerText `button "Settings trigger"` (ringkasan model/setting saat ini).
- Kredit harian: 50/hari akun gratis; plan berbayar lebih (README:27).

---

## 3. Project

- URL: `https://flow.google.com/project/<uuid>`; root regex `^https:\/\/[^/]+\/project\/[0-9a-f-]{36}` (flow.ts:1101).
  Sub-view: `/project/<id>/edit/<uuid>`, `/scene/<uuid>`, `/collection/<uuid>`, `/character/<uuid>`.
- **Buat project** `createProject` (flow.ts:2228-2249): `goto(inEnglish("https://flow.google.com/"))` →
  `button` name `/new project/i` `.first()` (tunggu 30 s) → klik → `waitForURL(/\/project\/[0-9a-f-]{36}/, 30 s)`
  → id dari URL → nama project = `textbox "Editable text"` (15 s), `fill(title)` + `Enter` + 1200 ms.
  Penulis: "Not yet run live" (CLAUDE.md:572-573).
- **Buka project**: cukup `goto(inEnglish("https://flow.google.com/project/<uuid>"))` (lihat open-project.mjs).
- `ensureProjectGrid` (flow.ts:1099-1110) — dipanggil di awal setiap job: dismissOverlays → jika path ≠ root
  project → `goto(inEnglish(root))` + 2500 ms → `showAllMedia(thorough)` → 800 ms → scrollToTop.
  Generasi WAJIB dimulai dari root project + `All media` (CLAUDE.md:85).
- `showAllMedia` (flow.ts:1078-1097): klik item nav `All media` di `navigation "Project navigation"`
  (`locator("button, a").filter({hasText: /All media\s*$/})`, flow.ts:1043-1053). Fallback: `button "Filtering and
  sorting options"` → bila ada checkbox tercentang klik `Clear all filters` → radio label `Newest` → Escape.
- `leaveSideMenu` (flow.ts:1059-1066): setelah klik menu kiri, `blur()` elemen fokus di dalam `mat-sidenav`;
  kalau tidak, Escape berikutnya menutup drawer selamanya (CLAUDE.md:374-380).
- `dismissOverlays` (flow.ts:44-50): leaveSideMenu → `Escape` → klik `Close account panel` bila tampak →
  `clearBackdrops`: klik paksa `.cdk-overlay-backdrop.cdk-overlay-backdrop-showing` (maks 4×, jeda 500 ms).
- `scrollToTop` (flow.ts:129-132): `document.querySelectorAll(".page-container").forEach(e=>e.scrollTop=0)` + 400 ms.
  Top bar `visibility:hidden` saat grid di-scroll, jadi panggil sebelum setiap langkah (CLAUDE.md:38-39).

---

## 4. Alur generate (video & image) — `runGeneration` (flow.ts:1113-1189)

Urutan persis:
1. `getFlowState()`; bukan signedIn/inProject → throw hint. `ensureProjectGrid`.
2. Agent harus OFF: `button` name `/^(Flow )?Agent$/`; jika `aria-pressed="true"` → klik (flow.ts:1121-1122).
3. `button "Clear prompt"` bila visible → klik.
4. `applySettings` → **quote kredit**; jika `cost > max_credits` → throw, *tidak ada yang dibuat* (flow.ts:1126-1131).
5. First frame: `uploadAsset(..., "start")` lalu `attachAsset(opener = button "Start" exact)`.
6. Last frame: `uploadAsset(..., "end")` lalu `attachAsset(opener = button "End" exact)`.
7. Video + frames → reference_images dibuang + catatan (Frames dan Ingredients eksklusif di composer, flow.ts:1139-1147).
8. Tiap reference (maks 3, core.ts:46-48): upload `ref<i>` → `attachAsset(button "Add ingredients to the prompt box")`.
   Verifikasi: `count(button "Ingredient") >= wanted` else throw (flow.ts:1152-1156). (Hati-hati: ada satu tombol
   "Ingredient" tersembunyi di luar composer yang ikut terhitung, CLAUDE.md:263.)
9. `typePrompt` (flow.ts:503-511): klik `.ProseMirror` → `ControlOrMeta+a` → `Delete` → ketik prompt
   **satu baris** (`replace(/\s*\n+\s*/g," ")`, karena Enter = submit) dengan delay **8 ms/karakter** → 500 ms.
10. `button "Start generation"`; jika disabled → throw. scrollToTop → **snapshot `before = mediaIds()`** → klik.
11. `waitForNewMedia(before, variants, IMAGE 3 min | VIDEO 12 min, kind)` (§5).
12. Untuk tiap hasil: `renameTile` → `<basename(output_dir)>-<file_stem>[-vN]` (best effort), 800 ms,
    `downloadMedia` (§6), 1500 ms.

### 4a. Settings popover — `applySettings` (flow.ts:398-417)
- `openSettings` (320-328): probe = `radio "Image"` exact. Maks 3×: klik `button "Settings trigger"`, tunggu probe 3 s.
  Gagal → `"Could not open Flow's generation settings popover."` (klik trigger kadang tidak membuka → retry).
- `pickRadio(name)` (330-342): `getByRole("radio",{name, exact: string?})`.first(); tidak visible → buka ulang popover;
  masih tidak → `Flow has no "<name>" option...`; jika belum checked → klik + 500 ms.
- Urutan radio: `Image`|`Video` → (video) `Frames` bila ada first/last frame, else `Ingredients` → aspect
  (`16:9`,`9:16`; image juga `4:3`,`1:1`,`3:4`) → model → (video) resolusi regex `^360p`/`^720p` → (video) durasi
  `4s`|`6s`|`8s`|`10s` (hanya Omni; Veo fix 8 s) → variants `x1`..`x4` → 600 ms.
- **Model** `pickModel` (363-382): `button "Select model family"`; bila innerText sudah memuat nama model → skip.
  Klik → `menuitem` (tunggu 5 s) → cocokkan substring case-insensitive. Tidak ketemu → Escape + clearBackdrops + throw
  `Model "<m>" not found. Available here: ...`. Klik item + 700 ms.
  Image tanpa model / "Nano Banana" / "Nano Banana 2" → `latest` = `newestNanoBanana()` (350-361): versi tertinggi dari
  regex `/nano banana\s+(\d+(?:\.\d+)*)/i`, kecuali yang mengandung `\blite\b`. Label contoh: `Omni 1.1 Flash`,
  `Veo 3.1 - Fast`, `Veo 3.1 - Quality`, `Nano Banana Pro`, `Nano Banana 2.1`, `Nano Banana 2 Lite`.
  Jebakan: Escape penutup menu model bisa ikut menutup popover → pickRadio membuka ulang (CLAUDE.md:579-582).
- **Quote kredit** (flow.ts:411-415): `getByRole("link", {name: /^\d[\d,]*\s+credits?$/}).first().innerText()` →
  angka pertama. Regex ketat karena banner saldo rendah "Add AI credits" juga berakhiran "credits". NaN → throw.
- `closeSettings` (387-396): popover = `.cdk-overlay-pane:has(.credit-cost-label)`; maks 3×: blur activeElement +
  Escape + 400 ms; masih ada → klik `Settings trigger`.
- Harga x1 (CLAUDE.md:34,59): Omni 1.1 Flash 360p 4/5/6/7, 720p 7/10/12/15 kredit untuk 4/6/8/10 s; Veo 3.1 Lite 10,
  Fast 20, Quality 100; image (Nano Banana) 0. `max_credits` default **25** (core.ts:31).
- Edit (`runEdit`) dan agent mode **tidak menampilkan quote** → wajib `acknowledge_cost`, biaya diukur dari selisih
  saldo `readCredits` sebelum/sesudah (flow.ts:1608,1655-1656; core.ts:338,359).

### 4b. Upload — `uploadAsset` (flow.ts:436-449)
- `asset:<judul>` = aset yang sudah ada di project (image/video/karakter) → tanpa upload, pakai judulnya.
- File lokal disalin ke temp dengan nama unik **`fm-<jobid>-<label><ext lowercase>`** (nama aset = nama file).
- scrollToTop → klik `button "Add media menu"` → siapkan `filechooser` (10 s) → klik `menuitem "Upload"` exact →
  `setFiles(staged)`.
- `waitForUpload` (423-432): tunggu `flow-grid-tile-container[aria-label="<name>"]:has([data-media-id])` attached,
  timeout **90 s**, lalu 1000 ms (tile upload muncul langsung "image 0%" tanpa media id; jangan dianggap hasil).
- Go: `page.SetInterceptFileChooserDialog(true)` + event `page.EventFileChooserOpened` → `dom.SetFileInputFiles`
  dengan `BackendNodeID` dari event (BELUM diuji di Flow — Playwright memakai mekanisme yang sama).

### 4c. Picker aset — `attachAsset(opener, name)` (flow.ts:459-501)
- list = `listbox "Asset list"`, tab = `tab "All"` exact. Maks 3 percobaan: (Escape + 800 ms jika retry) klik opener,
  tunggu list ATAU tab All visible (5 s). Gagal → `Flow's media picker did not open (three tries)...`.
- Jika tab All ada dan `aria-selected != "true"` → klik All + 1000 ms (picker membuka tab terakhir dipakai).
- Option: `getByRole("option", {name: new RegExp("^"+escape(name), "i")}).first()` (nama option =
  `"<name>"`/`"<name> Image|Video|Avatar"`). Tidak tampak → coba tab `Voices`,`Characters`,`Avatars`,`Uploads`
  (klik + 1200 ms). Tunggu option 10 s → klik.
- Picker Ingredients hanya preview → klik `button "Add to prompt"` exact bila muncul (1.5 s). Picker Start/End
  langsung attach saat klik. Tunggu list hidden (10 s) + 500 ms.

---

## 5. Deteksi selesai, gagal, retry, timeout, pacing

**Murni DOM polling** — tidak ada intersepsi network.
- `TILE_ID_JS` (flow.ts:111-118) identitas tile `flow-grid-tile-container`: skip jika berisi
  `flow-collection-tile`; ambil `img/video[data-media-id]` → atau uuid regex `[0-9a-f]{8}-[0-9a-f-]{27}` di `src`
  → else `"title:" + aria-label`. (Thumbnail kini URL signed `https://flow.google.com/asb/...` tanpa uuid; video
  saat diam hanya punya `img[alt="Generated video thumbnail"]` dan TIDAK punya media id → dilacak via judul.)
- `freshMedia(before, kind)` (251-273): tile baru = id ∉ before, label tidak diawali `fm-`, tidak busy, dan jenis
  cocok (`flow-video-tile` → video, `flow-image-tile` → image). **busy** = innerText cocok `/\d+%/` ATAU tile video
  tanpa `img[alt="Generated video thumbnail"], video`. (Timeline video 4 s: judul=prompt di 9 s tanpa %, judul
  Flow + "0%" di 12 s, 100% di 34 s, thumbnail 35 s — CLAUDE.md:408-414.) Tile baru muncul paling atas.
- `waitForNewMedia` (275-318): loop tiap **2000 ms** sampai deadline:
  - fresh ≥ count → ambil `count` pertama; jika ada id `title:` harus **sama di dua poll berturut** (judul masih
    bisa berubah) → return.
  - progress = `/\d+%/` dari 8 tile teratas (untuk UI).
  - Bila tak ada progress: `newErrorTiles(before)` = hitung `flow-error-tile` di atas tile pertama yang sudah dikenal.
  - Ada error → `errorReason` = innerText `.error-message-text` dari `flow-grid-tile-container flow-error-tile`.
    `POLICY = /polic|violat|prominent|safety|not allowed|guideline/i` → **throw tanpa retry** (mis. "This prompt might
    violate our policies about generating prominent people").
  - Selain itu, bila `retriesLeft` (param `retries`, default 1, maks 3) > 0 → `retryErrorTile`: hover tile, klik
    `button "Retry"` di tile (tunggu 2 s), 1500 ms, scrollToTop. Retry Flow gratis; tile baru muncul di atas.
  - Habis retry → throw `Flow failed this generation N time(s) ("<reason>"). Nothing was charged...`.
  - Deadline → `Timed out after <s>s waiting for Flow to finish.` Timeout: image **3 min**, video **12 min**
    (flow.ts:19-20), edit 10 min (1596), agent `3 min + 30 s × scene` (1853).
- DOM error tile nyata (CLAUDE.md:100-107): container `aria-label` KOSONG → `flow-image-tile` → `flow-error-tile`
  (`.error-title` "Failed", `.error-message-text` "Sorry, this image failed to generate.", `.disclaimer-message`
  "You have not been charged for this generation."), tombol `Retry`,`Reuse prompt`,`Delete`. Tile gagal dari agent
  mode hanya punya `Delete`.
- `FAILURE_TEXT = /failed|couldn.t|unable/i` (flow.ts:21) dipakai hanya di edit view (baris teks `main`).
- **Queue retry** (queue.ts:145-146): hanya error `/agent finished without creating/i` di-requeue. **Timeout tidak
  pernah di-retry otomatis** (mungkin sudah memakan kredit). Antrian kosong ≠ tidak ada yang berjalan; grid Flow
  satu-satunya catatan jujur (CLAUDE.md:203-207).
- **Pacing** (queue.ts:60-61, 125-133): satu generasi sekaligus; jeda acak **25–70 s** (env `FLOW_MCP_PAUSE_MIN_S`/
  `_MAX_S`) dihitung dari selesai job terakhir. Download batch dipatok acak **4.0–4.4 s** per file
  (`downloadPace`, flow.ts:1778). Jeda kecil hard-coded di mana-mana (300–4500 ms) — pertahankan.

---

## 6. Download hasil

UI-driven (menu tile), file ditulis Chrome sendiri; **bukan** URL dari network/DOM.
- `downloadMedia(id, stem, quality)` (515-530): scrollToTop + **2500 ms** settle → `mediaTile(id)` visible (30 s) →
  simpan `aria-label` → resolver ulang tiap percobaan: by id, lalu by title `...[aria-label="<t>"]:has([src])`.
  `mediaTile` (141-148): `title:` → `flow-grid-tile-container[aria-label="<t>"]`; else
  `flow-grid-tile-container:has([data-media-id="<id>"]), flow-grid-tile-container:has([src*="<id>"])`.
- `useOwnDownloadDir` (558-566): CDP `Browser.setDownloadBehavior {behavior:"allowAndName", downloadPath:
  <HOME>/downloads, eventsEnabled:true}` — **ulangi sebelum SETIAP download** (klien CDP lain me-reset-nya).
- `downloadTile` (988-1037), 3 percobaan (Escape + 2000 ms antar percobaan):
  1. `before = downloadsNow()` (isi `<HOME>/downloads` + `~/Downloads`).
  2. `hoverTile(tile, 250)`: scrollIntoView + **mouse move nyata** ke tengah bounding box (hover() tidak memunculkan
     toolbar), flow.ts:605-615.
  3. `button "More options"` di dalam tile (tunggu 3 s) → klik; fallback klik kanan tile.
  4. `menuitem "Download"` exact (8 s); tidak ada → error berisi daftar menuitem yang ditawarkan.
  5. Submenu: `menuitem` name `/original/i`.first() (3 s). Jika `quality=="upscaled"` dan ada
     `[role="menuitem"]:not([aria-disabled="true"]):not([disabled])` dengan teks `/upscaled/i` → klik itu, else original.
     Label: image `1K Original size`, `2K Upscaled`; video `270p Animated GIF`, `720p Original size`,
     `1080p Upscaled` (4K disabled di Pro), CLAUDE.md:42-43.
  6. `waitForDownloadedFile` (579-602): poll **250 ms**, abaikan `.crdownload`/dotfile/yang sudah ada; file dianggap
     selesai jika ukuran > 0 sama di dua poll. Timeout original **180 s**, upscaled **600 s**.
  7. Ekstensi dari magic bytes (allowAndName menulis nama GUID tanpa ekstensi), `extensionOf` 620-637:
     `FFD8FF`→.jpeg, `89 PNG`→.png, `RIFF....WEBP`→.webp, `[4:8]=ftyp`→.mp4, `GIF8`→.gif, `PK\x03\x04`→.zip, else .bin.
  8. ZIP (tile x2–x4) → `unpackTakes`: `<stem>.mp4`, `<stem>-v2.mp4`… + ZIP disimpan `<stem>-takes.zip`.
  9. rename ke `<stem><ext>` → Escape → scrollToTop.
- Penamaan: `<OUTPUT>/<project>/scene-NN[-vN].<ext>`, `OUTPUT = env FLOW_MCP_OUTPUT | ~/flow-mcp-out`; nomor
  melanjutkan max yang ada di disk/antrian (core.ts:529-568).
- Upscale 1080p dirender on-demand dan **bisa tidak pernah datang** (7+ menit) → ambil 720p lalu upscale lokal
  `scale=1920:1080:flags=lanczos` (CLAUDE.md:269-271).
- Batch gambar agent (original): dikumpulkan ke **collection** lalu satu ZIP via top bar
  `flow-more-options-menu` → `button "More options"` → `menuitem "Download collection"`; nama entry
  `<title _>_<8 char media id>.jpg` (flow.ts:655-932). Opsional untuk port awal.
- Scene (`flow-scene-tile`): buka tile → `/scene/` → `button "Download scene"` → satu mp4 (timeout 600 s); jangan
  tekan Escape saat export (flow.ts:1445-1463).

---

## 7. Chaining & agent mode (inti)

- **Chain last→first** (lokal, ffmpeg; chain.ts): `extractLastFrame`: `ffmpeg -y -sseof -0.2 -i <v> -update 1 -q:v 2
  <v>-lastframe.jpg` (chain.ts:9-18); `extractFirstFrame`: `-i <v> -frames:v 1 -q:v 2 <v>-firstframe.jpg` (22-31);
  `extractFrameAt(s)`: `-ss <s.3f> -i <v> -frames:v 1 -q:v 2 <v>-frame-<s.2f>s.jpg` (35-44).
  Queue runner (core.ts:487-512): `first_frame` = .mp4 → frame terakhir (atau `first_frame_at`); `last_frame` = .mp4
  → frame pertama; `chain_previous` → frame terakhir video job sebelumnya; lalu jadi upload Start/End biasa.
- Prompt video selalu diapit klausa anti-teks (core.ts:553-557) kecuali `on_screen_text`:
  awal `NO SUBTITLES, NO CAPTIONS, NO TEXT OF ANY KIND ON SCREEN. ` + akhir
  ` NO TEXT ON SCREEN: never add subtitles, captions, titles, speech transcripts, words or letters anywhere in the picture, at any moment; any speech is heard only, never written.`
- **Continue (agent route)** `runContinue` (flow.ts:1949-2059): klik tile video → `/edit/` (30 s) + 4000 ms →
  `button "Skip to next clip"` (+2500) → `button "Save frame"` (+4500) → `button "Back button to go to previous
  page"` (+3500) → ensureProjectGrid → tile `aria-label="Saved frame from <judul>"`.first() → hover → `More options`
  → `menuitem "Animate"` exact (+3500; ini menyalakan Agent) → `setAgentMode(true)` → (mode likeness saja) attach
  karakter via `Add ingredients...` → `setAgentSettings("Never", aspect)` → prompt diawali instruksi
  `Use I2V, Flow's first frame animation tool. The attached frame is the FIRST FRAME...` (exact) atau `Use R2V,
  reference-to-video...` (likeness) → `Start generation`. Hingga 12× tiap 5 s: jika body cocok
  `/Would you like to|which you prefer|I2V|R2V/i` dan belum ada `\d{1,3}%` → ketik jawaban + Enter. Lalu
  waitForNewMedia(video, 12 min). `finally`: closeAgentSession → grid → settings "Always" → Agent off → Clear prompt.
  I2V (frame persis) dan referensi karakter **saling eksklusif di model** (CLAUDE.md:208-216).
- Guard dobel-bayar (core.ts:728-740): sebelum continue, cek 6 aset teratas; ada video baru yang mirip → tolak
  kecuali `force`.
- **Agent mode helper**: `setAgentMode` (1663-1681) maks 3× [clearBackdrops, closeAgentSettings (`flow-agent-panel`
  → `button "Back"` exact), cek `aria-pressed`, klik (8 s), 1500 ms], verifikasi akhir. `setAgentSettings`
  (1684-1704): `flow-base-prompt-box` → `button "Settings"` exact (harus di-scope; top bar juga punya "Settings")
  → `heading "Agent settings"` (8 s) → `radio /^Always|^Never/` → (opsional) radio aspect + `x1` +
  model `flow-agent-panel button "Image generation default model"` → `button "Save"` exact (+1200) → finally Back.
  `closeAgentSession` (1707-1721): bila `button "Start new session"` tampak → `button "Close"` exact.
- **Agent image batch** `agentRound` (1792-1941): maks 20 scene/permintaan (`AGENT_CHUNK`, 30+ gagal), prompt satu
  blok `Generate exactly N separate images, one image per scene, in scene order. Images only, never video. <aspect>
  aspect ratio. Do not ask questions, generate them now. Scene 1: ... Scene 2: ...` via `keyboard.insertText`.
  Selesai bila tidak ada `\d+%` di `main` dan `button "Stop"` hilang selama >8 s. Hasil dicocokkan ke scene lewat
  `Reuse prompt` (hover tile → teks `.ProseMirror`) + `matchScenes` (overlap kata ≥0.3, kata umum ≥60% dibuang).
  Maks 3 ronde; sisa ≤3 scene → `runGeneration` satu per satu (2 percobaan, jeda 8 s). Selalu kembalikan confirm
  "Always" dan Agent off.

---

## 8. Konkurensi, limit, rate

- Satu generasi pada satu waktu (`JobQueue.working`, queue.ts:118-155); jeda 25–70 s; tidak paralel antar tab.
- Batas: 100 scene per `flow_generate`, 50 scene per agent batch, reference_images ≤3, variants 1–4, retries 0–3
  (core.ts:126,294,48,32,54).
- **Hanya satu proses** boleh menyetir Chrome yang sama: dua klien CDP merusak download (artifact dir tersapu,
  override download di-reset) dan pernah menyebabkan dobel-bayar 30 kredit (CLAUDE.md:112-114, 217-225, 237-242).
- Jangan jalankan `detailed` state (buka panel akun) saat generasi berjalan.
- Tidak ada stealth/evasion; reCAPTCHA invisible dibiarkan. Tempo manusia = jeda + ketik 8 ms/karakter + mouse move.

---

## 9. Titik rapuh / TODO yang dicatat penulis

1. Semua tombol dicari via nama Inggris (~45 label) → wajib `?hl=en` di setiap load (CLAUDE.md:348-356).
2. Toggle Agent diganti nama jadi "Flow Agent" (diff lokal terbaru) → pakai regex `/^(Flow )?Agent$/`.
3. Grid virtual: tile jauh di bawah ter-unmount bila scrollToTop sebelum diklik; ambil snapshot `before` dulu, scan,
   lalu klik di tempat (CLAUDE.md:123-125). Tile baru sedang re-mount → settle 2.5 s + resolve ulang.
4. Video tanpa media id → dilacak via judul; judul berubah (prompt → judul Flow → rename kita). Handle harus ikut
   rename (flow.ts:1184) dan judul harus stabil 2 poll.
5. Upload sendiri (`fm-`) pernah terbaca sebagai hasil (31 klip "gagal" palsu) — filter `fm-` + tunggu media id.
6. Klik "Settings trigger" / "Add ingredients" kadang tidak membuka apa pun → retry 3× (penyebab tak diketahui).
7. Backdrop `cdk-overlay-backdrop` yang tak tertutup Escape menelan semua klik → clearBackdrops.
8. Escape saat fokus di `mat-sidenav` menutup menu kiri; menu bisa *collapsed* (ikon tanpa label).
9. Popover settings tidak selalu tertutup dengan satu Escape (closeSettings).
10. Retry pada kegagalan end-to-end otomatis belum pernah terlihat live (CLAUDE.md:90-93, 107).
11. Upscale 1080p bisa tak pernah selesai. ZIP untuk multi-take. Ekstensi harus dari magic bytes.
12. Jalur Windows (Ctrl+klik seleksi, recycle bin) belum pernah diuji di PC nyata (platform.ts:6-8, flow.ts:662).
13. `createProject` belum diuji live. Edit/agent tidak punya quote kredit.
14. Karakter dari foto user → video ditolak "prominent people"; jangan retry.

---

## 10. Go/chromedp port checklist

Helper dasar (wajib, karena semua locator = role + accessible name):
- `ByRole(ctx, role, name string|*regexp.Regexp, scope)`: `accessibility.QueryAXTree` (param `Role`,
  `AccessibleName` untuk exact; untuk regex ambil semua node `role` lalu filter `Name.Value`) → `BackendDOMNodeID` →
  filter visible (`dom.GetBoxModel` sukses & `offsetParent`). Scope (mis. dalam tile) = query dengan `NodeID` root.
  Alternatif murah: JS `querySelectorAll` + cocokkan `aria-label || innerText` (cukup untuk `aria-label` tombol Flow;
  label menu berisi ligature ikon, mis. "downloadDownload", tapi accessible name tetap "Download" — AX tree lebih aman).
- `RealHover(x,y)` = `input.DispatchMouseEvent(MouseMoved)`; `Click` = Pressed/Released di tengah box; modifier
  Ctrl=2/Meta=4 untuk seleksi tile.
- `TypeSlow(text, 8ms)` via `input.DispatchKeyEvent` per char (atau `input.InsertText` untuk skrip agent);
  `SelectAllDelete` = Ctrl/Meta+A lalu Delete. `Esc`.
- `GotoEN(url)` = set `hl=en` lalu `page.Navigate` + tunggu `DOMContentLoaded`.
- `EvalTileIDs()` = jalankan `TILE_ID_JS` (flow.ts:111-118) verbatim lewat `runtime.Evaluate`.
- `ScrollTop()` = `.page-container` scrollTop=0 + 400 ms. `DismissOverlays()` / `ClearBackdrops()` / `LeaveSideMenu()`.

| Fungsi Go | Strategi / selector |
|---|---|
| `Connect()` | `GET /json/version` (1.5 s) → remote allocator; else spawn Chrome (§1 flag) + poll 40×500 ms. Pilih target dgn URL `flow.google.com`/`labs.google/fx`, else buat tab `https://flow.google.com/?hl=en`. `EnsureEnglish` via `document.documentElement.lang`. |
| `EnsureLoggedIn()` | URL tidak cocok `/\/about\|accounts\.google\.com/` = login; `/\/project\//` = di project. Jika belum login: tampilkan jendela, minta user login manual, poll URL. |
| `ReadPlan()` | innerText `button "Account details"` baris pertama; tutup via `button "Close account panel"`. |
| `ReadCredits()` | dismiss → scrollTop → klik `button "Account details"` → `link /Google Flow credits/` (5 s) → digit saja → dismiss. Tidak saat generate. |
| `CreateProject(title)` | home → `button /new project/i` (30 s) → URL `/project/<uuid>` → `textbox "Editable text"` fill + Enter. |
| `OpenProject(id)` | `GotoEN(https://flow.google.com/project/<id>)` → `EnsureProjectGrid` (nav `Project navigation` → `All media`, fallback filter `Newest`). |
| `ReadQuote(params)` | `openSettings` (probe `radio "Image"`, 3×) → radios Image/Video, Frames/Ingredients, aspect, `button "Select model family"`→`menuitem`, `^360p/^720p`, `Ns`, `xN` → `link /^\d[\d,]*\s+credits?$/` → `closeSettings` (`.cdk-overlay-pane:has(.credit-cost-label)`). Tolak jika > max_credits. |
| `Upload(file,label)` | salin ke `fm-<job>-<label>.<ext>` → `button "Add media menu"` → intercept file chooser → `menuitem "Upload"` → `SetFileInputFiles` → tunggu tile `[aria-label="<name>"]:has([data-media-id])` 90 s. |
| `Attach(opener,name)` | opener `button "Start"`/`"End"`/`"Add ingredients to the prompt box"`; `listbox "Asset list"`, `tab "All"`, option `^<name>` (tab Voices/Characters/Avatars/Uploads), `button "Add to prompt"`. 3× retry. |
| `GenerateImage(p)` | grid → Agent off (`/^(Flow )?Agent$/`, aria-pressed) → `Clear prompt` → ReadQuote(Image, model latest Nano Banana) → refs → `.ProseMirror` ketik 1 baris → `Start generation` enabled → snapshot ids → klik → `WaitResult(kind=image, 3 min)`. |
| `GenerateVideo(p)` | sama, Video + Frames (Start/End upload) atau Ingredients (≤3 refs, cek count `button "Ingredient"`), resolusi/durasi; prompt diapit klausa NO TEXT; `WaitResult(video, 12 min)`. |
| `WaitResult(before,n,kind,timeout)` | poll 2 s: `freshMedia` (id∉before, label≠`fm-*`, tidak `\d+%`, video punya `img[alt="Generated video thumbnail"]`/`video`, jenis cocok); id `title:` stabil 2 poll. Error tile `flow-error-tile` + `.error-message-text`; POLICY regex → stop; else `Retry` di tile (≤retries). |
| `RenameTile(id,title)` | RealHover → tile `button "More options"` → `menuitem "Rename"` → +1200 ms → Ctrl+A → ketik → Enter. Best effort; handle pindah ke `title:<baru>`. |
| `Download(id,stem,quality)` | `Browser.setDownloadBehavior allowAndName` (tiap kali) → ScrollTop + 2.5 s → resolve tile → RealHover → `More options` → `menuitem "Download"` → `/original/i` atau `/upscaled/i` non-disabled → tunggu file (event `Browser.downloadProgress` state=completed, fallback poll ukuran stabil 250 ms; 180 s / 600 s) → magic-bytes ext → ZIP unpack → rename `scene-NN`. |
| `ExtractFrame(...)` | ffmpeg perintah §7 (last/first/at). |
| `ContinueShot(...)` | (fase 2) jalur §7 runContinue: `Skip to next clip` → `Save frame` → Back → `Saved frame from <t>` → `Animate` → agent settings Never → prompt I2V/R2V → jawab pertanyaan → WaitResult → restore. |
| `AgentImages(...)` | (fase 2) §7 agentRound; ≤20 scene/permintaan, `Stop` + `%` idle 8 s, `Reuse prompt` matching, restore Always + Agent off. |
| `Queue` | 1 worker; jeda acak 25–70 s antar job; timeout tak pernah di-retry otomatis; satu proses per Chrome. |
