# VyA — Chòm sao Thảo Vy · Sổ tiến độ

> Đọc file này ĐẦU TIÊN mỗi lần quay lại làm tiếp. Ghi ngắn, mục mới nhất ở trên.

## Tóm tắt nhanh

- **Đang ở đâu**: v4 — chân dung được **thắp đèn lại như trong phòng chụp** (dựng khối, đèn chính + 2 đèn viền, điều phối sáng tối), rải hạt thành stipple thật. Có `tools/` sinh bản đồ sao, có git, có `build.js`.
- **Bản trên mạng đang là bản CŨ**: anh dặn để test ở máy trước, chưa đăng v3 lên link.
- **Trang đã lên mạng**: `https://claude.ai/artifact/2LB1Y88rNRY7dFS334jJKj` (ai có link cũng mở được). Sửa xong thì `node build.js` rồi đăng đè `index.html` lên ĐÚNG địa chỉ đó — link không đổi.
- **Tiếp theo (ưu tiên)**: 1) **test thật trên điện thoại** · 2) bật đồng bộ Firebase theo `SYNC.md` (cần anh bấm vài cái trong tài khoản Google) · 3) gỡ phụ thuộc mạng (three.js, Google Fonts).
- **Rủi ro lớn nhất**: trang hiện **chết hoàn toàn nếu không có Internet** — `import * as THREE from 'three'` lấy từ CDN, import hỏng là cả file JS không chạy, mất luôn cả chương lời mời.

## Cấu trúc thư mục

| File | Vai trò |
|---|---|
| `_template.html` | **BẢN GỐC ĐỂ SỬA** — còn 4 chỗ trống: `__PORTRAIT_B64__`, `__AUDIO_B64__`, `__STARMAP_B64__`, `__ASPECT__` |
| `index.html` | Bản đã nhúng asset (6,7 MB) — **FILE KẾT QUẢ, không sửa tay**, luôn sửa `_template.html` rồi build lại |
| `PROGRESS.md` | File này |
| `IDEAS.md` | Kế hoạch / ý tưởng làm tiếp |
| `SYNC.md` | Hướng dẫn bật đồng bộ Firebase (chưa làm) |
| `build.js` | `node build.js` — ghép template + assets ra `index.html` |
| `tools/` | **Bộ sinh chân dung sao** — `relight.mjs` (ÁNH SÁNG) · `make-starmap.mjs` (HẠT) · `decode.mjs` (tách người khỏi nền báo/cờ) + 8 script soi bằng mắt. **Đọc `tools/README.md` trước khi chỉnh** |
| `assets/` | Ảnh, nhạc, bản đồ sao gốc — nguồn của `build.js` |
| `.gitattributes` | `* -text` — cấm git đổi byte file base64 6,7 MB |

## Đã làm được gì (v1)

**Bầu trời sao (three.js + WebGL, shader tự viết)**
- ~113.000 hạt sao dựng lại khuôn mặt bằng **mật độ sao**, không phải dán ảnh (mobile hạ còn 62.000).
- 4 hình thái morph mượt vào nhau: `Chân dung` · `Thiên hà` (lõi cầu + 3 nhánh xoắn) · `Trái tim` (khối 3D thật, dò tia nhị phân vào mặt cong, 3 lớp vỏ/ruột/bụi) · `Ngày ấy` (chữ `17 · 09 · 2026`).
- Nét nối chòm sao (lưới băm CSR), trường sao nền xa, bloom (`UnrealBloomPass`).
- Tương tác: rê tay hút sao + vệt đuôi 3 mẫu, bấm tạo sóng xung kích, nghiêng máy (deviceorientation), sao "thở" theo nhạc qua `AnalyserNode`.
- Mở trang: cả trời tụ từ xa lại thành khuôn mặt (`uReveal`).

