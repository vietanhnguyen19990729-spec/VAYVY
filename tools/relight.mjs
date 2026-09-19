/* relight.mjs — tầng ÁNH SÁNG của chân dung.
 *
 * Tấm ảnh gốc là ảnh chụp nhanh: sáng đều, bẹt, không có ý đồ. Muốn nó thành một
 * bức CHÂN DUNG thì phải bỏ ánh sáng cũ đi và thắp đèn lại theo ý mình.
 *
 * Cách làm: ước lượng KHỐI của khuôn mặt (không cần biết nó là mặt), rồi chiếu ba
 * ngọn đèn lên cái khối đó:
 *
 *   ĐÈN CHÍNH  trên-trái-trước  — dựng sáng tối, tạo chiều sâu cho gò má, sống mũi
 *   ĐÈN VIỀN   trên-phải-SAU    — chạy một đường sáng mảnh quanh tóc và bờ vai.
 *                                 Đây là thứ ảnh gốc KHÔNG có, và là thứ làm nó
 *                                 sang lên rõ nhất.
 *   ĐÈN PHỤ    dưới-trước       — rất nhẹ, để bên tối không chết hẳn thành mảng đen
 *
 * Khối lấy ở đâu ra? Hai nguồn cộng lại:
 *   1. VÒM: càng vào sâu trong mặt nạ càng nhô ra trước — cho cả cái đầu một độ cong
 *      như quả trứng, nên rìa tự quay lưng lại với đèn (nhờ vậy đèn viền mới ăn).
 *   2. PHÙ ĐIÊU: coi độ sáng (đã làm mượt) như bản đồ độ cao — mũi, gò má, hốc mắt
 *      nhô lõm theo. Trong vùng TÓC thì tắt gần hết, vì tóc tối do MÀU chứ không
 *      phải do hình.
 *
 * Ghép lại bằng phép SOFT LIGHT chứ không nhân thẳng: soft light chỉ uốn đường cong
 * sáng-tối ở tầng LỚN, còn chi tiết nhỏ (mắt, gọng kính, viền môi) giữ nguyên.
 * Nhân thẳng là mất sạch nét trong bóng tối.
 */

