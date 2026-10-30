# LightPlayer

Trình xem video nhẹ, giao diện viết bằng HTML, chạy bằng Electron. Mở video nhanh, tối ưu cho Windows 10.

## Cách build ra file .exe

1. Cài [Node.js](https://nodejs.org) bản **LTS** (nếu chưa có).
2. Chạy file `build-exe.bat`. Lần đầu sẽ hơi lâu vì phải tải Electron.
3. Khi xong, file nằm ở `dist\LightPlayer.exe` (bản portable, không cần cài đặt).

Muốn chạy thử mà chưa cần build thì mở `run-dev.bat`.

## Cách mở video

- **Mở file**: chọn một video để phát.
- **Mở nhiều file**: chọn nhiều video cùng lúc, tạo thành playlist.
- **Mở thư mục**: quét toàn bộ video trong thư mục (kể cả thư mục con) thành playlist, sắp xếp theo số tự nhiên (2 trước 10).
- **Thêm vào list**: thêm file vào playlist đang có mà không thay thế.
- **Kéo thả** file hoặc thư mục vào cửa sổ. Giữ `Shift` khi thả để thêm vào list thay vì thay list.
- **Open with**: chuột phải vào video → *Open with* → chọn `LightPlayer.exe`. Nếu app đang chạy, file mới sẽ tự được thêm vào playlist.

## Tính năng

- Playlist: tìm kiếm, kéo để đổi thứ tự, xóa từng mục, sắp xếp A-Z / Z-A.
- Chế độ phát: ngẫu nhiên, lặp tất cả, lặp một bài.
- Nhớ vị trí đang xem dở của từng video.
- Lặp đoạn A-B.
- Tốc độ phát từ 0.25x đến 4x.
- Tua từng khung hình.
- Phụ đề `.srt` / `.vtt`: tự nạp nếu trùng tên với video, hoặc nạp thủ công.
- Chụp khung hình (tự sao chép vào clipboard).
- Picture-in-picture, luôn hiển thị trên cùng, toàn màn hình.
- Lăn chuột để chỉnh âm lượng.
- Tự ẩn thanh điều khiển và con trỏ chuột khi không dùng.
- Tự chuyển sang video kế tiếp nếu một file bị lỗi.

## Phím tắt

| Phím | Chức năng |
|---|---|
| `Space` / `K` | Phát / tạm dừng |
| `←` / `→` | Tua lùi / tới 5 giây (giữ `Shift`: 15 giây) |
| `↑` / `↓` | Tăng / giảm âm lượng |
| `M` | Tắt / bật tiếng |
| `F` | Toàn màn hình (hoặc nhấp đúp vào video) |
| `N` / `P` | Video kế tiếp / trước đó |
| `[` / `]` | Giảm / tăng tốc độ phát |
| `\` | Về tốc độ 1x |
| `,` / `.` | Lùi / tiến 1 khung hình |
| `A` | Đánh dấu điểm A, B để lặp đoạn (bấm lần 3 để tắt) |
| `S` | Chụp khung hình |
| `I` | Picture-in-picture |
| `L` | Ẩn / hiện playlist |
| `T` | Luôn hiển thị trên cùng |
| `C` | Nạp phụ đề |
| `O` | Mở file |
| `Ctrl + O` | Mở thư mục |
| `Esc` | Thoát toàn màn hình |

## Đổi logo / icon

- Các logo đã cắt sẵn nằm trong `assets\logos\`.
- Logo hiển thị trong app: `assets\logo.png`.
- Icon của app và file `.exe`: `assets\icon.ico`.

Để đổi icon, thay file `assets\icon.ico` rồi build lại. Nếu icon trong Explorer chưa đổi sau khi build, hãy đổi tên file `.exe` hoặc khởi động lại Explorer để Windows làm mới bộ nhớ icon.

## Lưu ý

- File `.exe` nặng khoảng 70–90 MB vì đã đóng gói kèm trình duyệt Chromium.
- Một số file `.avi` / `.mkv` dùng codec cũ (DivX, AC3, DTS...) có thể không phát được.
- Hỗ trợ H.265/HEVC phụ thuộc vào card đồ họa của máy.