**Nội dung trang**
- 3 chương cuộn dọc: Hero (tên + bộ đếm ngày sống từ 17.09.2026) → `Đêm đầu tiên` (Đồi Thiên Văn) → `Lá thư` + nút "Dành cho em".
- Cuộn tới chương nào thì bầu sao tự đổi hình thái đó (IntersectionObserver dải giữa 10%, tránh đổi 2 lần 1 cú cuộn).
- HUD góc (toạ độ, số sao, đồng hồ), vignette + scrim tự tối lại lúc đọc chữ.

**Màn cao trào (`FX`, canvas 2D riêng)**
- Kịch bản có nhịp: build 1.0s → surge 2.15s → burst 3.0s → chữ hiện 4.45s → lắng, tổng ~14.6s; tự dọn rAF/listener khi hết.
- Âm thanh chuông/riser/shimmer tổng hợp bằng oscillator (không dùng file), nhạc nền nhúng sẵn, có gợi ý "chạm để mở nhạc" khi trình duyệt chặn autoplay.

**Chương 4 · Lời mời hẹn buổi tiếp theo** (v2)
- Hỏi “Buổi tiếp theo, em nhé?” với 2 nút. Nút **TỪ CHỐI** rê tới gần 110px là trượt đi chỗ khác (thấy rõ đường chạy)
  (chọn trong 28 điểm ngẫu nhiên lấy chỗ xa tay nhất), mỗi lần bung ra chữ *lewlew*, nhỏ dần;
  chạy đủ 8 lần thì biến mất hẳn. Chặn ở cả `pointerdown` lẫn `click` nên **không cách nào bấm được**.
- Bấm **ĐỒNG Ý** → hiện ô chọn ngày (điền sẵn thứ 7 tới) + giờ (19:00) + ô lời nhắn không bắt buộc.
  Chốt xong: bầu sao morph sang Trái tim + sóng xung kích, hiện thẻ hẹn có đếm ngược.
- Chỗ xem lại: nút **Hẹn tiếp theo** ở thanh điều khiển + một dòng trên HUD góc phải.
- Lưu 3 tầng, cái nào mới hơn (`savedAt`) thì thắng: link chia sẻ `#hen=` · `localStorage` · máy chủ.
  Máy chủ CHƯA bật (`SYNC_URL` để trống) — xem `SYNC.md`. Mọi bước mạng đều fail-soft.

**Đã lo sẵn**
- `prefers-reduced-motion`, responsive khổ dọc (860px/620px), `bail()` rơi về ảnh tĩnh nếu WebGL lỗi, núm chỉnh sáng `window.vyaTune(gain, str, thr, size)` trong console.

## Còn thiếu / nợ kỹ thuật

1. ~~Thiếu doctype/charset/viewport~~ — **đã sửa 19.09.2026**.
2. **Không có script build** — 4 placeholder trong `_template.html` hiện được thay bằng tay. Cần `build.js` + giữ lại `assets/` (ảnh gốc, mp3, script sinh starmap 6 byte/hạt: x,y int16 · độ sáng · độ xám).
3. **Phụ thuộc Internet**: `three@0.160.0` từ jsdelivr + Google Fonts. Mất mạng là trang chỉ còn ảnh tĩnh.
4. ~~Chưa có git~~ — **đã `git init` 19.09.2026**, 2 commit.
5. `index.html` 6,7 MB (nhạc chiếm 5,6 MB) — mở bằng 4G khá lâu, chưa có màn chờ báo % tải.
6. **Chưa test thật trên máy điện thoại của Vy** — việc cần làm ngay sau bản vá viewport.

## Nhật ký

### 2026-09-19 (chiều) — Thắp đèn lại cho chân dung

Anh muốn nó "đẹp hơn cả ảnh thật, kiểu nghệ thuật điều phối sáng tối". Bản sáng nay mới
chỉ *chép lại* sáng tối của tấm ảnh chụp — mà tấm đó là ảnh chụp nhanh: sáng đều, bẹt,
không có ý đồ. Nên lần này **bỏ hẳn ánh sáng cũ và thắp lại từ đầu**.

