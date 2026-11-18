const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('MOTEDesktop',{
  openOutput:()=>ipcRenderer.invoke('mote-open-output'),
  version:()=>ipcRenderer.invoke('mote-version'),
  getNdiOutput:()=>ipcRenderer.invoke('mote-get-ndi'),
  setNdiOutput:enabled=>ipcRenderer.invoke('mote-set-ndi',enabled),
  setNdiSize:size=>ipcRenderer.invoke('mote-set-ndi-size',size),
  onNdiOutput:callback=>{
    const listener=(_event,state)=>callback(state);
    ipcRenderer.on('mote-ndi-state',listener);
    return ()=>ipcRenderer.removeListener('mote-ndi-state',listener);
  }
});
