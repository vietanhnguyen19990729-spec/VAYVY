/* make-starmap.mjs — dựng lại assets/starmap.bin từ ảnh gốc.
 *
 *   node tools/decode.mjs        (chỉ cần khi đổi ảnh gốc)
 *   node tools/make-starmap.mjs  (chạy mỗi lần chỉnh tham số)
 *   node build.js
 *
 * Ý tưởng: KHÔNG rải sao đều rồi tô sáng từng hạt — làm thế ảnh chỉ là một mảng nhiễu.
 * Ở đây ảnh hiện ra bằng CHÍNH MẬT ĐỘ sao, và mật độ được rải bằng khuếch tán sai số
 * (Floyd–Steinberg) nên khoảng cách giữa các hạt rất đều — sạch, không vón cục.
 *
 * Bốn lớp hạt, mỗi lớp một tính cách riêng:
 *   0 DA   — mặt/da: dày, hạt nhỏ, sáng
 *   1 TOC  — tóc: chạy theo HƯỚNG sợi (trường tiếp tuyến), thành vệt chứ không thành nhiễu
 *   2 NET  — mắt/kính/môi/sống mũi: bám chỗ tương phản mạnh, hạt nhỏ nhất, đanh nhất
 *   3 BUI  — bụi rìa: tan dần ra nền, để bóng người không có viền cứng
 *
 * 8 byte/hạt:  x,y (int16) · độ sáng · độ xám gốc · cỡ hạt · lớp
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { relight } from './relight.mjs';

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const A = f => path.join(DIR, 'assets', f);

/* ======================= NÚM CHỈNH ======================= */
const T = {
  /* --- làm mịn giữ nét (lọc song phương) --- */
  smIter:     1,      // số lượt. 0 = tắt
  smR:        3,      // bán kính px
  smRange: 0.085,     // KHÁC BIỆT SÁNG bao nhiêu thì coi là NÉT và không làm mịn.
                      // Cao quá -> mờ hết mắt/kính/môi; thấp quá -> da vẫn lấm tấm

  /* --- dựng tông --- */
  sharpAmt:   0.55,   // độ nổi nét cục bộ (mắt/kính/môi). Cao quá -> VIỀN SÁNG quanh mặt
  sharpSig:  11.0,    // bán kính so sánh sáng-tối cục bộ
  loPct:      0.02,   // cắt đuôi tối
  hiPct:      0.995,  // cắt đuôi sáng
  contrast:   1.14,   // độ tương phản tổng
  lift:       0.010,
  gamma:      0.97,   // <1 = đẩy mặt sáng lên

  /* --- tách tóc / da --- */
  hairSig:    9.0,    // làm nhoè lớn để mắt-kính-môi KHÔNG bị tính nhầm là tóc
  hairLo:     0.34,
  hairHi:     0.15,

  /* --- rải hạt --- */
  nSkin:      56000,  // NHIỀU hạt NHỎ, không phải ít hạt to: đó là chỗ khác nhau giữa
                      // "vẽ bằng điểm" và "rắc nhiễu" — trán sẽ có chuyển sắc thay vì bệt trắng
  nNet:       22000,  // lớp NÉT riêng: mắt, mi, gọng kính, viền môi, sống mũi
  netPow:     1.30,   // mũ mật độ theo độ lớn nét
  netLo:      0.07,   // sàn độ sáng hạt nét — PHẢI thấp, xem ghi chú ở mục 9a
  netGamma:   1.60,
  nHair:      30000,
  nMass:      3400,
  nDust:      4000,
  /* Để ~1: độ sáng nhìn thấy TỈ LỆ THẲNG với bản đồ tông, nên bức render ra đúng
     bằng bản đồ tông — chỉnh nghệ thuật ở đâu là NHÌN THẤY ở đó, không phải đoán
     qua lớp hạt. Đẩy lên 1,5 là toàn bộ vùng trung gian tối sầm và mặt bị bẹt. */
  toneGamma:  1.06,
  toneFloor:  0.010,  // vẫn còn chút sao chỗ tối nhất, không thì thành lỗ thủng
  detailAmt:  0.35,   // chỗ nhiều nét rải dày hơn -> nét mảnh không bị mất
  hairDamp:   0.62,   // giảm hạt "da" trong vùng tóc, nhường chỗ cho sợi

  /* --- sợi tóc --- */
  strandLen:  26,     // số bước trung bình một sợi
  strandStep: 1.15,   // px mỗi bước
  strandGlow: 0.34,   // sợi sáng hơn khối tóc bao nhiêu
  strandDim:  1.15,   // sợi tóc: chỉ SỢI mới được ánh lên
  strandShine: 2.4,   // mũ chọn sợi sáng: cao -> chỉ vài sợi bắt sáng, còn lại chìm
  hairLift:   0.022,  // nền tóc: đủ để đọc ra một MẢNG, chưa đủ để thành quầng sáng
  flowSig:    7.0,    // làm mượt trường hướng. Nhỏ -> sợi xoăn tít như len rối
  flowCoh:    0.30,   // dưới mức này coi như không có hướng rõ -> không gieo sợi

  /* --- rìa tan --- */
  fadeBand:   26,     // px: trong dải này mật độ giảm dần về phía rìa
  fadeKeep:   0.10,   // còn lại bao nhiêu ngay sát rìa
  dustBand:   18,     // bụi bay ra ngoài mặt nạ bao xa

  /* --- đèn viền (lớp hạt riêng chạy quanh bóng người) --- */
  nEye:       1100,   // đốm bắt sáng trong con ngươi / trên môi / ánh gọng kính
  eyeSize:    0.30,
  nRim:       5200,   // đường viền sáng: ít hạt, rất sáng, rất nhỏ
  rimSharp:   1.05,   // mũ mật độ: cao -> viền mảnh lại
  rimBr:      0.92,
  rimSize:    0.34,   // hạt viền nhỏ nhất bảng, để đường viền đanh chứ không nhoè

  /* --- độ sáng & cỡ hạt --- */
  /* Stipple thật thì MỌI HẠT GẦN NHƯ BẰNG NHAU, sáng tối do KHOẢNG CÁCH giữa các
     hạt quyết định. Cho độ sáng từng hạt chạy theo tông NỮA là tính hai lần: vùng
     giữa vừa thưa vừa mờ, chồng lên nhau ngẫu nhiên, ra đúng cái cảm giác "ảnh bị
     rắc nhiễu" phải tránh. Nên để dải này HẸP. */
  brGamma:    0.90,
  brLo:       0.45,
  /* Cỡ hạt so với KHOẢNG CÁCH giữa các hạt là thứ quyết định "vẽ bằng điểm" hay
     "một mảng sáng". Để hạt to hơn khoảng cách là vùng sáng dính liền thành mảng
     trắng và nuốt luôn con mắt — nhìn ảnh render tưởng lỗi thuật toán, thật ra chỉ
     là hạt quá khổ. Nhiều hạt NHỎ luôn đẹp hơn ít hạt to. */
  sizeBase:   0.46,
  sizeTone:   0.08,   // sáng thì hạt NHỎ lại, tối thì to hơn chút
};
/* ========================================================= */

