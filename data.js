/* ==========================================================================
   ULISTEN — dữ liệu nội dung
   Nhóm chỉ cần sửa file này để cập nhật giọng quê, người lắng nghe, câu nói chung.
   ========================================================================== */

/* Câu nói chung đã thu âm bằng nhiều giọng tỉnh.
   TODO(nhóm): thay bằng đúng câu nhóm đã thu. */
window.COMMON_LINE = 'Anh/Chị luôn sẵn lòng lắng nghe em!';

/* Tệp ghi âm theo tỉnh (đặt file vào thư mục /audio).
   Khoá là mã tỉnh mới (xem js/map-data.js). Tỉnh nào chưa có file thì để trống. */
window.VOICES = {
  hatinh: { file: 'ha-tinh.m4a', by: 'Bạn Hà Tĩnh' },
  // Tỉnh có nhiều giọng: dùng [ ... ] và đặt nhãn cho từng giọng
  hcm: [
    { file: 'tp-hcm-nu.m4a',  label: 'Giọng nữ' },
    { file: 'tp-hcm-nam.m4a', label: 'Giọng nam' },
  ],
};
/* Tỉnh đang thu âm (hiện ở mục "Một câu nói, nhiều giọng quê") */
window.VOICES_SOON = ['hanoi', 'nghean', 'hue', 'cantho'];

/* Khung giờ mỗi tối */
window.SLOTS = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
window.HOURS = { open: 20, close: 23 };

/* Người lắng nghe — DỮ LIỆU MINH HOẠ cho bản demo.
   slots: f = còn trống, b = đã kín, - = không trực. Thứ tự theo SLOTS. */
window.LISTENERS = [
  { id: 'thu',   name: 'Chị Thu',   g: 'f', year: 3, prov: 'hatinh', town: 'Hồng Lĩnh',   topics: ['Nhớ nhà', 'Việc học'], intro: 'Năm nhất mình cũng từng khóc vì nhớ nhà.', slots: 'bbffff', tmr: 'ffbf-f' },
  { id: 'minh',  name: 'Anh Minh',  g: 'm', year: 4, prov: 'hatinh', town: 'Cẩm Xuyên',   topics: ['Việc học', 'Bạn bè'],  intro: 'Mình học Bách khoa, rất giỏi ngồi nghe.',   slots: '-bbfff', tmr: 'fff-bb' },
  { id: 'ha',    name: 'Chị Hà',    g: 'f', year: 2, prov: 'hatinh', town: 'Kỳ Anh',      topics: ['Gia đình'],            intro: 'Cứ kể thong thả, mình không vội đâu.',      slots: '---bff', tmr: '--ffff' },
  { id: 'mai',   name: 'Chị Mai',   g: 'f', year: 3, prov: 'nghean', town: 'Thanh Chương', topics: ['Nhớ nhà'],            intro: 'Người Nghệ, nói chậm, nghe kỹ.',           slots: 'fbffb-', tmr: 'bfff--' },
  { id: 'khoa',  name: 'Anh Khoa',  g: 'm', year: 4, prov: 'hue',    town: 'Hương Thủy',  topics: ['Bạn bè', 'Việc học'],  intro: 'Mình thích những câu chuyện bình thường.',  slots: 'ff-bff', tmr: 'f-ffbf' },
  { id: 'vy',    name: 'Chị Vy',    g: 'f', year: 3, prov: 'hcm',    town: 'Thủ Đức',     topics: ['Nhớ nhà', 'Gia đình'], intro: 'Ra Hà Nội học, mình hiểu cái lạnh đầu tiên.', slots: 'fffbbf', tmr: 'ffbbff' },
  { id: 'phuc',  name: 'Anh Phúc',  g: 'm', year: 2, prov: 'hcm',    town: 'Vũng Tàu',    topics: ['Việc học'],            intro: 'Chuyện gì cũng được, mình nghe hết.',        slots: 'bfffff', tmr: 'fffff-' },
  { id: 'ngoc',  name: 'Chị Ngọc',  g: 'f', year: 4, prov: 'hcm',    town: 'Bình Dương',  topics: ['Bạn bè', 'Gia đình'],  intro: 'Mình từng là tân sinh viên lạc lõng.',      slots: '--ffbf', tmr: '-fffff' },
  { id: 'duc',   name: 'Anh Đức',   g: 'm', year: 3, prov: 'hanoi',  town: 'Sóc Sơn',     topics: ['Việc học'],            intro: 'Không quê xa, nhưng mình biết cảm giác lạc lõng.', slots: 'ffbbff', tmr: 'ffffbb' },
  { id: 'linh',  name: 'Chị Linh',  g: 'f', year: 2, prov: 'hanoi',  town: 'Ba Vì',       topics: ['Nhớ nhà', 'Bạn bè'],   intro: 'Mình ở đây, cứ từ từ nói nhé.',             slots: 'bfffbf', tmr: 'fbffff' },
];

window.TOPICS = ['Việc học', 'Nhớ nhà', 'Bạn bè', 'Gia đình', 'Chỉ cần ai đó nghe'];

/* Tên gọi khác / viết tắt để ô tìm kiếm hiểu (ngoài tên tỉnh cũ đã có sẵn trong map-data). */
window.ALIASES = {
  hcm: ['HCM', 'TPHCM', 'TP HCM', 'Sài Gòn', 'Saigon', 'Vũng Tàu', 'Bà Rịa'],
  hue: ['Thừa Thiên Huế', 'TT Huế'],
  danang: ['Hội An', 'Tam Kỳ'],
  khanhhoa: ['Nha Trang', 'Phan Rang', 'Cam Ranh'],
  lamdong: ['Đà Lạt', 'Phan Thiết', 'Gia Nghĩa'],
  gialai: ['Quy Nhơn', 'Pleiku'],
  daklak: ['Buôn Ma Thuột', 'Tuy Hòa'],
  quangngai: ['Kon Tum'],
  cantho: ['Sóc Trăng', 'Vị Thanh'],
  angiang: ['Phú Quốc', 'Rạch Giá', 'Long Xuyên', 'Châu Đốc'],
  camau: ['Bạc Liêu'],
  laocai: ['Sa Pa', 'Sapa'],
  quangninh: ['Hạ Long'],
  phutho: ['Việt Trì', 'Vĩnh Yên', 'Hòa Bình'],
  hanoi: ['HN', 'Thủ đô'],
};

window.REGIONS = {
  bac:   { name: 'Miền Bắc',  short: 'Bắc' },
  trung: { name: 'Miền Trung', short: 'Trung' },
  nam:   { name: 'Miền Nam',  short: 'Nam' },
};
