// يجمع البناء في ملف HTML واحد: artifact/daftar.html
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = 'dist-artifact/assets/';
const files = readdirSync(dir);
const js = readFileSync(dir + files.find((f) => f.endsWith('.js')), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(dir + files.find((f) => f.endsWith('.css')), 'utf8');
const html = `<title>دفتر الأمانات</title>
<meta name="theme-color" content="#0d1628" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Reem+Kufi:wght@500;700&display=swap" rel="stylesheet" />
<style>${css}
html { direction: rtl; } html, body { background: var(--bg); }</style>
<div id="root" dir="rtl" lang="ar"></div>
<script>document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl';</script>
<script type="module">${js}</script>
`;
writeFileSync('artifact/daftar.html', html);
// نسخة اختبار محلية بهيكل كامل
writeFileSync('dist-artifact/test.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)} body{margin:0}</style></head><body>${html}</body></html>`);
console.log('artifact/daftar.html', (html.length / 1024).toFixed(0), 'KB');
