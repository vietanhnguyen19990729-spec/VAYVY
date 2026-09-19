/* check.mjs — soát lại cả trang sau khi đổi chân dung: 4 hình thái, khổ điện thoại,
   rê tay, nhấp, và bắt mọi lỗi JS.   node tools/check.mjs */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const URL = 'file:///' + path.join(DIR, 'index.html').split(String.fromCharCode(92)).join('/');
const C = path.join(DIR, 'tools', 'cache');
const browser = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];

async function run(w, h, tag){
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errs.push(tag + ': ' + e));
  page.on('console', m => { if (m.type() === 'error') errs.push(tag + ': ' + m.text()); });
  await page.goto(URL);
  await page.waitForTimeout(8000);
  const n = await page.evaluate(() => document.querySelectorAll('#forms button, .form-btn, [data-form]').length);
  const labels = ['chandung', 'thienha', 'traitim', 'ngayay'];
  for (let i = 0; i < 4; i++){
    await page.evaluate(k => {
      const b = document.querySelectorAll('button');
      const want = ['CHÂN DUNG', 'THIÊN HÀ', 'TRÁI TIM', 'NGÀY ẤY'][k];
      for (const el of b) if (el.textContent.trim().toUpperCase().includes(want)) { el.click(); return; }
    }, i);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(C, tag + '-' + i + '-' + labels[i] + '.png') });
  }
  /* rê tay + nhấp lên giữa chân dung */
  await page.evaluate(k => {
    const b = document.querySelectorAll('button');
    for (const el of b) if (el.textContent.trim().toUpperCase().includes('CHÂN DUNG')) { el.click(); return; }
  }, 0);
  await page.waitForTimeout(1800);
  await page.mouse.move(w * 0.72, h * 0.5);
  await page.waitForTimeout(700);
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(C, tag + '-cham.png') });
  const fps = await page.evaluate(() => new Promise(r => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(tick) : r(Math.round(n / 2)); };
    requestAnimationFrame(tick);
  }));
  console.log(tag + ': nut=' + n + '  fps~' + fps);
  await page.close();
}

await run(1280, 900, 'pc');
await run(420, 880, 'dt');
await browser.close();
console.log(errs.length ? 'LOI JS:\n' + errs.join('\n') : 'KHONG CO LOI JS');