**Thêm `tools/relight.mjs`** — tầng ánh sáng, tách hẳn khỏi tầng rải hạt:
- ước lượng KHỐI của khuôn mặt (không cần biết nó là mặt): lấy chính mặt nạ đem làm nhoè
  hai mức — một dải hẹp sát rìa cho mặt quay ngang, một độ cong thoải cho cả cái đầu;
- chiếu ba ngọn đèn lên khối đó: **đèn chính** trên-trái-trước, **đèn viền** trên-phải-sau
  (cộng một ngọn phụ yếu bên trái cho bố cục khỏi lệch), **đèn phụ** dưới-trước rất nhẹ;
- ghép vào ảnh bằng **soft light**, không nhân thẳng — giữ nguyên nét mắt/kính/môi;
- rồi mới tới bố cục: đèn sân khấu quanh mặt, chìm vai, đường cong nhấn, vai sáng,
  chấm bắt sáng, và **đốm sáng trong con ngươi** (dò bằng "chỗ sáng mà xung quanh tối").

**Đường viền sáng ôm quanh tóc là thứ ảnh gốc KHÔNG có**, và là thứ làm bức ảnh sang lên
rõ nhất. Nó có lớp hạt riêng.

**Bốn bẫy thật, ghi lại kẻo quên**:
1. **Cỡ hạt so với khoảng cách giữa các hạt.** Đo ra gò má có **3,25 hạt/điểm ảnh** —
   khoảng cách còn nhỏ hơn nửa điểm ảnh. Không đời nào thấy được "điểm", vùng sáng dính
   liền thành mảng trắng và nuốt luôn con mắt. Cứ tưởng thuật toán mất mắt, hoá ra chỉ là
   hạt quá khổ. Viết `tools/raster.mjs` để đo thẳng thay vì đoán.
2. **`uPGain` không phải muốn to bao nhiêu cũng được.** Để 4,6 thì mỗi hạt một mình đã
   trắng bệt → thông tin tông vốn nằm ở MẬT ĐỘ bị xoá sạch, chỗ nào có hạt là chỗ đó
   trắng. Phải để từng hạt mờ và để chúng cộng dồn lên (2,05).
3. **Lớp NÉT phải có luật độ sáng riêng.** Con ngươi, hàng mi, gọng kính vốn tối mà lại
   rất nhiều nét: cho chúng hạt sáng đều như da là mắt sáng ngang trán.
4. **Ngưỡng chọn sao nối chòm bị số cứng.** Đổi luật độ sáng một cái là `MIN_TONE = 0.42`
   hết lọc được gì, cả khuôn mặt biến thành lưới trắng lúc bấm chuột. Nay tự suy theo
   phân vị.

Sửa thêm `decode.mjs`: nếp gấp lá cờ đổ bóng tối y như tóc (L≈0,15) nhưng vẫn đỏ gắt, nên
cả dải cờ chạy dọc mép trái đang bị hút vào mặt nạ. Thêm điều kiện trung tính là hết.

**Kết quả**: 118.168 hạt (bản sáng nay 133.807, bản đầu 113.180) — **nhẹ hơn cả hai**,
`index.html` 6,76 MB. Byte thứ 5 của mỗi hạt đổi nghĩa từ "độ xám gốc" sang **ĐỘ SÂU**,
nên khi máy quay trôi nhẹ thì khuôn mặt có khối thật chứ không phải tấm bìa dán hạt.
Đã soi lại 4 hình thái, khổ điện thoại, rê tay, nhấp, màn "DÀNH CHO EM", các chương chữ:
không lỗi JS.

**Vẫn CHƯA đăng lên link** — anh dặn để test ở máy trước.

### 2026-09-19 — Dựng lại chân dung sao theo ảnh mẫu (stipple sci-fi)

