# Bật đồng bộ — để lời hẹn của Vy hiện thẳng trên máy anh

## Đọc cái này trước — có 2 bước, bước 1 là bắt buộc

| | Làm gì | Kết quả |
|---|---|---|
| **Bước A — XONG rồi** | Trang đã ở trên mạng | Vy chốt xong bấm **"Gửi cho anh"** → gửi anh một đường link → anh bấm là thấy đúng thẻ hẹn |
| **Bước B — tuỳ chọn** | Thêm Firebase (Phần 1 + 2) | Bỏ luôn bước gửi tay: Vy bấm xong, anh mở trang là tự thấy |

**Địa chỉ của trang** (ai có link cũng mở được, không cần đăng nhập):

```
https://claude.ai/artifact/2LB1Y88rNRY7dFS334jJKj
```

Mỗi lần sửa xong, chạy `node build.js` rồi đăng đè `index.html` lên **đúng địa chỉ đó** —
link không đổi, Vy đang mở cũng thấy bản mới. Đừng tạo địa chỉ mới, Vy sẽ giữ link cũ.

**Vì sao phải có bước này**: nếu trang chỉ là một file gửi qua Zalo, đường link Vy gửi sẽ trỏ
vào ổ đĩa máy Vy (`file:///C:/Users/.../index.html`) — máy anh mở không ra. Phải có một địa chỉ
chung trên mạng thì cả link chia sẻ lẫn Firebase mới có ý nghĩa.

Chưa làm gì cả thì tính năng **vẫn chạy đủ trên máy Vy**: bấm ĐỒNG Ý, chọn ngày giờ, viết lời nhắn,
trang lưu và hiện thẻ hẹn có đếm ngược — chỉ là chưa sang được máy anh.

---

## Phần 1 — Kho dữ liệu (Firebase, ~5 phút, miễn phí)

1. Vào `console.firebase.google.com`, đăng nhập Google → **Add project**.
   Đặt tên gì cũng được (vd `vya`). Hỏi Google Analytics thì **tắt** cho nhanh.
2. Menu trái → **Build** → **Realtime Database** → **Create Database**.
   - Vùng: chọn **Singapore (asia-southeast1)** — gần Việt Nam nhất.
   - Chọn **Start in test mode** → Enable.
3. Copy địa chỉ hiện ở đầu bảng, dạng:
   `https://vya-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app`
4. Sang tab **Rules**, xoá hết và dán đúng khối này rồi bấm **Publish**:
   ```json
   { "rules": { "hen": { ".read": true, ".write": true } } }
   ```
   > Phải làm bước này. "Test mode" tự khoá lại sau 30 ngày, tới lúc đó lời hẹn im lặng
   > ngừng đồng bộ mà không báo gì.

**Cần biết**: khối luật trên mở đúng một nhánh `hen`. Ai có địa chỉ đó cũng đọc/ghi được
nhánh ấy — không đọc được gì khác, và địa chỉ thì không ai đoán ra. Với một trang riêng
của hai người thì đủ; đừng để dữ liệu gì khác vào đây.

## Phần 2 — Dán vào trang

Mở `_template.html`, tìm dòng:

```js
const SYNC_URL = '';
```

Sửa thành địa chỉ ở bước 3, **thêm `/hen.json` vào cuối**:

```js
const SYNC_URL = 'https://vya-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app/hen.json';
```

Rồi chạy:

```
node build.js
```

## Phần 3 — Đưa trang lên mạng (đã xong)

Trang đang ở địa chỉ ghi ở đầu file. Nếu sau này muốn chuyển chỗ khác:

- **Nhanh nhất**: `app.netlify.com/drop` — kéo thả `index.html` vào, có link ngay.
  Muốn giữ link lâu dài thì đăng ký tài khoản miễn phí.
- **Bền hơn**: GitHub Pages (thư mục này đã có git sẵn).

Trang nặng 6,4 MB (nhạc chiếm 4 MB) nên lần mở đầu bằng 4G hơi lâu — xem mục
"màn chờ" trong `IDEAS.md` §2.1.

---

## Kiểm lại xem đã chạy chưa

1. Mở trang trên điện thoại, bấm ĐỒNG Ý → chọn ngày → **Chốt luôn**.
   Dòng chữ nhỏ dưới thẻ phải hiện **"Đã gửi cho anh rồi ♥"**.
   Nếu hiện *"Chưa gửi lên được"* → sai `SYNC_URL`, hoặc chưa Publish Rules, hoặc mất mạng.
2. Mở trang trên máy khác → phải tự hiện thẻ hẹn, và nút **Hẹn tiếp theo** xuất hiện
   ở thanh dưới cùng.

## Thử đi thử lại

Chốt xong rồi mà muốn thử lại từ đầu: mở **`index.html#reset`** (thêm `#reset` vào cuối địa chỉ).
Trang sẽ quên lời hẹn đã lưu — kể cả bản trên máy chủ — và hỏi lại như chưa có gì.
Gõ `resetHen()` trong Console cũng ra kết quả y hệt. Cố ý không làm thành nút trên trang,
để đó thì có ngày bấm nhầm mất lời hẹn thật.

## Nếu hỏng thì hỏng kiểu gì

Toàn bộ phần mạng đều **fail-soft** — mất mạng hay Firebase lỗi thì:
lời hẹn vẫn lưu trên máy, thẻ hẹn vẫn hiện, chỉ báo một dòng chữ nhỏ là chưa gửi lên được
và anh vẫn còn nút "Gửi cho anh" để gửi tay. Không có đường nào làm mất lời hẹn đã chốt.
