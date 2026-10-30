const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const VIDEO_EXT = ['.mp4','.mkv','.webm','.m4v','.mov','.avi','.ogv','.ogg','.mp3','.m4a','.flac','.wav','.opus','.ts'];
let win;

// Tang toc phan cung + ho tro HEVC tren Windows 10 (neu GPU ho tro)
app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport,VaapiVideoDecoder');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function argPaths(argv) {
  return argv.slice(app.isPackaged ? 1 : 2).filter(a => !a.startsWith('--') && fs.existsSync(a));
}

function expand(paths, recursive = true) {
  const out = [];
  const walk = (p) => {
    let st; try { st = fs.statSync(p); } catch { return; }
    if (st.isDirectory()) {
      let items = []; try { items = fs.readdirSync(p); } catch { return; }
      items.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      for (const it of items) {
        const full = path.join(p, it);
        let s; try { s = fs.statSync(full); } catch { continue; }
        if (s.isDirectory()) { if (recursive) walk(full); }
        else if (VIDEO_EXT.includes(path.extname(full).toLowerCase())) out.push(full);
      }
    } else if (VIDEO_EXT.includes(path.extname(p).toLowerCase())) out.push(p);
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
  win = new BrowserWindow({
    width: 1100, height: 660, minWidth: 480, minHeight: 320,
    backgroundColor: '#0e0f11', icon: path.join(__dirname, '..', 'assets', 'icon.ico'), title: 'LightPlayer', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
  send(argPaths(process.argv), false);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', (_e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    send(argPaths(argv), true); // mo them file -> them vao list
  });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}

ipcMain.handle('pick-files', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Video / Audio', extensions: VIDEO_EXT.map(e => e.slice(1)) }, { name: 'Tat ca', extensions: ['*'] }] });
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