/* ---------- đọc ảnh đã giải mã ---------- */
const raw = fs.readFileSync(path.join(DIR, 'tools', 'cache', 'src.bin'));
const nl = raw.indexOf(10);
const { W, H } = JSON.parse(raw.slice(0, nl).toString('utf8'));
const rgba = raw.slice(nl + 1, nl + 1 + W * H * 4);
const mask = raw.slice(nl + 1 + W * H * 4);
const NP = W * H;

/* ---------- tiện ích ---------- */
function mulberry(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rnd = mulberry(20260917);

function boxBlur(src, r){
  const t = new Float32Array(NP), d = new Float32Array(NP), k = 1 / (2 * r + 1);
  for (let y = 0; y < H; y++){
    const row = y * W;
    let acc = 0;
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
/* ba lượt hộp ~ một lượt Gauss: đủ mượt mà vẫn nhanh */
const blur = (s, sig) => {
  const r = Math.max(1, Math.round(sig * 0.9));
  return boxBlur(boxBlur(boxBlur(s, r), r), r);
};

const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const at = (f, x, y) => {                       // đọc song tuyến tính
  x = Math.min(W - 1.001, Math.max(0, x));
  y = Math.min(H - 1.001, Math.max(0, y));
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * W + x0;
  return (f[i] * (1 - fx) + f[i + 1] * fx) * (1 - fy)
       + (f[i + W] * (1 - fx) + f[i + W + 1] * fx) * fy;
};

/* ---------- 1. độ sáng cảm thụ ---------- */
const L = new Float32Array(NP);
for (let i = 0; i < NP; i++){
  const o = i * 4;
  L[i] = (0.2126 * rgba[o] + 0.7152 * rgba[o + 1] + 0.0722 * rgba[o + 2]) / 255;
}

/* ---------- 1b. làm mịn GIỮ NÉT ----------
   Ảnh gốc là ảnh chụp điện thoại: da có nhiễu cảm biến + vệt nén JPEG. Bước nổi nét
   ở dưới khuếch đại đúng thứ nhiễu đó lên, rồi bước kéo tương phản khuếch đại tiếp
   -> cả khuôn mặt lấm tấm như bị rắc cát, đúng cái "grainy" phải tránh.
   Lọc song phương: lấy trung bình các điểm xung quanh NHƯNG chỉ tính những điểm có
   độ sáng gần giống nó. Da mịn đi, còn gọng kính / mi mắt / viền môi thì khác biệt
   sáng quá lớn nên không bị trộn — nét vẫn đanh nguyên. */
function bilateral(src, r, sr){
  const d = new Float32Array(NP);
  const gs = [];
  for (let k = -r; k <= r; k++) gs.push(Math.exp(-(k * k) / (2 * (r * 0.6) * (r * 0.6))));
  const inv2 = 1 / (2 * sr * sr);
  for (let y = 0; y < H; y++){
    for (let x = 0; x < W; x++){
      const i = y * W + x, c0 = src[i];
      let sum = 0, wsum = 0;
      for (let dy = -r; dy <= r; dy++){
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        const row = yy * W, wy = gs[dy + r];
        for (let dx = -r; dx <= r; dx++){
          const xx = x + dx; if (xx < 0 || xx >= W) continue;
          const v = src[row + xx], dv = v - c0;
          const w = wy * gs[dx + r] * Math.exp(-dv * dv * inv2);
          sum += v * w; wsum += w;
        }
      }
      d[i] = wsum > 0 ? sum / wsum : c0;
    }
  }
  return d;
}
let Lf = L;
for (let k = 0; k < T.smIter; k++) Lf = bilateral(Lf, T.smR, T.smRange);

/* ---------- 2. nổi nét cục bộ + kéo tương phản ---------- */
const Lsm  = blur(Lf, 0.8);
const Lbig = blur(Lf, T.sharpSig);
const Lc = new Float32Array(NP);
for (let i = 0; i < NP; i++) Lc[i] = clamp01(Lsm[i] + T.sharpAmt * (Lsm[i] - Lbig[i]));

/* chuẩn hoá theo phân vị TRONG mặt nạ — tờ báo phía sau không được kéo lệch thang sáng */
const samp = [];
for (let i = 0; i < NP; i += 7) if (mask[i]) samp.push(Lc[i]);
samp.sort((a, b) => a - b);
const pLo = samp[(samp.length * T.loPct) | 0];
const pHi = samp[(samp.length * T.hiPct) | 0];

const tone = new Float32Array(NP);
for (let i = 0; i < NP; i++){
  let t = clamp01((Lc[i] - pLo) / Math.max(1e-4, pHi - pLo));
  t = clamp01((t - 0.5) * T.contrast + 0.5 + T.lift);
  tone[i] = Math.pow(t, T.gamma);
}

/* ---------- 3. tách vùng tóc ---------- */
const Lhair = blur(L, T.hairSig);
const hair = new Float32Array(NP);
for (let i = 0; i < NP; i++) hair[i] = mask[i] ? smooth(T.hairLo, T.hairHi, Lhair[i]) : 0;

/* ---------- 4. lớp nét: độ lớn gradient ---------- */
const gx = new Float32Array(NP), gy = new Float32Array(NP), det = new Float32Array(NP);
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++){
  const i = y * W + x;
  gx[i] = (Lsm[i + 1 - W] + 2 * Lsm[i + 1] + Lsm[i + 1 + W]
         - Lsm[i - 1 - W] - 2 * Lsm[i - 1] - Lsm[i - 1 + W]) * 0.25;
  gy[i] = (Lsm[i + W - 1] + 2 * Lsm[i + W] + Lsm[i + W + 1]
         - Lsm[i - W - 1] - 2 * Lsm[i - W] - Lsm[i - W + 1]) * 0.25;
  det[i] = Math.hypot(gx[i], gy[i]);
}
{
  const s = [];
  for (let i = 0; i < NP; i += 5) if (mask[i]) s.push(det[i]);
  s.sort((a, b) => a - b);
  const q = Math.max(1e-4, s[(s.length * 0.97) | 0]);
  /* nét trong TÓC thì bỏ qua — tóc đã có lớp sợi riêng, cộng thêm nữa là thành nhiễu */
  for (let i = 0; i < NP; i++) det[i] = clamp01(det[i] / q) * (1 - 0.80 * hair[i]);
}

/* ---------- 5. hướng sợi tóc (ten-xơ cấu trúc) ---------- */
const Jxx = new Float32Array(NP), Jyy = new Float32Array(NP), Jxy = new Float32Array(NP);
for (let i = 0; i < NP; i++){ Jxx[i] = gx[i] * gx[i]; Jyy[i] = gy[i] * gy[i]; Jxy[i] = gx[i] * gy[i]; }
const Sxx = blur(Jxx, T.flowSig), Syy = blur(Jyy, T.flowSig), Sxy = blur(Jxy, T.flowSig);
/* tiếp tuyến = véc-tơ riêng của trị riêng NHỎ (dọc theo sợi, không cắt ngang sợi).
   coh = độ ĐỊNH HƯỚNG: gần 1 là ở đó thật sự có sợi chạy một chiều, gần 0 là rối
   không ra hướng nào — chỗ đó mà vẫn kéo sợi thì thành mấy sợi len xoăn tít. */
const tanX = new Float32Array(NP), tanY = new Float32Array(NP), coh = new Float32Array(NP);
for (let i = 0; i < NP; i++){
  const a = Sxx[i], b = Sxy[i], c = Syy[i];
  const tr = a + c, dd = Math.sqrt(Math.max(0, (a - c) * (a - c) + 4 * b * b));
  const lmin = (tr - dd) * 0.5;
  coh[i] = tr > 1e-9 ? dd / tr : 0;
  let vx = b, vy = lmin - a;
  if (Math.abs(vx) + Math.abs(vy) < 1e-9){ vx = 1; vy = 0; }
  const nn = Math.hypot(vx, vy);
  tanX[i] = vx / nn; tanY[i] = vy / nn;
}

/* ---------- 6. khoảng cách tới rìa mặt nạ (để rìa tan dần) ---------- */
const INF = 1e9;
const dist = new Float32Array(NP);
for (let i = 0; i < NP; i++) dist[i] = mask[i] ? INF : 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
  const i = y * W + x;
  let v = dist[i];
  if (x > 0) v = Math.min(v, dist[i - 1] + 1);
  if (y > 0) v = Math.min(v, dist[i - W] + 1);
  if (x > 0 && y > 0) v = Math.min(v, dist[i - W - 1] + 1.414);
  if (x < W - 1 && y > 0) v = Math.min(v, dist[i - W + 1] + 1.414);
  dist[i] = v;
}
for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--){
  const i = y * W + x;
  let v = dist[i];
  if (x < W - 1) v = Math.min(v, dist[i + 1] + 1);
  if (y < H - 1) v = Math.min(v, dist[i + W] + 1);
  if (x < W - 1 && y < H - 1) v = Math.min(v, dist[i + W + 1] + 1.414);
  if (x > 0 && y < H - 1) v = Math.min(v, dist[i + W - 1] + 1.414);
  dist[i] = v;
}
const fade = new Float32Array(NP);
for (let i = 0; i < NP; i++)
  fade[i] = mask[i] ? T.fadeKeep + (1 - T.fadeKeep) * smooth(0, T.fadeBand, dist[i]) : 0;

