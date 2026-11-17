export type Difficulty = 'easy' | 'normal' | 'expert';

/** شرط فتح: كل الحقول المذكورة يجب أن تتحقق؛ `any` يكفي أحد فروعه. */
export interface Cond {
  ev?: string[];
  asked?: string[];
  loc?: string[];
  diff?: Difficulty[];
  any?: Cond[];
}

export type Txt = string | { easy?: string; normal: string; expert?: string };

export interface Look {
  skin: string;
  head: 'ghutra' | 'shemagh' | 'kufi' | 'hijab' | 'hair' | 'cap';
  headColor?: string;
  beard?: 'white' | 'grey' | 'black' | 'none';
  glasses?: boolean;
  cloth: string;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  role: string;
  bio: string;
  voice: string;
  deflect: string;
  look: Look;
}

export type EvKind = 'doc' | 'object' | 'photo' | 'testimony' | 'digital' | 'card';

export interface Evidence {
  id: string;
  title: string;
  kind: EvKind;
  where: string;
  summary: string;
  body?: string[];
  style?: 'ledger' | 'letter' | 'paper' | 'screen' | 'recipe';
  mini?: 'photodiff';
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
  text: string;
  gives?: string[];
  unlock?: Cond;
  eagle?: boolean;
}

export interface Location {
  id: string;
  name: string;
  scene: string;
  desc: string;
  unlock?: Cond;
  lockedHint?: string;
  hotspots: Hotspot[];
}

export interface DNode {
  id: string;
  who: string;
  q: string;
  a: Txt;
  unlock?: Cond;
  /** إن وُجد: لا يظهر هذا الرد إلا بمواجهة الشخصية بهذا الدليل */
  present?: string;
  gives?: string[];
}

export interface TEvent {
  id: string;
  era: 'tonight' | 'past';
  text: string;
  time: string;
  order: number;
  unlock?: Cond;
}

export interface Hypothesis {
  who: string;
  when: string;
  how: string;
}

export interface Constraint {
  id: string;
  needs: Cond;
  text: string;
  violated: (h: Hypothesis) => boolean;
}

export interface HintGroup {
  id: string;
  done: Cond;
  levels: [string, string, string];
}

export interface Option {
  id: string;
  label: string;
}

export interface CaseData {
  id: string;
  title: string;
  subtitle: string;
  disclaimer: string;
  intro: { title: string; text: string; scene: string }[];
  characters: Character[];
  locations: Location[];
  evidence: Evidence[];
  dialogue: DNode[];
  timeline: TEvent[];
  windows: Option[];
  methods: Option[];
  motives: Option[];
  constraints: Constraint[];
  hints: HintGroup[];
  morals: Option[];
  glossary: { term: string; meaning: string }[];
}

export interface Solution {
  who: string;
  when: string;
  how: string;
  motive: string;
  support: string[];
  slides: { title: string; text: string; scene: string }[];
  epilogues: Record<string, string>;
}

export interface Accusation {
  who: string;
  motive: string;
  how: string;
  evidence: string[];
}

export interface Team {
  name: string;
  color: string;
  members: string[];
  notes: string;
  hintPenalty: number;
  hintsUsed: number;
  accusation?: Accusation;
  moral?: string;
}

export interface Link {
  a: string;
  b: string;
  label: string;
}

export type Phase = 'title' | 'setup' | 'intro' | 'play' | 'accuse' | 'resolution';

export interface GameState {
  v: 1;
  phase: Phase;
  difficulty: Difficulty;
  timed: boolean;
  timeLeft: number;
  teams: Team[];
  turn: number;
  actionsLeft: number;
  found: string[];
  visited: string[];
  asked: string[];
  seenHot: string[];
  log: { team: number; text: string }[];
  links: Link[];
  order: { tonight: string[]; past: string[] };
  hintLevel: Record<string, number>;
  marks: Record<string, number>;
  accuseIdx: number;
  muted: boolean;
}
