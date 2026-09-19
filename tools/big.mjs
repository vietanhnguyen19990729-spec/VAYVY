/* big.mjs — xem MỘT trường ở cỡ thật.  node tools/big.mjs "5 TONE thap den" */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const J = JSON.parse(fs.readFileSync(path.join(DIR, 'tools', 'cache', 'fields.json'), 'utf8'));
const KEY = process.argv[2] || Object.keys(J.f)[4];
const OUT = path.join(DIR, 'tools', 'cache', 'big.png');
if (!J.f[KEY]){ console.log('co cac truong:', Object.keys(J.f).join(' | ')); process.exit(1); }
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const png = await page.evaluate(([W, H, d]) => {
  const b = atob(d);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const im = c.createImageData(W, H);
  for (let i = 0; i < W * H; i++){
    const v = b.charCodeAt(i);
    im.data[i*4] = v; im.data[i*4+1] = v; im.data[i*4+2] = v; im.data[i*4+3] = 255;
  }
  c.putImageData(im, 0, 0);
  return cv.toDataURL('image/png');
}, [J.W, J.H, J.f[KEY]]);
await browser.close();
fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log(KEY + ' -> ' + OUT);
