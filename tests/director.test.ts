import { describe, expect, it } from 'vitest';
import {
  createOfflineSceneVariation,
  exportBatchPacksAsCsv,
  exportPackAsMarkdown,
  exportPackAsText,
  generateOfflinePack,
  HOOK_STRATEGIES,
  recalculatePack,
  swapPackCharacter,
  VIDEO_STYLES,
} from '../shared/director';
import { getAllTemplates, getTemplateById } from '../shared/templates';
import type { Answers, HookStrategyId, VideoStyleId } from '../shared/types';

const BASE_ANSWERS: Answers = {
  product: 'Kopi Susu Gula Aren Senja',
  hasPhoto: false,
  advantages: ['Manis pas', 'Gula aren asli', 'Segar'],
  cta: 'Pesan sekarang, link di bio',
  story: 'Disajikan dingin dengan es kristal.',
  videoStyle: 'real-live',
  hookStyle: 'visual-kejutan',
  vibe: 'hangat',
  music: 'santai',
  cast: 'product',
  voice: 'none',
  durationS: 20,
  aspect: '9:16',
  quality: 'seimbang',
  seamlessChain: false,
};

describe('Rangkai Director Engine', () => {
  it('generates complete offline prompt packs for all 14 templates (6 Creator + 4 Soft Selling + 4 Hard Selling) across 15s, 20s, 30s, and 60s', () => {
    const templates = getAllTemplates();
    expect(templates.length).toBe(14);
    expect(templates.filter((t) => t.mode === 'creator').length).toBe(6);
    expect(templates.filter((t) => t.mode === 'marketing' && t.sellingStyle === 'soft').length).toBe(4);
    expect(templates.filter((t) => t.mode === 'marketing' && t.sellingStyle === 'hard').length).toBe(4);

    for (const tpl of templates) {
      for (const dur of [15, 20, 30, 60] as const) {
        const pack = generateOfflinePack(tpl, {
          ...BASE_ANSWERS,
          contentMode: tpl.mode,
          sellingStyle: tpl.sellingStyle,
          durationS: dur,
        });
        expect(pack.bible.contentMode).toBe(tpl.mode);
        expect(pack.bible.sellingStyle).toBe(tpl.sellingStyle);
        expect(pack.scenes.length).toBeGreaterThanOrEqual(3);
        if (dur === 60) {
          expect(pack.scenes.length).toBe(8);
          expect(pack.scenes.reduce((acc, s) => acc + s.durationS, 0)).toBe(60);
          expect(pack.settings.durationS).toBe(60);
        }
        expect(pack.steps.length).toBeGreaterThanOrEqual(pack.scenes.length + 2);
        expect(pack.settings.creditsTotal).toBe(pack.scenes.length * 20);

        for (const sc of pack.scenes) {
          expect(sc.prompt.includes('\n')).toBe(false);
          expect(sc.prompt).toContain('NO SUBTITLES');
          expect(sc.prompt).toContain('Kopi Susu Gula Aren Senja');
        }
      }
    }
  });

  it('applies all 8 Video Styles and all 6 Hook Strategies cleanly in both Creator and Marketing modes', () => {
    const creatorTpl = getTemplateById('storytelling-konten')!;
    const marketingTpl = getTemplateById('iklan-konversi')!;

    for (const styleId of Object.keys(VIDEO_STYLES) as VideoStyleId[]) {
      const pack = generateOfflinePack(creatorTpl, { ...BASE_ANSWERS, videoStyle: styleId });
      expect(pack.bible.videoStyleName).toBe(VIDEO_STYLES[styleId].name);
      expect(pack.scenes[0].prompt).toContain('Visual Medium & Render Style:');
      expect(pack.assets[0].prompt).toContain(VIDEO_STYLES[styleId].assetStyleEn);
    }

    for (const hookId of Object.keys(HOOK_STRATEGIES) as HookStrategyId[]) {
      const creatorPack = generateOfflinePack(creatorTpl, {
        ...BASE_ANSWERS,
        contentMode: 'creator',
        hookStyle: hookId,
        voice: 'dialog',
      });
      expect(creatorPack.bible.hookStrategyName).toBe(HOOK_STRATEGIES[hookId].name);
      expect(creatorPack.scenes[0].prompt).toContain('SCROLL-STOPPING 0.0s');
      expect(Boolean(creatorPack.scenes[0].dialogue)).toBe(true);

      const mktPack = generateOfflinePack(marketingTpl, {
        ...BASE_ANSWERS,
        contentMode: 'marketing',
        sellingStyle: 'hard',
        hookStyle: hookId,
        voice: 'dialog',
      });
      expect(mktPack.bible.hookStrategyName).toBe(HOOK_STRATEGIES[hookId].marketingName);
      expect(mktPack.bible.productLock).toContain('Hero Product / Service Lock');

      const softTpl = getTemplateById('soft-selling-edukasi')!;
      const softPack = generateOfflinePack(softTpl, {
        ...BASE_ANSWERS,
        contentMode: 'marketing',
        sellingStyle: 'soft',
        hookStyle: hookId,
        voice: 'dialog',
      });
      expect(softPack.bible.hookStrategyName).toBe(HOOK_STRATEGIES[hookId].softSellingName);
      expect(softPack.bible.sellingStyle).toBe('soft');
    }
  });

  it('contains zero emojis in generated captions, descriptions, and prompts', () => {
    const tpl = getTemplateById('ugc-testimoni')!;
    const pack = generateOfflinePack(tpl, { ...BASE_ANSWERS, cast: 'person', voice: 'dialog' });
    const emojiRegex = /[\p{Extended_Pictographic}\uFE0F]/u;

    expect(emojiRegex.test(pack.caption)).toBe(false);
    for (const sc of pack.scenes) {
      expect(emojiRegex.test(sc.description)).toBe(false);
      expect(emojiRegex.test(sc.prompt)).toBe(false);
    }
  });

  it('switches step button labels between Ingredients and Frames when seamlessChain is toggled', () => {
    const tpl = getTemplateById('iklan-produk')!;
    const packIngredients = generateOfflinePack(tpl, { ...BASE_ANSWERS, seamlessChain: false });
    const scene2StepIng = packIngredients.steps.find((s) => s.sceneIdx === 1)!;
    expect(scene2StepIng.buttons.some((b) => b.label === 'Ingredients')).toBe(true);

    const packFrames = generateOfflinePack(tpl, { ...BASE_ANSWERS, seamlessChain: true });
    const scene2StepFrm = packFrames.steps.find((s) => s.sceneIdx === 1)!;
    expect(scene2StepFrm.buttons.some((b) => b.label === 'Frames')).toBe(true);
    expect(scene2StepFrm.buttons.some((b) => b.label === 'Start')).toBe(true);
  });

  it('recalculates pack credits and creates variations cleanly', () => {
    const tpl = getTemplateById('promo-makanan')!;
    const pack = generateOfflinePack(tpl, BASE_ANSWERS);
    const variedScene = createOfflineSceneVariation(pack.scenes[0], pack.bible, BASE_ANSWERS, 1);
    expect(variedScene.prompt).not.toEqual(pack.scenes[0].prompt);

    const updated = recalculatePack(pack, { ...BASE_ANSWERS, quality: 'terbaik' });
    expect(updated.settings.creditsScene).toBe(100);
    expect(updated.settings.creditsTotal).toBe(pack.scenes.length * 100);
  });

  it('embeds identical forensic Character DNA lock inside EVERY single scene prompt when character is enabled', () => {
    for (const tplId of ['iklan-produk', 'ugc-testimoni', 'edukasi-singkat', 'cerita-pendek']) {
      const tpl = getTemplateById(tplId)!;
      const pack = generateOfflinePack(tpl, {
        ...BASE_ANSWERS,
        videoStyle: 'kartun-3d',
        cast: 'person',
        characterCustom: 'cowok 24 thn rambut ikal, kacamata bulat, pakai hoodie hitam',
        voice: 'dialog',
      });

      expect(pack.bible.characterLock).toBeTruthy();
      expect(pack.assets.some((a) => a.id === 'character')).toBe(true);

      for (const sc of pack.scenes) {
        expect(sc.prompt).toContain('LOCKED CHARACTER IDENTITY');
        expect(sc.prompt).toContain(pack.bible.characterLock!);
        expect(sc.prompt).toContain('ZERO CHARACTER DRIFT');
      }
    }
  });

  it('exports TXT, Markdown, and Batch CSV accurately', () => {
    const tpl = getTemplateById('iklan-produk')!;
    const pack = generateOfflinePack(tpl, {
      ...BASE_ANSWERS,
      videoStyle: 'minecraft-voxel',
      hookStyle: 'skala-unik',
    });

    const txt = exportPackAsText(pack);
    const md = exportPackAsMarkdown(pack);
    const csv = exportBatchPacksAsCsv([{ product: BASE_ANSWERS.product, pack }]);

    expect(txt).toContain('PAKET PROMPT STUDIOFLOW');
    expect(txt).toContain('Style Minecraft (Voxel)');
    expect(md).toContain('# Paket Prompt StudioFlow');
    expect(csv).toContain('"Kopi Susu Gula Aren Senja"');
  });

  it('adds or swaps characters cleanly while keeping setting, style, and dialogue consistent', () => {
    const tpl = getTemplateById('showcase-sinematik')!;
    const noCharAnswers: Answers = {
      ...BASE_ANSWERS,
      contentMode: 'creator',
      product: 'Kenapa Otak Lupa Saat Pindah Ruangan',
      videoStyle: 'kartun-3d',
      cast: 'product',
      voice: 'none',
    };
    const noCharPack = generateOfflinePack(tpl, noCharAnswers);
    expect(noCharPack.bible.characterLock).toBeFalsy();
    const originalSetting = noCharPack.bible.setting;

    // 1. Add Sinta to a previously characterless project
    const added = swapPackCharacter(noCharPack, noCharAnswers, {
      mode: 'preset',
      presetId: 'sinta',
    });
    expect(added.pack.bible.characterName).toBe('Sinta');
    expect(added.pack.bible.setting).toBe(originalSetting);
    expect(added.pack.assets.some((a) => a.id === 'character' && a.name.includes('Sinta'))).toBe(
      true
    );
    expect(added.pack.scenes[0].prompt).toContain('Sinta');

    // 2. Swap Sinta -> Raka while keeping setting, style, and scene count 100% consistent
    const swapped = swapPackCharacter(added.pack, added.answers, {
      mode: 'preset',
      presetId: 'raka',
    });
    expect(swapped.pack.bible.characterName).toBe('Raka');
    expect(swapped.pack.bible.setting).toBe(originalSetting);
    expect(swapped.pack.assets.find((a) => a.id === 'character')?.prompt).toContain('Raka');
    expect(swapped.pack.scenes[0].prompt).toContain('Raka');
    expect(swapped.pack.scenes[0].prompt).not.toContain('Sinta');
  });

  it('enforces rich 8-second spoken scripts and position-aware opening/closing tone cues across every scene', () => {
    const templates = getAllTemplates();
    const emojiRegex = /[\p{Extended_Pictographic}\uFE0F]/u;

    for (const tpl of templates) {
      const pack = generateOfflinePack(tpl, {
        ...BASE_ANSWERS,
        contentMode: tpl.mode,
        sellingStyle: tpl.sellingStyle,
        durationS: 60,
        voice: 'dialog',
        cast: 'person',
      });

      expect(pack.scenes.length).toBe(8);

      pack.scenes.forEach((sc, idx) => {
        const wordCount = (sc.dialogue || '').trim().split(/\s+/).filter(Boolean).length;
        expect(wordCount).toBeGreaterThanOrEqual(18);
        expect(emojiRegex.test(sc.dialogue || '')).toBe(false);
        expect(sc.prompt).toContain('8-Second Clip Pacing');
        expect(sc.prompt).toContain('8-second spoken cadence');
        expect(sc.prompt).toContain('OPENING TONE:');
        expect(sc.prompt).toContain('CLOSING TONE:');

        if (idx === 0) {
          expect(sc.prompt).toContain('Opening Hook');
          expect(sc.prompt).toContain('bridging intonation');
        } else if (idx === pack.scenes.length - 1) {
          expect(sc.prompt).toContain('Final Closing');
          expect(sc.prompt).toContain('resolved downward closing cadence');
        } else {
          expect(sc.prompt).toContain('Continuous Story Beat');
          expect(sc.prompt).toContain('seamless mid-story continuation');
          expect(sc.prompt).toContain('open connective cadence');
        }
      });
    }
  });
});
