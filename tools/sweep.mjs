/* sweep.mjs — mở trang MỘT lần rồi chụp nhiều mức phơi sáng bằng vyaTune().
 *   node tools/sweep.mjs "3.0,2.4,1.9"   (gain)  [bloomStr] [bloomThr] [size]
 */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const gains = (process.argv[2] || '3.0').split(',').map(Number);
const STR = process.argv[3] ? +process.argv[3] : null;
const THR = process.argv[4] ? +process.argv[4] : null;
const SZ  = process.argv[5] ? +process.argv[5] : null;
const browser = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto('file:///' + path.join(DIR, 'index.html').split(String.fromCharCode(92)).join('/'));
await page.waitForTimeout(8000);
for (const g of gains){
  await page.evaluate(([g, s, t, z]) => window.vyaTune(g, s, t, z), [g, STR, THR, SZ]);
  await page.waitForTimeout(900);
  const f = path.join(DIR, 'tools', 'cache', 'g' + String(g).replace('.', '') + '.png');
  await page.screenshot({ path: f, clip: { x: +(process.env.CX||470), y: +(process.env.CY||60), width: +(process.env.CW||790), height: +(process.env.CH||840) } });
  console.log('gain ' + g + ' -> ' + f);
}
await browser.close();
if (errs.length) console.log('LOI JS:\n' + errs.join('\n'));
