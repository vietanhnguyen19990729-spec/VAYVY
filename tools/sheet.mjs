/* sheet.mjs — dán các trường trung gian (DUMP=1) thành một tấm PNG để soi bằng mắt.
 *   DUMP=1 node tools/make-starmap.mjs && node tools/sheet.mjs
 */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = process.argv[2] || path.join(DIR, 'tools', 'cache', 'sheet.png');
const J = JSON.parse(fs.readFileSync(path.join(DIR, 'tools', 'cache', 'fields.json'), 'utf8'));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const png = await page.evaluate((J) => {
  const { W, H, f } = J;
  const names = Object.keys(f);
  const COLS = 4, SC = 0.62;
  const w = Math.round(W * SC), h = Math.round(H * SC);
  const rows = Math.ceil(names.length / COLS);
  const cv = document.createElement('canvas');
  cv.width = COLS * w; cv.height = rows * (h + 20);
  const c = cv.getContext('2d');
  c.fillStyle = '#111'; c.fillRect(0, 0, cv.width, cv.height);
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
  const tc = tmp.getContext('2d');
  names.forEach((nm, k) => {
    const b = atob(f[nm]);
    const im = tc.createImageData(W, H);
    for (let i = 0; i < W * H; i++){
      const v = b.charCodeAt(i);
      im.data[i*4] = v; im.data[i*4+1] = v; im.data[i*4+2] = v; im.data[i*4+3] = 255;
    }
    tc.putImageData(im, 0, 0);
    const cx = (k % COLS) * w, cy = ((k / COLS) | 0) * (h + 20);
    c.drawImage(tmp, cx, cy + 20, w, h);
    c.fillStyle = '#7fd'; c.font = '13px monospace';
    c.fillText(nm, cx + 6, cy + 15);
  });
  return cv.toDataURL('image/png');
}, J);
await browser.close();
fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log('xem -> ' + OUT);