/* ---------- 6b. THẮP ĐÈN LẠI ----------
   Tới đây mới có đủ nguyên liệu (tông, tóc, nét, khoảng cách tới rìa) để dựng khối
   và chiếu đèn. Từ điểm này trở đi mọi thứ dùng `TONE` (đã thắp đèn), KHÔNG dùng
   `tone` (sáng tối bê nguyên từ ảnh chụp) nữa. Núm chỉnh đèn nằm trong relight.mjs. */
const R = relight({ W, H, mask, tone, hair, det, dist, blur, L });
const TONE = R.tone2, depth = R.depth;

/* ---------- 7. rải điểm bằng khuếch tán sai số ----------
   Quét kiểu rắn bò + rung ngưỡng: khoảng cách giữa các hạt rất đều (gần nhiễu xanh),
   khác hẳn random thuần vốn hay vón cục chỗ này, thủng chỗ kia.

   Chạy trên lưới MỊN GẤP `ss` LẦN ảnh gốc, vì mỗi ô chỉ đẻ được tối đa một hạt:
   để nguyên lưới ảnh thì cả khuôn mặt chạm trần ~1 hạt/điểm ảnh, muốn dày hơn cũng
   không dày được, và trán cứ bệt thành mảng trắng. */
function diffuse(field, total, seed, ss){
  ss = ss || 1;
  const GW = W * ss, GH = H * ss, GN = GW * GH;
  const grid = new Float32Array(GN);
  let sum = 0;
  for (let y = 0; y < GH; y++){
    const sy = (y + 0.5) / ss - 0.5;
    for (let x = 0; x < GW; x++){
      const v = at(field, (x + 0.5) / ss - 0.5, sy);
      grid[y * GW + x] = v;
      sum += v;
    }
  }
  if (sum <= 0) return [];
  const k = total / sum;
  const r = mulberry(seed);
  const err = new Float32Array(GN);
  const pts = [];
  const inv = 1 / ss;
  for (let y = 0; y < GH; y++){
    const rev = (y & 1) === 1;
    for (let n = 0; n < GW; n++){
      const x = rev ? GW - 1 - n : n, i = y * GW + x;
      const v = grid[i] * k + err[i];
      let e;
      if (v > 0.5 + (r() - 0.5) * 0.28){
        pts.push(((x + 0.5) * inv - 0.5) + (r() * 0.9 - 0.45) * inv,
                 ((y + 0.5) * inv - 0.5) + (r() * 0.9 - 0.45) * inv);
        e = v - 1;
      } else e = v;
      const dx = rev ? -1 : 1;
      const px = x + dx;
      if (px >= 0 && px < GW) err[i + dx] += e * 0.4375;
      if (y < GH - 1){
        const b = i + GW;
        if (x - dx >= 0 && x - dx < GW) err[b - dx] += e * 0.1875;
        err[b] += e * 0.3125;
        if (px >= 0 && px < GW) err[b + dx] += e * 0.0625;
      }
    }
  }
  return pts;
}

