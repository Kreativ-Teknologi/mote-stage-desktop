const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('MOTEDesktop',{
  openOutput:()=>ipcRenderer.invoke('mote-open-output'),
  version:()=>ipcRenderer.invoke('mote-version')
});
