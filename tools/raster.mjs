/* raster.mjs — dựng lại starmap.bin thành ảnh xám THEO ĐÚNG TÍCH SÁNG mỗi điểm ảnh,
   không qua cỡ hạt. Dùng để biết mất chi tiết là do khâu RẢI HẠT hay khâu VẼ. */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = fs.readFileSync(path.join(DIR, 'tools', 'cache', 'src.bin'));
const { W, H } = JSON.parse(raw.slice(0, raw.indexOf(10)).toString('utf8'));
const bin = fs.readFileSync(path.join(DIR, 'assets', 'starmap.bin'));
const meta = JSON.parse(fs.readFileSync(path.join(DIR, 'assets', 'meta.json'), 'utf8'));
const S = meta.stride, N = (bin.length / S) | 0;
const acc = new Float32Array(W * H);
for (let i = 0; i < N; i++){
  const o = i * S;
  const x = Math.round((bin.readInt16LE(o) / 10000 + 1) / 2 * (W - 1));
  const y = Math.round((1 - bin.readInt16LE(o + 2) / 10000) / 2 * (H - 1));
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  acc[y * W + x] += bin[o + 4] / 255;
}
/* nhoè 1 px cho dễ nhìn rồi chuẩn hoá theo phân vị 99,5% */
const s = Array.from(acc).filter(v => v > 0).sort((a, b) => a - b);
const hi = s[(s.length * 0.995) | 0] || 1;
const u8 = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) u8[i] = Math.min(255, Math.round(acc[i] / hi * 255));
let b64 = ''; for (let i = 0; i < W * H; i += 0x8000) b64 += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const png = await page.evaluate(([W, H, d]) => {
  const b = atob(d);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'); const im = c.createImageData(W, H);
  for (let i = 0; i < W * H; i++){ const v = b.charCodeAt(i);
    im.data[i*4] = v; im.data[i*4+1] = v; im.data[i*4+2] = v; im.data[i*4+3] = 255; }
  c.putImageData(im, 0, 0);
  /* làm mượt để mắt người đọc được tông thay vì thấy toàn chấm rời */
  const o = document.createElement('canvas'); o.width = W; o.height = H;
  const oc = o.getContext('2d'); oc.filter = 'blur(1.6px)'; oc.drawImage(cv, 0, 0);
  return o.toDataURL('image/png');
}, [W, H, Buffer.from(b64, 'binary').toString('base64')]);
await browser.close();
const OUT = path.join(DIR, 'tools', 'cache', 'raster.png');
fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log('xem -> ' + OUT);
