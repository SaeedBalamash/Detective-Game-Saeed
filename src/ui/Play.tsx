import { useMemo, useState } from 'react';
import type { Character, Evidence, Hypothesis } from '../engine/types';
import { useGame } from './App';
import { Avatar, Scene, YusufPhoto } from './art';
import {
  ACTIONS, HINT_COST, contradictions, currentHint, knownConstraints, met, timelineScore, toArabicDigits as ar, txt,
} from '../engine/logic';
import { exportCode } from '../engine/state';

type Tab = 'places' | 'people' | 'evidence' | 'notes' | 'board' | 'time' | 'logic' | 'hints';
const TABS: { id: Tab; name: string; icon: string }[] = [
  { id: 'places', name: 'الأماكن', icon: '🏠' },
  { id: 'people', name: 'الأشخاص', icon: '👥' },
  { id: 'evidence', name: 'الأدلة', icon: '🗂️' },
  { id: 'notes', name: 'الدفتر', icon: '📓' },
  { id: 'board', name: 'اللوحة', icon: '🧵' },
  { id: 'time', name: 'الزمن', icon: '⏳' },
  { id: 'logic', name: 'المنطق', icon: '⚖️' },
  { id: 'hints', name: 'تلميح', icon: '💡' },
];
const ROLES = ['القارئ', 'الكاتب', 'المستجوِب', 'عين الصقر'];
const KIND: Record<string, string> = { doc: 'وثيقة', object: 'غرض', photo: 'صورة', testimony: 'إفادة', digital: 'رقمي', card: 'بطاقة معرفية' };

