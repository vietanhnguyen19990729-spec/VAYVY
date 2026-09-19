/* preview.mjs — xem nhanh assets/starmap.bin thành ảnh PNG, KHÔNG cần mở cả trang.
 *
 *   node tools/preview.mjs [duong-dan-anh-ra.png] [chieu-cao] [do-sang]
 *
 * Vẽ lại đúng kiểu shader đang dùng: chấm tròn mờ dần ra rìa, cộng sáng (additive)
 * trên nền xanh đêm. Dùng để chỉnh tham số trong make-starmap.mjs cho nhanh —
 * chốt xong mới build cả trang.
 */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const A = f => path.join(DIR, 'assets', f);
const OUT = process.argv[2] || path.join(DIR, 'tools', 'cache', 'preview.png');
const PH = +(process.argv[3] || 860);
const GAIN = +(process.argv[4] || 0.10);   // canh cho khop do sang that cua trang

const meta = JSON.parse(fs.readFileSync(A('meta.json'), 'utf8'));
const smap = fs.readFileSync(A('starmap.bin')).toString('base64');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const png = await page.evaluate(async ([smap, stride, aspect, PH, GAIN]) => {
  const bin = atob(smap);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const dv = new DataView(u8.buffer);
  const N = (bin.length / stride) | 0;

  const H = PH, W = Math.round(PH * aspect * 1.34);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = '#04060c';
  c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighter';

  /* một chấm mẫu vẽ sẵn rồi dán lại nhiều lần — vẽ gradient 115k lần thì treo */
  const R = 16;
  const sp = document.createElement('canvas');
  sp.width = sp.height = R * 2;
  const sc = sp.getContext('2d');
  const g = sc.createRadialGradient(R, R, 0, R, R, R);
  for (let i = 0; i <= 10; i++){
    const d = i / 10;
    let a = 1 - (d - 0.12) / 0.88;
    a = Math.pow(Math.max(0, Math.min(1, a)), 1.25);
    g.addColorStop(d, 'rgba(216,232,255,' + a.toFixed(3) + ')');
  }
  sc.fillStyle = g;
  sc.fillRect(0, 0, R * 2, R * 2);

  const PH2 = H * 0.86;                      // chân dung cao 86% khung, giống trên trang
  const PW = PH2 * aspect;
  const SIZE = 3.05 * (H / 860);             // cỡ hạt cơ bản, quy về chiều cao khung
  for (let k = 0; k < N; k++){
    const o = k * stride;
    const x = dv.getInt16(o, true) / 10000, y = dv.getInt16(o + 2, true) / 10000;
    const br = u8[o + 4] / 255;
    const sz = (stride >= 8 ? u8[o + 6] / 255 * 2.5 : 1.0);
    const px = W * 0.5 + x * PW * 0.5;
    const py = H * 0.5 - y * PH2 * 0.5;
    const r = SIZE * sz;
    c.globalAlpha = Math.min(1, br * GAIN);
    c.drawImage(sp, px - r, py - r, r * 2, r * 2);
  }
  return cv.toDataURL('image/png');
}, [smap, meta.stride || 6, meta.aspect, PH, GAIN]);
await browser.close();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log('xem thu -> ' + OUT);
