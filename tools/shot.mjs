/* shot.mjs — chụp trang thật.  node tools/shot.mjs ra.png [rong] [cao] [cho-giay] */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = process.argv[2] || path.join(DIR, 'tools', 'cache', 'page.png');
const Wp = +(process.argv[3] || 1280), Hp = +(process.argv[4] || 900);
const WAIT = +(process.argv[5] || 7);
const browser = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: Wp, height: Hp }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file:///' + path.join(DIR, 'index.html').split(String.fromCharCode(92)).join('/'));
await page.waitForTimeout(WAIT * 1000);
await page.screenshot({ path: OUT });
await browser.close();
console.log('chup -> ' + OUT + (errs.length ? '\nLOI JS:\n' + errs.join('\n') : '\nkhong loi JS'));
