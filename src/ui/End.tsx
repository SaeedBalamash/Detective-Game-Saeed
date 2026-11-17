import { useEffect, useState } from 'react';
import type { Solution } from '../engine/types';
import { useGame } from './App';
import { Avatar, Scene } from './art';
import { score, timelineScore, toArabicDigits as ar } from '../engine/logic';
import { clearSave } from '../engine/state';

export function Accuse() {
  const { s, d, cs } = useGame();
  const team = s.teams[s.accuseIdx];
  const [ready, setReady] = useState(false);
  const [who, setWho] = useState('');
  const [motive, setMotive] = useState('');
  const [how, setHow] = useState('');
  const [ev, setEv] = useState<string[]>([]);
  const found = cs.evidence.filter((e) => s.found.includes(e.id) && e.kind !== 'card');
  const need = Math.min(3, found.length);
  const ok = who && motive && how && ev.length === need;

  if (!ready) {
    return (
      <div className="cine">
        <Scene id="majlis" />
        <div className="cine-text">
          <h2>الاتهام النهائي</h2>
          <p>كل فريق يسجّل استنتاجه سراً. سلّموا الجهاز الآن إلى <b style={{ color: team.color }}>{team.name}</b>، وليُدِر الباقون وجوههم.</p>
          <div className="row end">
            {s.accuseIdx === 0 && <button className="btn" onClick={() => d({ t: 'phase', phase: 'play' })}>عودة للتحقيق</button>}
            <button className="btn primary" data-testid="accuse-ready" onClick={() => setReady(true)}>نحن {team.name} — جاهزون</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="page">
      <h2 style={{ color: team.color }}>اتهام {team.name}</h2>
      <section className="panel">
        <h3>١ · من أخرج الدفتر من الصندوق؟</h3>
        <div className="grid people small">
          {cs.characters.map((c) => (
            <button key={c.id} className={`card person ${who === c.id ? 'on' : ''}`} data-testid={`acc-who-${c.id}`} onClick={() => setWho(c.id)}>
              <Avatar look={c.look} size={64} /><h3>{c.name}</h3>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <h3>٢ · لماذا؟</h3>
        <div className="choices">
          {cs.motives.map((m) => <button key={m.id} className={`choice ${motive === m.id ? 'on' : ''}`} data-testid={`acc-mo-${m.id}`} onClick={() => setMotive(m.id)}><span>{m.label}</span></button>)}
        </div>
      </section>
      <section className="panel">
        <h3>٣ · كيف والختم سليم؟</h3>
        <div className="choices">
          {cs.methods.map((m) => <button key={m.id} className={`choice ${how === m.id ? 'on' : ''}`} data-testid={`acc-how-${m.id}`} onClick={() => setHow(m.id)}><span>{m.label}</span></button>)}
        </div>
      </section>
      <section className="panel">
        <h3>٤ · أقوى {ar(need)} أدلة تدعم اتهامكم ({ar(ev.length)} / {ar(need)})</h3>
        <div className="chips">
          {found.map((e) => (
            <button key={e.id} className={`chip k-${e.kind} ${ev.includes(e.id) ? 'on' : ''}`} data-testid={`acc-ev-${e.id}`}
              onClick={() => setEv(ev.includes(e.id) ? ev.filter((x) => x !== e.id) : ev.length < need ? [...ev, e.id] : ev)}>{e.title}</button>
          ))}
        </div>
      </section>
      <div className="row end">
        <button className="btn primary" disabled={!ok} data-testid="acc-submit" onClick={() => {
          d({ t: 'accuse', a: { who, motive, how, evidence: ev } });
          setReady(false); setWho(''); setMotive(''); setHow(''); setEv([]);
        }}>ثبّتوا الاتهام</button>
      </div>
    </div>
  );
}

export function Resolution() {
  const { s, d, cs } = useGame();
  const [sol, setSol] = useState<Solution | null>(null);
  const [i, setI] = useState(0);
  useEffect(() => { void import('../cases/daftar/solution').then((m) => setSol(m.solution)); }, []);
  if (!sol) return <div className="page"><p>…</p></div>;

  if (i < sol.slides.length) {
    const sl = sol.slides[i];
    return (
      <div className="cine">
        <Scene id={sl.scene} />
        <div className="cine-text" key={i}>
          <h2>{sl.title}</h2>
          <p>{sl.text}</p>
          <div className="row end">
            <span className="muted">{ar(i + 1)} / {ar(sol.slides.length)}</span>
            <button className="btn primary" data-testid="res-next" onClick={() => setI(i + 1)}>{i === sol.slides.length - 1 ? 'النتائج' : 'التالي'}</button>
          </div>
        </div>
      </div>
    );
  }

  const name = (id: string) => cs.characters.find((c) => c.id === id)?.name ?? '—';
  const tlBonus = timelineScore(cs, 'tonight', s.order.tonight).perfect && s.order.tonight.length >= 8 ? 5 : 0;
  const rows = s.teams.map((t) => ({ t, sc: score(sol, t.accusation, t.hintPenalty) }));
  const best = Math.max(...rows.map((r) => r.sc.total));
  const votes = s.teams.map((t) => t.moral).filter(Boolean) as string[];
  const allVoted = votes.length === s.teams.length;
  const tally = cs.morals.map((m) => ({ m, n: votes.filter((v) => v === m.id).length })).sort((a, b) => b.n - a.n);
  const culprit = cs.characters.find((c) => c.id === sol.who)!;

  return (
    <div className="page" data-testid="verdict">
      <h2>الحقيقة</h2>
      <section className="panel verdict">
        <Avatar look={culprit.look} size={110} />
        <div>
          <h3>{culprit.name}</h3>
          <p><b>كيف:</b> {cs.methods.find((m) => m.id === sol.how)!.label}</p>
          <p><b>متى:</b> {cs.windows.find((m) => m.id === sol.when)!.label}</p>
          <p><b>لماذا:</b> {cs.motives.find((m) => m.id === sol.motive)!.label}</p>
        </div>
      </section>
      <section className="panel">
        <h3>نتائج الفرق</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>الفريق</th><th>اتهم</th><th>الفاعل</th><th>الدافع</th><th>الطريقة</th><th>الأدلة</th><th>التلميحات</th><th>المجموع</th></tr></thead>
            <tbody>
              {rows.map(({ t, sc }) => (
                <tr key={t.name} className={sc.total === best && best > 0 ? 'win' : ''}>
                  <td style={{ color: t.color }}>{t.name}</td>
                  <td>{t.accusation ? name(t.accusation.who) : '—'}</td>
                  <td>{ar(sc.who)}</td><td>{ar(sc.motive)}</td><td>{ar(sc.how)}</td><td>{ar(sc.evidence)}</td><td>{ar(sc.hints)}</td>
                  <td><b data-testid="total">{ar(sc.total)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tlBonus > 0 && <p className="ok">أحسنتم جميعاً: خط الليلة الزمني مرتب بلا خطأ.</p>}
        <p className="muted">الفاعل ٤٠ · الطريقة ٢٥ · الدافع ٢٠ · كل دليل داعم ٥.</p>
      </section>
      <section className="panel">
        <h3>السؤال الأخير: ماذا يُفعل بالأمانة؟</h3>
        <p className="muted">لا جواب صحيحاً هنا. كل فريق يصوّت، والأغلبية تحدد المشهد الأخير.</p>
        {s.teams.map((t, ti) => (
          <div key={t.name} className="vote">
            <b style={{ color: t.color }}>{t.name}</b>
            <div className="choices">
              {cs.morals.map((m) => (
                <button key={m.id} className={`choice ${t.moral === m.id ? 'on' : ''}`} data-testid={`moral-${ti}-${m.id}`}
                  onClick={() => d({ t: 'moral', team: ti, id: m.id })}><span>{m.label}</span></button>
              ))}
            </div>
          </div>
        ))}
      </section>
      {allVoted && (
        <section className="panel epilogue" data-testid="epilogue">
          <h3>المشهد الأخير</h3>
          <p>{sol.epilogues[tally[0].m.id]}</p>
        </section>
      )}
      <div className="row end">
        <button className="btn primary" data-testid="new-after" onClick={() => { clearSave(); d({ t: 'reset' }); }}>تحقيق جديد</button>
      </div>
    </div>
  );
}
