/* decode.mjs — giải mã assets/portrait.jpg ra pixel thô + tách MẶT NẠ NGƯỜI.
 *
 *   node tools/decode.mjs
 *
 * Kết quả: tools/cache/src.bin  (header JSON + RGBA thô + mặt nạ 1 byte/điểm)
 * Chỉ chạy lại khi đổi ảnh gốc. Cần Chrome (qua playwright-core) vì Node không tự
 * giải mã được JPEG.
 *
 * Ảnh gốc chụp trước bức tường dán BÁO và một lá CỜ ĐỎ. Để nguyên thì nền sáng hơn cả
 * khuôn mặt — dựng sao lên là chữ báo nổi hơn em. Ba dấu hiệu tách rất bạch trong đúng
 * tấm này (số đo thật, xem README trong tools/):
 *     tóc, áo   L ≈ 0.08–0.18   R−B ≈ 0.04     (tối hơn hẳn mọi thứ khác)
 *     da        L ≈ 0.54–0.74   R−B ≈ 0.21     (ngả ấm vừa)
 *     báo       L ≈ 0.48–0.73   R−B ≤ 0.065    (sáng nhưng trung tính)
 *     cờ đỏ     L ≈ 0.36        R−G ≈ 0.34     (đỏ gắt hơn da nhiều)
 * -> lấy (tối HOẶC da), dọn hạt lẻ, khép kín, giữ MẢNG LIỀN LỚN NHẤT, lấp lỗ.
 */
import { chromium } from 'file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const A = f => path.join(DIR, 'assets', f);
const meta = JSON.parse(fs.readFileSync(A('meta.json'), 'utf8'));

/* ngưỡng phân loại — chỉnh ở đây nếu đổi ảnh gốc */
const K = {
  darkL:   0.26,   // dưới mức này coi là tóc/áo
  skinRB:  0.12,   // da ấm hơn báo
  skinRBx: 0.34,   // nhưng không ấm tới mức lá cờ
  skinRG:  0.26,
  skinLo:  0.30,
  openR:   2,      // dọn hạt lẻ
  closeR:  7       // khép các khe giữa sợi tóc
};

const jpg = 'data:image/jpeg;base64,' + fs.readFileSync(A('portrait.jpg')).toString('base64');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const out = await page.evaluate(async ([jpg, ASPECT]) => {
  const img = new Image(); img.src = jpg; await img.decode();
  const W = img.naturalWidth;
  const H = Math.round(W / ASPECT);        // khung cắt: phần TRÊN của ảnh, đúng như bản v1
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(img, 0, 0);
  const d = c.getImageData(0, 0, W, H).data;
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < d.length; i += CH) s += String.fromCharCode.apply(null, d.subarray(i, i + CH));
  return { W, H, b64: btoa(s) };
}, [jpg, meta.aspect]);
await browser.close();

const W = out.W, H = out.H, NP = W * H;
const rgba = Buffer.from(out.b64, 'base64');

