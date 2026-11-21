import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildFlowSteps,
  buildSceneVideoPrompt,
  cleanSingleLinePrompt,
  createOfflineSceneVariation,
  generateOfflinePack,
  HOOK_STRATEGIES,
  normalizeAnswers,
  VIDEO_STYLES,
} from '../shared/director';
import { getTemplateById } from '../shared/templates';
import type { Answers, Pack, Scene } from '../shared/types';

// Lightweight .env loader (no external dotenv dependency needed)
function loadDotEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}
loadDotEnvFile();

const app = new Hono();

// ---------- In-Memory Sliding Window Rate Limiter ----------
interface RateBucket {
  timestamps: number[];
}
const rateBuckets = new Map<string, RateBucket>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQ = Number(process.env.RATE_LIMIT_PER_MIN || 30);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  if (bucket.timestamps.length >= RATE_MAX_REQ) {
    rateBuckets.set(ip, bucket);
    return false;
  }
  bucket.timestamps.push(now);
  rateBuckets.set(ip, bucket);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBuckets.entries()) {
    const active = b.timestamps.filter((t) => now - t < RATE_WINDOW_MS);
    if (active.length === 0) rateBuckets.delete(ip);
    else b.timestamps = active;
  }
}, 5 * 60_000).unref();

// ---------- Hermes / 9Router Gateway Configuration ----------
interface GatewayConfig {
  enabled: boolean;
  providerLabel: string;
  endpointUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

function resolveChatCompletionsUrl(rawBase: string): string {
  const trimmed = rawBase.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.endsWith('/chat/completions')) return trimmed;
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

function getGatewayConfig(): GatewayConfig {
  const baseUrl = (
    process.env.AI_BASE_URL ||
    process.env.HERMES_BASE_URL ||
    process.env.NINEROUTER_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    ''
  ).trim();

  const apiKey = (
    process.env.AI_API_KEY ||
    process.env.HERMES_API_KEY ||
    process.env.NINEROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  ).trim();

  const model = (
    process.env.AI_MODEL ||
    process.env.NINEROUTER_MODEL ||
    process.env.OPENAI_MODEL ||
    ''
  ).trim();

  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 45_000);
  const endpointUrl = resolveChatCompletionsUrl(baseUrl);
  const enabled = Boolean(endpointUrl && model);

  return {
    enabled,
    providerLabel: process.env.AI_PROVIDER_NAME?.trim() || 'Hermes · 9Router (VPS 3)',
    endpointUrl,
    apiKey,
    model: model || 'belum-diatur',
    timeoutMs,
  };
}

