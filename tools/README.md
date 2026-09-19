# tools/ — bộ sinh chân dung sao

Khuôn mặt trên trang KHÔNG phải ảnh dán lên. Nó là ~118.000 hạt sao, và ảnh hiện ra
bằng **mật độ** hạt. Toàn bộ chất lượng chân dung nằm ở `assets/starmap.bin`.

Hai file quyết định diện mạo:

| File | Việc |
|---|---|
| `relight.mjs` | **ÁNH SÁNG** — dựng khối rồi thắp đèn lại. Chỉnh sáng-tối, kịch tính, bố cục ở đây |
| `make-starmap.mjs` | **HẠT** — mật độ, cỡ hạt, sợi tóc, rìa tan. Chỉnh kết cấu ở đây |

## Chạy

```bash
node tools/decode.mjs        # chỉ khi đổi ảnh gốc (assets/portrait.jpg)
node tools/make-starmap.mjs  # mỗi lần chỉnh tham số
node build.js                # ghép ra index.html
```

## Soi bằng mắt — làm trước khi đoán

Chỉnh mò trên bức render hạt là mất buổi. Luôn xem trước ở tầng phù hợp:

```bash
node tools/fieldview.mjs                      # ảnh gốc + mặt nạ người (nền phủ hồng)
DUMP=1 node tools/make-starmap.mjs            # đổ các trường trung gian
node tools/sheet.mjs                          # dán 8 trường thành một tấm
node tools/big.mjs "5 TONE thap den"          # xem MỘT trường ở cỡ thật  ← hay dùng nhất
node tools/raster.mjs                         # starmap.bin -> ảnh xám (bỏ qua cỡ hạt)
node tools/preview.mjs out.png 900 0          # xem thử; 0 = TỰ PHƠI SÁNG
node tools/preview.mjs out.png 900 0 1.0 2.4  # phóng to 2,4x để soi kết cấu hạt
node tools/shot.mjs out.png                   # chụp trang thật
node tools/sweep.mjs "1.9,2.3" 0.28 0.58      # mở trang MỘT lần, chụp nhiều mức sáng
node tools/check.mjs                          # soát 4 hình thái + khổ điện thoại + lỗi JS
node tools/final.mjs                          # màn "DÀNH CHO EM" + các chương chữ
```

Các script mượn Chrome qua `playwright-core` của dự án KairuDocsQC
(`file:///C:/KairuDocsQC/node_modules/playwright-core/index.mjs`) vì Node không tự
giải mã được JPEG và không tự vẽ PNG. Đổi máy thì sửa một dòng `import` ở đầu mỗi file.

## decode.mjs — tách người khỏi nền

Ảnh gốc chụp trước bức tường dán **báo** và một lá **cờ đỏ**. Số đo thật:

| Vùng | L | R−B | R−G |
|---|---|---|---|
| tóc, áo | 0,08–0,18 | 0,04 | |
| da | 0,54–0,74 | 0,21 | 0,14 |
| báo | 0,48–0,73 | ≤ 0,065 | |
| cờ đỏ | 0,36 | 0,45 | 0,34 |

→ lấy (rất tối **và trung tính** — `darkRB`) **hoặc** (ngả ấm vừa), dọn hạt lẻ, khép khe
giữa sợi tóc, giữ **mảng liền lớn nhất**, lấp lỗ.

Bẫy: nếp gấp lá cờ đổ bóng cũng tối y như tóc. Thiếu điều kiện `darkRB` là cả dải cờ
chạy dọc mép trái bị hút vào mặt nạ.

## relight.mjs — thắp đèn lại

Ảnh gốc là ảnh chụp nhanh: sáng đều, bẹt, không có ý đồ. Bỏ ánh sáng cũ đi, dựng khối
rồi chiếu ba ngọn đèn lên:

- **đèn chính** trên-trái-trước — dựng sáng tối, tạo khối
- **đèn viền** trên-phải-sau (+ một ngọn phụ yếu bên trái) — đường sáng ôm quanh tóc và
  bờ vai. Ảnh gốc không có thứ này, và nó là thứ làm bức ảnh sang lên rõ nhất
- **đèn phụ** dưới-trước, rất nhẹ — để bên tối không chết thành mảng đen

Khối lấy từ **mặt nạ đem làm nhoè** (`edgeSig` hẹp + `bodySig` thoải), cộng một chút phù
điêu từ độ sáng đã làm mượt. Ghép vào ảnh bằng phép **soft light** chứ không nhân thẳng:
soft light chỉ uốn sáng-tối ở tầng lớn, chi tiết nhỏ (mắt, gọng kính, viền môi) giữ nguyên.

Rồi tới bố cục: **đèn sân khấu** quanh khuôn mặt (`spot*`), **chìm vai** (`sink*`),
**đường cong nhấn** (`punch*`), **vai sáng** (`knee*`), **chấm bắt sáng** (`spec*`) và
**đốm trong con ngươi** (`eye*`).

### Núm nguy hiểm nhất

