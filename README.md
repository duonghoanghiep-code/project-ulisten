# ULISTEN — website

Trang web tĩnh (HTML/CSS/JS thuần), không cần cài đặt hay build. Đưa lên Vercel là chạy.

## Đưa lên Vercel (khoảng 2 phút)

**Cách 1 — kéo thả, không cần GitHub**
1. Giải nén file zip.
2. Vào vercel.com → **Add New… → Project**. Kéo cả thư mục `ulisten` vào ô tải lên (hoặc dùng `npx vercel` trong thư mục này).
3. Framework Preset: **Other**. Build Command: để trống. Output Directory: để trống.
4. Bấm **Deploy**.

**Cách 2 — qua GitHub (nên dùng nếu cả nhóm cùng sửa)**
1. Tạo repo mới, đẩy toàn bộ thư mục này lên.
2. Trên Vercel: **Add New → Project → Import** repo đó. Không cần chỉnh cấu hình, bấm **Deploy**.
3. Từ đó, mỗi lần push lên GitHub, Vercel tự cập nhật.

Chạy thử trên máy: mở terminal trong thư mục này, gõ `npx serve` (hoặc `python3 -m http.server`), rồi mở địa chỉ hiện ra.
Lưu ý: micro chỉ hoạt động trên `https://` hoặc `localhost`. Vercel đã có sẵn https.

## Nhóm cần sửa gì

Gần như mọi nội dung nằm trong **`js/data.js`**:

| Mục | Biến | Ghi chú |
|---|---|---|
| Câu nói chung đã thu âm | `COMMON_LINE` | Thay bằng đúng câu nhóm đã thu |
| File ghi âm theo tỉnh | `VOICES` | Đặt file `.mp3` vào thư mục `audio/`, khoá là mã tỉnh mới |
| Tỉnh "đang thu âm" | `VOICES_SOON` | |
| Người lắng nghe | `LISTENERS` | **Dữ liệu minh hoạ** — thay bằng người thật hoặc xoá bớt |
| Khung giờ | `SLOTS`, `HOURS` | Mặc định 20:00–23:00, mỗi 30 phút |
| Tên gọi khác để tìm kiếm | `ALIASES` | Ví dụ "Sài Gòn" → TP. Hồ Chí Minh |

Mã tỉnh mới: `hanoi, caobang, dienbien, laichau, langson, quangninh, sonla, tuyenquang, laocai, thainguyen, phutho, bacninh, hungyen, haiphong, ninhbinh, thanhhoa, nghean, hatinh, hue, quangtri, danang, quangngai, gialai, khanhhoa, lamdong, daklak, hcm, dongnai, tayninh, cantho, vinhlong, dongthap, camau, angiang`.

Tên file ghi âm đang chờ sẵn: `audio/ha-tinh.mp3`, `audio/tp-hcm.mp3`. Chưa có file thì nút phát chạy hiệu ứng giả và báo "Chưa có tệp ghi âm".

## Tính năng

- **Bản đồ 34 tỉnh, thành** (Nghị quyết 202/2025/QH15): rê chuột → miền nổi lên kiểu 3D, hai miền còn lại tối đi. Bấm miền → zoom mượt và hiện ranh giới tỉnh. Bấm tỉnh → tỉnh nổi cao nhất và thẻ tỉnh trượt ra.
- **Thoát ra dễ dàng:** phím `Esc` lùi một cấp, thanh điều hướng `Việt Nam › Miền › Tỉnh`, bản đồ thu nhỏ ở góc, nút toàn quốc, bấm vào vùng biển. Phím `←` `→` chuyển sang tỉnh kề bên. Cuộn để phóng to, kéo để di chuyển, chụm hai ngón trên điện thoại.
- **Hoàng Sa, Trường Sa** luôn có nhãn. Khi zoom làm quần đảo ra khỏi khung hình, nhãn bám vào mép màn hình kèm mũi tên chỉ hướng.
- **Tìm kiếm hiểu cả tên tỉnh cũ** và tên thành phố ("Quảng Bình" → Quảng Trị, "Đà Lạt" → Lâm Đồng). Gõ không dấu cũng được. Phím `/` để mở ô tìm.
- **Chọn người lắng nghe:** lưới người × giờ; bộ lọc cùng tỉnh, cùng miền hoặc giọng bất kỳ (kèm số người); chị hoặc anh; chủ đề muốn nói; tối nay hoặc tối mai. Có nút "Ghép nhanh". Khung giờ đã qua tự khoá lại.
- **Phòng chờ:** đồng hồ đếm ngược, bật thông báo của trình duyệt, kiểm tra micro thật (vạch sóng nhảy theo giọng), đổi giờ hoặc huỷ hẹn.
- **Cuộc gọi trên web:** chỉ giọng nói, có nút tắt tiếng, âm lượng, kết thúc. Nút **"Mình cần giúp ngay"** nối giám sát viên và hiện số 115.
- **Sau cuộc gọi:** thang cảm nhận ẩn danh, tuỳ chọn giới thiệu tới U-Care, nút hẹn lần sau.
- **Góp giọng quê:** thu âm 15 giây ngay trên trình duyệt (bản demo, chỉ phát lại trên máy người dùng).
- Chạy tốt trên điện thoại; hỗ trợ bàn phím và trình đọc màn hình; tự giảm chuyển động khi người dùng bật "giảm chuyển động" trong hệ điều hành.

## Giới hạn của bản demo — đọc trước khi trình bày

1. **Cuộc gọi chưa nối hai người thật.** Micro của người dùng hoạt động thật, nhưng phía người lắng nghe đang được mô phỏng. Muốn gọi thật cần một dịch vụ gọi qua trình duyệt (WebRTC), ví dụ LiveKit, Daily hoặc Agora; các dịch vụ này đều có gói miễn phí cho lượng dùng nhỏ. Chỗ cần cắm vào là hàm `renderCall()` trong `js/app.js`.
2. **Lịch hẹn chỉ lưu trên trình duyệt của người dùng** (localStorage), chưa có máy chủ. Người lắng nghe và giám sát viên chưa nhìn thấy lịch hẹn. Bản thật cần cơ sở dữ liệu (ví dụ Supabase hoặc Firebase) và một cổng riêng cho người lắng nghe và U-Care.
3. **Thông báo nhắc giờ** chỉ hiện khi tab còn mở. Muốn nhắc cả khi đã đóng tab thì cần Web Push và máy chủ.
4. **Tên người lắng nghe, số người đang trực, khung giờ** đều là dữ liệu minh hoạ.

## Nguồn bản đồ

Ranh giới 34 tỉnh, thành được dựng bằng cách hợp nhất ranh giới các tỉnh cũ theo đúng danh sách sáp nhập trong Nghị quyết 202/2025/QH15. Hình học gốc lấy từ [@svg-maps/vietnam](https://www.npmjs.com/package/@svg-maps/vietnam) (giấy phép CC BY 4.0; đã ghi nguồn ở chân trang). Khi dùng chính thức, nên đối chiếu thêm với bản đồ hành chính do cơ quan nhà nước công bố.

Font: Lexend (SIL Open Font License), tự host trong thư mục `fonts/`.
