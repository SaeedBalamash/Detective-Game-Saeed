import { describe, expect, it } from 'vitest';
import { daftar as cs } from '../src/cases/daftar';
import { solution as sol } from '../src/cases/daftar/solution';
import { contradictions, currentHint, met, score, survivors, timelineScore } from '../src/engine/logic';
import { exportCode, importCode, initial, makeReducer } from '../src/engine/state';
import type { Cond, GameState } from '../src/engine/types';

const evIds = new Set(cs.evidence.map((e) => e.id));
const nodeIds = new Set(cs.dialogue.map((n) => n.id));
const condRefs = (c?: Cond): { ev: string[]; asked: string[] } => {
  if (!c) return { ev: [], asked: [] };
  const sub = (c.any ?? []).map(condRefs);
  return { ev: [...(c.ev ?? []), ...sub.flatMap((x) => x.ev)], asked: [...(c.asked ?? []), ...sub.flatMap((x) => x.asked)] };
};

/** يحاكي لاعباً يفعل كل ما هو متاح حتى لا يبقى جديد؛ يعيد ما أمكن الوصول إليه. */
function exhaust(difficulty: GameState['difficulty']) {
  const s = { found: [] as string[], asked: [] as string[], visited: [] as string[], difficulty };
  let changed = true;
  while (changed) {
    changed = false;
    const add = (ids: string[] = []) => ids.forEach((id) => { if (!s.found.includes(id)) { s.found.push(id); changed = true; } });
    for (const l of cs.locations) {
      if (!met(l.unlock, s)) continue;
      if (!s.visited.includes(l.id)) { s.visited.push(l.id); changed = true; }
      for (const h of l.hotspots) if (met(h.unlock, s)) add(h.gives);
    }
    for (const n of cs.dialogue) {
      if (s.asked.includes(n.id) || !met(n.unlock, s)) continue;
      if (n.present && !s.found.includes(n.present)) continue;
      s.asked.push(n.id); changed = true; add(n.gives);
    }
    if (s.found.includes('e_photo1') && s.found.includes('e_photo2')) add(['e_photodiff']);
  }
  return s;
}

describe('سلامة بيانات القضية', () => {
  it('المعرّفات فريدة', () => {
    expect(evIds.size).toBe(cs.evidence.length);
    expect(nodeIds.size).toBe(cs.dialogue.length);
    const hs = cs.locations.flatMap((l) => l.hotspots.map((h) => h.id));
    expect(new Set(hs).size).toBe(hs.length);
  });
  it('كل مرجع يشير إلى عنصر موجود', () => {
    const chars = new Set(cs.characters.map((c) => c.id));
    for (const l of cs.locations) {
      for (const r of condRefs(l.unlock).ev) expect(evIds.has(r), r).toBe(true);
      for (const r of condRefs(l.unlock).asked) expect(nodeIds.has(r), r).toBe(true);
      for (const h of l.hotspots) {
        for (const g of h.gives ?? []) expect(evIds.has(g), g).toBe(true);
        for (const r of condRefs(h.unlock).ev) expect(evIds.has(r), r).toBe(true);
        for (const r of condRefs(h.unlock).asked) expect(nodeIds.has(r), r).toBe(true);
        expect(h.x).toBeGreaterThan(0); expect(h.x).toBeLessThan(100);
      }
    }
    for (const n of cs.dialogue) {
      expect(chars.has(n.who), n.id).toBe(true);
      if (n.present) expect(evIds.has(n.present), n.id).toBe(true);
      for (const g of n.gives ?? []) expect(evIds.has(g), g).toBe(true);
      for (const r of condRefs(n.unlock).ev) expect(evIds.has(r), r).toBe(true);
    }
    for (const c of cs.constraints) for (const r of condRefs(c.needs).ev) expect(evIds.has(r), r).toBe(true);
    for (const t of cs.timeline) for (const r of condRefs(t.unlock).ev) expect(evIds.has(r), r).toBe(true);
    for (const s of sol.support) expect(evIds.has(s), s).toBe(true);
  });
  it('ثماني شخصيات على الأقل وثلاثة أجيال', () => {
    expect(cs.characters.length).toBeGreaterThanOrEqual(8);
    const ages = cs.characters.map((c) => c.age);
    expect(Math.min(...ages)).toBeLessThan(20); expect(Math.max(...ages)).toBeGreaterThan(75);
  });
});