export const LIGHT = {
  /* --- dựng khối --- */
  bodySig:   34,    // px: độ cong THOẢI của cả khối đầu
  edgeSig:    9,    // px: dải hẹp sát rìa, nơi khối quay ngang — đèn viền ăn ở đây
  edgeMix:  0.58,   // tỉ trọng giữa hai tầng khối
  domeAmt:   1.00,  // độ cong của cả khối đầu
  featAmt:   0.16,  // độ nổi của chi tiết. Đây là núm NGUY HIỂM NHẤT: nhích lên một
                    // chút là khuôn mặt thành mặt nạ nhựa dập nổi, gọng kính phồng
                    // lên như kính lặn. Nhiệm vụ của nó chỉ là đỡ gò má và cằm.
  featSig:   17.0,  // làm mượt trước khi lấy độ cao. Thấp = dập nổi từng chi tiết
  featHair:   0.82, // tắt phù điêu trong tóc bao nhiêu (tóc tối vì MÀU, không vì hình)
  nGain:     14.0,  // độ dốc pháp tuyến. Cao -> sáng tối gắt, khối rõ nhưng dễ nham nhở

  /* --- ba ngọn đèn (toạ độ ảnh: x phải, y XUỐNG, z hướng về người xem) --- */
  keyDir:  [-0.64, -0.40,  0.66],
  rimDir:  [ 0.88, -0.34, -0.33],
  rim2Dir: [-0.80, -0.42, -0.42],   // đèn viền PHỤ bên trái
  rim2Amt:  0.38,                   // yếu hơn hẳn: chỉ để bờ tóc trái không mất hút
  filDir:  [ 0.26,  0.42,  0.87],

  keyAmt:    0.88,  // lực đèn chính
  keyPow:    1.30,  // mũ nửa-Lambert: cao -> chuyển sáng tối mềm như da
  filAmt:    0.30,
  rimPow:    1.85,  // mũ đèn viền: cao -> viền mảnh và gắt
  rimEdge:   1.55,  // chỉ những mặt QUAY NGANG mới bắt viền
  rimSig:     2.6,  // làm mượt đường viền cho nó là ÁNH SÁNG chứ không phải nét vẽ
  rimAmt:    0.66,  // lực viền cộng vào tông
  ambient:   0.18,

  shadeAmt:  0.96,  // độ mạnh của việc thắp lại đèn. 0 = giữ nguyên ảnh gốc
  shadeLo:   0.06,  // cắt đuôi khi chuẩn hoá bản đồ sáng
  shadeHi:   0.97,

  /* --- điều phối bố cục --- */
  spotR0:    0.55,  // trong bán kính này quanh khuôn mặt thì giữ nguyên độ sáng
  spotR1:    1.85,  // ra tới đây thì tối còn spotLo
  spotLo:    0.60,  // càng nhỏ càng "sân khấu": chỉ khuôn mặt sáng, còn lại chìm
  sinkY0:    0.60,  // từ độ cao này xuống đáy khung thì chìm dần (vai, ngực)
  sinkAmt:   0.40,

  /* Chuẩn hoá lại độ sáng CUỐI CÙNG. Thắp đèn xong thì tổng sáng tụt hẳn (đèn chỉ
     chiếu một phía, lại còn chìm rìa chìm vai), nên phải kéo lên cho vùng sáng nhất
     chạm trần. Nhờ bước này, vặn các núm đèn ở trên KHÔNG làm cả bức tối đi hay
     cháy lên — chỉ đổi cách phân bố sáng tối, đúng nghĩa "điều phối". */
  autoPct:   0.996,  // để 0,985 là ~1,5% điểm bị cháy trắng — đúng mấy mảng trắng
  autoMax:    4.0,   // nham nhở như sáp chảy trên trán, sống mũi, cằm

  /* Đường cong cuối: bẻ quanh một điểm tựa THẤP hơn giữa, nên vùng sáng nở ra rực
     rỡ còn vùng tối chìm hẳn. Đây là cái làm bức ảnh "có chủ ý" thay vì đúng sáng. */
  punchC:    1.26,  // độ dốc
  punchP:    0.40,  // điểm tựa: thấp -> nhiều sáng; cao -> nhiều tối
  outGamma:  0.90,  // <1 = nâng vùng trung gian lên cho da sáng mịn

  /* VAI SÁNG. Trên ngưỡng này thì nén lại, nên cả một vùng rộng KHÔNG cùng chạm
     trần. Thiếu nó là trán và gò má cùng đạt mật độ tối đa, các hạt dính liền
     thành mảng trắng và nuốt luôn con mắt ngay bên dưới. Phần dôi ra để dành cho
     mấy chấm bắt sáng thật sự. */
  kneeAt:    0.82,
  kneeC:     0.45,

  /* --- bắt sáng (mắt, gọng kính, viền môi) --- */
  /* Chấm bắt sáng phải RẤT NHỎ và RẤT ÍT: chỉ con ngươi, vành kính, một vệt trên
     môi. Hạ ngưỡng xuống là cả trán, sống mũi, cằm cùng cháy thành mảng trắng nham
     nhở — trông như sáp chảy, mất sạch khối vừa dựng được. */
  specLo:    0.74,
  specHi:    0.97,
  specDet:   0.44,
  specAmt:   0.42,

  /* ĐỐM BẮT SÁNG TRONG CON NGƯƠI. Không cần biết mắt nằm đâu: cứ tìm chỗ nào SÁNG
     mà XUNG QUANH TỐI — trong tấm này đúng là hai đốm trong con ngươi, một vệt trên
     môi và vài chỗ ánh trên gọng kính. Thiếu nó thì đôi mắt chỉ là hai hốc tối,
     khuôn mặt không nhìn lại mình. */
  eyeSig:     6.0,  // bán kính "xung quanh"
  eyeLo:     0.26,  // điểm phải sáng hơn mức này
  eyeHi:     0.54,
  eyeDarkHi: 0.34,  // mà xung quanh phải tối hơn mức này
  eyeDarkLo: 0.14,
  eyeAmt:    0.85,
};

const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const norm3 = v => { const n = Math.hypot(v[0], v[1], v[2]); return [v[0]/n, v[1]/n, v[2]/n]; };

/* Soft light (công thức W3C). Giữ được chi tiết nhỏ vì nó là một đường cong áp lên
   từng điểm, không phải phép nhân thẳng. */
const Dsl = b => b <= 0.25 ? ((16 * b - 12) * b + 4) * b : Math.sqrt(b);
const softLight = (b, s) =>
  s < 0.5 ? b - (1 - 2 * s) * b * (1 - b) : b + (2 * s - 1) * (Dsl(b) - b);

