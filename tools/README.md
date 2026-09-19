# tools/ — bộ sinh bản đồ sao chân dung

Khuôn mặt trên trang KHÔNG phải ảnh dán lên. Nó là ~134.000 hạt sao, và ảnh hiện ra
bằng **mật độ** hạt. Toàn bộ chất lượng chân dung nằm ở `assets/starmap.bin` — ba script
trong thư mục này sinh ra nó.

## Chạy

```bash
node tools/decode.mjs        # chỉ khi đổi ảnh gốc (assets/portrait.jpg)
node tools/make-starmap.mjs  # mỗi lần chỉnh tham số
node tools/preview.mjs       # xem thử nhanh, không cần mở cả trang
node build.js                # ghép ra index.html
```

`decode.mjs` và `preview.mjs` mượn Chrome qua `playwright-core` của dự án KairuDocsQC
(`file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs`) vì Node không tự giải
mã được JPEG. Đổi máy thì sửa đúng một dòng `import` ở đầu mỗi file.

## decode.mjs — tách người khỏi nền

Ảnh gốc chụp trước bức tường dán **báo** và một lá **cờ đỏ**. Để nguyên thì nền sáng hơn
cả khuôn mặt, dựng sao lên là chữ báo nổi hơn em. Ba dấu hiệu tách rất bạch trong đúng
tấm này (số đo thật):

| Vùng | L | R−B | R−G |
|---|---|---|---|
| tóc, áo | 0,08–0,18 | 0,04 | |
| da | 0,54–0,74 | 0,21 | 0,14 |
| báo | 0,48–0,73 | ≤ 0,065 | |
| cờ đỏ | 0,36 | 0,45 | 0,34 |

→ lấy (rất tối **hoặc** ngả ấm vừa), dọn hạt lẻ, khép khe giữa sợi tóc, giữ **mảng liền
lớn nhất**, lấp lỗ. Kết quả cache ở `tools/cache/src.bin`.

## make-starmap.mjs — rải sao

Bảy bước, tất cả núm chỉnh nằm trong khối `T` ở đầu file:

1. **độ sáng cảm thụ** → **nổi nét cục bộ** (unsharp) → **kéo tương phản** theo phân vị
   *trong mặt nạ* (`sharpAmt`, `contrast`, `gamma`). Để `sharpAmt` cao là sinh **viền
   sáng** quanh mặt — đúng cái kiểu "tô đường viền" phải tránh.
2. **tách tóc**: làm nhoè lớn (`hairSig`) rồi cắt ngưỡng, nên mắt/kính/môi tuy tối nhưng
   quá nhỏ, không bị tính nhầm là tóc.
3. **lớp nét**: độ lớn gradient, chuẩn hoá theo phân vị 97%, **bỏ qua trong vùng tóc**.
4. **hướng sợi tóc**: ten-xơ cấu trúc, lấy véc-tơ riêng của trị riêng nhỏ. `flowSig` nhỏ
   → sợi xoăn tít như len rối; `flowCoh` gạt những chỗ rối không ra hướng nào.
5. **rìa tan**: biến đổi khoảng cách tới rìa mặt nạ (`fadeBand`, `fadeKeep`, `dustBand`).
6. **rải điểm bằng khuếch tán sai số** (Floyd–Steinberg, quét rắn bò, rung ngưỡng) trên
   lưới **mịn gấp 2** ảnh gốc. Đây là mấu chốt: khoảng cách giữa các hạt rất đều nên ra
   "vẽ bằng điểm" chứ không phải "rắc nhiễu". Chạy trên lưới ảnh thì mỗi ô chỉ đẻ được
   tối đa **một** hạt → cả khuôn mặt chạm trần ~1 hạt/điểm ảnh và trán cứ bệt trắng.
7. **bốn lớp hạt**: `0` da · `1` tóc (đi theo trường tiếp tuyến, chỉ vài sợi bắt sáng —
   `strandShine`) · `2` nét (mắt/kính/môi, hạt nhỏ và đanh nhất) · `3` bụi rìa.

Cuối cùng **xáo trộn toàn bộ**: máy yếu chỉ lấy 62.000 hạt ĐẦU TIÊN, cắt ở đâu cũng phải
còn đủ cả mặt, cả tóc, cả bụi.

Định dạng ra — **8 byte/hạt**: `x,y` (int16, −10000…10000) · độ sáng · độ xám gốc ·
cỡ hạt (×2,5/255) · lớp. Số hạt và `stride` được ghi lại vào `assets/meta.json`,
`build.js` đọc từ đó điền vào `__STRIDE__`.

## Soi các bước trung gian

```bash
DUMP=1 node tools/make-starmap.mjs
```
đổ `tone` / `hair` / `det` / `coh` / các trường mật độ ra `tools/cache/fields.json`.

## Chỉnh độ sáng trên trang

Ba thứ quyết định, nằm trong `_template.html`, và chỉnh sống được bằng console:

```js
vyaTune(gain, bloomStrength, bloomThreshold, size)
vyaTune(1.26, 0.28, 0.58, 3.40)   // giá trị đang dùng
```

Lưu ý: `renderer.outputColorSpace = LinearSRGBColorSpace`. Bỏ dòng đó ra là nền đen
`#04060c` bị kéo lên `(32,40,57)` — cả bầu trời phủ xám xanh và chân dung không bao giờ
bật khỏi nền được.