**Vấn đề**: bản v1 rải sao **mật độ gần như ĐỀU** trên một mảng loang, ảnh chỉ hiện ra nhờ
độ sáng từng hạt — đúng kiểu "ảnh bị biến thành chấm nhiễu". Script sinh ra `starmap.bin`
thì đã mất từ lâu, nên phải viết lại từ đầu.

**Bộ công cụ mới `tools/`** (chi tiết + bảng số đo trong `tools/README.md`):
- `decode.mjs` — tách người khỏi nền. Ảnh gốc chụp trước tường dán **báo** và một lá **cờ đỏ**;
  mặt nạ cũ (dựng từ chính bản đồ sao v1) ăn cả tờ báo nên chữ báo vẫn hiện mờ trên đầu.
  Nay tách bằng ba dấu hiệu tách bạch: rất tối (tóc/áo) · ngả ấm vừa (da) · còn lại là nền.
- `make-starmap.mjs` — rải sao. Mật độ **theo tông ảnh**, rải bằng **khuếch tán sai số**
  (Floyd–Steinberg) trên lưới mịn gấp 2 nên khoảng cách giữa các hạt rất đều. Bốn lớp hạt:
  da · tóc (chạy theo **hướng sợi** lấy từ ten-xơ cấu trúc, chỉ vài sợi bắt sáng) ·
  nét (mắt/kính/môi, hạt nhỏ và đanh nhất) · bụi rìa (để bóng người không có viền cứng).
- `preview.mjs` — xem thử `starmap.bin` thành ảnh, không phải mở cả trang.

**Bẫy thật đã gặp, ghi lại kẻo quên**:
1. **Không gian màu** — three.js mặc định mã hoá lại sang sRGB lúc xuất, kéo nền đen
   `#04060c` lên thành `(32,40,57)`: cả bầu trời phủ một lớp xám xanh, mặt chỉ sáng gấp 1,7
   lần nền nên nhìn thế nào cũng bệt. Đặt `outputColorSpace = LinearSRGBColorSpace` là nền
   về đen thật, tương phản bật hẳn lên. **Đây là thay đổi lớn nhất của cả bản này.**
2. **Khuếch tán sai số chỉ đẻ được tối đa 1 hạt/ô** — chạy trên lưới ảnh gốc thì cả khuôn
   mặt chạm trần ~1 hạt/điểm ảnh, muốn dày hơn cũng không dày được, trán cứ bệt thành mảng
   trắng. Phải chạy trên lưới mịn gấp 2.
3. **Nổi nét (unsharp) tay nặng sinh VIỀN SÁNG quanh mặt** — đúng cái kiểu tô đường viền
   phải tránh. Hạ `sharpAmt` 0,90 → 0,40.
4. **Các hình thái khác bị vạ lây**: chân dung sáng lên thì trái tim và dòng chữ cháy thành
   mảng trắng. Phải cho cỡ hạt và độ sáng của **thiên hà / trái tim / dòng chữ** co lại, và
   cho **ngưỡng bloom chạy theo hình thái** (chân dung ngưỡng thấp để trán toả sáng, hình
   thái khác ngưỡng cao để không nhoè).
5. **Nền tối chồng lên (`#scrim`) thành vệt bẩn** — nền đã đen thật thì không cần phủ nặng
   như trước nữa; hạ từ `.72` xuống `.40`.
6. **Chạm/rê tay làm loé trắng cả mặt** — chân dung giờ sáng gấp mấy lần nên phải nhẹ tay
   hẳn cú bùng sáng, riêng cho hình thái chân dung (`hot *= mix(1.0, 0.25, w.x)`).

**Kết quả**: 133.807 hạt (v1: 113.180), `index.html` 6,91 MB (v1: 6,41 MB), vẫn **60 fps**.
Định dạng `starmap.bin` đổi từ 6 byte/hạt sang **8 byte/hạt** (thêm cỡ hạt + lớp) — `build.js`
điền `__STRIDE__` từ `assets/meta.json` nên không phải sửa tay.
Đã soi lại cả 4 hình thái, khổ điện thoại, màn cao trào, nét nối chòm sao: không lỗi JS.
Bộ 23 kiểm tra của chương lời mời vẫn đạt **23/23**.