/* ---------- 8. các trường mật độ ---------- */
const dSkin = new Float32Array(NP), dSeed = new Float32Array(NP), dMass = new Float32Array(NP);
for (let i = 0; i < NP; i++){
  if (!mask[i]) continue;
  const t = TONE[i];
  const base = T.toneFloor + Math.pow(t, T.toneGamma);
  /* Tăng mật độ ở chỗ nhiều nét, NHƯNG phải nhân thêm chính độ sáng t: nếu không,
     lông mi, con ngươi, gọng kính (tối mà nhiều nét) bị nhồi thêm hạt -> mắt sáng
     bằng trán, mất sạch. Nét tối phải hiện ra bằng chỗ VẮNG hạt, không phải thêm hạt. */
  dSkin[i] = base * (1 + T.detailAmt * det[i] * t) * (1 - T.hairDamp * hair[i]) * fade[i];
  dMass[i] = hair[i] * (T.hairLift + 0.82 * t) * fade[i];
  /* mầm sợi: gieo ở chỗ tóc có ánh — sợi sẽ chạy từ đó ra */
  dSeed[i] = hair[i] * (0.10 + Math.pow(t, 0.75)) * fade[i] * smooth(T.flowCoh, T.flowCoh + 0.22, coh[i]);
}

/* ---------- 9. gom hạt ---------- */
const X = [], Y = [], BR = [], LU = [], SZ = [], CL = [];
const push = (px, py, br, lu, sz, cl) => {
  X.push(px); Y.push(py); BR.push(br); LU.push(lu); SZ.push(sz); CL.push(cl);
};
const sizeOf = t => T.sizeBase - T.sizeTone * t;
const brOf   = t => T.brLo + (1 - T.brLo) * Math.pow(t, T.brGamma);

