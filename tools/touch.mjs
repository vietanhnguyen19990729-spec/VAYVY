import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const C = path.join(DIR, 'tools', 'cache');
const b = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await p.goto('file:///' + path.join(DIR, 'index.html').split(String.fromCharCode(92)).join('/'));
await p.waitForTimeout(8000);
const clip = { x: 470, y: 60, width: 790, height: 840 };
await p.mouse.move(900, 480); await p.waitForTimeout(1200);
await p.screenshot({ path: path.join(C, 't-hover.png'), clip });
await p.mouse.down(); await p.mouse.up();
for (const ms of [250, 700, 1500]){
  await p.waitForTimeout(ms === 250 ? 250 : 450);
  await p.screenshot({ path: path.join(C, 't-click' + ms + '.png'), clip });
}
await b.close(); console.log('xong');