export function Play() {
  const { s, d, cs } = useGame();
  const [tab, setTab] = useState<Tab>('places');
  const [open, setOpen] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const team = s.teams[s.turn];
  const rot = s.log.length;
  const mm = Math.floor(s.timeLeft / 60), ss = s.timeLeft % 60;
  const ev = open ? cs.evidence.find((e) => e.id === open) : null;

  return (
    <div className="play">
      <header className="top">
        <div className="brand">{cs.title}</div>
        <div className="turn" style={{ borderColor: team.color }} data-testid="turn">
          <span className="dot" style={{ background: team.color }} />
          <strong>{team.name}</strong>
          <span className="pips" aria-label={`باقي ${s.actionsLeft} حركات`}>
            {Array.from({ length: ACTIONS[s.difficulty] }).map((_, i) => <i key={i} className={i < s.actionsLeft ? 'on' : ''} />)}
          </span>
        </div>
        {s.timed && <div className={`timer ${s.timeLeft < 300 ? 'low' : ''}`}>{s.timeLeft > 0 ? `${ar(mm)}:${ar(String(ss).padStart(2, '0'))}` : 'انتهى الوقت'}</div>}
        <div className="spacer" />
        <button className="icon" title="الصوت" onClick={() => d({ t: 'mute' })}>{s.muted ? '🔇' : '🔊'}</button>
        <button className="icon" title="القائمة" data-testid="menu" onClick={() => setMenu(true)}>☰</button>
      </header>

      {team.members.length > 0 && (
        <div className="roles">
          {ROLES.slice(0, Math.max(1, Math.min(4, team.members.length))).map((r, i) => (
            <span key={r}><b>{r}:</b> {team.members[(i + rot) % team.members.length]}</span>
          ))}
        </div>
      )}

      <main className="stage">
        {tab === 'places' && <Places onEv={setOpen} />}
        {tab === 'people' && <People onEv={setOpen} />}
        {tab === 'evidence' && <EvidenceList onEv={setOpen} />}
        {tab === 'notes' && <Notes onEv={setOpen} />}
        {tab === 'board' && <Board />}
        {tab === 'time' && <Timeline />}
        {tab === 'logic' && <Logic />}
        {tab === 'hints' && <Hints />}
      </main>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>{t.name}
          </button>
        ))}
        <button className="accuse" data-testid="go-accuse" onClick={() => setMenu(true)}><span>🔏</span>الاتهام</button>
      </nav>

      {ev && <EvidenceModal ev={ev} onClose={() => setOpen(null)} />}
      {menu && (
        <div className="modal" onClick={() => setMenu(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>القائمة</h3>
            <p className="muted">التقدم يُحفظ تلقائياً على هذا الجهاز.</p>
            <button className="btn" onClick={() => { d({ t: 'endTurn' }); setMenu(false); }}>إنهاء دور {team.name} الآن</button>
            <button className="btn" onClick={() => { void navigator.clipboard?.writeText(exportCode(s)); alert('نُسخ رمز الحفظ.'); }}>نسخ رمز الحفظ</button>
            <button className="btn primary" data-testid="confirm-accuse" onClick={() => d({ t: 'phase', phase: 'accuse' })}>
              انتهينا من التحقيق — إلى الاتهام النهائي
            </button>
            <button className="btn danger" onClick={() => { if (confirm('إنهاء اللعبة والعودة للبداية؟')) d({ t: 'reset' }); }}>خروج إلى البداية</button>
            <button className="btn" onClick={() => setMenu(false)}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= الأماكن ================= */
function Places({ onEv }: { onEv: (id: string) => void }) {
  const { s, d, cs } = useGame();
  const [locId, setLocId] = useState<string | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const loc = cs.locations.find((l) => l.id === locId);

  if (!loc) {
    return (
      <div className="grid cards">
        {cs.locations.map((l) => {
          const ok = met(l.unlock, s);
          const seen = l.hotspots.filter((h) => s.seenHot.includes(h.id)).length;
          return (
            <button key={l.id} className={`card loc ${ok ? '' : 'locked'}`} disabled={!ok} data-testid={`loc-${l.id}`}
              onClick={() => { setLocId(l.id); setHot(null); d({ t: 'visit', loc: l.id }); }}>
              <Scene id={l.scene} />
              <div className="card-body">
                <h3>{ok ? l.name : '🔒 ' + l.name}</h3>
                <p>{ok ? l.desc : l.lockedHint}</p>
                {ok && <span className="badge">{ar(seen)} / {ar(l.hotspots.length)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    );
  }
  const spots = loc.hotspots.filter((h) => met(h.unlock, s));
  const cur = spots.find((h) => h.id === hot);
  return (
    <div className="place">
      <div className="place-head">
        <button className="btn small" data-testid="back-places" onClick={() => setLocId(null)}>→ كل الأماكن</button>
        <h2>{loc.name}</h2>
      </div>
      <div className="place-grid">
      <Scene id={loc.scene}>
        {spots.map((h) => (
          <button key={h.id} data-testid={`hot-${h.id}`}
            className={`hotspot ${s.seenHot.includes(h.id) ? 'seen' : ''} ${h.eagle ? 'eagle' : ''} d-${s.difficulty}`}
            style={{ left: `${h.x}%`, top: `${h.y}%` }} aria-label={h.label}
            onClick={() => { setHot(h.id); d({ t: 'hotspot', id: h.id, label: `${loc.name} — ${h.label}`, gives: h.gives ?? [] }); }}>
            <span>{h.eagle ? '👁' : '✦'}</span><em>{h.label}</em>
          </button>
        ))}
      </Scene>
      <div className="panel finding" aria-live="polite">
        {cur ? (
          <>
            <h3>{cur.label}{cur.eagle && <span className="badge gold">عين الصقر</span>}</h3>
            <p>{cur.text}</p>
            <EvChips ids={cur.gives ?? []} onEv={onEv} />
          </>
        ) : <p className="muted">{loc.desc} — اختاروا نقطة للفحص. كل فحص جديد يستهلك حركة من دور الفريق.</p>}
      </div>
      </div>
    </div>
  );
}

function EvChips({ ids, onEv }: { ids: string[]; onEv: (id: string) => void }) {
  const { cs } = useGame();
  if (!ids.length) return null;
  return (
    <div className="chips">
      {ids.map((id) => {
        const e = cs.evidence.find((x) => x.id === id)!;
        return <button key={id} className={`chip k-${e.kind}`} data-testid={`chip-${id}`} onClick={() => onEv(id)}>+ {e.title}</button>;
      })}
    </div>
  );
}

/* ================= الأشخاص ================= */
function People({ onEv }: { onEv: (id: string) => void }) {
  const { s, d, cs } = useGame();
  const [who, setWho] = useState<string | null>(null);
  const [pick, setPick] = useState(false);
  const [last, setLast] = useState<{ q: string; a: string; gives: string[] } | null>(null);
  const c = cs.characters.find((x) => x.id === who);

  if (!c) {
    return (
      <div className="grid people">
        {cs.characters.map((p) => (
          <button key={p.id} className="card person" data-testid={`char-${p.id}`} onClick={() => { setWho(p.id); setLast(null); }}>
            <Avatar look={p.look} />
            <h3>{p.name}</h3>
            <p>{p.role} · {ar(p.age)}</p>
          </button>
        ))}
      </div>
    );
  }
  const nodes = cs.dialogue.filter((n) => n.who === c.id && met(n.unlock, s));
  const open = nodes.filter((n) => !n.present);
  const done = nodes.filter((n) => s.asked.includes(n.id));
  const found = cs.evidence.filter((e) => s.found.includes(e.id) && e.kind !== 'card');

  const confront = (ev: Evidence) => {
    setPick(false);
    const n = nodes.find((x) => x.present === ev.id);
    if (n) {
      d({ t: 'ask', id: n.id, label: `مواجهة ${c.name} بـ«${ev.title}»`, gives: n.gives ?? [] });
      setLast({ q: n.q, a: txt(n.a, s.difficulty), gives: n.gives ?? [] });
    } else {
      d({ t: 'ask', id: `miss:${c.id}:${ev.id}`, label: `مواجهة ${c.name} بـ«${ev.title}» (بلا نتيجة)`, gives: [] });
      setLast({ q: `(${ev.title})`, a: c.deflect, gives: [] });
    }
  };

  return (
    <div className="talk">
      <div className="place-head">
        <button className="btn small" data-testid="back-people" onClick={() => setWho(null)}>→ كل الأشخاص</button>
      </div>
      <div className="talk-grid">
        <aside className="panel profile">
          <Avatar look={c.look} size={140} />
          <h2>{c.name}</h2>
          <p className="muted">{c.role} · {ar(c.age)} سنة</p>
          <p>{c.bio}</p>
          <p className="muted">الصوت: {c.voice}</p>
        </aside>
        <section>
          <div className="panel bubble" aria-live="polite">
            {last ? (
              <>
                <p className="q">— {last.q}</p>
                <p className="a">«{last.a}»</p>
                <EvChips ids={last.gives} onEv={onEv} />
              </>
            ) : <p className="muted">اختاروا سؤالاً، أو واجهوا {c.name} بدليل وجدتموه. كل سؤال جديد يستهلك حركة.</p>}
          </div>
          <div className="qs">
            {open.map((n) => (
              <button key={n.id} className={`q-btn ${s.asked.includes(n.id) ? 'asked' : ''}`} data-testid={`q-${n.id}`}
                onClick={() => { d({ t: 'ask', id: n.id, label: `${c.name}: ${n.q}`, gives: n.gives ?? [] }); setLast({ q: n.q, a: txt(n.a, s.difficulty), gives: n.gives ?? [] }); }}>
                {n.q}
              </button>
            ))}
            <button className="q-btn confront" data-testid="confront" onClick={() => setPick(true)} disabled={!found.length}>
              ⚡ واجِه بدليل…
            </button>
          </div>
          {done.length > 0 && (
            <details className="panel">
              <summary>محضر الأقوال ({ar(done.length)})</summary>
              {done.map((n) => (
                <div key={n.id} className="rec"><p className="q">— {n.q}</p><p className="a">«{txt(n.a, s.difficulty)}»</p></div>
              ))}
            </details>
          )}
        </section>
      </div>
      {pick && (
        <div className="modal" onClick={() => setPick(false)}>
          <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
            <h3>بأي دليل تواجهون {c.name}؟</h3>
            <div className="chips">
              {found.map((e) => (
                <button key={e.id} className={`chip k-${e.kind}`} data-testid={`present-${e.id}`} onClick={() => confront(e)}>{e.title}</button>
              ))}
            </div>
            <button className="btn" onClick={() => setPick(false)}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= الأدلة ================= */
function EvidenceList({ onEv }: { onEv: (id: string) => void }) {
  const { s, cs } = useGame();
  const [kind, setKind] = useState('all');
  const list = cs.evidence.filter((e) => s.found.includes(e.id) && e.kind !== 'card' && (kind === 'all' || e.kind === kind));
  return (
    <div>
      <div className="row filters">
        {['all', 'doc', 'object', 'photo', 'testimony', 'digital'].map((k) => (
          <button key={k} className={`btn small ${kind === k ? 'primary' : ''}`} onClick={() => setKind(k)}>{k === 'all' ? 'الكل' : KIND[k]}</button>
        ))}
        <span className="muted">{ar(list.length)} دليل</span>
      </div>
      {list.length === 0 && <p className="muted pad">لا أدلة بعد. ابدؤوا بفحص الأماكن وسؤال الحاضرين.</p>}
      <div className="grid ev">
        {list.map((e) => (
          <button key={e.id} className={`card evc k-${e.kind}`} data-testid={`ev-${e.id}`} onClick={() => onEv(e.id)}>
            <span className="badge">{KIND[e.kind]}</span>
            <h3>{e.title}</h3>
            <p>{e.summary}</p>
            <small>{e.where}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function EvidenceModal({ ev, onClose }: { ev: Evidence; onClose: () => void }) {
  const { s } = useGame();
  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()} data-testid="ev-modal">
        <span className="badge">{KIND[ev.kind]} · {ev.where}</span>
        <h3>{ev.title}</h3>
        <p>{ev.summary}</p>
        {ev.id === 'e_photo1' && <YusufPhoto />}
        {ev.id === 'e_oldphoto' && <p className="muted">دقّقوا في أسفل الصندوق في الصورة.</p>}
        {ev.body && (
          <div className={`doc ${ev.style ?? 'paper'}`}>
            {ev.body.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        )}
        {ev.mini === 'photodiff' && (s.found.includes('e_photo1')
          ? <PhotoDiff />
          : <p className="warn">تحتاجون صورة يوسف الأولى للمقارنة.</p>)}
        <button className="btn" data-testid="close-ev" onClick={onClose}>إغلاق</button>
      </div>
    </div>
  );
}

const DIFFS = [
  { id: 'stud', x: 42.5, y: 73, label: 'مسمار ممسوح وعليه أثر أبيض' },
  { id: 'gap', x: 24, y: 78.5, label: 'الدرج بارز قليلاً' },
  { id: 'folder', x: 83, y: 55, label: 'ملف على المكتب' },
];
function PhotoDiff() {
  const { s, d } = useGame();
  const solved = s.found.includes('e_photodiff');
  const [hit, setHit] = useState<string[]>(solved ? DIFFS.map((x) => x.id) : []);
  const tap = (id: string) => {
    if (hit.includes(id)) return;
    const next = [...hit, id];
    setHit(next);
    if (next.length === DIFFS.length && !solved) d({ t: 'grant', ids: ['e_photodiff'], label: 'مقارنة صورتي يوسف' });
  };
  return (
    <div className="diff">
      <p><b>عين الصقر:</b> جدوا ثلاثة فروق في الصورة الثانية ({ar(hit.length)} / ٣)</p>
      <div className="diff-pair">
        <figure><YusufPhoto /><figcaption>١٥:٥٢ — مخزن البيت القديم</figcaption></figure>
        <figure>
          <div className="diff-target">
            <YusufPhoto second />
            {DIFFS.map((x) => (
              <button key={x.id} data-testid={`diff-${x.id}`} className={hit.includes(x.id) ? 'hit' : ''}
                style={{ left: `${x.x}%`, top: `${x.y}%` }} aria-label={x.label} onClick={() => tap(x.id)} />
            ))}
          </div>
          <figcaption>١٧:٣٨ — مكتب الجد</figcaption>
        </figure>
      </div>
      <ul>{DIFFS.filter((x) => hit.includes(x.id)).map((x) => <li key={x.id}>✔ {x.label}</li>)}</ul>
      {hit.length === 3 && <p className="ok">أُضيف دليل جديد: «نتيجة المقارنة».</p>}
    </div>
  );
}

/* ================= الدفتر ================= */
const COLS = [{ id: 'm', name: 'دافع' }, { id: 'o', name: 'فرصة' }, { id: 'k', name: 'يعرف سرّ الصندوق' }];
const MARK = ['؟', '✔', '✖'];
function Notes({ onEv }: { onEv: (id: string) => void }) {
  const { s, d, cs } = useGame();
  const team = s.teams[s.turn];
  const cards = cs.evidence.filter((e) => e.kind === 'card' && s.found.includes(e.id));
  return (
    <div className="notes">
      <section className="panel">
        <h3>ملاحظات {team.name}</h3>
        <textarea data-testid="notes" rows={6} value={team.notes} placeholder="فرضياتكم، أسئلة معلّقة، ما لم يقنعكم…"
          onChange={(e) => d({ t: 'note', text: e.target.value })} />
        <p className="muted">لكل فريق ملاحظاته؛ تظهر ملاحظات الفريق صاحب الدور.</p>
      </section>
      <section className="panel">
        <h3>مقارنة المشتبه بهم</h3>
        <p className="muted">انقروا الخانة لتبديلها: ؟ ← ✔ ← ✖</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>الاسم</th>{COLS.map((c) => <th key={c.id}>{c.name}</th>)}</tr></thead>
            <tbody>
              {cs.characters.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  {COLS.map((col) => {
                    const k = `${c.id}:${col.id}`; const v = s.marks[k] ?? 0;
                    return <td key={col.id}><button className={`mark m${v}`} data-testid={`mark-${k}`} onClick={() => d({ t: 'mark', key: k })}>{MARK[v]}</button></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h3>بطاقات معرفية ({ar(cards.length)})</h3>
        {cards.length === 0 && <p className="muted">تظهر هنا شروح العادات والأماكن التي تمرّون بها.</p>}
        <div className="chips">{cards.map((e) => <button key={e.id} className="chip k-card" onClick={() => onEv(e.id)}>{e.title}</button>)}</div>
      </section>
      <section className="panel">
        <h3>مسرد الألفاظ</h3>
        <dl className="gloss">{cs.glossary.map((g) => <div key={g.term}><dt>{g.term}</dt><dd>{g.meaning}</dd></div>)}</dl>
      </section>
      <section className="panel">
        <h3>سجل التحقيق</h3>
        <ol className="log">
          {[...s.log].reverse().slice(0, 40).map((l, i) => (
            <li key={i}><span className="dot" style={{ background: s.teams[l.team]?.color }} />{l.text}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/* ================= لوحة الربط ================= */
function Board() {
  const { s, d, cs } = useGame();
  const [sel, setSel] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const nodes = useMemo(() => {
    const list: { id: string; name: string; type: string }[] = [
      ...cs.characters.map((c) => ({ id: c.id, name: c.name.replace(/^(الجد|العمة|العم|الأستاذ|د\.|السيد) /, ''), type: 'p' })),
      ...cs.locations.filter((l) => s.visited.includes(l.id)).map((l) => ({ id: l.id, name: l.name, type: 'l' })),
      ...cs.evidence.filter((e) => s.found.includes(e.id) && e.kind !== 'card').map((e) => ({ id: e.id, name: e.title, type: 'e' })),
    ];
    const place = (items: typeof list, y0: number, y1: number, cols: number) => {
      const rows = Math.max(1, Math.ceil(items.length / cols));
      return items.map((x, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const inRow = r === rows - 1 ? items.length - r * cols : cols;
        return { ...x, x: 100 - ((c + 0.5) / inRow) * 100, y: rows === 1 ? (y0 + y1) / 2 : y0 + (r / (rows - 1)) * (y1 - y0) };
      });
    };
    const by = (t: string) => list.filter((x) => x.type === t);
    return [...place(by('p'), 6, 16, 6), ...place(by('e'), 28, 82, 6), ...place(by('l'), 93, 93, 8)];
  }, [cs, s.found, s.visited]);
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const click = (id: string) => {
    if (!sel) return setSel(id);
    if (sel !== id) d({ t: 'link', link: { a: sel, b: id, label: label.trim() } });
    setSel(null); setLabel('');
  };
  return (
    <div className="board-wrap">
      <div className="row filters">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="وصف الخيط (اختياري): «كذب»، «يؤكد»…" data-testid="link-label" />
        <span className="muted">{sel ? 'اختاروا العنصر الثاني لربطه' : 'انقروا عنصرين لربطهما بخيط'}</span>
      </div>
      <div className="board">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {s.links.map((l, i) => {
            const a = pos.get(l.a), b = pos.get(l.b);
            return a && b ? <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> : null;
          })}
        </svg>
        {nodes.map((n) => (
          <button key={n.id} className={`node t-${n.type} ${sel === n.id ? 'sel' : ''}`} data-testid={`node-${n.id}`}
            style={{ left: `${n.x}%`, top: `${n.y}%` }} onClick={() => click(n.id)}>{n.name}</button>
        ))}
      </div>
      <ul className="links">
        {s.links.map((l, i) => (
          <li key={i}>
            <b>{pos.get(l.a)?.name}</b> ⟷ <b>{pos.get(l.b)?.name}</b>{l.label && <> — {l.label}</>}
            <button className="x" aria-label="حذف" onClick={() => d({ t: 'unlink', i })}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================= الخط الزمني ================= */
function Timeline() {
  const { s, d, cs } = useGame();
  const [era, setEra] = useState<'tonight' | 'past'>('tonight');
  const [res, setRes] = useState<ReturnType<typeof timelineScore> | null>(null);
  const ids = s.order[era];
  const total = cs.timeline.filter((e) => e.era === era).length;
  const move = (i: number, by: number) => {
    const j = i + by; if (j < 0 || j >= ids.length) return;
    const next = [...ids]; [next[i], next[j]] = [next[j], next[i]];
    d({ t: 'order', era, ids: next }); setRes(null);
  };
  return (
    <div className="time">
      <div className="row filters">
        <button className={`btn small ${era === 'tonight' ? 'primary' : ''}`} onClick={() => { setEra('tonight'); setRes(null); }}>أحداث الليلة</button>
        <button className={`btn small ${era === 'past' ? 'primary' : ''}`} data-testid="era-past" onClick={() => { setEra('past'); setRes(null); }}>تاريخ العائلة</button>
        <span className="muted">مكتشف: {ar(ids.length)} من {ar(total)} أحداث</span>
      </div>
      <p className="muted">رتّبوا الأحداث من الأقدم إلى الأحدث. {s.difficulty === 'easy' ? '' : 'الأوقات مذكورة داخل الأدلة.'}</p>
      <ol className="tl">
        {ids.map((id, i) => {
          const e = cs.timeline.find((x) => x.id === id)!;
          const ok = res && res.sorted[i] === id;
          return (
            <li key={id} className={res && s.difficulty === 'easy' ? (ok ? 'good' : 'bad') : ''} data-testid={`tl-${id}`}>
              <span className="n">{ar(i + 1)}</span>
              <span className="t">{s.difficulty === 'easy' && <b>{e.time} · </b>}{e.text}</span>
              <button aria-label="أعلى" data-testid={`up-${id}`} onClick={() => move(i, -1)}>▲</button>
              <button aria-label="أسفل" data-testid={`down-${id}`} onClick={() => move(i, 1)}>▼</button>
            </li>
          );
        })}
      </ol>
      <button className="btn primary" data-testid="check-tl" onClick={() => setRes(timelineScore(cs, era, ids))}>تحقق من الترتيب</button>
      {res && (
        <p className={res.perfect ? 'ok' : 'warn'} data-testid="tl-result">
          {res.perfect ? 'الترتيب صحيح لما اكتشفتموه حتى الآن.'
            : s.difficulty === 'expert' ? 'الترتيب غير صحيح بعد.'
              : `${ar(res.right)} من ${ar(res.total)} في موضعها الصحيح.`}
        </p>
      )}
    </div>
  );
}

/* ================= قاعة المنطق ================= */
function Logic() {
  const { s, cs } = useGame();
  const [h, setH] = useState<Hypothesis>({ who: cs.characters[0].id, when: cs.windows[0].id, how: cs.methods[0].id });
  const [out, setOut] = useState<ReturnType<typeof contradictions> | null>(null);
  const known = knownConstraints(cs, s);
  const sel = (k: keyof Hypothesis, opts: { id: string; label: string }[], name: string) => (
    <label>{name}
      <select value={h[k]} data-testid={`h-${k}`} onChange={(e) => { setH({ ...h, [k]: e.target.value }); setOut(null); }}>
        {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
  return (
    <div className="logic">
      <section className="panel">
        <h3>قاعة المنطق</h3>
        <p className="muted">اعرضوا فرضية على الحقائق التي ثبتت عندكم حتى الآن ({ar(known.length)} حقيقة). القاعة لا تكشف الحل؛ تُظهر فقط ما يناقض فرضيتكم مما اكتشفتموه. الاختبار لا يستهلك حركات.</p>
        <div className="hyp">
          {sel('who', cs.characters.map((c: Character) => ({ id: c.id, label: c.name })), 'من أخرج الدفتر؟')}
          {sel('when', cs.windows, 'متى؟')}
          {sel('how', cs.methods, 'كيف؟')}
        </div>
        <button className="btn primary" data-testid="test-h" onClick={() => setOut(contradictions(cs, s, h))}>اختبروا الفرضية</button>
      </section>
      {out && (
        <section className="panel" data-testid="h-result" aria-live="polite">
          {out.length === 0 ? (
            <p className="ok">لا شيء مما اكتشفتموه يناقض هذه الفرضية. {known.length < 8 ? 'لكن حقائقكم ما زالت قليلة — فرضيات كثيرة تصمد الآن.' : 'هل تصمد فرضية أخرى غيرها؟'}</p>
          ) : s.difficulty === 'expert' ? (
            <p className="warn">تناقضها {ar(out.length)} من الحقائق المكتشفة.</p>
          ) : (
            <>
              <p className="warn">تناقضها {ar(out.length)} من الحقائق المكتشفة:</p>
              <ul>{out.map((c) => <li key={c.id}>{c.text}</li>)}</ul>
            </>
          )}
        </section>
      )}
      <section className="panel">
        <h3>الحقائق الثابتة حتى الآن</h3>
        {known.length === 0 && <p className="muted">لا شيء بعد.</p>}
        <ul>{known.map((c) => <li key={c.id}>{c.text}</li>)}</ul>
      </section>
    </div>
  );
}

/* ================= التلميحات ================= */
function Hints() {
  const { s, d, cs } = useGame();
  const g = currentHint(cs, s);
  const lvl = s.hintLevel[g.id] ?? 0;
  const team = s.teams[s.turn];
  return (
    <div className="hints">
      <section className="panel">
        <h3>تلميحات متدرجة</h3>
        <p className="muted">ثلاث درجات: توجيه، ثم تضييق، ثم شبه كشف. كل تلميح يخصم من نقاط الفريق صاحب الدور ({team.name}: −{ar(team.hintPenalty)} حتى الآن).</p>
        {g.levels.slice(0, lvl).map((t, i) => <p key={i} className="hint" data-testid={`hint-${i}`}><b>{['توجيه', 'تضييق', 'شبه كشف'][i]}:</b> {t}</p>)}
        {lvl < 3
          ? <button className="btn primary" data-testid="ask-hint" onClick={() => d({ t: 'hint', group: g.id })}>اطلبوا تلميح «{['توجيه', 'تضييق', 'شبه كشف'][lvl]}» (−{ar(HINT_COST[lvl])})</button>
          : <p className="muted">استنفدتم تلميحات هذه المرحلة. تقدّموا في التحقيق لتُفتح تلميحات جديدة.</p>}
      </section>
    </div>
  );
}
