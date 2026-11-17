import type { Look } from '../engine/types';

/* ============ الصندوق ============ */
export function Chest(p: { x: number; y: number; s?: number; open?: boolean; gap?: boolean; smudge?: boolean; dusty?: boolean; halfDrawer?: boolean }) {
  const s = p.s ?? 1;
  const studs = [0, 1, 2, 3, 4, 5, 6];
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${s})`}>
      {p.open && (
        <g>
          <path d="M-150 -70 L-140 -190 L140 -190 L150 -70 Z" fill="#5a3418" stroke="#2c1608" strokeWidth="4" />
          <rect x="-60" y="-170" width="120" height="70" rx="4" fill="#e9dcc0" stroke="#8a6a3a" strokeWidth="3" />
          <circle cx="0" cy="-135" r="10" fill="#8e1f1f" />
        </g>
      )}
      <rect x="-150" y="-70" width="300" height="130" rx="6" fill="#6b3d1c" stroke="#2c1608" strokeWidth="4" />
      {!p.open && <rect x="-156" y="-88" width="312" height="26" rx="8" fill="#7a4822" stroke="#2c1608" strokeWidth="4" />}
      {[-110, -60, 60, 110].map((x) => (
        <rect key={x} x={x - 4} y="-66" width="8" height="122" fill="#c9973e" opacity=".85" />
      ))}
      <rect x="-18" y="-58" width="36" height="44" rx="5" fill="#c9973e" stroke="#6b4a14" strokeWidth="3" />
      <circle cx="0" cy="-34" r="5" fill="#2c1608" />
      {!p.open && <circle cx="0" cy="-72" r="13" fill="#6e1414" stroke="#3a0909" strokeWidth="2" />}
      {/* القاعدة والدرج */}
      <rect x="-158" y="60" width="316" height="46" rx="4" fill="#4f2b12" stroke="#2c1608" strokeWidth="4" />
      {p.halfDrawer && <rect x="-120" y="72" width="240" height="46" fill="#3b1f0c" stroke="#2c1608" strokeWidth="3" />}
      {p.gap && <rect x="-122" y="100" width="244" height="7" fill="#120803" />}
      {studs.map((i) => (
        <circle key={i} cx={-120 + i * 40} cy="83" r="8" fill={p.dusty ? '#8d7a55' : '#d9a441'} stroke="#6b4a14" strokeWidth="2" />
      ))}
      {p.smudge && (
        <g>
          <circle cx="40" cy="83" r="9" fill="#f1c659" stroke="#6b4a14" strokeWidth="2" />
          <ellipse cx="44" cy="80" rx="13" ry="7" fill="#fff" opacity=".85" />
        </g>
      )}
    </g>
  );
}

const Defs = () => (
  <defs>
    <pattern id="stone" width="120" height="60" patternUnits="userSpaceOnUse">
      <rect width="120" height="60" fill="#e6d9be" />
      <path d="M0 0H120M0 30H120M0 60H120M40 0V30M100 0V30M10 30V60M70 30V60" stroke="#c9b892" strokeWidth="2" />
    </pattern>
    <pattern id="lattice" width="28" height="28" patternUnits="userSpaceOnUse">
      <rect width="28" height="28" fill="#1f5a57" />
      <path d="M0 14L14 0L28 14L14 28Z" fill="none" stroke="#0e3432" strokeWidth="4" />
      <circle cx="14" cy="14" r="3" fill="#f6d98a" opacity=".8" />
    </pattern>
    <pattern id="carpet" width="80" height="80" patternUnits="userSpaceOnUse">
      <rect width="80" height="80" fill="#7c2a25" />
      <path d="M40 6L74 40L40 74L6 40Z" fill="none" stroke="#d9a441" strokeWidth="3" />
      <circle cx="40" cy="40" r="7" fill="#1f5a57" />
    </pattern>
    <pattern id="stripe" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#f4efe4" /><rect width="5" height="12" fill="#b3261e" />
    </pattern>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0b1530" /><stop offset="1" stopColor="#263a63" />
    </linearGradient>
    <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#3a2a1d" /><stop offset="1" stopColor="#6a4a2c" />
    </linearGradient>
    <radialGradient id="lamp" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#ffe6a3" stopOpacity=".55" /><stop offset="1" stopColor="#ffe6a3" stopOpacity="0" />
    </radialGradient>
  </defs>
);

const Roshan = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <g>
    <rect x={x - 12} y={y - 12} width={w + 24} height={h + 24} fill="#143f3d" stroke="#0a2422" strokeWidth="6" />
    <rect x={x} y={y} width={w} height={h} fill="url(#lattice)" />
    <rect x={x - 22} y={y + h + 12} width={w + 44} height="22" fill="#0e3432" />
    <path d={`M${x - 22} ${y - 12}L${x + w / 2} ${y - 50}L${x + w + 22} ${y - 12}Z`} fill="#0e3432" />
  </g>
);

const Beams = ({ ys }: { ys: number[] }) => (
  <g>{ys.map((y) => <rect key={y} x="0" y={y} width="1600" height="14" fill="#6b4a2c" />)}</g>
);

function Majlis() {
  return (
    <g>
      <rect width="1600" height="900" fill="#efe6d2" />
      <rect y="560" width="1600" height="340" fill="url(#carpet)" />
      <rect x="1180" y="120" width="300" height="300" fill="url(#night)" stroke="#8a6a3a" strokeWidth="12" />
      <circle cx="1400" cy="190" r="26" fill="#f6e7b0" />
      <rect x="640" y="110" width="320" height="140" rx="8" fill="#1d2b3f" stroke="#d9a441" strokeWidth="10" />
      <text x="800" y="200" textAnchor="middle" fontFamily="Amiri, serif" fontSize="62" fill="#f1c659">وَالصُّلْحُ خَيْرٌ</text>
      <rect x="230" y="190" width="180" height="150" fill="#d8d2c4" stroke="#3a2a1d" strokeWidth="10" />
      <g opacity=".75"><Chest x={340} y={290} s={0.26} halfDrawer /><circle cx="280" cy="250" r="18" fill="#777" /><rect x="262" y="268" width="36" height="50" fill="#888" /></g>
      <rect x="0" y="470" width="1600" height="120" rx="20" fill="#1f5a57" />
      <rect x="0" y="560" width="1600" height="40" fill="#143f3d" />
      {[120, 380, 1140, 1400].map((x) => <rect key={x} x={x} y="440" width="150" height="80" rx="18" fill="#d9a441" />)}
      <ellipse cx="800" cy="690" rx="200" ry="34" fill="#b9b3a5" stroke="#6f6a5e" strokeWidth="5" />
      <g className="steam"><path d="M800 430c-30-40 30-60 0-100" fill="none" stroke="#fff" strokeWidth="8" opacity=".5" strokeLinecap="round" /></g>
      <rect x="760" y="540" width="80" height="130" rx="30" fill="#d7dbe0" stroke="#7b838c" strokeWidth="5" />
      <rect x="772" y="470" width="56" height="74" rx="12" fill="#c8ccd2" stroke="#7b838c" strokeWidth="5" />
      <ellipse cx="800" cy="452" rx="34" ry="24" fill="#f4efe4" stroke="#7b838c" strokeWidth="5" />
      {[690, 730, 870, 910].map((x) => <rect key={x} x={x} y="650" width="22" height="30" rx="4" fill="#b5651d" opacity=".9" stroke="#fff" strokeWidth="2" />)}
      <circle cx="800" cy="520" r="420" fill="url(#lamp)" />
    </g>
  );
}

function Office() {
  return (
    <g>
      <rect width="1600" height="900" fill="#2b3a4f" />
      <rect y="640" width="1600" height="260" fill="#59432e" />
      <rect x="1380" y="150" width="170" height="500" fill="#4a3320" stroke="#24170c" strokeWidth="8" />
      <circle cx="1410" cy="420" r="10" fill="#d9a441" />
      <rect x="930" y="500" width="430" height="26" fill="#3b2816" /><rect x="950" y="526" width="20" height="170" fill="#3b2816" /><rect x="1320" y="526" width="20" height="170" fill="#3b2816" />
      <rect x="1090" y="466" width="130" height="34" fill="#f4efe4" stroke="#c8553d" strokeWidth="4" transform="rotate(-6 1150 480)" />
      <path d="M1010 500v-90h10v90zM980 400h70l-14-60h-42z" fill="#d9a441" />
      <circle cx="1015" cy="420" r="230" fill="url(#lamp)" />
      <rect x="120" y="150" width="200" height="330" fill="#3b2816" />
      {[180, 250, 320, 390].map((y) => <rect key={y} x="132" y={y} width="176" height="8" fill="#24170c" />)}
      {[140, 170, 205, 240, 270].map((x, i) => <rect key={x} x={x} y="196" width="22" height="54" fill={['#7c2a25', '#1f5a57', '#d9a441', '#31405a', '#7c2a25'][i]} />)}
      <rect x="380" y="690" width="400" height="40" fill="#3b2816" />
      <Chest x={576} y={570} s={1.15} open gap smudge />
    </g>
  );
}

function Kitchen() {
  return (
    <g>
      <rect width="1600" height="900" fill="#f1ead9" />
      <rect y="600" width="1600" height="300" fill="#b9a98a" />
      <rect x="0" y="560" width="1100" height="60" fill="#d8d2c4" stroke="#8a8272" strokeWidth="5" />
      <rect x="0" y="620" width="1100" height="280" fill="#2f6f73" />
      <rect x="780" y="130" width="230" height="430" rx="14" fill="#e3e6ea" stroke="#9aa1aa" strokeWidth="6" />
      <rect x="840" y="220" width="96" height="120" fill="#fff8e1" stroke="#d9a441" strokeWidth="4" transform="rotate(3 880 270)" />
      {[236, 262, 288, 314].map((y) => <rect key={y} x="852" y={y} width="72" height="6" fill="#7a6a4a" transform="rotate(3 880 270)" />)}
      <ellipse cx="480" cy="548" rx="140" ry="34" fill="#c8ccd2" stroke="#7b838c" strokeWidth="5" />
      <path d="M350 540q130-110 260 0z" fill="#f6f1e6" stroke="#b9b3a5" strokeWidth="4" />
      <path d="M150 440h130l20 120h-170z" fill="#d6c4a0" stroke="#8a7a56" strokeWidth="5" /><ellipse cx="225" cy="560" rx="90" ry="12" fill="#fff" opacity=".8" />
      <ellipse cx="960" cy="545" rx="90" ry="16" fill="#3a3a3a" />
      {[930, 960, 990].map((x) => <path key={x} d={`M${x} 540l16-22 16 22z`} fill="#c98a3c" />)}
      <rect x="1130" y="250" width="380" height="16" fill="#6b4a2c" />
      {[1170, 1260, 1350].map((x) => <rect key={x} x={x} y="266" width="60" height="150" fill="url(#stripe)" stroke="#8a2a22" strokeWidth="3" />)}
      {[1200, 1290, 1380, 1470].map((x) => <circle key={x} cx={x} cy="258" r="9" fill="#d9a441" />)}
      <rect x="1180" y="480" width="330" height="420" fill="#e3e6ea" stroke="#9aa1aa" strokeWidth="6" />
    </g>
  );
}

function Hosh() {
  return (
    <g>
      <rect width="1600" height="900" fill="url(#night)" />
      {[[200, 90], [520, 60], [900, 120], [1250, 70], [1480, 150], [700, 40]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#fff" />)}
      <rect x="560" y="200" width="620" height="420" fill="#e9e1cf" /><rect x="560" y="180" width="620" height="30" fill="#c9b892" />
      {[640, 800, 960].map((x) => <rect key={x} x={x} y="270" width="100" height="130" fill="#ffe6a3" stroke="#8a6a3a" strokeWidth="6" />)}
      <rect x="60" y="330" width="330" height="290" fill="#d8cfb8" /><rect x="170" y="430" width="90" height="190" fill="#4a3320" />
      <rect y="620" width="1600" height="280" fill="#8d8474" />
      <rect x="1220" y="300" width="380" height="320" fill="#3b4250" /><rect x="1260" y="340" width="20" height="280" fill="#232833" />
      <rect x="1280" y="400" width="70" height="100" rx="8" fill="#10151f" stroke="#3aa6a0" strokeWidth="5" /><circle cx="1315" cy="430" r="8" fill="#3aa6a0" />
      <g>
        <rect x="250" y="560" width="400" height="80" rx="10" fill="#f4f4f1" stroke="#777" strokeWidth="4" />
        <path d="M520 560l20-70h90l20 70z" fill="#f4f4f1" stroke="#777" strokeWidth="4" /><rect x="545" y="500" width="76" height="52" fill="#263a63" />
        <rect x="270" y="548" width="220" height="14" fill="#555" />
        <circle cx="330" cy="650" r="34" fill="#1a1a1a" /><circle cx="580" cy="650" r="34" fill="#1a1a1a" />
      </g>
      <rect x="900" y="590" width="150" height="14" fill="#6b4a2c" /><rect x="930" y="535" width="56" height="56" fill="#c98a3c" stroke="#fff" strokeWidth="3" />
      <path d="M720 690h100v-70h14v120h-14v-36h-100z" fill="#f4efe4" />
      <path d="M1480 620v-260" stroke="#4a3320" strokeWidth="18" />
      {[-60, -25, 15, 55].map((r) => <path key={r} d="M1480 360q-80-50-150 10" fill="none" stroke="#2f6f4a" strokeWidth="14" transform={`rotate(${r} 1480 360)`} />)}
    </g>
  );
}

function Maqad() {
  return (
    <g>
      <rect width="1600" height="900" fill="url(#stone)" />
      <Beams ys={[130, 330, 530]} />
      <rect y="690" width="1600" height="210" fill="#9c8b6b" />
      <Roshan x={110} y={200} w={250} h={330} />
      <path d="M140 220L620 760H260L110 500Z" fill="#ffe6a3" opacity=".22" className="shaft" />
      <rect x="650" y="110" width="300" height="100" fill="#efe6d2" stroke="#6b4a2c" strokeWidth="8" />
      <text x="800" y="172" textAnchor="middle" fontFamily="Amiri, serif" fontSize="30" fill="#3a2a1d">أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا</text>
      <rect x="560" y="560" width="440" height="30" fill="#4a3320" /><rect x="580" y="590" width="26" height="170" fill="#4a3320" /><rect x="954" y="590" width="26" height="170" fill="#4a3320" />
      <rect x="700" y="510" width="150" height="50" rx="8" fill="url(#stripe)" stroke="#8a2a22" strokeWidth="3" />
      <rect x="1240" y="470" width="190" height="230" fill="#3d4650" stroke="#1d2329" strokeWidth="8" /><circle cx="1335" cy="585" r="26" fill="#1d2329" stroke="#d9a441" strokeWidth="5" />
      <path d="M1560 780q-520 40-760-20" fill="none" stroke="#7a6a4c" strokeWidth="10" strokeDasharray="26 22" opacity=".7" />
      {[[300, 600], [420, 420], [520, 660], [240, 480]].map(([x, y], i) => <circle key={i} className="dust" cx={x} cy={y} r="4" fill="#fff" opacity=".7" />)}
    </g>
  );
}

function Makhzan() {
  return (
    <g>
      <rect width="1600" height="900" fill="url(#stone)" />
      <Beams ys={[100, 300]} />
      <rect y="640" width="1600" height="260" fill="#a59474" />
      <Roshan x={150} y={170} w={340} h={380} />
      <path d="M180 190L900 860H420L150 520Z" fill="#ffe6a3" opacity=".25" className="shaft" />
      <rect x="470" y="680" width="340" height="110" fill="#bfae8c" stroke="#8e7d5c" strokeWidth="4" strokeDasharray="14 10" />
      <path d="M810 735h400" stroke="#8e7d5c" strokeWidth="26" opacity=".45" />
      <rect x="1140" y="230" width="260" height="410" fill="#4a3320" />
      {[310, 400, 490, 580].map((y) => <rect key={y} x="1152" y={y} width="236" height="10" fill="#24170c" />)}
      {[1165, 1200, 1238, 1272, 1310].map((x, i) => <rect key={x} x={x} y="336" width="26" height="64" fill={['#7c2a25', '#1f5a57', '#3a2a1d', '#d9a441', '#31405a'][i]} />)}
      <rect x="1268" y="326" width="18" height="14" fill="#fff8e1" />
      {[[420, 500], [560, 360], [680, 620], [330, 420]].map(([x, y], i) => <circle key={i} className="dust" cx={x} cy={y} r="4" fill="#fff" opacity=".7" />)}
    </g>
  );
}

function Souq() {
  return (
    <g>
      <rect width="1600" height="900" fill="url(#night)" />
      <path d="M0 0H420V900H0Z" fill="url(#stone)" /><path d="M1180 0H1600V900H1180Z" fill="url(#stone)" />
      <rect x="420" y="120" width="760" height="780" fill="#d8cdb2" />
      <Roshan x={90} y={130} w={220} h={250} /><Roshan x={1290} y={160} w={220} h={250} />
      <rect y="760" width="1600" height="140" fill="#77705f" />
      <rect x="560" y="200" width="480" height="90" fill="#6b4a2c" stroke="#3a2a1d" strokeWidth="6" />
      <text x="800" y="258" textAnchor="middle" fontFamily="Reem Kufi, sans-serif" fontSize="34" fill="#e6d9be" opacity=".8">سالم عوض باوزير</text>
      <rect x="560" y="330" width="480" height="430" fill="#5c6570" />
      {[370, 420, 470, 520, 570, 620, 670, 720].map((y) => <rect key={y} x="560" y={y} width="480" height="6" fill="#3d444d" />)}
      <rect x="1200" y="470" width="300" height="290" fill="#ffe6a3" /><rect x="1200" y="430" width="300" height="46" fill="#7c2a25" />
      {[1230, 1300, 1370, 1440].map((x) => <rect key={x} x={x} y="640" width="46" height="110" fill="#b5651d" />)}
      <path d="M420 120q380-90 760 0" fill="none" stroke="#3a2a1d" strokeWidth="6" />
      {[560, 700, 840, 980].map((x) => <circle key={x} cx={x} cy="76" r="12" fill="#ffe6a3" />)}
    </g>
  );
}

function Company() {
  return (
    <g>
      <rect width="1600" height="900" fill="#e8ecef" />
      <rect y="650" width="1600" height="250" fill="#9aa5ad" />
      <rect x="900" y="80" width="640" height="460" fill="url(#night)" stroke="#fff" strokeWidth="10" />
      {[1000, 1130, 1260, 1400].map((x, i) => <rect key={x} x={x} y={300 - i * 40} width="80" height={240 + i * 40} fill="#16213d" />)}
      <rect x="380" y="240" width="200" height="170" fill="#fff8e1" stroke="#d9a441" strokeWidth="14" />
      {[280, 310, 340, 370].map((y) => <rect key={y} x="410" y={y} width="140" height="8" fill="#7a6a4a" />)}
      <text x="250" y="170" fontFamily="Reem Kufi, sans-serif" fontSize="44" fill="#1f5a57">مؤسسة باوزير</text>
      <rect x="700" y="560" width="700" height="30" fill="#31405a" /><rect x="740" y="590" width="24" height="160" fill="#31405a" /><rect x="1340" y="590" width="24" height="160" fill="#31405a" />
      <rect x="1040" y="460" width="170" height="100" rx="8" fill="#f4f4f1" stroke="#777" strokeWidth="5" /><rect x="1070" y="440" width="110" height="26" fill="#fff" stroke="#777" strokeWidth="3" />
      <rect x="820" y="470" width="140" height="90" rx="6" fill="#10151f" />
    </g>
  );
}

const SCENES: Record<string, () => JSX.Element> = {
  majlis: Majlis, office: Office, kitchen: Kitchen, hosh: Hosh, maqad: Maqad, makhzan: Makhzan, souq: Souq, company: Company,
};

export function Scene({ id, children }: { id: string; children?: React.ReactNode }) {
  const S = SCENES[id] ?? Majlis;
  return (
    <div className="scene" data-scene={id}>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
        <Defs />
        <S />
        <rect width="1600" height="900" fill="#0b1530" opacity=".12" />
      </svg>
      {children}
    </div>
  );
}

/* ============ صور يوسف (لعبة المقارنة) ============ */
export function YusufPhoto({ second }: { second?: boolean }) {
  return (
    <svg viewBox="0 0 800 520" className="photo" aria-hidden="true">
      <Defs />
      {second ? (
        <g>
          <rect width="800" height="520" fill="#2b3a4f" /><rect y="400" width="800" height="120" fill="#59432e" />
          <rect x="560" y="300" width="240" height="20" fill="#3b2816" />
          <rect x="610" y="270" width="110" height="30" fill="#f4efe4" stroke="#c8553d" strokeWidth="4" />
          <Chest x={300} y={300} gap smudge />
        </g>
      ) : (
        <g>
          <rect width="800" height="520" fill="url(#stone)" /><rect y="400" width="800" height="120" fill="#a59474" />
          <rect x="560" y="300" width="240" height="20" fill="#6b4a2c" />
          <Chest x={300} y={300} dusty />
        </g>
      )}
      <rect x="560" y="470" width="220" height="36" rx="6" fill="#000" opacity=".55" />
      <text x="670" y="496" textAnchor="middle" fontSize="24" fill="#fff" fontFamily="monospace">{second ? '17:38' : '15:52'}</text>
    </svg>
  );
}

/* ============ البورتريه ============ */
export function Avatar({ look, size = 96 }: { look: Look; size?: number }) {
  const hc = look.headColor ?? '#ffffff';
  const beard = look.beard && look.beard !== 'none'
    ? { white: '#f2f2f2', grey: '#9a9a9a', black: '#2a2118' }[look.beard] : null;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="avatar" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="#15233f" stroke="#d9a441" strokeWidth="3" />
      <path d="M18 120q0-40 42-40t42 40z" fill={look.cloth} />
      {look.head === 'hijab' && <path d="M26 62q0-44 34-44t34 44q0 30-10 44h-48q-10-14-10-44z" fill={hc} />}
      <ellipse cx="60" cy="58" rx="22" ry="26" fill={look.skin} />
      {beard && <path d="M38 62q22 40 44 0q0 30-22 30t-22-30z" fill={beard} />}
      {look.head === 'ghutra' && <path d="M30 60q-4-44 30-44t30 44l8 40h-14l-4-46q-20-12-40 0l-4 46h-14z" fill="#fdfdfb" stroke="#ddd" />}
      {look.head === 'shemagh' && (
        <g><path d="M30 60q-4-44 30-44t30 44l8 40h-14l-4-46q-20-12-40 0l-4 46h-14z" fill="#c8362c" /><path d="M34 34q26-14 52 0" fill="none" stroke="#111" strokeWidth="5" /></g>
      )}
      {look.head === 'kufi' && <path d="M38 40q22-22 44 0v-8q-22-18-44 0z M38 40h44v6h-44z" fill="#f4efe4" stroke="#bbb" />}
      {look.head === 'cap' && <path d="M38 42q4-24 22-24t22 24z" fill={hc} />}
      {look.head === 'hair' && <path d="M38 48q0-30 22-30t22 30q-10-14-22-14t-22 14z" fill="#1c1510" />}
      <circle cx="52" cy="56" r="2.6" fill="#1c1510" /><circle cx="68" cy="56" r="2.6" fill="#1c1510" />
      {look.glasses && <g fill="none" stroke="#222" strokeWidth="2"><circle cx="52" cy="56" r="7" /><circle cx="68" cy="56" r="7" /><path d="M59 56h2" /></g>}
      <path d="M54 70q6 4 12 0" fill="none" stroke="#6b3d2a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