/* 9a. DA — hạt gần như bằng nhau, tông hoàn toàn do khoảng cách giữa các hạt */
{
  const p = diffuse(dSkin, T.nSkin, 7717, 2);
  for (let i = 0; i < p.length; i += 2){
    const x = p[i], y = p[i + 1], t = at(TONE, x, y);
    push(x, y, brOf(t), at(depth, x, y), sizeOf(t), 0);
  }
}
/* 9a-bis. NÉT — mắt, mi, gọng kính, viền môi.
   Lớp này có LUẬT ĐỘ SÁNG RIÊNG, và đó là cả vấn đề. Hạt da cố ý gần như bằng nhau
   (tông do mật độ). Nhưng nếu hạt nét cũng sáng đều như vậy thì con ngươi, hàng mi,
   gọng kính — vốn TỐI mà lại rất nhiều nét — bị nhồi hạt sáng vào, và đôi mắt sáng
   ngang cái trán: nhìn render tưởng mất mắt.
   Nên: mật độ theo ĐỘ LỚN NÉT (đủ chi tiết), còn độ sáng theo TÔNG và dốc (tối thì
   phải tối). Kết quả là mắt vừa đủ chi tiết vừa vẫn là một vùng tối. */
{
  const dNet = new Float32Array(NP);
  for (let i = 0; i < NP; i++)
    dNet[i] = mask[i] ? Math.pow(det[i], T.netPow) * (1 - 0.85 * hair[i]) * fade[i] : 0;
  const p = diffuse(dNet, T.nNet, 2609, 2);
  for (let i = 0; i < p.length; i += 2){
    const x = p[i], y = p[i + 1], t = at(TONE, x, y);
    push(x, y, T.netLo + (1 - T.netLo) * Math.pow(t, T.netGamma),
         at(depth, x, y), sizeOf(t) * 0.70, 2);
  }
}
/* 9b. sợi tóc — đi theo trường tiếp tuyến */
{
  const seeds = diffuse(dSeed, Math.round(T.nHair / T.strandLen), 3391);
  for (let s = 0; s < seeds.length; s += 2){
    let x = seeds[s], y = seeds[s + 1];
    const t0 = at(TONE, x, y);
    /* chỉ MỘT VÀI sợi bắt được ánh sáng, phần còn lại chìm hẳn vào khối tối —
       cho đều tay thì tóc lại thành một mảng xám nhiễu, đúng cái phải tránh */
    const shine = 0.30 + 1.25 * Math.pow(rnd(), T.strandShine);
    const len = Math.round(T.strandLen * (0.45 + rnd() * 1.25));
    /* mỗi sợi chạy về MỘT phía, chọn ngẫu nhiên; bám hướng cũ để không quay ngoắt lại */
    let dirX = at(tanX, x, y), dirY = at(tanY, x, y);
    if (rnd() < 0.5){ dirX = -dirX; dirY = -dirY; }
    for (let k = 0; k < len; k++){
      if (x < 0 || y < 0 || x >= W - 1 || y >= H - 1) break;
      if (at(hair, x, y) < 0.12 && k > 2) break;
      const taper = Math.min(1, k / 3) * smooth(0, 0.34, 1 - k / len);
      const t = at(TONE, x, y);
      const br = clamp01((brOf(t) + T.hairLift) * T.strandDim * shine
                         * (1 + T.strandGlow * t0) * taper * at(fade, x, y));
      if (br > 0.012) push(x, y, br, at(depth, x, y), sizeOf(t) * 0.80, 1);
      let nx = at(tanX, x, y), ny = at(tanY, x, y);
      if (nx * dirX + ny * dirY < 0){ nx = -nx; ny = -ny; }
      dirX = dirX * 0.35 + nx * 0.65; dirY = dirY * 0.35 + ny * 0.65;
      const nn = Math.hypot(dirX, dirY) || 1;
      dirX /= nn; dirY /= nn;
      x += dirX * T.strandStep + (rnd() - 0.5) * 0.30;
      y += dirY * T.strandStep + (rnd() - 0.5) * 0.30;
    }
  }
}
/* 9c. khối tóc: một lớp rất thưa để tóc là MẢNG chứ không phải mấy sợi lơ lửng */
{
  const p = diffuse(dMass, T.nMass, 5519, 2);
  for (let i = 0; i < p.length; i += 2){
    const x = p[i], y = p[i + 1], t = at(TONE, x, y);
    push(x, y, (brOf(t) + T.hairLift) * 0.62, at(depth, x, y), sizeOf(t) * 0.98, 1);
  }
}
/* 9d. bụi rìa: bay ra ngoài mặt nạ, mờ dần — bóng người không có viền cứng */
{
  const dEdge = new Float32Array(NP);
  for (let i = 0; i < NP; i++)
    dEdge[i] = mask[i] ? smooth(T.fadeBand * 1.6, 1, dist[i]) * (0.25 + 0.75 * TONE[i]) : 0;
  const p = diffuse(dEdge, T.nDust, 9181, 2);
  for (let i = 0; i < p.length; i += 2){
    const x = p[i], y = p[i + 1];
    const t = at(TONE, x, y);
    /* đẩy ra phía ngoài, ngược hướng tăng của khoảng-cách-tới-rìa */
    const s = 2;
    const ox = at(dist, x + s, y) - at(dist, x - s, y);
    const oy = at(dist, x, y + s) - at(dist, x, y - s);
    const nn = Math.hypot(ox, oy) || 1;
    const away = Math.pow(rnd(), 1.8) * T.dustBand;
    const fx = x - ox / nn * away + (rnd() - 0.5) * 5;
    const fy = y - oy / nn * away + (rnd() - 0.5) * 5;
    const dim = Math.pow(1 - away / T.dustBand, 1.6);
    push(fx, fy, clamp01(brOf(t) * 0.55 * dim + 0.02), at(depth, x, y),
         sizeOf(t) * (1.15 + rnd() * 0.5), 3);
  }
}

