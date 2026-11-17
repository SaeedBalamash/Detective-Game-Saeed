import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import type { CaseData, Difficulty, GameState } from '../engine/types';
import { daftar } from '../cases/daftar';
import { Action, clearSave, importCode, initial, loadSave, makeReducer, save } from '../engine/state';
import { MINUTES, toArabicDigits as ar } from '../engine/logic';
import { Scene } from './art';
import { Play } from './Play';
import { Accuse, Resolution } from './End';

export const Ctx = createContext<{ s: GameState; d: (a: Action) => void; cs: CaseData }>(null as never);
export const useGame = () => useContext(Ctx);

const cs = daftar;
const reducer = makeReducer(cs);

/* صوت محيطي مولَّد برمجياً: همهمة هادئة + غليان خفيف */
function useAmbient(on: boolean) {
  const ref = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  useEffect(() => {
    if (!on) { ref.current?.gain.gain.setTargetAtTime(0, ref.current.ctx.currentTime, 0.3); return; }
    try {
      if (!ref.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; data[i] = last * 3; }
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
        const gain = ctx.createGain(); gain.gain.value = 0;
        src.connect(lp).connect(gain).connect(ctx.destination); src.start();
        ref.current = { ctx, gain };
      }
      void ref.current.ctx.resume();
      ref.current.gain.gain.setTargetAtTime(0.5, ref.current.ctx.currentTime, 0.8);
    } catch { /* الصوت غير متاح */ }
  }, [on]);
}

export function App() {
  const [s, d] = useReducer(reducer, initial);
  useEffect(() => { save(s); }, [s]);
  useEffect(() => {
    if (!(s.timed && s.phase === 'play')) return;
    const id = setInterval(() => d({ t: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [s.timed, s.phase]);
  useAmbient(!s.muted && s.phase !== 'title');

  return (
    <Ctx.Provider value={{ s, d, cs }}>
      <div className="app" data-phase={s.phase}>
        {s.phase === 'title' && <Title />}
        {s.phase === 'setup' && <Setup />}
        {s.phase === 'intro' && <Intro />}
        {s.phase === 'play' && <Play />}
        {s.phase === 'accuse' && <Accuse />}
        {s.phase === 'resolution' && <Resolution />}
      </div>
    </Ctx.Provider>
  );
}

function Title() {
  const { d, cs } = useGame();
  const [saved] = useState(() => loadSave());
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="title-screen">
      <Scene id="maqad" />
      <div className="title-card">
        <p className="kicker">لعبة تحقيق عائلية · ٦–١٠ لاعبين</p>
        <h1>{cs.title}</h1>
        <p className="sub">{cs.subtitle}</p>
        <p className="tag">ما كُتب بالحبر لا تمحوه السنين</p>
        <div className="col">
          <button className="btn primary" data-testid="new-game" onClick={() => d({ t: 'phase', phase: 'setup' })}>تحقيق جديد</button>
          {saved && (
            <button className="btn" data-testid="resume" onClick={() => d({ t: 'load', state: saved })}>
              استئناف التحقيق المحفوظ
            </button>
          )}
          <details>
            <summary>استيراد برمز الحفظ</summary>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="ألصقوا رمز الحفظ هنا" rows={3} />
            <button className="btn small" onClick={() => {
              const st = importCode(code);
              if (st) d({ t: 'load', state: st }); else setErr('الرمز غير صالح');
            }}>استيراد</button>
            {err && <p className="warn">{err}</p>}
          </details>
        </div>
        <p className="disclaimer">{cs.disclaimer}</p>
      </div>
    </div>
  );
}

const DIFF: { id: Difficulty; name: string; desc: string }[] = [
  { id: 'easy', name: 'سهل', desc: 'أدلة أوضح، أوقات ظاهرة في الخط الزمني، وأربع حركات لكل دور. مناسب مع الصغار.' },
  { id: 'normal', name: 'عادي', desc: 'التجربة الموصى بها: ثلاث حركات لكل دور وتلميحات معتدلة.' },
  { id: 'expert', name: 'خبير', desc: 'شهادات أقل صراحة، وقاعة المنطق تكتفي بعدد التناقضات.' },
];

function Setup() {
  const { d } = useGame();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [timed, setTimed] = useState(false);
  const [teams, setTeams] = useState([
    { name: 'فريق الروشن', members: '' },
    { name: 'فريق السماور', members: '' },
  ]);
  const names = ['فريق الروشن', 'فريق السماور', 'فريق السنبوك', 'فريق المقعد'];
  const total = teams.reduce((n, t) => n + t.members.split(/[،,\n]/).filter((x) => x.trim()).length, 0);
  return (
    <div className="page">
      <h2>إعداد التحقيق</h2>
      <section className="panel">
        <h3>مستوى الصعوبة</h3>
        <div className="choices">
          {DIFF.map((x) => (
            <button key={x.id} className={`choice ${difficulty === x.id ? 'on' : ''}`} data-testid={`diff-${x.id}`} onClick={() => setDifficulty(x.id)}>
              <strong>{x.name}</strong><span>{x.desc}</span>
            </button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} data-testid="timed" />
          وضع مؤقّت ({ar(MINUTES[difficulty])} دقيقة) — اتركوه فارغاً للعب الحر
        </label>
      </section>
      <section className="panel">
        <h3>الفرق ({ar(teams.length)})</h3>
        <p className="muted">فريقان إلى أربعة. اكتبوا أسماء اللاعبين مفصولة بفواصل ليوزّع عليهم اللعبُ الأدوار في كل دور (قارئ، كاتب، مستجوِب، عين الصقر). المجموع الحالي: {ar(total)} لاعبين.</p>
        {teams.map((t, i) => (
          <div className="team-row" key={i}>
            <input value={t.name} aria-label="اسم الفريق" onChange={(e) => setTeams(teams.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <input value={t.members} placeholder="مثال: سارة، عمر، جنى" aria-label="أسماء اللاعبين"
              onChange={(e) => setTeams(teams.map((x, j) => (j === i ? { ...x, members: e.target.value } : x)))} />
          </div>
        ))}
        <div className="row">
          {teams.length < 4 && <button className="btn small" data-testid="add-team" onClick={() => setTeams([...teams, { name: names[teams.length], members: '' }])}>+ فريق</button>}
          {teams.length > 2 && <button className="btn small" onClick={() => setTeams(teams.slice(0, -1))}>− فريق</button>}
        </div>
      </section>
      <div className="row end">
        <button className="btn" onClick={() => d({ t: 'phase', phase: 'title' })}>رجوع</button>
        <button className="btn primary" data-testid="start" onClick={() => {
          clearSave();
          d({
            t: 'start', difficulty, timed,
            teams: teams.map((t, i) => ({
              name: t.name.trim() || names[i],
              members: t.members.split(/[،,\n]/).map((x) => x.trim()).filter(Boolean),
            })),
          });
        }}>ابدأ</button>
      </div>
    </div>
  );
}

function Intro() {
  const { d, cs } = useGame();
  const [i, setI] = useState(0);
  const slide = cs.intro[i];
  const last = i === cs.intro.length - 1;
  return (
    <div className="cine">
      <Scene id={slide.scene} />
      <div className="cine-text" key={i}>
        <h2>{slide.title}</h2>
        <p>{slide.text}</p>
        <div className="row end">
          <span className="muted">{ar(i + 1)} / {ar(cs.intro.length)}</span>
          <button className="btn primary" data-testid="intro-next" onClick={() => (last ? d({ t: 'phase', phase: 'play' }) : setI(i + 1))}>
            {last ? 'ابدؤوا التحقيق' : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  );
}
