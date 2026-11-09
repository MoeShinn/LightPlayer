LIGHTPLAYER - Trinh xem video nhe (HTML + Electron)

CACH DUNG
1. Cai Node.js LTS (https://nodejs.org)
2. Chay build-exe.bat -> ra dist\LightPlayer\LightPlayer.exe
   (ca thu muc LightPlayer la 1 ban portable, copy di dau cung duoc; hoac run-dev.bat de chay thu)
   Muon co bo cai dat + dang ky "Open with" cho file video: chay build-setup.bat
3. Chuot phai video > Open with > chon LightPlayer.exe de mo nhanh.

TAI SAO KHOI DONG NHANH HON
- Truoc day build "portable 1 file": moi lan mo phai giai nen ~150MB ra thu muc Temp roi moi chay
  (va Windows Defender quet lai). Gio la thu muc da giai nen san -> mo thang, khong giai nen.
- Cua so hien ngay khi san sang ve hinh (nen toi, khong chop trang), file truyen vao luc khoi dong
  duoc phat ngay, khong cho qua nhieu vong IPC.
- Quet thu muc dung readdir withFileTypes (it loi goi he thong hon), sandbox renderer, tat spellcheck,
  tat DevTools ban dong goi, nap module doc anh bia (cover.js) luc can moi nap.

THUMBNAIL TRONG PLAYLIST
- Uu tien: anh bia nhung san trong file (MP4/M4A/MOV: covr, MKV/WebM: attachment cover.jpg, MP3: ID3 APIC).
- Neu khong co: tu lay khung hinh o khoang 10% thoi luong.
- Chi tao cho muc dang hien tren man hinh (cuon toi dau tao toi do), luu cache o
  %APPDATA%\LightPlayer\thumbs nen lan sau hien ngay. Cache tu don khi qua 3000 anh.
- Preview: di chuot vao thumbnail trong list -> chay thu cac doan (khong co tieng);
  di chuot len thanh tua -> hien khung hinh + thoi gian tai vi tri do.

MO FILE
- Mo file / Mo nhieu file / Mo folder (quet ca thu muc con) / Them vao list
- Keo tha file hoac folder vao cua so (tha them = thay list, giu Shift = them vao list)
- Mo them file khi app dang chay -> tu dong them vao list

PHIM TAT
Space/K play-pause | ←/→ tua 5s (Shift 15s) | ↑/↓ am luong | M tat tieng
F fullscreen | N/P bai sau/truoc | [ ] giam/tang toc do | \ toc do 1x
A danh dau doan lap A-B | S chup khung hinh (copy clipboard) | I picture-in-picture
L an/hien playlist | T luon tren cung | C nap phu de | , . lui/tien 1 khung | O mo file | Ctrl+O mo folder
