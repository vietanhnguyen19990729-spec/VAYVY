# VyA — Kế hoạch & ý tưởng làm tiếp

Thứ tự đã xếp theo: **sửa cái đang hỏng → làm mượt → làm sâu (lãng mạn) → làm đẹp thêm**.
Mỗi mục ghi rõ *tại sao đáng làm* và *nặng hay nhẹ*. Làm xong mục nào thì ghi 1 dòng vào `PROGRESS.md`.

---

## 0. SỬA NGAY — trang đang thiếu 4 thẻ meta (nhẹ, ~5 phút, ảnh hưởng lớn nhất)

File hiện bắt đầu thẳng bằng `<title>`, **không có `<!doctype html>`, không `<meta charset>`, không `<meta name="viewport">`**.

- Không có `viewport` ⇒ điện thoại dựng trang ở khổ giả 980px rồi thu nhỏ lại: chữ bé li ti, hai media query 620px/860px **không bao giờ chạy**, và `isNarrow()` (`innerWidth < 760`) trả `false` nên máy điện thoại vẫn phải gánh đủ 113.000 hạt thay vì 62.000 → nóng máy, tụt khung hình.
- Không có `charset` ⇒ mở bằng `file://` có lúc ra chữ Việt lỗi font (mojibake).

Đây là việc đáng làm trước mọi thứ khác: toàn bộ công sức responsive đã viết sẵn trong CSS hiện **không được kích hoạt trên điện thoại**.

## 1. Nền móng — để còn sửa được lâu dài (nhẹ, nửa buổi)

1. **Cất lại asset gốc** vào `assets/`: ảnh chân dung gốc, file nhạc gốc. Hiện chỉ còn bản base64 đã nhúng, muốn đổi ảnh là phải làm lại từ đầu.
2. **Viết `build.js`**: đọc `_template.html`, sinh bản đồ sao từ ảnh (6 byte/hạt: x,y int16 · độ sáng · độ xám), nhúng nhạc + ảnh, tính `__ASPECT__`, ghi ra `index.html`. Có script này thì đổi ảnh/đổi nhạc chỉ còn 1 lệnh.
3. **`git init`** + commit bản v1 ngay. Sửa hỏng còn lùi lại được.
4. **Gỡ phụ thuộc mạng**: tải `three.module.js` + 3 file postprocessing + 3 font `.woff2` về `vendor/`. Mất mạng thì trang vẫn chạy đủ — quan trọng nếu mở ở chỗ sóng yếu.

## 2. Làm MƯỢT

1. **Màn chờ trở thành một phần của màn mở** (vừa) — hiện `index.html` nặng 6,7 MB (nhạc chiếm 5,6 MB), 4G phải chờ vài giây nhìn một dòng chữ đứng im. Tách nhạc ra file riêng cho tải sau, và cho đàn sao **tụ dần theo đúng % đã tải**: chờ biến thành xem sao bay về.
2. **Tự hạ chất lượng khi máy yếu** (nhẹ) — đo khung hình trung bình 2 giây đầu, tụt dưới ~45fps thì giảm DPR/số hạt/bloom. Mượt trên máy Vy quan trọng hơn đẹp tối đa trên máy mình.
3. **Nhịp khi đổi hình thái** (nhẹ) — `aSeed[2]` (trễ theo từng hạt) đã có sẵn trong dữ liệu nhưng nhịp morph hiện gần như đều: cho hạt sáng đi trước, hạt tối theo sau, dùng easing khác nhau cho mỗi cặp hình → đổi hình có hơi thở chứ không trượt phẳng.
4. **Cuộn đậu đúng chương** (nhẹ) — `scroll-snap-type: y proximity` cho 3 section: cuộn tay trên điện thoại sẽ không dừng lưng chừng giữa 2 chương.

## 3. Làm SÂU — phần lãng mạn (đây mới là thứ đáng đầu tư nhất)

Trang hiện rất đẹp nhưng **đọc một lượt là hết**: 3 đoạn chữ, 1 cao trào. Ba ý dưới đây làm nó mở lại lần thứ mười vẫn còn cái để tìm.