/* 9d-bis. ĐỐM BẮT SÁNG — vài chục hạt thôi, nhưng là mấy hạt quan trọng nhất cả bức:
   hai đốm trong con ngươi làm khuôn mặt nhìn lại người xem. Sáng hết cỡ, nhỏ hết cỡ,
   để bloom bắt được thành một tia lấp lánh. */
{
  const dEye = new Float32Array(NP);
  for (let i = 0; i < NP; i++) dEye[i] = mask[i] ? Math.pow(R.eye[i], 1.6) * fade[i] : 0;
  const p = diffuse(dEye, T.nEye, 8123, 3);
  for (let i = 0; i < p.length; i += 2)
    push(p[i], p[i + 1], 1.0, at(depth, p[i], p[i + 1]), T.eyeSize, 2);
}

/* 9e. ĐÈN VIỀN — một đường sáng mảnh ôm quanh tóc và bờ vai.
   Ảnh gốc không có thứ này. Nó là chi tiết làm bức chân dung tách hẳn khỏi nền và
   trông như được chụp trong phòng studio chứ không phải chụp vội trước bức tường. */
{
  const dRim = new Float32Array(NP);
  for (let i = 0; i < NP; i++)
    dRim[i] = mask[i] ? Math.pow(R.rim[i], T.rimSharp) * fade[i] : 0;
  const p = diffuse(dRim, T.nRim, 4271, 2);
  for (let i = 0; i < p.length; i += 2){
    const x = p[i], y = p[i + 1];
    const rv = at(R.rim, x, y), t = at(TONE, x, y);
    push(x, y, clamp01(T.rimBr * Math.pow(rv, 0.70) + brOf(t) * 0.30),
         at(depth, x, y), T.rimSize * (0.85 + rnd() * 0.35), 2);
  }
}

