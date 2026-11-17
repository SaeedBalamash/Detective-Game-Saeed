import type { Accusation, CaseData, Difficulty, GameState, Link, Team } from './types';
import { ACTIONS, HINT_COST, MINUTES, met } from './logic';

export const SAVE_KEY = 'daftar.save.v1';
export const TEAM_COLORS = ['#d9a441', '#3aa6a0', '#c8553d', '#7b6bd6'];

export const initial: GameState = {
  v: 1, phase: 'title', difficulty: 'normal', timed: false, timeLeft: 0, teams: [],
  turn: 0, actionsLeft: 3, found: [], visited: [], asked: [], seenHot: [], log: [], links: [],
  order: { tonight: [], past: [] }, hintLevel: {}, marks: {}, accuseIdx: 0, muted: true,
};

export type Action =
  | { t: 'load'; state: GameState }
  | { t: 'reset' }
  | { t: 'phase'; phase: GameState['phase'] }
  | { t: 'start'; difficulty: Difficulty; timed: boolean; teams: { name: string; members: string[] }[] }
  | { t: 'visit'; loc: string }
  | { t: 'hotspot'; id: string; label: string; gives: string[] }
  | { t: 'ask'; id: string; label: string; gives: string[] }
  | { t: 'grant'; ids: string[]; label: string }
  | { t: 'endTurn' }
  | { t: 'note'; text: string }
  | { t: 'link'; link: Link }
  | { t: 'unlink'; i: number }
  | { t: 'order'; era: 'tonight' | 'past'; ids: string[] }
  | { t: 'hint'; group: string }
  | { t: 'tick' }
  | { t: 'accuse'; a: Accusation }
  | { t: 'moral'; team: number; id: string }
  | { t: 'mark'; key: string }
  | { t: 'mute' };

function spend(s: GameState, label: string, cs: CaseData): GameState {
  const log = [...s.log, { team: s.turn, text: label }];
  let actionsLeft = s.actionsLeft - 1;
  let turn = s.turn;
  if (actionsLeft <= 0) {
    turn = (s.turn + 1) % s.teams.length;
    actionsLeft = ACTIONS[s.difficulty];
  }
  return syncOrder({ ...s, log, actionsLeft, turn }, cs);
}

/** يضيف أحداث الخط الزمني المكتشفة حديثاً إلى ترتيب اللاعبين (في آخر القائمة). */
function syncOrder(s: GameState, cs: CaseData): GameState {
  const order = { tonight: [...s.order.tonight], past: [...s.order.past] };
  for (const e of cs.timeline) {
    if (met(e.unlock, s) && !order[e.era].includes(e.id)) order[e.era].push(e.id);
  }
  return { ...s, order };
}

const uniq = (a: string[]) => Array.from(new Set(a));

export function makeReducer(cs: CaseData) {
  return function reducer(s: GameState, a: Action): GameState {
    switch (a.t) {
      case 'load': return a.state;
      case 'reset': return { ...initial, muted: s.muted };
      case 'phase': return { ...s, phase: a.phase };
      case 'start': {
        const teams: Team[] = a.teams.map((t, i) => ({
          name: t.name, members: t.members, color: TEAM_COLORS[i % TEAM_COLORS.length],
          notes: '', hintPenalty: 0, hintsUsed: 0,
        }));
        return syncOrder({
          ...initial, muted: s.muted, phase: 'intro', difficulty: a.difficulty, timed: a.timed,
          timeLeft: MINUTES[a.difficulty] * 60, teams, actionsLeft: ACTIONS[a.difficulty],
        }, cs);
      }
      case 'visit': return s.visited.includes(a.loc) ? s : { ...s, visited: [...s.visited, a.loc] };
      case 'hotspot': {
        if (s.seenHot.includes(a.id)) return s;
        return spend({ ...s, seenHot: [...s.seenHot, a.id], found: uniq([...s.found, ...a.gives]) }, `فحص: ${a.label}`, cs);
      }
      case 'ask': {
        if (s.asked.includes(a.id)) return s;
        return spend({ ...s, asked: [...s.asked, a.id], found: uniq([...s.found, ...a.gives]) }, `سؤال: ${a.label}`, cs);
      }
      case 'grant':
        return syncOrder({ ...s, found: uniq([...s.found, ...a.ids]), log: [...s.log, { team: s.turn, text: a.label }] }, cs);
      case 'endTurn':
        return { ...s, turn: (s.turn + 1) % s.teams.length, actionsLeft: ACTIONS[s.difficulty] };
      case 'note': {
        const teams = s.teams.map((t, i) => (i === s.turn ? { ...t, notes: a.text } : t));
        return { ...s, teams };
      }
      case 'link': return { ...s, links: [...s.links, a.link] };
      case 'unlink': return { ...s, links: s.links.filter((_, i) => i !== a.i) };
      case 'order': return { ...s, order: { ...s.order, [a.era]: a.ids } };
      case 'hint': {
        const lvl = s.hintLevel[a.group] ?? 0;
        if (lvl >= 3) return s;
        const teams = s.teams.map((t, i) =>
          i === s.turn ? { ...t, hintPenalty: t.hintPenalty + HINT_COST[lvl], hintsUsed: t.hintsUsed + 1 } : t);
        return { ...s, teams, hintLevel: { ...s.hintLevel, [a.group]: lvl + 1 } };
      }
      case 'tick':
        return s.timed && s.phase === 'play' && s.timeLeft > 0 ? { ...s, timeLeft: s.timeLeft - 1 } : s;
      case 'accuse': {
        const teams = s.teams.map((t, i) => (i === s.accuseIdx ? { ...t, accusation: a.a } : t));
        const next = s.accuseIdx + 1;
        return next >= s.teams.length
          ? { ...s, teams, accuseIdx: next, phase: 'resolution' }
          : { ...s, teams, accuseIdx: next };
      }
      case 'moral': {
        const teams = s.teams.map((t, i) => (i === a.team ? { ...t, moral: a.id } : t));
        return { ...s, teams };
      }
      case 'mark': return { ...s, marks: { ...s.marks, [a.key]: ((s.marks[a.key] ?? 0) + 1) % 3 } };
      case 'mute': return { ...s, muted: !s.muted };
    }
  };
}

export function save(s: GameState) {
  try {
    if (s.phase === 'title') return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch { /* التخزين غير متاح */ }
}

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s && s.v === 1 && Array.isArray(s.teams) ? s : null;
  } catch { return null; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* */ }
}

export function exportCode(s: GameState) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}

export function importCode(code: string): GameState | null {
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(code.trim())))) as GameState;
    return s && s.v === 1 && Array.isArray(s.teams) ? s : null;
  } catch { return null; }
}