/* ---------- tiện ích hình thái học ---------- */
function boxBlur(src, r){
  const t = new Float32Array(NP), d = new Float32Array(NP), k = 1 / (2 * r + 1);
  for (let y = 0; y < H; y++){
    const row = y * W; let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++){
      t[row + x] = acc * k;
      acc += src[row + Math.min(W - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < W; x++){
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += t[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++){
      d[y * W + x] = acc * k;
      acc += t[Math.min(H - 1, y + r + 1) * W + x] - t[Math.max(0, y - r) * W + x];
    }
  }
  return d;
}
/* nở / co viết bằng "nhoè hộp rồi cắt ngưỡng" — đủ dùng và nhanh hơn quét cửa sổ */
const grow   = (m, r) => { const b = boxBlur(m, r); const o = new Float32Array(NP);
  for (let i = 0; i < NP; i++) o[i] = b[i] > 0.004 ? 1 : 0; return o; };
const shrink = (m, r) => { const b = boxBlur(m, r); const o = new Float32Array(NP);
  for (let i = 0; i < NP; i++) o[i] = b[i] > 0.996 ? 1 : 0; return o; };

/* ---------- phân loại ---------- */
const Rf = new Float32Array(NP), Gf = new Float32Array(NP), Bf = new Float32Array(NP);
for (let i = 0; i < NP; i++){ Rf[i] = rgba[i * 4]; Gf[i] = rgba[i * 4 + 1]; Bf[i] = rgba[i * 4 + 2]; }
const Rb = boxBlur(Rf, 2), Gb = boxBlur(Gf, 2), Bb = boxBlur(Bf, 2);

let m = new Float32Array(NP);
for (let i = 0; i < NP; i++){
  const R = Rb[i], G = Gb[i], B = Bb[i];
  const L = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
  const rb = (R - B) / 255, rg = (R - G) / 255;
  const dark = L < K.darkL;
  const skin = L > K.skinLo && rb > K.skinRB && rb < K.skinRBx && rg < K.skinRG;
  m[i] = (dark || skin) ? 1 : 0;
}
m = grow(shrink(m, K.openR), K.openR);        // mở: bay hết hạt lẻ trên nền báo
m = shrink(grow(m, K.closeR), K.closeR);      // đóng: khép khe giữa các sợi tóc

/* ---------- giữ mảng liền lớn nhất ---------- */
const lab = new Int32Array(NP).fill(-1);
let best = -1, bestN = 0, cur = 0;
const q = new Int32Array(NP);
for (let s = 0; s < NP; s++){
  if (m[s] !== 1 || lab[s] >= 0) continue;
  let head = 0, tail = 0;
  q[tail++] = s; lab[s] = cur;
  while (head < tail){
    const i = q[head++], x = i % W, y = (i / W) | 0;
    if (x > 0     && m[i - 1] === 1 && lab[i - 1] < 0){ lab[i - 1] = cur; q[tail++] = i - 1; }
    if (x < W - 1 && m[i + 1] === 1 && lab[i + 1] < 0){ lab[i + 1] = cur; q[tail++] = i + 1; }
    if (y > 0     && m[i - W] === 1 && lab[i - W] < 0){ lab[i - W] = cur; q[tail++] = i - W; }
    if (y < H - 1 && m[i + W] === 1 && lab[i + W] < 0){ lab[i + W] = cur; q[tail++] = i + W; }
  }
  if (tail > bestN){ bestN = tail; best = cur; }
  cur++;
}
const mask = new Uint8Array(NP);
for (let i = 0; i < NP; i++) mask[i] = lab[i] === best ? 1 : 0;

/* ---------- lấp lỗ: loang nền từ viền ảnh vào, chỗ nào không tới được là lỗ ---------- */
const outside = new Uint8Array(NP);
let head = 0, tail = 0;
const seed = i => { if (!outside[i] && !mask[i]){ outside[i] = 1; q[tail++] = i; } };
for (let x = 0; x < W; x++){ seed(x); seed((H - 1) * W + x); }
for (let y = 0; y < H; y++){ seed(y * W); seed(y * W + W - 1); }
while (head < tail){
  const i = q[head++], x = i % W, y = (i / W) | 0;
  if (x > 0)     seed(i - 1);
  if (x < W - 1) seed(i + 1);
  if (y > 0)     seed(i - W);
  if (y < H - 1) seed(i + W);
}
for (let i = 0; i < NP; i++) if (!outside[i]) mask[i] = 1;

const head2 = Buffer.from(JSON.stringify({ W, H }) + '\n', 'utf8');
fs.mkdirSync(path.join(DIR, 'tools', 'cache'), { recursive: true });
fs.writeFileSync(path.join(DIR, 'tools', 'cache', 'src.bin'),
  Buffer.concat([head2, rgba, Buffer.from(mask.buffer, 0, NP)]));

let on = 0;
for (let i = 0; i < NP; i++) on += mask[i];
console.log('anh cat  ' + W + ' x ' + H + '   mat na ' + (on / NP * 100).toFixed(1) + '% dien tich');
