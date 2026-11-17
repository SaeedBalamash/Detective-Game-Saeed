import type {
  Accusation, CaseData, Cond, Difficulty, GameState, Hypothesis, Solution, Txt,
} from './types';

export const ACTIONS: Record<Difficulty, number> = { easy: 4, normal: 3, expert: 3 };
export const MINUTES: Record<Difficulty, number> = { easy: 75, normal: 110, expert: 150 };
export const HINT_COST = [3, 6, 10];

type Progress = Pick<GameState, 'found' | 'asked' | 'visited' | 'difficulty'>;

export function met(c: Cond | undefined, s: Progress): boolean {
  if (!c) return true;
  if (c.ev && !c.ev.every((e) => s.found.includes(e))) return false;
  if (c.asked && !c.asked.every((e) => s.asked.includes(e))) return false;
  if (c.loc && !c.loc.every((e) => s.visited.includes(e))) return false;
  if (c.diff && !c.diff.includes(s.difficulty)) return false;
  if (c.any && !c.any.some((x) => met(x, s))) return false;
  return true;
}

export function txt(t: Txt, d: Difficulty): string {
  if (typeof t === 'string') return t;
  return t[d] ?? t.normal;
}

/** القيود المكتشفة التي تناقضها الفرضية. */
export function contradictions(cs: CaseData, s: Progress, h: Hypothesis) {
  return cs.constraints.filter((c) => met(c.needs, s) && c.violated(h));
}

export function knownConstraints(cs: CaseData, s: Progress) {
  return cs.constraints.filter((c) => met(c.needs, s));
}

/** كل الفرضيات التي لا يناقضها أي قيد (تُستعمل في التحقق الآلي من وحدانية الحل). */
export function survivors(cs: CaseData): Hypothesis[] {
  const out: Hypothesis[] = [];
  for (const who of cs.characters)
    for (const when of cs.windows)
      for (const how of cs.methods) {
        const h = { who: who.id, when: when.id, how: how.id };
        if (!cs.constraints.some((c) => c.violated(h))) out.push(h);
      }
  return out;
}

export function currentHint(cs: CaseData, s: Progress) {
  return cs.hints.find((g) => !met(g.done, s)) ?? cs.hints[cs.hints.length - 1];
}

export function timelineScore(cs: CaseData, era: 'tonight' | 'past', order: string[]) {
  const by = new Map(cs.timeline.map((e) => [e.id, e.order]));
  const sorted = [...order].sort((a, b) => by.get(a)! - by.get(b)!);
  const right = order.filter((id, i) => sorted[i] === id).length;
  return { right, total: order.length, perfect: right === order.length && order.length > 1, sorted };
}

export interface Score {
  who: number; motive: number; how: number; evidence: number; hints: number; total: number;
}

export function score(sol: Solution, a: Accusation | undefined, hintPenalty: number): Score {
  if (!a) return { who: 0, motive: 0, how: 0, evidence: 0, hints: -hintPenalty, total: Math.max(0, -hintPenalty) };
  const who = a.who === sol.who ? 40 : 0;
  const motive = a.motive === sol.motive ? 20 : 0;
  const how = a.how === sol.how ? 25 : 0;
  const evidence = a.evidence.filter((e) => sol.support.includes(e)).length * 5;
  const total = Math.max(0, who + motive + how + evidence - hintPenalty);
  return { who, motive, how, evidence, hints: -hintPenalty, total };
}

export function toArabicDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
}