**Còn có thể chỉnh thêm** (đều là núm, không phải viết lại): `contrast`/`gamma` cho độ bệt của
trán · `strandDim`/`strandShine` cho tóc đậm nhạt · `detailAmt` cho độ rõ của mắt và gọng kính ·
`fadeBand`/`dustBand` cho độ tan của rìa · `vyaTune(gain, bloom, threshold, size)` chỉnh sống
ngay trong console.

### 2026-09-19 — Sửa chương lời mời theo góp ý

- **"Đổi lịch" giờ quay về câu hỏi** thay vì mở thẳng ô chọn ngày — ai muốn xem lại trò nút
  chạy trốn thì cứ bấm. Lời hẹn cũ KHÔNG mất: thẻ vẫn nằm ngay dưới câu hỏi, bỏ dở giữa chừng
  thì mọi thứ y nguyên; bấm Đồng ý thì ô chọn ngày vẫn điền sẵn lịch cũ. Lời mở đầu đổi sang
  câu dành cho lần chơi lại, chốt xong tự trả về câu gốc.
  Phần kéo nút TỪ CHỐI về chỗ cũ gom thành `restoreAsk()` dùng chung với `resetHen()` —
  hai chỗ mà lệch nhau một dòng là có chỗ nút không chịu quay về.

- Bỏ chữ *(để trống cũng được)* ở ô lời nhắn.
- **Đăng bản mới lên link** (bản 13). Link đã có từ trước, nên chỉ đăng đè, không tạo link mới.

- **Hai nút nổi hẳn lên** (chỉ trong `#askRow`, nút khác cả trang giữ nguyên): to hơn (13px),
  `Đồng ý` có nền chuyển sắc hồng + quầng sáng + nhịp thở nhẹ; `Từ chối` nền đặc + viền xanh sáng
  để bay qua chỗ sao sáng vẫn đọc được mặt chữ.
- **Chạy chậm lại cho nhìn được**: trượt `.46s` (trước `.26s`), và mỗi cú chỉ đi một quãng vừa phải
  (≤ 560px, hoặc 42% đường chéo màn hình) chứ không bắn thẳng sang góc đối diện — đo được 25 vị trí
  trung gian qua 51 khung hình. Nhịp nghỉ nâng lên 430ms cho khớp, để cú trước trượt xong hẳn.
- **Cho nó ra dáng chạy trốn**: tay còn cách ~240px là nó đã **đứng run lẩy bẩy** (`.shy`), tới
  110px mới bỏ chạy — cú phóng có nhún lấy đà rồi bật lên (`.dash`, squash & stretch), nghiêng
  người về hướng chạy, chạy càng nhiều càng co rúm lại. Chữ *lewlew* cũng nảy lò cò hơn.
  Hai biến `--rot`/`--sc` tách riêng vì animation và transform đặt tay sẽ đá nhau.

- **Xoá để thử lại**: mở `index.html#reset` (hoặc gõ `resetHen()` trong Console) là trang quên lời
  hẹn đã lưu, xoá luôn trên máy chủ nếu đã bật, và hỏi lại từ đầu — nút TỪ CHỐI về đúng chỗ cũ.
  Cố ý KHÔNG làm thành nút trên trang, để đó có ngày Vy bấm nhầm mất lời hẹn thật.

- **Nền khó đọc**: chữ chương này nằm đúng chỗ hình trái tim sáng nhất. Lót một mảng tối toả dần
  (`#act-date .wrap::before`, `z-index:-1`, không mép cứng) — đọc rõ mà vẫn thấy sao phía sau.
