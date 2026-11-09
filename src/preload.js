const { contextBridge, ipcRenderer, webUtils } = require('electron');
let initial = [];
try {
  const a = process.argv.find(x => x.startsWith('--lp-open='));
  if (a) initial = JSON.parse(decodeURIComponent(a.slice(10)));
} catch {}
contextBridge.exposeInMainWorld('api', {
  initial,
  pickFiles: () => ipcRenderer.invoke('pick-files'),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  pickSub: () => ipcRenderer.invoke('pick-sub'),
  expand: (p, rec) => ipcRenderer.invoke('expand', p, rec),
  findSub: (f) => ipcRenderer.invoke('find-sub', f),
  thumbGet: (f) => ipcRenderer.invoke('thumb-get', f),
  thumbSave: (f, buf) => ipcRenderer.invoke('thumb-save', f, buf),
  pathOf: (file) => webUtils.getPathForFile(file),
  alwaysOnTop: (v) => ipcRenderer.send('always-on-top', v),
  setTitle: (t) => ipcRenderer.send('set-title', t),
  onOpen: (cb) => ipcRenderer.on('open-paths', (_e, d) => cb(d))
});