async function callHermes9Router(systemPrompt: string, userPrompt: string): Promise<string> {
  const cfg = getGatewayConfig();
  if (!cfg.enabled) {
    throw new Error('Gateway Hermes / 9Router belum dikonfigurasi di .env');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (cfg.apiKey) {
      headers.authorization = `Bearer ${cfg.apiKey}`;
    }

    const res = await fetch(cfg.endpointUrl, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.55,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Gateway HTTP ${res.status}: ${errBody.slice(0, 180)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Safely strips <think>...</think> reasoning blocks (from R1/Qwen/Hermes reasoning models in 9Router combos)
 * and markdown ```json fences before extracting JSON.
 */
function extractJsonObject<T>(raw: string): T | null {
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const withoutFences = withoutThink
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(withoutFences.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function stripEmojis(text: string): string {
  return text.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s{2,}/g, ' ').trim();
}

function getClientIp(reqHeaders: Headers): string {
  return (
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    reqHeaders.get('x-real-ip')?.trim() ||
    'local'
  );
}

interface LlmDirectorPayload {
  productLock?: string;
  productAssetPrompt?: string;
  setting?: string;
  lighting?: string;
  scenes?: Array<{
    idx: number;
    descriptionId?: string;
    shot?: string;
    camera?: string;
    actionEn?: string;
    sfx?: string;
    dialogueId?: string;
  }>;
  captionId?: string;
  hashtags?: string[];
}

// ---------- API Routes ----------
app.get('/api/health', (c) => {
  const cfg = getGatewayConfig();
  return c.json({
    ok: true,
    version: '0.4.1',
    llmAvailable: cfg.enabled,
    provider: cfg.enabled ? cfg.providerLabel : null,
    model: cfg.enabled ? cfg.model : 'menunggu-konfigurasi-9router',
  });
});

app.post('/api/director/ping', async (c) => {
  const cfg = getGatewayConfig();
  if (!cfg.enabled) {
    return c.json(
      {
        ok: false,
        message: 'AI_BASE_URL dan AI_MODEL belum diisi di file .env server.',
      },
      400
    );
  }
  const t0 = Date.now();
  try {
    const reply = await callHermes9Router(
      'Reply ONLY with valid JSON: {"status":"ready"}',
      'ping'
    );
    const ms = Date.now() - t0;
    return c.json({
      ok: true,
      latencyMs: ms,
      model: cfg.model,
      provider: cfg.providerLabel,
      sample: reply.slice(0, 120),
    });
  } catch (err) {
    return c.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : 'Gagal menghubungi gateway 9Router / Hermes',
      },
      502
    );
  }
});

app.post('/api/director/enrich', async (c) => {
  const ip = getClientIp(c.req.raw.headers);
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa detik.' }, 429);
  }

  let body: { templateId?: string; answers?: Answers };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Payload JSON tidak valid.' }, 400);
  }

  const template = body.templateId ? getTemplateById(body.templateId) : undefined;
  if (!template || !body.answers) {
    return c.json({ error: 'Template atau jawaban wizard tidak lengkap.' }, 400);
  }

  let basePack: Pack;
  const normalized = normalizeAnswers(body.answers);
  try {
    basePack = generateOfflinePack(template, normalized);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Gagal menyusun paket prompt.' }, 400);
  }

  const cfg = getGatewayConfig();
  if (!cfg.enabled) {
    return c.json({ pack: basePack, enriched: false, fallbackReason: 'no_gateway_configured' });
  }

  try {
    const selectedVideoStyle = VIDEO_STYLES[normalized.videoStyle || 'real-live'];
    const selectedHook = HOOK_STRATEGIES[normalized.hookStyle || 'visual-kejutan'];

    const systemPrompt = [
      'You are StudioFlow Master Creative Director, an elite viral commercial director and Veo 3.1 prompt engineer.',
      'Follow this strict Prompt Engineering Hierarchy:',
      '',
      '1. VISUAL MEDIUM LOCK (NON-NEGOTIABLE):',
      `- Every scene and reference asset MUST strictly render in "${selectedVideoStyle.name}" (${selectedVideoStyle.mediumLock}).`,
      '- If the style is Minecraft/Voxel, everything is built of 3D pixel-art cubic blocks. If 2D Anime, cel-shaded hand-drawn 2D sakuga. If 3D Cartoon, Pixar-grade stylized 3D CGI. If Real Live-Action, authentic cinema lens physics.',
      '',
      '2. SCENE 1 HOOK MASTERY (0.0s - 3.0s SCROLL-STOPPER):',
      `- Scene idx 0 MUST execute the "${selectedHook.name}" hook strategy (${selectedHook.visualHookEn}).`,
      '- Never start Scene 0 with a slow static wide shot. Start at frame 0.0s with immediate kinetic action, visual tension, POV intrigue, or tactile close-up impact that stops viewers from scrolling.',
      '- If spoken dialogue/VO is enabled, Scene 0 dialogueId must be a punchy, curiosity-inducing Indonesian hook under 12 words.',
      '',
      '3. FEW-SHOT EXAMPLES OF ELITE SCENE 0 HOOKS:',
      'Example A (Style: Minecraft Voxel, Hook: Sudut Kamera Spektakuler, Product: Kopi Susu Gula Aren):',
      '{"idx":0,"shot":"low-angle 24mm voxel perspective","camera":"sweeping FPV glide skimming across oak planks straight up to the blocky cup","actionEn":"SCROLL-STOPPING 0.0s HOOK: cubic amber palm sugar blocks cascade and swirl inside a translucent voxel iced coffee cup as blocky ice cubes splash in crisp RTX voxel sunlight","sfx":"crisp Minecraft block pop and refreshing liquid splash","dialogueId":"Belum pernah kan lihat es kopi gula aren sekeren ini?"}',
      '',
      'Example B (Style: Orang & Objek Realistis, Hook: Kejutan Detail Dekat, Product: Sambal Bawang):',
      '{"idx":0,"shot":"extreme macro 100mm probe lens, razor-thin DOF","camera":"rapid punchy push-in decelerating into 120fps slow motion","actionEn":"SCROLL-STOPPING 0.0s HOOK: glossy crimson chili oil and caramelized garlic sizzle and drip off a spoon right in front of the macro lens before revealing the sealed glass jar behind","sfx":"mouthwatering hot sizzle and crisp glass clink","dialogueId":"Tunggu, lihat tekstur bawang dan cabai aslinya sedekat ini!"}',
      '',
      '4. STRICT OUTPUT SCHEMA (valid JSON only, zero emojis, zero on-screen text/subtitles/words inside video frames):',
      '{',
      '  "productLock": "English visual lock sentence keeping exact product shape, colors, and chosen render style identical across all shots",',
      '  "productAssetPrompt": "English Nano Banana reference image prompt rendered strictly in the chosen Visual Medium, no text, no watermark",',
      '  "setting": "English environment description matching the chosen Visual Medium and vibe",',
      '  "lighting": "English lighting setup",',
      '  "scenes": [',
      '    {',
      '      "idx": 0,',
      '      "descriptionId": "Clear Bahasa Indonesia explanation (no emojis)",',
      '      "shot": "English lens/framing",',
      '      "camera": "English single continuous camera movement",',
      '      "actionEn": "Vivid English action (NO written words/titles/subtitles in frame)",',
      '      "sfx": "English sound effect",',
      '      "dialogueId": "Punchy Bahasa Indonesia line if voiceMode != none, else empty string"',
      '    }',
      '  ],',
      '  "captionId": "Natural Bahasa Indonesia caption without emojis",',
      '  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"]',
      '}',
    ].join('\n');

    const userPrompt = JSON.stringify({
      templateName: template.name,
      videoStyle: {
        id: selectedVideoStyle.id,
        name: selectedVideoStyle.name,
        mediumLock: selectedVideoStyle.mediumLock,
      },
      hookStrategy: {
        id: selectedHook.id,
        name: selectedHook.name,
        customHookLine: normalized.customHookLine || '',
      },
      product: normalized.product,
      customProductDetail: normalized.productLockCustom || '',
      hasRealPhoto: normalized.hasPhoto,
      advantages: normalized.advantages,
      storyNote: normalized.story || '',
      cta: normalized.cta,
      vibe: normalized.vibe,
      cast: normalized.cast,
      voiceMode: normalized.voice,
      aspectRatio: normalized.aspect,
      sceneStructure: basePack.scenes.map((s) => ({
        idx: s.idx,
        role: s.role,
        label: s.label,
        durationS: s.durationS,
        fallbackActionEn: s.actionEn,
      })),
    });

    const rawText = await callHermes9Router(systemPrompt, userPrompt);
    const parsed = extractJsonObject<LlmDirectorPayload>(rawText);
    if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return c.json({ pack: basePack, enriched: false, fallbackReason: 'invalid_llm_json' });
    }

    let productLock = parsed.productLock
      ? cleanSingleLinePrompt(stripEmojis(parsed.productLock))
      : basePack.bible.productLock;
    if (normalized.hasPhoto && !productLock.toLowerCase().includes('reference image')) {
      productLock += ', matching the attached product reference image exactly';
    }

    const bible: Pack['bible'] = {
      ...basePack.bible,
      productLock,
      setting: parsed.setting ? cleanSingleLinePrompt(stripEmojis(parsed.setting)) : basePack.bible.setting,
      lighting: parsed.lighting ? cleanSingleLinePrompt(stripEmojis(parsed.lighting)) : basePack.bible.lighting,
      source: 'llm',
    };

    const assets = basePack.assets.map((asset) => {
      if (asset.id === 'product' && parsed.productAssetPrompt && !asset.upload) {
        return {
          ...asset,
          prompt: cleanSingleLinePrompt(stripEmojis(parsed.productAssetPrompt)),
        };
      }
      return asset;
    });

    const scenes: Scene[] = basePack.scenes.map((sc) => {
      const match = parsed.scenes?.find((x) => x.idx === sc.idx);
      if (!match) return sc;
      const actionEn = match.actionEn ? cleanSingleLinePrompt(stripEmojis(match.actionEn)) : sc.actionEn;
      const description = match.descriptionId ? stripEmojis(match.descriptionId) : sc.description;
      const shot = match.shot ? cleanSingleLinePrompt(stripEmojis(match.shot)) : sc.shot;
      const camera = match.camera ? cleanSingleLinePrompt(stripEmojis(match.camera)) : sc.camera;
      const sfx = match.sfx ? cleanSingleLinePrompt(stripEmojis(match.sfx)) : sc.sfx;
      const dialogue =
        normalized.voice !== 'none' && match.dialogueId
          ? stripEmojis(match.dialogueId)
          : sc.dialogue;

      const updated: Scene = { ...sc, description, shot, camera, actionEn, sfx, dialogue };
      updated.prompt = buildSceneVideoPrompt(bible, updated, updated.actionEn, normalized.voice);
      return updated;
    });

    const caption = parsed.captionId ? stripEmojis(parsed.captionId) : basePack.caption;
    const hashtags =
      Array.isArray(parsed.hashtags) && parsed.hashtags.length > 0
        ? parsed.hashtags
            .map((h) => (h.startsWith('#') ? stripEmojis(h) : `#${stripEmojis(h)}`))
            .slice(0, 6)
        : basePack.hashtags;

    const enrichedBase: Omit<Pack, 'steps' | 'guideUpdatedAt'> = {
      ...basePack,
      bible,
      assets,
      scenes,
      caption,
      hashtags,
    };

    const finalPack: Pack = {
      ...enrichedBase,
      steps: buildFlowSteps(enrichedBase, normalized),
      guideUpdatedAt: basePack.guideUpdatedAt,
    };

    return c.json({ pack: finalPack, enriched: true });
  } catch {
    return c.json({ pack: basePack, enriched: false, fallbackReason: 'upstream_error' });
  }
});

app.post('/api/director/variation', async (c) => {
  const ip = getClientIp(c.req.raw.headers);
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar.' }, 429);
  }

  let body: { scene?: Scene; bible?: Pack['bible']; answers?: Answers; seed?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Payload tidak valid.' }, 400);
  }

  if (!body.scene || !body.bible || !body.answers) {
    return c.json({ error: 'Data scene tidak lengkap.' }, 400);
  }

  const normalized = normalizeAnswers(body.answers);
  const offlineVar = createOfflineSceneVariation(
    body.scene,
    body.bible,
    normalized,
    body.seed ?? Date.now()
  );

  const cfg = getGatewayConfig();
  if (!cfg.enabled) {
    return c.json({ scene: offlineVar, source: 'offline' });
  }

  try {
    const sys =
      'Output ONLY valid JSON (no markdown commentary): {"shot":"camera lens & framing in English","camera":"camera movement in English","actionEn":"fresh alternative physical action in English for Veo 3.1 without any on-screen text","descriptionId":"short Bahasa Indonesia description without emojis"}';
    const usr = JSON.stringify({
      product: normalized.product,
      role: body.scene.label,
      currentDescription: body.scene.description,
      currentAction: body.scene.actionEn,
    });
    const raw = await callHermes9Router(sys, usr);
    const parsed = extractJsonObject<{
      shot?: string;
      camera?: string;
      actionEn?: string;
      descriptionId?: string;
    }>(raw);

    if (!parsed?.actionEn) {
      return c.json({ scene: offlineVar, source: 'offline' });
    }
    const nextScene: Scene = {
      ...body.scene,
      shot: parsed.shot ? stripEmojis(parsed.shot) : offlineVar.shot,
      camera: parsed.camera ? stripEmojis(parsed.camera) : body.scene.camera,
      actionEn: cleanSingleLinePrompt(stripEmojis(parsed.actionEn)),
      description: parsed.descriptionId ? stripEmojis(parsed.descriptionId) : body.scene.description,
    };
    nextScene.prompt = buildSceneVideoPrompt(body.bible, nextScene, nextScene.actionEn, normalized.voice);
    return c.json({ scene: nextScene, source: 'llm' });
  } catch {
    return c.json({ scene: offlineVar, source: 'offline' });
  }
});

// ---------- Static SPA Serving (Production) ----------
const clientDist = path.resolve(process.cwd(), 'dist/client');
if (fs.existsSync(clientDist)) {
  app.use('/assets/*', async (c, next) => {
    await next();
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
  });
  app.use('/*', serveStatic({ root: './dist/client' }));
  app.get('*', (c) => {
    const indexHtml = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
    return c.html(indexHtml);
  });
}

const port = Number(process.env.PORT || 8787);
serve({ fetch: app.fetch, port }, (info) => {
  const cfg = getGatewayConfig();
  console.log(
    `[studioflow-server] listening on http://0.0.0.0:${info.port} (AI Gateway: ${
      cfg.enabled ? `${cfg.providerLabel} -> ${cfg.model}` : 'belum diisi di .env (fallback lokal aktif)'
    })`
  );
});
