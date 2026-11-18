const {existsSync}=require('node:fs');
const path=require('node:path');
const {promisify}=require('node:util');

const SOURCE_NAME='MOTE Stage';
const FRAME_RATE=30;
const SUPPORTED=process.platform==='win32'&&process.arch==='x64';
let ndi;

function loadNdi(){
  if(ndi)return ndi;
  const directories=[
    process.env.NDI_RUNTIME_DIR_V6,
    process.env.NDI_RUNTIME_DIR_V5,
    process.env.ProgramFiles&&path.join(process.env.ProgramFiles,'NDI','NDI 6 Tools','Runtime')
  ];
  const dll=directories.filter(dir=>dir&&path.isAbsolute(dir))
    .map(dir=>path.join(dir,'Processing.NDI.Lib.x64.dll')).find(existsSync);
  if(!dll)throw new Error('Install NDI Tools for Windows to start NDI output.');

  try{
    const koffi=require('koffi');
    const library=koffi.load(dll);
    const senderConfig=koffi.struct({
      p_ndi_name:'str',p_groups:'str',clock_video:'bool',clock_audio:'bool'
    });
    const videoFrame=koffi.struct({
      xres:'int',yres:'int',FourCC:'uint32_t',frame_rate_N:'int',frame_rate_D:'int',
      picture_aspect_ratio:'float',frame_format_type:'int',timecode:'int64_t',
      p_data:'uint8_t *',line_stride_in_bytes:'int',p_metadata:'str',timestamp:'int64_t'
    });
    const initialize=library.func('bool NDIlib_initialize()');
    const create=library.func('NDIlib_send_create','void *',[koffi.pointer(senderConfig)]);
    const destroy=library.func('void NDIlib_send_destroy(void *)');
    const connections=library.func('int NDIlib_send_get_no_connections(void *, uint32_t)');
    const send=library.func('NDIlib_send_send_video_v2','void',['void *',koffi.pointer(videoFrame)]);
    if(!initialize())throw new Error('NDIlib_initialize failed');
    ndi={create,destroy:promisify(destroy.async),connections,send:promisify(send.async)};
    return ndi;
  }catch(error){
    console.error('Could not load NDI:',error);
    throw new Error('Could not load the NDI runtime. Check the NDI Tools installation.');
  }
}

function createSender(){
  const {create,destroy,connections,send}=loadNdi();
  const sender=create({p_ndi_name:SOURCE_NAME,p_groups:null,clock_video:false,clock_audio:false});
  if(!sender)throw new Error('Could not create the NDI source.');
  return {
    hasReceiver:()=>connections(sender,0)>0,
    close:()=>destroy(sender),
    send:(width,height,pixels)=>send(sender,{
      xres:width,yres:height,FourCC:0x58524742, // BGRX
      frame_rate_N:FRAME_RATE,frame_rate_D:1,picture_aspect_ratio:0,frame_format_type:1, // progressive
      timecode:0x7fffffffffffffffn, // NDI synthesizes timecode
      p_data:pixels,line_stride_in_bytes:width*4,p_metadata:null,timestamp:0
    })
  };
}

function createNdiOutput(onStateChange){
  let state={supported:SUPPORTED,phase:'off',message:''};
  let run;
  function update(phase,message=''){
    state={supported:SUPPORTED,phase,message};
    onStateChange(state);
  }
  function stop(message=''){
    if(!run)return Promise.resolve(state);
    if(run.stopping)return run.stopping;
    const current=run;
    clearTimeout(current.timer);
    current.stopping=Promise.resolve(current.inFlight).catch(()=>{}).then(()=>current.sender.close())
      .catch(error=>{console.error('Could not close NDI:',error);})
      .then(()=>{
        run=null;
        update('off',message);
        return state;
      });
    update('stopping');
    return current.stopping;
  }
  function start(getWindow){
    if(!SUPPORTED||run)return state;
    try{
      const win=getWindow();
      const sender=createSender();
      const current={sender,lastFrame:performance.now()};
      run=current;
      async function capture(){
        if(win.isDestroyed())throw new Error('Audience window closed. NDI output stopped.');
        if(state.phase==='live'&&!sender.hasReceiver()){
          current.lastFrame=performance.now();
          return;
        }
        const image=await win.capturePage(undefined,{stayHidden:true});
        if(current.stopping)return;
        if(image.isEmpty()){
          if(performance.now()-current.lastFrame>5000)throw new Error('NDI could not capture the audience window.');
          return;
        }
        const {width,height}=image.getSize();
        const scale=Math.min(1,1920/width,1080/height);
        const frameWidth=Math.max(2,Math.floor(width*scale/2)*2);
        const frameHeight=Math.max(2,Math.floor(height*scale/2)*2);
        const frame=frameWidth===width&&frameHeight===height?image:image.resize({width:frameWidth,height:frameHeight,quality:'good'});
        const pixels=frame.toBitmap();
        if(pixels.length!==frameWidth*frameHeight*4)throw new Error('NDI received an unexpected audience window bitmap size.');
        await sender.send(frameWidth,frameHeight,pixels);
        current.lastFrame=performance.now();
        if(!current.stopping&&state.phase==='starting')update('live',SOURCE_NAME+' is available on the local network.');
      }
      function tick(){
        const started=performance.now();
        current.inFlight=capture();
        current.inFlight.then(()=>{
          if(!current.stopping)current.timer=setTimeout(tick,Math.max(0,1000/FRAME_RATE-(performance.now()-started)));
        },error=>{
          console.error('NDI output stopped:',error);
          void stop(error.message);
        });
      }
      update('starting');
      tick();
    }catch(error){
      update('off',error.message);
    }
    return state;
  }
  return {start,stop,getState:()=>state,isRunning:()=>!!run};
}

module.exports={createNdiOutput};