/* ---------- 10. xáo trộn ----------
   Máy yếu chỉ lấy 62.000 hạt ĐẦU TIÊN, nên thứ tự phải trộn đều: cắt ở đâu cũng
   phải còn đủ cả mặt, cả tóc, cả bụi — không thì điện thoại chỉ thấy nửa khuôn mặt. */
const n = X.length;
const idx = new Int32Array(n);
for (let i = 0; i < n; i++) idx[i] = i;
for (let i = n - 1; i > 0; i--){
  const j = (rnd() * (i + 1)) | 0;
  const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
}

/* ---------- 11. ghi file ---------- */
const STRIDE = 8;
const buf = Buffer.alloc(n * STRIDE);
const q = (v, lo, hi) => Math.max(0, Math.min(255, Math.round((v - lo) / (hi - lo) * 255)));
let kept = 0;
for (let k = 0; k < n; k++){
  const i = idx[k], o = kept * STRIDE;
  const nx = (X[i] / (W - 1)) * 2 - 1;
  const ny = -((Y[i] / (H - 1)) * 2 - 1);
  if (nx < -1.35 || nx > 1.35 || ny < -1.35 || ny > 1.35) continue;
  buf.writeInt16LE(Math.max(-32000, Math.min(32000, Math.round(nx * 10000))), o);
  buf.writeInt16LE(Math.max(-32000, Math.min(32000, Math.round(ny * 10000))), o + 2);
  buf[o + 4] = q(clamp01(BR[i]), 0, 1);
  buf[o + 5] = q(clamp01(LU[i]), 0, 1);
  buf[o + 6] = q(Math.max(0.12, Math.min(2.5, SZ[i])), 0, 2.5);
  buf[o + 7] = CL[i];
  kept++;
}
fs.writeFileSync(A('starmap.bin'), buf.slice(0, kept * STRIDE));
const meta = JSON.parse(fs.readFileSync(A('meta.json'), 'utf8'));
meta.stars = kept;
meta.stride = STRIDE;
fs.writeFileSync(A('meta.json'), JSON.stringify(meta, null, 2) + '\n');

