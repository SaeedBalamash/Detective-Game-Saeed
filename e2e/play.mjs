// اختبار شامل للّعب من البداية إلى الخاتمة عبر المتصفح.
// التشغيل: npm run build && npm run e2e
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const URL = 'http://localhost:4173/';
const SHOTS = new globalThis.URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' });
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? '✔' : '✘'} ${name}${extra ? ' — ' + extra : ''}`); };

async function waitServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(URL); if (r.ok) return; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server did not start');
}

const t = (id) => `[data-testid="${id}"]`;

try {
  await waitServer();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'ar-SA' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const shot = (n) => page.screenshot({ path: `${SHOTS}${n}.png` });
  const click = (id) => page.click(t(id));
  const tab = (id) => click(`tab-${id}`);
  const hot = async (loc, ...ids) => {
    await tab('places');
    if (await page.locator(t('back-places')).count()) await click('back-places');
    await click(`loc-${loc}`);
    for (const id of ids) await click(`hot-${id}`);
  };
  const person = async (id) => {
    await tab('people');
    if (await page.locator(t('back-people')).count()) await click('back-people');
    await click(`char-${id}`);
  };
  const confront = async (who, ev) => { await person(who); await click('confront'); await click(`present-${ev}`); };
  const found = () => page.evaluate(() => JSON.parse(localStorage.getItem('daftar.save.v1')).found);

  // —— البداية والإعداد
  await page.goto(URL);
  check('الصفحة عربية ومن اليمين لليسار', await page.evaluate(() => document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar'));
  await shot('01-title-tv');
  await click('new-game');
  await click('diff-normal');
  await page.fill('input[aria-label="أسماء اللاعبين"] >> nth=0', 'سارة، عمر، جنى');
  await page.fill('input[aria-label="أسماء اللاعبين"] >> nth=1', 'ليان، خالد، ياسر');
  await shot('02-setup');
  await click('start');
  for (let i = 0; i < 4; i++) { if (i === 2) await shot('03-intro'); await click('intro-next'); }
  check('بدء اللعبة والمقدمة', await page.locator(t('turn')).isVisible());

  // —— مواقع مقفلة في البداية
  check('البيت القديم مقفل في البداية', await page.locator(t('loc-maqad')).isDisabled());
  await shot('04-places');

  // —— المكتب: الدرج مخفي حتى تُعرف حكايته
  await hot('office', 'h_lock', 'h_inside', 'h_desk');
  check('نقطة «قاعدة الصندوق» مخفية قبل معرفة سرّها', (await page.locator(t('hot-h_base')).count()) === 0);
  await shot('05-office');
  check('تناوب الأدوار بعد ثلاث حركات', (await page.locator(t('turn')).innerText()).includes('فريق السماور'));
  await hot('majlis', 'h_photo', 'h_seats');
  await hot('office', 'h_base');
  check('اكتشاف الدرج الخفي وأثر الدقيق', (await found()).includes('e_drawer') && (await found()).includes('e_flour'));

  // —— الاستجواب والمواجهة
  await person('yusuf'); await click('q-y1'); await click('q-y2');
  await click('confront'); await click('present-e_seal');
  check('مواجهة بلا نتيجة تعطي ردّ التهرّب', (await page.locator('.bubble .a').innerText()).includes('مدري'));
  await click('confront'); await click('present-e_folder');
  check('مواجهة يوسف بالملف تكشف الصورة الثانية', (await found()).includes('e_photo2'));
  await shot('06-interrogation');

  // —— لعبة المقارنة
  await tab('evidence'); await click('ev-e_photo2'); await page.waitForTimeout(500);
  await click('diff-stud'); await click('diff-gap'); await click('diff-folder');
  check('مقارنة الصورتين تضيف دليلاً', (await found()).includes('e_photodiff'));
  await shot('07-photodiff');
  await click('close-ev');

  // —— سلسلة فتح البيت القديم
  await hot('hosh', 'h_gate', 'h_bag');
  await confront('saeed', 'e_gatelog');
  await tab('places'); if (await page.locator(t('back-places')).count()) await click('back-places');
  check('البيت القديم يُفتح بعد مواجهة سعيد', await page.locator(t('loc-maqad')).isEnabled());
  await hot('maqad', 'h_bundle', 'h_dust');
  await shot('08-old-house');
  check('العثور على الدفتر والقيد ٤٧', (await found()).includes('e_entry47'));
  await confront('saeed', 'e_daftar');
  await hot('kitchen', 'h_towels', 'h_recipe');
  await person('reem'); await click('q-r1'); await click('q-r2');
  await person('khadija'); await click('q-k1'); await click('q-k2');
  await person('omar'); await click('q-o1'); await click('q-o2'); await click('q-o3');
  await person('nur'); await click('q-n1'); await click('q-n2');
  await person('talal'); await click('q-t1');
  await person('fawzi'); await click('q-f1'); await click('confront'); await click('present-e_half_shop');
  check('مطابقة نصفي الوصل', (await found()).includes('e_match'));
  await tab('evidence'); await click('ev-e_entry47'); await shot('09-ledger'); await click('close-ev');

  // —— قاعة المنطق
  await tab('logic');
  await page.selectOption(t('h-who'), 'salim'); await page.selectOption(t('h-when'), 'w3'); await page.selectOption(t('h-how'), 'm_drawer');
  await click('test-h');
  check('قاعة المنطق ترفض فرضية خاطئة', (await page.locator(t('h-result')).innerText()).includes('تناقضها'));
  await page.selectOption(t('h-who'), 'khadija'); await click('test-h');
  check('قاعة المنطق لا تجد تناقضاً في الفرضية الصحيحة', (await page.locator(t('h-result')).innerText()).includes('لا شيء'));
  await shot('10-logic');

  // —— التلميحات والخط الزمني والدفتر واللوحة
  await tab('hints'); await click('ask-hint');
  check('ظهور التلميح الأول', await page.locator(t('hint-0')).isVisible());
  await tab('time'); await click('check-tl');
  const r1 = await page.locator(t('tl-result')).innerText();
  const first = await page.locator('.tl li').first().getAttribute('data-testid');
  await click(`down-${first.replace('tl-', '')}`); await click('check-tl');
  check('التحقق من الخط الزمني يتغير بتغيير الترتيب', r1 !== (await page.locator(t('tl-result')).innerText()), r1);
  await shot('11-timeline');
  await tab('notes'); await page.fill(t('notes'), 'الدقيق على المسمار… من كان في المطبخ؟');
  await click('mark-khadija:o');
  await shot('12-notebook');
  await tab('board'); await page.fill(t('link-label'), 'دقيق');
  await click('node-khadija'); await click('node-e_flour');
  check('إضافة خيط على لوحة الربط', (await page.locator('.board line').count()) === 1);
  await shot('13-board');

  // —— الحفظ والاستئناف
  const before = (await found()).length;
  await page.reload(); await click('resume');
  await tab('notes');
  check('الحفظ والاستئناف يعيدان الأدلة والملاحظات',
    (await found()).length === before && (await page.inputValue(t('notes'))).includes('الدقيق'));

  // —— مقاسات الشاشة
  for (const [name, w, h] of [['mobile', 390, 844], ['tablet', 820, 1180]]) {
    await page.setViewportSize({ width: w, height: h });
    await hot('office'); await shot(`14-${name}-scene`);
    await person('khadija'); await shot(`15-${name}-talk`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`لا تمرير أفقي على ${name}`, !overflow);
  }
  await page.setViewportSize({ width: 1920, height: 1080 });

  // —— الاتهام والخاتمة
  await click('go-accuse'); await click('confirm-accuse');
  await click('accuse-ready');
  await click('acc-who-khadija'); await click('acc-mo-mo_honor'); await click('acc-how-m_drawer');
  for (const e of ['e_flour', 'e_towels', 'e_daftar']) await click(`acc-ev-${e}`);
  await shot('16-accuse');
  await click('acc-submit');
  await click('accuse-ready');
  await click('acc-who-salim'); await click('acc-mo-mo_deal'); await click('acc-how-m_key');
  for (const e of ['e_folder', 'e_seal', 'e_gatelog']) await click(`acc-ev-${e}`);
  await click('acc-submit');
  await shot('17-resolution');
  for (let i = 0; i < 7; i++) await click('res-next');
  const totals = await page.locator(t('total')).allInnerTexts();
  check('الفريق المصيب ينال ١٠٠ ناقص التلميح، والمخطئ صفراً', totals[0] === '٩٧' && totals[1] === '٠', totals.join(' / '));
  await click('moral-0-public'); await click('moral-1-public');
  check('المشهد الأخير يظهر بعد التصويت الأخلاقي', await page.locator(t('epilogue')).isVisible());
  await page.locator(t('epilogue')).scrollIntoViewIfNeeded();
  await shot('18-epilogue');
  await click('new-after');
  check('العودة إلى البداية بلا حفظ قديم', (await page.locator(t('resume')).count()) === 0);

  // —— سيناريو ثانٍ: سهل + مؤقّت + ثلاث فرق
  await click('new-game'); await click('diff-easy'); await page.check(t('timed')); await click('add-team'); await click('start');
  for (let i = 0; i < 4; i++) await click('intro-next');
  check('السهل: أربع حركات لكل دور', (await page.locator('.pips i').count()) === 4);
  const t1 = await page.locator('.timer').innerText(); await page.waitForTimeout(2200);
  check('المؤقّت يعدّ تنازلياً', t1 !== (await page.locator('.timer').innerText()), t1);
  await hot('office');
  check('السهل: قاعدة الصندوق ظاهرة من البداية', (await page.locator(t('hot-h_base')).count()) === 1);
  await tab('time');
  check('السهل: الأوقات ظاهرة في الخط الزمني', (await page.locator('.tl li b').count()) > 0);
  await click('go-accuse'); await click('confirm-accuse');
  check('ثلاث فرق: الاتهام يبدأ بالفريق الأول', (await page.locator('.cine-text').innerText()).includes('فريق الروشن'));

  // —— سيناريو ثالث: خبير
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await click('new-game'); await click('diff-expert'); await click('start');
  for (let i = 0; i < 4; i++) await click('intro-next');
  await person('khadija'); await click('q-k2');
  check('الخبير: شهادة خديجة أقل صراحة', !(await page.locator('.bubble .a').innerText()).includes('باب ما يعرفه'));
  await tab('logic'); await click('test-h');
  check('الخبير: قاعة المنطق تعمل بلا حقائق', await page.locator(t('h-result')).isVisible());
  check('لا أخطاء في الكونسول', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
} catch (e) {
  check('اكتمال السيناريو', false, String(e).slice(0, 400));
} finally {
  server.kill();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} / ${results.length} ناجح`);
process.exit(failed ? 1 : 0);