| Núm | Quá tay thì sao |
|---|---|
| `featAmt` | mặt thành mặt nạ nhựa dập nổi, gọng kính phồng như kính lặn |
| `nGain` | sáng tối gắt, khối nham nhở |
| `specLo` (thấp) | trán / sống mũi / cằm cháy thành mảng trắng nham nhở như sáp chảy |
| `kneeAt` (thấp) | cả vùng rộng cùng chạm trần, hạt dính liền, nuốt luôn con mắt |
| `spotLo` (thấp) | quá "sân khấu", chỉ còn cái mặt trôi giữa màn đen |

`autoPct` chuẩn hoá độ sáng ở bước cuối, nên vặn mấy núm đèn ở trên **không** làm cả bức
tối đi hay cháy lên — chỉ đổi cách phân bố sáng tối. Đúng nghĩa "điều phối".

## make-starmap.mjs — rải hạt

1. **làm mịn giữ nét** (lọc song phương). Ảnh chụp điện thoại có nhiễu cảm biến; bước nổi
   nét ở dưới khuếch đại đúng thứ nhiễu đó lên rồi bước kéo tương phản khuếch đại tiếp →
   cả khuôn mặt lấm tấm như bị rắc cát. Lọc song phương mịn da mà vẫn giữ nét đanh.
2. **nổi nét cục bộ** + **kéo tương phản** theo phân vị *trong mặt nạ*.
3. **tách tóc** (làm nhoè lớn rồi cắt ngưỡng, nên mắt/kính/môi không bị tính nhầm là tóc).
4. **lớp nét** = độ lớn gradient. **hướng sợi tóc** = ten-xơ cấu trúc. **rìa tan** = biến
   đổi khoảng cách.
5. → `relight.mjs` ←
6. **rải điểm bằng khuếch tán sai số** (Floyd–Steinberg, quét rắn bò) trên lưới **mịn gấp
   2**. Chạy trên lưới ảnh thì mỗi ô chỉ đẻ được tối đa **một** hạt.
7. **sáu lớp hạt**: `0` da · `1` tóc (đi theo trường tiếp tuyến, chỉ vài sợi bắt sáng) ·
   `2` nét / đốm bắt sáng / đèn viền · `3` bụi rìa.

Cuối cùng **xáo trộn toàn bộ**: máy yếu chỉ lấy 62.000 hạt ĐẦU TIÊN, cắt ở đâu cũng phải
còn đủ cả mặt, cả tóc, cả bụi.

Định dạng — **8 byte/hạt**: `x,y` (int16) · độ sáng · **độ sâu** · cỡ hạt · lớp.
Số hạt và `stride` ghi vào `assets/meta.json`, `build.js` đọc từ đó điền `__STRIDE__`.

### Ba luật phải nhớ

**Cỡ hạt so với KHOẢNG CÁCH giữa các hạt** quyết định "vẽ bằng điểm" hay "một mảng sáng".
Có lúc gò má lên tới **3,25 hạt/điểm ảnh** — khoảng cách còn nhỏ hơn nửa điểm ảnh, không
đời nào thấy được "điểm", và vùng sáng dính liền nuốt luôn con mắt. Nhiều hạt NHỎ luôn
đẹp hơn ít hạt to. Đo bằng `tools/raster.mjs` khi nghi ngờ.

**Hạt da gần như bằng nhau, tông do mật độ.** Cho độ sáng từng hạt chạy theo tông NỮA là
tính hai lần → vùng giữa vừa thưa vừa mờ, chồng lên nhau ngẫu nhiên, ra đúng cái cảm giác
"ảnh bị rắc nhiễu" phải tránh. `brLo` cao = dải hẹp.

**Lớp NÉT phải có luật độ sáng RIÊNG** (`netLo`, `netGamma`). Con ngươi, hàng mi, gọng
kính vốn TỐI mà lại rất nhiều nét: cho chúng hạt sáng đều như da là đôi mắt sáng ngang
cái trán, nhìn render tưởng thuật toán mất mắt. Nét tối phải hiện ra bằng chỗ **vắng**
hạt, không phải thêm hạt.

## Trên trang

```js
vyaTune(gain, bloomStrength, bloomThreshold, size)
vyaTune(2.05, 0.28, 0.58, 3.40)   // giá trị đang dùng
```

Hai chỗ trong `_template.html` dễ quên:

- `renderer.outputColorSpace = LinearSRGBColorSpace`. Bỏ dòng đó ra là nền đen `#04060c`
  bị kéo lên `(32,40,57)` — cả bầu trời phủ xám xanh, chân dung không bao giờ bật khỏi nền.
- `uPGain` **không phải muốn to bao nhiêu cũng được**. To quá thì mỗi hạt một mình đã trắng
  bệt, thông tin tông vốn nằm ở mật độ bị xoá sạch: chỗ nào có hạt là chỗ đó trắng. Phải để
  từng hạt mờ và để chúng **cộng dồn** lên.
- `MIN_TONE` trong `buildLinks` (nét chòm sao) tự suy theo **phân vị**, không phải số cứng —
  đổi luật độ sáng của bộ sinh là số cứng hết lọc được gì, cả khuôn mặt biến thành lưới trắng.
