# VyA — Chòm sao Thảo Vy · Sổ tiến độ

> Đọc file này ĐẦU TIÊN mỗi lần quay lại làm tiếp. Ghi ngắn, mục mới nhất ở trên.

## Tóm tắt nhanh

- **Đang ở đâu**: bản v1 CHẠY ĐƯỢC, đã vá phần meta nên điện thoại giờ hiển thị đúng. Toàn bộ trang nằm trong 1 file HTML duy nhất, đã có git.
- **Tiếp theo (ưu tiên)**: 1) **test thật trên điện thoại** (bản vá viewport chưa được kiểm trên máy thật) · 2) cất ảnh/nhạc gốc + viết `build.js` · 3) gỡ phụ thuộc mạng (three.js, Google Fonts) · 4) chòm sao kỷ niệm — xem `IDEAS.md` §3.1.
- **Rủi ro lớn nhất**: KHÔNG còn ảnh gốc / nhạc gốc / script sinh bản đồ sao → hiện tại không tái tạo lại `index.html` được nếu muốn đổi ảnh.

## Cấu trúc thư mục

| File | Vai trò |
|---|---|
| `_template.html` | **BẢN GỐC ĐỂ SỬA** — còn 4 chỗ trống: `__PORTRAIT_B64__`, `__AUDIO_B64__`, `__STARMAP_B64__`, `__ASPECT__` |
| `index.html` | Bản đã nhúng asset (6,7 MB) — **FILE KẾT QUẢ, không sửa tay**, luôn sửa `_template.html` rồi build lại |
| `PROGRESS.md` | File này |
| `IDEAS.md` | Kế hoạch / ý tưởng làm tiếp |
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
