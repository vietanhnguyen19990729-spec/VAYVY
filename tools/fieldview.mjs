/* fieldview.mjs — đổ src.bin (ảnh gốc + mặt nạ) ra PNG để nhìn bằng mắt.
 *   node tools/fieldview.mjs [out.png]
 */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = process.argv[2] || path.join(DIR, 'tools', 'cache', 'src.png');
const raw = fs.readFileSync(path.join(DIR, 'tools', 'cache', 'src.bin'));
const nl = raw.indexOf(10);
const { W, H } = JSON.parse(raw.slice(0, nl).toString('utf8'));
const rgba = raw.slice(nl + 1, nl + 1 + W * H * 4).toString('base64');
const mask = raw.slice(nl + 1 + W * H * 4).toString('base64');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const png = await page.evaluate(([W, H, rgba, mask]) => {
  const dec = s => { const b = atob(s), u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const P = dec(rgba), M = dec(mask);
  const cv = document.createElement('canvas');
  cv.width = W * 2; cv.height = H;
  const c = cv.getContext('2d');
  const im = c.createImageData(W, H);
  im.data.set(P);
  c.putImageData(im, 0, 0);
  const im2 = c.createImageData(W, H);
  for (let i = 0; i < W * H; i++){
    const o = i * 4;
    if (M[i]){ im2.data[o] = P[o]; im2.data[o+1] = P[o+1]; im2.data[o+2] = P[o+2]; }
    else { im2.data[o] = 255; im2.data[o+1] = 0; im2.data[o+2] = 120; }
    im2.data[o+3] = 255;
  }
  c.putImageData(im2, W, 0);
  return cv.toDataURL('image/png');
}, [W, H, rgba, mask]);
await browser.close();
fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log('xem -> ' + OUT + '  (' + W + 'x' + H + ')');