1. **⭐ Chòm sao kỷ niệm (ĐỀ XUẤT LÀM ĐẦU — vừa)**
   Rải 5–7 ngôi sao "có tên" nằm trên khuôn mặt, sáng hơn và nhấp nháy chậm hơn chung quanh. Chạm vào một ngôi → nét chòm sao quanh nó tự vẽ ra, một tấm ảnh nhỏ mờ dần hiện lên kèm **một câu duy nhất** về kỷ niệm đó (lần đầu nhắn tin, món ăn chung đầu tiên, câu nói em hay nói...). Chạm ra ngoài thì nó tan về lại thành sao.
   *Vì sao đáng làm*: biến trang từ "một lá thư" thành "một bầu trời để đi dạo". Tận dụng đúng thứ đã dựng sẵn (hạt, nét nối, sóng xung kích) nên không phải viết engine mới.

2. **⭐ Hình thái thứ 5 — "Đêm ấy" (vừa–nặng)**
   Bầu trời **thật** đúng đêm 17.09.2026 nhìn từ 20°48′B · 106°37′Đ: vị trí thật của các chòm sao tối hôm đó, có tên chòm hiện mờ bên cạnh. Tính hoàn toàn offline bằng bảng ~500 ngôi sao sáng + công thức góc giờ, không cần gọi mạng.
   *Vì sao đáng làm*: cả trang đang xây trên giọng "đài quan trắc" — đây là lúc lời hứa đó thành thật. Và nó trả lời đúng câu "bầu trời tối hôm ấy trông thế nào".

3. **Giọng nói thay cho chữ ở cao trào (nhẹ, nhưng hiệu quả cao nhất trên mỗi phút bỏ ra)**
   Thu một đoạn ~8 giây mình đọc đúng câu *"Cùng nhau vẽ ra tương lai tươi sáng em nhé"*, cho phát đúng lúc dòng chữ hiện ra (nhạc nền tự hạ xuống -12dB rồi lên lại). Một giọng thật ăn đứt mọi hiệu ứng hạt.

4. **Trang tự lớn lên theo thời gian (nhẹ)**
   Bộ đếm ngày đang chạy rồi — cho nó **mở khoá** thêm nội dung theo mốc: ngày 100, ngày 365... mỗi mốc hiện thêm một đoạn thư mới + một ngôi sao mới trên khuôn mặt. Gửi một lần nhưng vài tháng sau mở lại vẫn có cái mới.

5. **Kết bằng hừng đông thay vì tắt về đen (nhẹ)**
   Sau cao trào, nền chuyển rất chậm từ `--void` xanh đen sang tông ấm của bình minh, HUD đổi `Trạng thái: Còn tiếp diễn`. Kết thúc không nên là màn hình tối.

## 4. Làm ĐẸP thêm (chọn 2–3 cái, đừng làm hết — nhiều hiệu ứng quá sẽ rẻ đi)

1. **Sao có nhiệt màu** — hiện hạt gần như đơn sắc; cho vùng sáng ngả ấm (hổ phách), vùng tối ngả lạnh (xanh thép). Khuôn mặt sẽ có khối hơn hẳn mà không cần thêm hạt nào.
2. **Nét chòm sao vẽ dần** — lúc bấm, các nét chạy ra từ điểm chạm thay vì hiện cùng lúc.
3. **Sao băng rất thưa** — trung bình ~40 giây một vệt, chỉ một, đi chéo góc xa. Hiếm nên mới quý.
4. **Con trỏ kéo theo bụi sao** — quầng sáng nhỏ bám sau ngón tay/chuột.
5. **Chữ hiện theo mask gradient** từng dòng thay vì mờ dần cả khối.

## 5. Nếu định đưa lên web (chưa làm — hỏi trước)

Gửi qua Zalo/Messenger thì cần `og:title`/`og:description`/`og:image` (ảnh xem trước), nếu không chỉ hiện một đường link trơ. Kèm tên miền riêng + mật khẩu nhẹ nếu không muốn ai khác mở.