- **Phải NHÌN THẤY nút chạy**: trước đây nút đổi chỗ tức thì (cố ý, sợ trượt mượt thì bị bắt) nên
  mắt chỉ thấy nó "biến mất rồi hiện lại". Nay cho trượt `.26s`, bù lại: bán kính kích hoạt tăng
  90 → 110px, và hai cú chạy cách nhau ít nhất 0,3s (`FLEE_GAP`) — nhịp nghỉ đặt trong `flee()`,
  cú bị hoãn sẽ hẹn lại rồi đo lại xem tay còn kề bên không, **không** đặt ở `pointermove` (đặt ở
  đó chính là con bug đã sửa hôm trước). Trong lúc đang trượt thì đo khung thật từng lần, không
  dùng khung nhớ sẵn.
- **Đổi chữ nút**: `Có`/`Không` → **`Đồng ý`/`Từ chối`** (cả 3 file tài liệu đã sửa theo).
- Lái Chrome thật kiểm 18 điểm, đạt cả 18 — trong đó có điểm đếm **15 vị trí trung gian** qua 40
  khung hình để chứng minh nó trượt chứ không nhảy cóc.

### 2026-09-19 — Chương lời mời + build.js
- **`build.js`**: tách ngược base64 trong `index.html` ra `assets/` (ảnh 478x760, nhạc 4 MB,
  bản đồ sao 113.180 ngôi). Kiểm: build lại ra file **giống hệt từng byte**. Từ giờ chỉ sửa
  `_template.html` rồi `node build.js`.
  *Lưu ý*: `assets/portrait.jpg` chỉ là **ảnh dự phòng** (tỉ lệ 0,629), còn bản đồ sao dựng từ
  một khung cắt khác (tỉ lệ 0,781) — ảnh gốc của bản đồ sao vẫn chưa tìm lại được.
- Thêm chương 4 **Lời mời** (xem mục trên). Đã lái Chrome thật kiểm 28 điểm, đạt cả 28,
  cả khổ 1280px lẫn 420px, không lỗi console.
- **Bug thật đã sửa trong lúc làm**: hãm sự kiện `pointermove` theo thời gian (60ms) khiến một
  nhát rê chuột nhanh bị nuốt mất sự kiện CUỐI — con trỏ đậu ngay trên nút TỪ CHỐI mà nút đứng im,
  phải rung chuột mới chạy. Thay bằng nhớ sẵn khung của nút, chỉ đo lại khi nó có thể đã dịch.
- **Hoãn**: “Chòm sao kỷ niệm” — mới đi chơi một buổi, chưa đủ kỷ niệm để rải sao. Giữ nguyên ý
  tưởng trong `IDEAS.md` §3.1, làm sau.

### 2026-09-19 — Vá meta cho điện thoại + dựng git
- `git init`, 2 commit: `v1` (bản gốc) → bản vá. Kèm `.gitattributes` `* -text` để git không đụng byte file base64.
- Thêm `<!doctype html>` · `<html lang="vi">` · `<meta charset>` · `<meta name="viewport" ...viewport-fit=cover>` · `theme-color`.
  Trước đó thiếu `viewport` nên điện thoại dựng trang ở khổ giả 980px: 2 media query 620px/860px **không bao giờ chạy**, và
  `isNarrow()` trả `false` khiến điện thoại gánh đủ 113.000 hạt thay vì 62.000.
- Thêm `env(safe-area-inset-*)` cho HUD hai góc trên, thanh điều khiển và gợi ý mở nhạc (tai thỏ / thanh home).
- Sửa **cả** `_template.html` lẫn `index.html`, đã kiểm 2 file vẫn khớp nhau và 3 khối base64 nguyên vẹn.
- **Chưa test trên máy thật.**

### 2026-09-19 — Lập sổ tiến độ
Đọc lại toàn bộ code v1, viết `PROGRESS.md` + `IDEAS.md`.

### ~2026-09-17/18 — v1 hoàn chỉnh
Dựng xong bầu sao 4 hình thái, 3 chương, màn cao trào, nhạc. Đã build ra `index.html`.