describe('المنطق: الحل وحيد ومبرهَن', () => {
  it('فرضية واحدة فقط تصمد أمام كل القيود، وهي الحل', () => {
    const surv = survivors(cs);
    expect(surv).toEqual([{ who: sol.who, when: sol.when, how: sol.how }]);
  });
  it('كل مشتبه آخر يُستبعد بقيد واحد على الأقل في النافذة والطريقة الصحيحتين', () => {
    for (const c of cs.characters) {
      if (c.id === sol.who) continue;
      const h = { who: c.id, when: sol.when, how: sol.how };
      expect(cs.constraints.some((k) => k.violated(h)), c.id).toBe(true);
    }
  });
  it('كل قيد له فائدة: يستبعد فرضية واحدة على الأقل ولا يناقض الحل', () => {
    const truth = { who: sol.who, when: sol.when, how: sol.how };
    for (const k of cs.constraints) {
      expect(k.violated(truth), k.id).toBe(false);
      let kills = 0;
      for (const c of cs.characters) for (const w of cs.windows) for (const m of cs.methods)
        if (k.violated({ who: c.id, when: w.id, how: m.id })) kills++;
      expect(kills, k.id).toBeGreaterThan(0);
    }
  });
  it('الخط الزمني بلا تعارض: ترتيب فريد لكل حقبة', () => {
    for (const era of ['tonight', 'past'] as const) {
      const orders = cs.timeline.filter((e) => e.era === era).map((e) => e.order);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });
});

describe.each(['easy', 'normal', 'expert'] as const)('قابلية الوصول (%s)', (diff) => {
  const s = exhaust(diff);
  it('كل الأدلة قابلة للاكتشاف', () => {
    const missing = cs.evidence.map((e) => e.id).filter((id) => !s.found.includes(id));
    expect(missing).toEqual([]);
  });
  it('كل الأماكن تُفتح وكل الحوارات تُطرح', () => {
    expect(cs.locations.every((l) => s.visited.includes(l.id))).toBe(true);
    expect(cs.dialogue.every((n) => s.asked.includes(n.id))).toBe(true);
  });
  it('بكل الأدلة: الحل لا يناقضه شيء، وكل مشتبه آخر يُستبعد', () => {
    expect(contradictions(cs, s, { who: sol.who, when: sol.when, how: sol.how })).toEqual([]);
    for (const c of cs.characters) {
      if (c.id === sol.who) continue;
      expect(contradictions(cs, s, { who: c.id, when: sol.when, how: sol.how }).length, c.id).toBeGreaterThan(0);
    }
  });
  it('كل أحداث الخط الزمني تُكتشف', () => {
    expect(cs.timeline.every((e) => met(e.unlock, s))).toBe(true);
  });
});

describe('المحرّك', () => {
  const reducer = makeReducer(cs);
  const start = () => reducer(initial, {
    t: 'start', difficulty: 'normal', timed: true,
    teams: [{ name: 'أ', members: ['١', '٢', '٣'] }, { name: 'ب', members: ['٤', '٥', '٦'] }],
  });
  it('الأدوار تتناوب بعد ثلاث حركات', () => {
    let s = start();
    expect(s.turn).toBe(0); expect(s.actionsLeft).toBe(3);
    for (const id of ['a', 'b', 'c']) s = reducer(s, { t: 'hotspot', id, label: id, gives: [] });
    expect(s.turn).toBe(1); expect(s.actionsLeft).toBe(3);
    s = reducer(s, { t: 'hotspot', id: 'a', label: 'a', gives: [] });
    expect(s.actionsLeft).toBe(3);
  });
  it('الأدلة تُضاف بلا تكرار وتفتح أحداث الخط الزمني', () => {
    let s = start();
    s = reducer(s, { t: 'hotspot', id: 'h_gate', label: 'x', gives: ['e_gatelog'] });
    s = reducer(s, { t: 'ask', id: 'q', label: 'x', gives: ['e_gatelog'] });
    expect(s.found.filter((x) => x === 'e_gatelog').length).toBe(1);
    expect(s.order.tonight).toContain('tn3');
  });
  it('التلميحات ثلاث درجات وتخصم من الفريق صاحب الدور فقط', () => {
    let s = start();
    const g = currentHint(cs, s).id;
    for (let i = 0; i < 5; i++) s = reducer(s, { t: 'hint', group: g });
    expect(s.hintLevel[g]).toBe(3);
    expect(s.teams[0].hintPenalty).toBe(19); expect(s.teams[1].hintPenalty).toBe(0);
  });
  it('المؤقت ينقص في اللعب فقط', () => {
    let s = start();
    const t0 = s.timeLeft;
    s = reducer(s, { t: 'tick' }); expect(s.timeLeft).toBe(t0);
    s = reducer(s, { t: 'phase', phase: 'play' });
    s = reducer(s, { t: 'tick' }); expect(s.timeLeft).toBe(t0 - 1);
  });
  it('الاتهام يُسجَّل لكل فريق ثم ينتقل إلى الخاتمة', () => {
    let s = reducer(start(), { t: 'phase', phase: 'accuse' });
    s = reducer(s, { t: 'accuse', a: { who: sol.who, motive: sol.motive, how: sol.how, evidence: sol.support.slice(0, 3) } });
    expect(s.phase).toBe('accuse');
    s = reducer(s, { t: 'accuse', a: { who: 'salim', motive: 'mo_deal', how: 'm_key', evidence: [] } });
    expect(s.phase).toBe('resolution');
    expect(score(sol, s.teams[0].accusation, 0).total).toBe(100);
    expect(score(sol, s.teams[1].accusation, 0).total).toBe(0);
  });
  it('الحفظ والاستيراد يعيدان الحالة نفسها', () => {
    const s = reducer(start(), { t: 'note', text: 'ملاحظة عربية ✦' });
    expect(importCode(exportCode(s))).toEqual(s);
    expect(importCode('كلام فارغ')).toBeNull();
  });
  it('تقييم الخط الزمني', () => {
    expect(timelineScore(cs, 'tonight', ['tn1', 'tn2', 'tn3']).perfect).toBe(true);
    expect(timelineScore(cs, 'tonight', ['tn3', 'tn1', 'tn2']).right).toBe(0);
  });
});
