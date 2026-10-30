const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('api', {
  pickFiles: () => ipcRenderer.invoke('pick-files'),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  pickSub: () => ipcRenderer.invoke('pick-sub'),
  expand: (p, rec) => ipcRenderer.invoke('expand', p, rec),
  findSub: (f) => ipcRenderer.invoke('find-sub', f),
  pathOf: (file) => webUtils.getPathForFile(file),
  alwaysOnTop: (v) => ipcRenderer.send('always-on-top', v),
  setTitle: (t) => ipcRenderer.send('set-title', t),
  onOpen: (cb) => ipcRenderer.on('open-paths', (_e, d) => cb(d))
});
