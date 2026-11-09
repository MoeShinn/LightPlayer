const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const VIDEO_EXT = new Set(['.mp4','.mkv','.webm','.m4v','.mov','.avi','.ogv','.ogg','.mp3','.m4a','.flac','.wav','.opus','.ts']);
const EXT_LIST = [...VIDEO_EXT].map(e => e.slice(1));
let win;

// ---- Cau hinh Chromium (phai dat truoc khi app ready) ----
// enable-features / disable-features chi duoc goi 1 lan moi loai (goi lai se ghi de)
app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport,VaapiVideoDecoder');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
Menu.setApplicationMenu(null); // khong dung dung menu mac dinh cua Electron

function argPaths(argv) {
  return argv.slice(app.isPackaged ? 1 : 2).filter(a => a && !a.startsWith('--') && fs.existsSync(a));
}

// Quet thu muc: dung withFileTypes de khoi stat tung file
function expand(paths, recursive = true) {
  const out = [];
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const walk = (p) => {
    let st; try { st = fs.statSync(p); } catch { return; }
    if (!st.isDirectory()) { if (VIDEO_EXT.has(path.extname(p).toLowerCase())) out.push(p); return; }
    let items; try { items = fs.readdirSync(p, { withFileTypes: true }); } catch { return; }
    items.sort((a, b) => collator.compare(a.name, b.name));
    for (const it of items) {
      const full = path.join(p, it.name);
      if (it.isDirectory()) { if (recursive) walk(full); }
      else if (VIDEO_EXT.has(path.extname(it.name).toLowerCase())) out.push(full);
    }
  };
  paths.forEach(walk);
  return out;
}

function send(paths, append) {
  if (!win || !paths.length) return;
  const go = () => win.webContents.send('open-paths', { paths, append });
  win.webContents.isLoading() ? win.webContents.once('did-finish-load', go) : go();
}

function createWindow() {
  // File mo kem theo lan khoi dong dau di thang vao renderer qua argv (khong cho did-finish-load + IPC)
  const initial = argPaths(process.argv);
  win = new BrowserWindow({
    width: 1100, height: 660, minWidth: 480, minHeight: 320, show: false,
    backgroundColor: '#0e0f11', icon: path.join(__dirname, '..', 'assets', 'icon.ico'), title: 'LightPlayer', autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false, spellcheck: false, devTools: !app.isPackaged,
      additionalArguments: ['--lp-open=' + encodeURIComponent(JSON.stringify(initial))]
    }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'index.html'));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', (_e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    send(argPaths(argv), true); // mo them file -> them vao list
  });
  app.whenReady().then(() => {
    createWindow();
    setTimeout(pruneThumbs, 15000); // don cache luc ranh, khong chan luc khoi dong
  });
  app.on('window-all-closed', () => app.quit());
}

/* ---------------- Thumbnail (cache tren dia) ---------------- */
let thumbDir = null;
const thumbPath = (file) => {
  let st; try { st = fs.statSync(file); } catch { return null; }
  if (!thumbDir) { thumbDir = path.join(app.getPath('userData'), 'thumbs'); fs.mkdirSync(thumbDir, { recursive: true }); }
  const key = require('crypto').createHash('sha1').update(`${file}|${st.size}|${st.mtimeMs}`).digest('hex').slice(0, 24);
  return path.join(thumbDir, key + '.jpg');
};
const fileUrl = (p) => require('url').pathToFileURL(p).href;

function resizeJpeg(buf) {
  const img = nativeImage.createFromBuffer(buf);
  if (img.isEmpty()) return null;
  const out = img.getSize().width > 320 ? img.resize({ width: 320, quality: 'good' }) : img;
  return out.toJPEG(82);
}

// Tra ve {url} neu da co thumbnail (cache hoac anh bia nhung trong file); null neu can lay khung hinh
ipcMain.handle('thumb-get', (_e, file) => {
  const f = thumbPath(file); if (!f) return null;
  if (fs.existsSync(f)) return { url: fileUrl(f) };
  const cover = require('./cover').getCover(file); // nap lazy, chi khi can
  if (cover) {
    const jpg = resizeJpeg(cover);
    if (jpg) { fs.writeFileSync(f, jpg); return { url: fileUrl(f) }; }
  }
  return null;
});
ipcMain.handle('thumb-save', async (_e, file, data) => {
  const f = thumbPath(file); if (!f) return null;
  await fs.promises.writeFile(f, Buffer.from(data));
  return fileUrl(f);
});
function pruneThumbs() {
  if (!thumbDir) return;
  fs.promises.readdir(thumbDir).then(async (names) => {
    if (names.length <= 3000) return;
    const rows = [];
    for (const n of names) { try { rows.push([n, (await fs.promises.stat(path.join(thumbDir, n))).mtimeMs]); } catch {} }
    rows.sort((a, b) => a[1] - b[1]);
    for (const [n] of rows.slice(0, rows.length - 2000)) fs.promises.unlink(path.join(thumbDir, n)).catch(() => {});
  }).catch(() => {});
}

/* ---------------- IPC khac ---------------- */
ipcMain.handle('pick-files', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Video / Audio', extensions: EXT_LIST }, { name: 'Tat ca', extensions: ['*'] }] });
  return r.canceled ? [] : r.filePaths;
});
ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'multiSelections'] });
  return r.canceled ? [] : r.filePaths;
});
ipcMain.handle('pick-sub', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Phu de', extensions: ['srt', 'vtt'] }] });
  return r.canceled ? null : readText(r.filePaths[0]);
});
ipcMain.handle('expand', (_e, paths, recursive) => expand(paths, recursive));
ipcMain.handle('find-sub', (_e, file) => {
  const base = file.slice(0, file.length - path.extname(file).length);
  for (const ext of ['.vtt', '.srt']) if (fs.existsSync(base + ext)) return readText(base + ext);
  return null;
});
ipcMain.on('always-on-top', (_e, v) => win && win.setAlwaysOnTop(!!v));
ipcMain.on('set-title', (_e, t) => win && win.setTitle(t));

function readText(p) {
  const buf = fs.readFileSync(p);
  let text = buf.toString('utf8');
  if (text.includes('\uFFFD')) text = buf.toString('latin1');
  return { name: path.basename(p), text };
}
