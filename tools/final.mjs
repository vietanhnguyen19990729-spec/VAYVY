import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const C = path.join(DIR, 'tools', 'cache');
const errs = [];
const b = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file:///' + path.join(DIR, 'index.html').split(String.fromCharCode(92)).join('/'));
await p.waitForTimeout(8000);
await p.evaluate(() => {
  for (const el of document.querySelectorAll('button'))
    if (el.textContent.toUpperCase().includes('DÀNH CHO EM')) { el.click(); return; }
});
for (const t of [1200, 3000, 5000]){
  await p.waitForTimeout(t === 1200 ? 1200 : 1800);
  await p.screenshot({ path: path.join(C, 'fin-' + t + '.png') });
}
/* các chương chữ: cuộn xuống hết trang */
const h = await p.evaluate(() => document.documentElement.scrollHeight);
console.log('chieu cao trang', h);
for (let i = 1; i <= 4; i++){
  await p.evaluate(y => scrollTo(0, y), Math.round(h * i / 5));
  await p.waitForTimeout(1400);
  await p.screenshot({ path: path.join(C, 'scroll-' + i + '.png') });
}
await b.close();
console.log(errs.length ? 'LOI JS:\n' + errs.join('\n') : 'KHONG CO LOI JS');
