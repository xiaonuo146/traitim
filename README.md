#3D Romantic Particle Heart — Three.js

Một dự án Creative Coding tương tác 3D kết hợp nghệ thuật hạt ánh sáng (Particle Art), hoạt ảnh điện ảnh và âm nhạc lãng mạn được xây dựng trên nền tảng **Three.js** và **WebGL**.

![Three.js](https://img.shields.io/badge/Three.js-r160-black?style=flat-square&logo=three.js)
![WebGL](https://img.shields.io/badge/WebGL-2.0-red?style=flat-square&logo=webgl)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?style=flat-square&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 1. Giới thiệu (Overview)

Dự án không chỉ là một khối đồ họa 3D đơn lẻ, mà là một **trải nghiệm hộp quà điện ảnh hoàn chỉnh** được thiết kế để gây bất ngờ cho người xem:
* Mở đầu bằng **màn hình mở quà bí ẩn** giúp vượt qua chính sách chặn tự phát âm thanh của trình duyệt (Autoplay Policy).
* Trình chiếu **Video kỷ niệm (Intro Video)** tràn màn hình kết hợp bản nhạc mở đầu nhẹ nhàng (`music1.mp3`).
* Khi video kết thúc (hoặc bấm Bỏ qua), khung cảnh mượt mà chuyển tiếp vào thế giới **Trái Tim 3D hạt phát sáng** với điệu nhạc thứ hai (`music2.mp3`), hòa quyện cùng chuỗi hoạt ảnh biến hình thư pháp đầy cảm xúc.

---

##  2. Các tính năng & Hoạt cảnh nổi bật (Key Features)

###  Chuỗi chuyển cảnh điện ảnh (Cinematic Flow)
1. **Khởi động an toàn (Safe Start):** Nút mở quà lấp lánh kích hoạt cấp quyền âm thanh tức thời cho trình duyệt.
2. **Video Intro Fullscreen:** Video clip mở đầu hiển thị bao phủ toàn màn hình, tích hợp nút "Bỏ qua" kính mờ (Glassmorphism).
3. **Chuyển tiếp 3D chuẩn xác:** Trái tim 3D được đóng băng ở giây số 0 trong suốt thời gian phát video. Chỉ khi video kết thúc, hoạt cảnh 3D mới chính thức bắt đầu, không bị trôi mất phân cảnh nào.
4. **Hệ thống 2 bản nhạc độc lập (Dual Audio Tracks):**
   * `music1.mp3`: Phát cùng lúc với Video Intro.
   * `music2.mp3`: Tự động tiếp nối và lặp lại khi bước vào không gian Trái Tim 3D.

---

###  Hoạt ảnh Trái Tim 3D & Hạt Năng Lượng
* **Đĩa đáy nở từ tâm (Soft Blooming Disk):** Các vệt sáng sinh ra từ tâm đĩa, bò xoay tròn lan rộng ra ngoài với tốc độ ốc sên siêu chậm rãi, đan xen tự nhiên và không gây chói lóa.
* **Cột lốc xoáy dọc (3D Vertical Helix):** Vệt sáng ngóc đầu bẻ lái thẳng đứng, uốn xoắn ốc theo trục đứng leo lên tim như một cơn lốc năng lượng thanh thoát.
* **Va chạm 3D thực tế & Phản lực nam châm:** Quét cự ly va chạm thật trong không gian. Khi chạm trúng, hạt tim và vệt sáng tương tác đẩy nhẹ nhau như hai cực từ trường.
* **Nứt vỡ 100% đồng loạt:** Luồng năng lượng kích hoạt cú nổ chấn động làm toàn bộ 4.500 hạt tim nứt toác đồng đều tăm tắp.
* **Biến hình chữ thư pháp nghệ thuật (Morphing Typography):**
  * Hạt tim lướt chuyển dịch tạo thành chữ nghiêng mềm mại: **"I Miss You"** (font *Great Vibes*).
  * Tiếp tục chuyển tiếp mượt mà sang dòng chữ: **"I Love You"**.
  * Tự động hút ngược về tái tạo thành **Trái Tim 3D hoàn chỉnh 100%** và đập nhịp tim rực rỡ!
* **Bảng màu Hồng Baby Neon (Baby Neon Pink):** Sắc hồng kẹo ngọt tươi tắn kết hợp lớp hào quang khuếch tán (*Feathered Halo Glow*), loại bỏ hoàn toàn đốm trắng cháy sáng ở tâm đĩa và 2 đầu mút tim.

---

### Bảng điều khiển tương tác (Interactive Controls)
Ở góc trái màn hình 3D tích hợp cụm nút điều khiển kính mờ:
* 🔊 / 🔇: Bật hoặc tắt nhạc nền 2.
* ⏸️ / ▶️: Tạm dừng hoặc tiếp tục hoạt cảnh 3D để chiêm ngưỡng từng góc độ.

---

##  3. Cấu trúc thư mục (Project Structure)

traitim
├── assets/
│   ├── intro.mp4          # Video clip mở đầu
│   ├── music1.mp3         # Nhạc phát cùng video clip
│   └── music2.mp3         # Nhạc phát cho Trái Tim 3D
├── css/
│   └── style.css          # Định dạng giao diện, hiệu ứng kính mờ & fade-out
├── js/
│   ├── background.js     # Bụi sao không gian trôi nổi (Ambient Particles)
│   ├── config.js          # Bảng màu, thông số camera và kích thước hạt
│   ├── heart.js           # Khối trái tim 3D, vòng xoáy vệt sáng & timeline
│   ├── particle.js        # Logic vật lý từng hạt, va chạm & biến hình chữ
│   ├── utils.js           # Hàm tạo Texture phát quang có vầng hào quang
│   └── main.js            # Khởi tạo Three.js, xử lý media và cụm điều khiển
├── index.html             # Cấu trúc trang web & nạp font chữ
└── README.md              # Tài liệu dự án
4. Hướng dẫn tải về & Chạy trên máy (Local Setup)
Do dự án sử dụng JavaScript ES Modules (import/export) và nạp file media cục bộ, trình duyệt yêu cầu chạy qua một web server nội bộ (không mở trực tiếp bằng cách nhấp đúp file index.html vì sẽ bị chặn lỗi CORS).
Bước 1: Clone dự án về máy qua Git
Mở Terminal / Command Prompt và gõ lệnh:
code
Bash
git clone https://github.com/<tai-khoan-cua-ban>/<ten-repository>.git
cd <ten-repository>
Bước 2: Khởi động Local Server (Chọn 1 trong các cách sau)
Cách 1 (Đơn giản nhất với VS Code):
Cài Extension Live Server trong Visual Studio Code.
Chuột phải vào file index.html 
→
→
 Chọn Open with Live Server.
Cách 2 (Dùng Python có sẵn):
code
Bash
# Python 3
python -m http.server 3000
Sau đó mở trình duyệt truy cập: http://localhost:3000
Cách 3 (Dùng Node.js):
code
Bash
npx serve
 5. Xem Video Demo & Tải Video về
 Cách 1: Xem trực tiếp trên Web (Khuyên dùng)
Bạn có thể bật tính năng GitHub Pages để bất kỳ ai cũng có thể bấm vào link xem trực tiếp dự án:
Vào repository của bạn trên GitHub 
→
→
 Chọn tab Settings.
Chọn mục Pages ở thanh menu bên trái.
Ở phần Branch, chọn nhánh main (hoặc master) 
→
→
 bấm Save.
Chờ 1–2 phút, GitHub sẽ cấp cho bạn một đường link công khai (ví dụ: https://<ten-tai-khoan>.github.io/<ten-repo>/) để xem online trên cả điện thoại và máy tính!
 Cách 2: Xem file Video trực tiếp trên GitHub
Trên giao diện GitHub của repository, bấm vào thư mục assets/.
Nhấp vào file intro.mp4.
GitHub có sẵn trình phát video tích hợp, bạn có thể bấm Play để xem trực tiếp ngay trên trang web.
 Cách 3: Tải file Video về máy tính
Tải qua giao diện web: Mở file assets/intro.mp4 trên GitHub 
→
→
 Bấm vào nút Download (hoặc nút Raw) ở góc trên bên phải để tải file về máy.
Tải qua lệnh Git: Khi bạn chạy lệnh git clone ở Bước 4, toàn bộ video intro.mp4 và các bản nhạc đã được tự động tải về thư mục assets/ trên máy tính của bạn.
### Tùy biến nhanh (Customization)
Chỉnh tốc độ hoạt cảnh: Mở file js/heart.js, tìm dòng const TIME_SCALE = 0.8;. Chỉnh về 1.0 để chạy tốc độ thật, hoặc 0.1 để xem chuyển động chậm.
Chỉnh độ mờ bụi không gian: Mở file js/background.js, chỉnh thông số opacity: 0.18; tại phần PointsMaterial.
Thay đổi nội dung chữ: Mở file js/heart.js, tìm các dòng generateTextCoordinates('I Miss You'...) để đổi thành tên người yêu hoặc thông điệp riêng của bạn.
```
