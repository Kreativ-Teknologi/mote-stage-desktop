const {app,BrowserWindow,protocol,net,session,Menu,powerSaveBlocker,ipcMain}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs/promises');
const {resolveAsset,isLocal}=require('./paths.cjs');
const {createNdiOutput}=require('./ndi-output.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'mote',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}}]);
let controller,output;
const preferences={preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false};
if(!app.requestSingleInstanceLock())app.quit();
else{
app.on('second-instance',()=>{if(controller){controller.show();controller.focus();}});
app.whenReady().then(()=>{
  const root=path.join(app.getAppPath(),'web');
  const ndi=createNdiOutput(state=>{
    if(controller&&!controller.isDestroyed())controller.webContents.send('mote-ndi-state',state);
  });
  let quitting=false;
  app.on('before-quit',event=>{
    if(!ndi.isRunning())return;
    event.preventDefault();
    if(quitting)return;
    quitting=true;
    void ndi.stop().then(()=>app.quit());
  });
  protocol.handle('mote',async request=>{
    const file=resolveAsset(root,request.url);
    if(!file)return new Response('Not found',{status:404});
    try{
      await fs.access(file);
      const response=await net.fetch(pathToFileURL(file).href);
      const headers=new Headers(response.headers);
      const extension=path.extname(file);
      const types={'.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.css':'text/css','.html':'text/html','.task':'application/octet-stream'};
      if(types[extension])headers.set('Content-Type',types[extension]);
      headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self' data: blob:; object-src 'none'; base-uri 'self'");
      return new Response(response.body,{status:response.status,headers});
    }catch{return new Response('Bundled file not found',{status:404});}
  });
  // Web content stays offline. The native NDI sender is started separately on request.
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_details,callback)=>callback({cancel:true}));
  session.defaultSession.setPermissionCheckHandler((contents,permission,origin)=>isLocal(contents?.getURL())&&['media','fullscreen'].includes(permission));
  session.defaultSession.setPermissionRequestHandler((contents,permission,callback)=>callback(isLocal(contents?.getURL())&&['media','fullscreen'].includes(permission)));
  const graphicsLog=path.join(app.getPath('userData'),'graphics-errors.log');
  fs.writeFile(graphicsLog,'MOTE Stage renderer diagnostics\n').catch(()=>{});
  let graphicsErrors=0;
  app.on('web-contents-created',(_event,contents)=>{
    contents.on('console-message',details=>{
      if(details.level==='error'&&graphicsErrors++<30)fs.appendFile(graphicsLog,details.message+'\n').catch(()=>{});
    });
    contents.on('will-navigate',(event,url)=>{if(!isLocal(url))event.preventDefault();});
    contents.setWindowOpenHandler(({url})=>{if(isLocal(url)&&new URL(url).searchParams.get('view')==='stage')ensureOutput();return {action:'deny'};});
  });
  app.on('browser-window-created',(_event,win)=>{
    win.setMenuBarVisibility(false);
    win.webContents.on('before-input-event',(event,input)=>{
      if(input.type!=='keyDown')return;
      if(input.key==='F11'){event.preventDefault();win.setFullScreen(!win.isFullScreen());}
      if(input.key==='Escape'&&win.isFullScreen()){event.preventDefault();win.setFullScreen(false);}
    });
  });
  function ensureOutput(focus=true){
    if(!output||output.isDestroyed()){
      output=new BrowserWindow({title:'Nord — Audience Display',width:1100,height:760,backgroundColor:'#000000',autoHideMenuBar:true,webPreferences:preferences});
      output.on('closed',()=>{output=null;void ndi.stop('Audience window closed. NDI output stopped.');});
      output.webContents.on('render-process-gone',()=>{void ndi.stop('Audience window stopped rendering. NDI output stopped.');});
      output.loadURL('mote://stage/index.html?view=stage');
    }
    output.show();if(focus)output.focus();return {version:app.getVersion()};
  }
  ipcMain.handle('mote-open-output',event=>{if(!isLocal(event.sender.getURL()))throw new Error('Local control only');return ensureOutput();});
  ipcMain.handle('mote-version',event=>isLocal(event.sender.getURL())?app.getVersion():null);
  function requireController(event){
    if(event.sender!==controller?.webContents||event.senderFrame!==event.sender.mainFrame||!isLocal(event.senderFrame?.url)){
      throw new Error('NDI output can only be controlled from the performance window.');
    }
  }
  ipcMain.handle('mote-get-ndi',event=>{requireController(event);return ndi.getState();});
  ipcMain.handle('mote-set-ndi-size',(event,size)=>{requireController(event);ndi.setSize(size);});
  ipcMain.handle('mote-set-ndi',(event,enabled)=>{
    requireController(event);
    if(enabled!==true)return ndi.stop();
    return ndi.start(()=>{
      if(!output||output.isDestroyed())ensureOutput(false);
      return output;
    });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform==='darwin'?[{label:'MOTE Stage',submenu:[{role:'about'},{type:'separator'},{role:'hide'},{role:'hideOthers'},{role:'unhide'},{type:'separator'},{role:'quit'}]}]:[]),
    {label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
    {label:'Window',submenu:[{label:'Show controls',accelerator:'CmdOrCtrl+1',click:()=>{controller?.show();controller?.focus();}},{label:'Show avatar',accelerator:'CmdOrCtrl+2',click:()=>ensureOutput()},{type:'separator'},{role:'minimize'},{role:'togglefullscreen'},{role:'close'}]}
  ]));
  powerSaveBlocker.start('prevent-display-sleep');
  controller=new BrowserWindow({title:'MOTE Stage',show:false,width:1260,height:800,minWidth:1000,minHeight:680,backgroundColor:'#000000',autoHideMenuBar:true,webPreferences:preferences});
  controller.once('ready-to-show',()=>{controller.maximize();controller.show();controller.focus();});
  controller.loadURL('mote://stage/index.html');
  controller.webContents.once('did-finish-load',()=>{ensureOutput(false);controller.focus();});
  controller.on('closed',()=>{controller=null;app.quit();});
});
app.on('window-all-closed',()=>app.quit());
}