/* DUMP=1 node tools/make-starmap.mjs -> đổ các trường trung gian ra ảnh để soi bằng mắt */
if (process.env.DUMP){
  const enc = f => { let s = ''; const CH = 0x8000;
    const u = new Uint8Array(NP);
    for (let i = 0; i < NP; i++) u[i] = Math.max(0, Math.min(255, Math.round(f[i] * 255)));
    for (let i = 0; i < NP; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH));
    return Buffer.from(s, 'binary').toString('base64'); };
  fs.writeFileSync(path.join(DIR, 'tools', 'cache', 'fields.json'), JSON.stringify({
    W, H, f: { '1 tone goc': enc(tone), '2 khoi': enc(R.height),
               '3 ban do sang': enc(R.shade), '4 den vien': enc(R.rim),
               '5 TONE thap den': enc(TONE), '6 do sau': enc(depth),
               '7 dom bat sang': enc(R.eye), '8 net': enc(det) } }));
  console.log('da do truong -> tools/cache/fields.json');
}

const cnt = [0, 0, 0, 0];
for (let i = 0; i < n; i++) cnt[CL[i]]++;
console.log('starmap.bin  ' + kept.toLocaleString('vi-VN') + ' hat  ('
  + (kept * STRIDE / 1048576).toFixed(2) + ' MB)');
console.log('  da ' + cnt[0].toLocaleString('vi-VN') + ' · toc ' + cnt[1].toLocaleString('vi-VN')
  + ' · net ' + cnt[2].toLocaleString('vi-VN') + ' · bui ' + cnt[3].toLocaleString('vi-VN'));