function pctl(field, mask, W, H, p, step){
  const s = [];
  for (let i = 0; i < W * H; i += (step || 5)) if (mask[i]) s.push(field[i]);
  s.sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, (s.length * p) | 0)] : 0;
}

/**
 * ctx = { W, H, mask, tone, hair, det, dist, blur }
 * trả về { tone2, rim, depth, nz, face }
 */
export function relight(ctx, K){
  const { W, H, mask, tone, hair, det, dist, blur, L } = ctx;
  const NP = W * H;
  K = Object.assign({}, LIGHT, K || {});

  /* ---- 1. bản đồ độ cao ---- */
  const toneS = blur(tone, K.featSig);

  /* Khối lấy từ chính MẶT NẠ đem làm nhoè, KHÔNG lấy từ trường khoảng cách.
     Trường khoảng cách có gân dọc trục giữa (medial axis): pháp tuyến nhảy dọc theo
     mấy cái gân đó, ra một chùm tia xoè quanh đầu như bánh xe — nhìn thấy ngay.
     Mặt nạ làm nhoè thì mượt tuyệt đối: 0 ở ngoài, 0,5 đúng mép, 1 sâu bên trong. */
  const mf = new Float32Array(NP);
  for (let i = 0; i < NP; i++) mf[i] = mask[i] ? 1 : 0;
  const mEdge = blur(mf, K.edgeSig);   // quay nhanh, sát rìa
  const mBody = blur(mf, K.bodySig);   // cong thoải, cả khối đầu

  const height = new Float32Array(NP);
  for (let i = 0; i < NP; i++){
    if (!mask[i]) continue;
    const feat = (toneS[i] - 0.5) * (1 - K.featHair * hair[i]);
    height[i] = K.domeAmt * (K.edgeMix * mEdge[i] + (1 - K.edgeMix) * mBody[i])
              + K.featAmt * feat;
  }

  /* ---- 2. pháp tuyến ---- */
  const nxF = new Float32Array(NP), nyF = new Float32Array(NP), nzF = new Float32Array(NP);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++){
    const i = y * W + x;
    const hx = (height[i + 1] - height[i - 1]) * 0.5;
    const hy = (height[i + W] - height[i - W]) * 0.5;
    const vx = -hx * K.nGain, vy = -hy * K.nGain, vz = 1;
    const n = Math.hypot(vx, vy, vz);
    nxF[i] = vx / n; nyF[i] = vy / n; nzF[i] = vz / n;
  }

  /* ---- 3. chiếu ba ngọn đèn ---- */
  const Lk = norm3(K.keyDir), Lr = norm3(K.rimDir), Lf = norm3(K.filDir);
  const L2 = norm3(K.rim2Dir);
  const shade = new Float32Array(NP), rim = new Float32Array(NP);
  for (let i = 0; i < NP; i++){
    if (!mask[i]) continue;
    const nx = nxF[i], ny = nyF[i], nz = nzF[i];
    /* nửa-Lambert: da người không tắt phụt ở đường phân giới sáng tối mà chuyển mềm */
    const key = Math.pow(clamp01((nx*Lk[0] + ny*Lk[1] + nz*Lk[2]) * 0.5 + 0.5), K.keyPow);
    const fil = clamp01((nx*Lf[0] + ny*Lf[1] + nz*Lf[2]) * 0.5 + 0.5);
    /* Hai ngọn viền, không phải một. Một ngọn thì bờ phải rực còn bờ trái mất hút,
       bố cục lệch hẳn sang một bên; ngọn phụ yếu hơn nhiều chỉ để đỡ lấy bờ kia. */
    const edge = Math.pow(1 - clamp01(nz), K.rimEdge);
    const rr  = (Math.pow(clamp01(nx*Lr[0] + ny*Lr[1] + nz*Lr[2]), K.rimPow)
              + K.rim2Amt * Math.pow(clamp01(nx*L2[0] + ny*L2[1] + nz*L2[2]), K.rimPow)) * edge;
    shade[i] = K.ambient + K.keyAmt * key + K.filAmt * fil;
    rim[i] = rr;
  }
  /* viền phải là một dải ÁNH SÁNG mềm, không phải một nét bút */
  const rimB = blur(rim, K.rimSig);
  for (let i = 0; i < NP; i++) rim[i] = mask[i] ? rimB[i] : 0;

  /* ---- 4. chuẩn hoá bản đồ sáng về quanh 0,5 rồi ghép bằng soft light ---- */
  const sLo = pctl(shade, mask, W, H, K.shadeLo);
  const sHi = pctl(shade, mask, W, H, K.shadeHi);
  const rHi = Math.max(1e-4, pctl(rim, mask, W, H, 0.995));

  /* tâm khuôn mặt = trọng tâm phần DA SÁNG, để bố cục xoay quanh đúng chỗ */
  let fx = 0, fy = 0, fw = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const i = y * W + x;
    if (!mask[i]) continue;
    const w = clamp01(tone[i] - 0.45) * (1 - hair[i]);
    fx += x * w; fy += y * w; fw += w;
  }
  fx = fw > 0 ? fx / fw : W * 0.5;
  fy = fw > 0 ? fy / fw : H * 0.5;
  const faceR = Math.max(60, Math.min(W, H) * 0.30);

  const tone2 = new Float32Array(NP), depth = new Float32Array(NP);
  const shadeN = new Float32Array(NP);
  for (let i = 0; i < NP; i++){
    if (!mask[i]) continue;
    const x = i % W, y = (i / W) | 0;

    const sn = clamp01((shade[i] - sLo) / Math.max(1e-4, sHi - sLo));
    shadeN[i] = sn;
    const s = 0.5 + (sn - 0.5) * K.shadeAmt;
    let t = clamp01(softLight(tone[i], s));

    /* đèn viền cộng vào, không nhân — nó là ÁNH SÁNG THÊM, không phải bộ lọc */
    const rn = clamp01(rim[i] / rHi);
    t = clamp01(t + K.rimAmt * rn);

    /* điều phối bố cục: ra xa khuôn mặt thì chìm, xuống dưới vai thì chìm thêm.
       Đây là chỗ biến "ảnh có nền đen" thành "chân dung dưới một ngọn đèn". */
    const r = Math.hypot(x - fx, y - fy) / faceR;
    const spot = K.spotLo + (1 - K.spotLo) * (1 - smooth(K.spotR0, K.spotR1, r));
    const sink = 1 - K.sinkAmt * smooth(K.sinkY0, 1.0, y / H);
    t = clamp01(t * spot * sink);

    tone2[i] = t;
    rim[i] = rn;
    /* độ sâu ghi vào file để trang dựng được KHỐI thật: đầu nhô ra, rìa lùi lại */
    depth[i] = clamp01(0.40 + height[i] * 0.42);
  }

  /* ---- 5. kéo lại độ sáng rồi mới điểm những chỗ BẮT SÁNG ----
     Phải theo đúng thứ tự này: chấm bắt sáng dựa trên ngưỡng độ sáng, mà độ sáng
     thì vừa bị các ngọn đèn kéo tụt xuống — chấm trước khi kéo lại là không chỗ nào
     đủ ngưỡng, mắt thành hai hốc đen. */
  const g = Math.min(K.autoMax, 1 / Math.max(1e-3, pctl(tone2, mask, W, H, K.autoPct)));
  /* Dò trên ĐỘ SÁNG GỐC, không dò trên tông đã xử lý: đốm bắt sáng chỉ rộng 2-3 điểm
     ảnh, qua bộ lọc làm mịn và bước kéo tương phản là bị san phẳng mất. */
  const src = L || tone;
  const around = blur(src, K.eyeSig);
  const eye = new Float32Array(NP);
  for (let i = 0; i < NP; i++){
    if (!mask[i]) continue;
    eye[i] = smooth(K.eyeLo, K.eyeHi, src[i]) * smooth(K.eyeDarkHi, K.eyeDarkLo, around[i]);
  }
  for (let i = 0; i < NP; i++){
    if (!mask[i]) continue;
    let t = clamp01(tone2[i] * g);
    t = Math.pow(clamp01(K.punchP + (t - K.punchP) * K.punchC), K.outGamma);
    if (t > K.kneeAt) t = K.kneeAt + (t - K.kneeAt) * K.kneeC;
    const sp = smooth(K.specLo, K.specHi, t) * smooth(K.specDet, K.specDet + 0.34, det[i]);
    tone2[i] = clamp01(t + K.specAmt * sp + K.eyeAmt * eye[i]);
  }

  return { tone2, rim, depth, nz: nzF, shade: shadeN, height, eye,
           face: { x: fx, y: fy, r: faceR } };
}
