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
    providerLabel: 'StudioFlow AI',
    endpointUrl,
    apiKey,
    model: model || 'local',
    timeoutMs,
  };
}

async function callHermes9Router(systemPrompt: string, userPrompt: string): Promise<string> {
  const cfg = getGatewayConfig();
  if (!cfg.enabled) {
    throw new Error('Layanan AI belum dikonfigurasi.');
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
  characterLock?: string;
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
    version: '1.0.0',
    llmAvailable: cfg.enabled,
    provider: null,
    model: cfg.enabled ? 'active' : 'local',
  });
});

app.post('/api/director/ping', async (c) => {
  const cfg = getGatewayConfig();
  if (!cfg.enabled) {
    return c.json(
      {
        ok: false,
        message: 'Layanan AI sedang dalam mode lokal.',
      },
      400
    );
  }
  const t0 = Date.now();
  try {
    await callHermes9Router(
      'Reply ONLY with valid JSON: {"status":"ready"}',
      'ping'
    );
    const ms = Date.now() - t0;
    return c.json({
      ok: true,
      latencyMs: ms,
      model: 'active',
      provider: null,
    });
  } catch {
    return c.json(
      {
        ok: false,
        message: 'Gagal menghubungi layanan AI.',
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
    const selectedHook = HOOK_STRATEGIES[normalized.hookStyle || 'rahasia-pov'];
    const isMarketing = normalized.contentMode === 'marketing';
    const isHardSelling = isMarketing && normalized.sellingStyle === 'hard';
    const activeHookTitle = isMarketing
      ? isHardSelling
        ? selectedHook.marketingName
        : selectedHook.softSellingName
      : selectedHook.name;

    const voiceDirective = !isMarketing
      ? [
          '1. AUTHENTIC CONTENT CREATOR VOICE (MODE = KONTEN BIASA / GENERAL):',
          '- Treat the input topic strictly as general creator content — NEVER write online-shop sales copy, promos, or packaging descriptions.',
          '- Spoken lines ("dialogueId") MUST sound like a charismatic Indonesian content creator speaking casually to viewers ("aku / kamu / kita", intriguing insights, natural storytelling).',
        ]
      : isHardSelling
        ? [
            '1. DIRECT-RESPONSE HARD SELLING VOICE (MODE = MARKETING · HARD SELLING):',
            '- Go straight to the point from second 0.0! Spotlight the product/service immediately, showcase concrete proof of its advantages, create strong urgency/desire, and close with a decisive purchase/conversion CTA.',
            '- Spoken lines ("dialogueId") must be punchy, persuasive, high-energy Indonesian commercial/affiliate copy that drives immediate checkout or click.',
          ]
        : [
            '1. ORGANIC SOFT SELLING VOICE (MODE = MARKETING · SOFT SELLING):',
            '- ANTI-SKIP RULE: Open the first 70% of the video like organic everyday storytelling, relatable POV, or helpful education WITHOUT sounding like an ad or pushing a sale early!',
            '- Introduce the product/service naturally near the middle-to-end as what personally helped the creator, and close with a gentle, friendly, non-pushy recommendation ("kalau penasaran boleh cek di bio ya").',
          ];

    const systemPrompt = [
      isMarketing
        ? isHardSelling
          ? 'You are StudioFlow Master Direct-Response Hard-Selling Commercial & Veo 3.1 Director.'
          : 'You are StudioFlow Master Organic Soft-Selling Storyteller, UGC Creator & Veo 3.1 Director.'
        : 'You are StudioFlow Master Content Creator Scriptwriter & Veo 3.1 Director for TikTok, Reels, YouTube Shorts, and YouTube.',
      'Follow this strict Content Strategy & Prompt Engineering Hierarchy:',
      '',
      ...voiceDirective,
      '',
      '2. VISUAL MEDIUM LOCK (NON-NEGOTIABLE):',
      `- Every scene and reference asset MUST strictly render in "${selectedVideoStyle.name}" (${selectedVideoStyle.mediumLock}).`,
      '- If Minecraft/Voxel, everything is 3D cubic pixel blocks. If 2D Anime, cel-shaded hand-drawn 2D sakuga. If 3D Cartoon, Pixar-grade stylized 3D CGI. If Real Live-Action, authentic cinema lens physics.',
      '',
      '3. CHARACTER IDENTITY LOCK (NON-NEGOTIABLE WHEN cast == "person"):',
      basePack.bible.characterLock
        ? `- A locked main creator/character is active: "${basePack.bible.characterName}" -> ${basePack.bible.characterLock}.`
        : '- No human character is active (cast == "product"); focus strictly on visual metaphors, environments, and objects.',
      '- When a locked character is active, EVERY scene actionEn MUST feature this EXACT SAME character (same name, face, hair, eyewear/hijab, and exact outfit). NEVER introduce random strangers or alter clothing across scenes.',
      normalized.characterCustom?.trim()
        ? `- Refine the user's custom character description ("${normalized.characterCustom.trim()}") into a forensic English "characterLock" specifying exact age, Indonesian/heritage look, face geometry, hair style/parting, glasses/no-glasses, top & bottom clothing colors, rendered in ${selectedVideoStyle.characterAdapterEn}.`
        : '- Keep "characterLock" identical to the provided locked character DNA.',
      '',
      '4. SCENE 1 HOOK MASTERY (0.0s - 3.0s RETENTION HOOK):',
      `- Scene idx 0 MUST execute the "${activeHookTitle}" hook strategy (${selectedHook.visualHookEn}).`,
      '- Start at frame 0.0s with immediate curiosity, visual pattern-interrupt, or relatable moment. Scene 0 dialogueId must be a punchy Indonesian hook under 14 words.',
      '',
      '5. STRICT OUTPUT SCHEMA (valid JSON only, zero emojis, zero on-screen text/subtitles/words inside video frames):',
      '{',
      '  "productLock": "English visual consistency lock for either the promoted product (marketing mode) or the topic visual motif (creator mode)",',
      '  "productAssetPrompt": "English Nano Banana reference image prompt rendered strictly in the chosen Visual Medium, no text, no watermark",',
      '  "characterLock": "Forensic English character identity lock if cast == person, else empty string",',
      '  "setting": "English environment description matching the topic, chosen Visual Medium, and vibe",',
      '  "lighting": "English lighting setup",',
      '  "scenes": [',
      '    {',
      '      "idx": 0,',
      '      "descriptionId": "Clear Bahasa Indonesia scene explanation (no emojis)",',
      '      "shot": "English lens/framing",',
      '      "camera": "English single continuous camera movement",',
      '      "actionEn": "Vivid English visual action (NO written words/titles/subtitles in frame)",',
      '      "sfx": "English sound effect",',
      '      "dialogueId": "Natural Bahasa Indonesia spoken line if voiceMode != none, else empty string"',
      '    }',
      '  ],',
      '  "captionId": "Engaging Bahasa Indonesia caption without emojis",',
      '  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"]',
      '}',
    ].join('\n');

    const userPrompt = JSON.stringify({
      contentMode: normalized.contentMode,
      sellingStyle: normalized.sellingStyle || null,
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
      characterName: basePack.bible.characterName || '',
      characterLock: basePack.bible.characterLock || '',
      customCharacterInput: normalized.characterCustom || '',
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

    const resolvedCharLock =
      normalized.cast === 'person' && normalized.characterCustom?.trim() && parsed.characterLock
        ? cleanSingleLinePrompt(stripEmojis(parsed.characterLock))
        : basePack.bible.characterLock;

    const bible: Pack['bible'] = {
      ...basePack.bible,
      productLock,
      characterLock: resolvedCharLock,
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
      if (asset.id === 'character' && bible.characterLock) {
        return {
          ...asset,
          prompt: cleanSingleLinePrompt(
            `Clean character model reference portrait of ${bible.characterLock}, rendered in ${selectedVideoStyle.assetStyleEn}, waist-up front-facing natural pose showing full face, hair, and upper outfit clearly, solid clean neutral background, sharp consistent character sheet details, no text, no watermark.`
          ),
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
