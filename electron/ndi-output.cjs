const {existsSync}=require('node:fs');
const path=require('node:path');
const {promisify}=require('node:util');

const SOURCE_NAME='MOTE Stage';
const FRAME_RATE=30;
const SUPPORTED=process.platform==='win32'&&process.arch==='x64'||process.platform==='darwin'&&['arm64','x64'].includes(process.arch);
let ndi;

function loadNdi(){
  if(ndi)return ndi;
  const mac=process.platform==='darwin';
  const directories=[
    process.env.NDI_RUNTIME_DIR_V6,
    process.env.NDI_RUNTIME_DIR_V5,
    ...(mac?['/usr/local/lib']: [process.env.ProgramFiles&&path.join(process.env.ProgramFiles,'NDI','NDI 6 Tools','Runtime')])
  ];
  const filenames=mac?['libndi.dylib','libndi.6.dylib','libndi.5.dylib']:['Processing.NDI.Lib.x64.dll'];
  const candidates=new Set(directories.filter(dir=>dir&&path.isAbsolute(dir))
    .flatMap(dir=>filenames.map(filename=>path.join(dir,filename))).filter(existsSync));
  if(!candidates.size)throw new Error(mac?'Install the NDI Runtime for macOS to start NDI output.':'Install NDI Tools for Windows to start NDI output.');
  for(const candidate of candidates)try{
    const koffi=require('koffi');
    const library=koffi.load(candidate);
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
    console.error('Could not load NDI:',candidate,error);
  }
  throw new Error(mac?'Could not load the NDI runtime. Install a version that matches this Mac build.':'Could not load the NDI runtime. Check the NDI Tools installation.');
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
  let run,size=null;
  function setSize(next){
    if(next===null){size=null;return;}
    const {width,height}=next??{};
    const valid=(value,max)=>Number.isInteger(value)&&value>=16&&value<=max&&value%2===0;
    if(!valid(width,3840)||!valid(height,2160)){
      throw new Error('Choose even NDI dimensions from 16 × 16 up to 3840 × 2160.');
    }
    if(size?.width!==width||size?.height!==height)size={width,height};
  }
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
        if(state.phase==='live'&&current.frameSize===size&&!sender.hasReceiver()){
          current.lastFrame=performance.now();
          return;
        }
        const image=await win.capturePage(undefined,{stayHidden:true});
        if(current.stopping)return;
        if(image.isEmpty()){
          if(performance.now()-current.lastFrame>5000)throw new Error('NDI could not capture the audience window.');
          return;
        }
        const bitmapScale=image.getScaleFactors()[0]??1;
        const {width,height}=image.getSize(bitmapScale);
        const frameSize=size;
        const scale=Math.min(frameSize?Infinity:1,(frameSize?.width??1920)/width,(frameSize?.height??1080)/height);
        const round=frameSize?Math.round:Math.floor;
        const pictureWidth=Math.max(2,round(width*scale/2)*2);
        const pictureHeight=Math.max(2,round(height*scale/2)*2);
        const needsResize=pictureWidth!==width||pictureHeight!==height;
        const frame=needsResize?image.resize({width:Math.max(1,Math.round(pictureWidth/bitmapScale)),height:Math.max(1,Math.round(pictureHeight/bitmapScale)),quality:'good'}):image;
        const frameScale=frame.getScaleFactors()[0]??1;
        const actual=frame.getSize(frameScale);
        const pixels=frame.toBitmap({scaleFactor:frameScale});
        const pictureWidthActual=actual.width,pictureHeightActual=actual.height;
        if(pixels.length!==pictureWidthActual*pictureHeightActual*4)throw new Error('NDI received an unexpected audience window bitmap size.');
        const frameWidth=frameSize?.width??(pictureWidthActual+pictureWidthActual%2),frameHeight=frameSize?.height??(pictureHeightActual+pictureHeightActual%2);
        let outputPixels=pixels;
        if(frameWidth!==pictureWidthActual||frameHeight!==pictureHeightActual){
          const pictureStride=pictureWidthActual*4,frameStride=frameWidth*4;
          const bytes=frameStride*frameHeight;
          if(current.padded?.length!==bytes)current.padded=Buffer.allocUnsafe(bytes);
          outputPixels=current.padded;
          // Match the backing color at the corners so a keyed blackout covers the padding.
          const corner=pixels.readUInt32LE(0);
          const solidCorners=[pictureStride-4,pixels.length-pictureStride,pixels.length-4]
            .every(offset=>pixels.readUInt32LE(offset)===corner);
          outputPixels.fill(solidCorners?pixels.subarray(0,4):0);
          const offset=Math.max(0,Math.floor((frameHeight-pictureHeightActual)/2))*frameStride+Math.max(0,Math.floor((frameWidth-pictureWidthActual)/2))*4;
          for(let row=0;row<Math.min(frameHeight,pictureHeightActual);row++){
            pixels.copy(outputPixels,offset+row*frameStride,row*pictureStride,row*pictureStride+Math.min(frameStride,pictureStride));
          }
        }else current.padded=null;
        await sender.send(frameWidth,frameHeight,outputPixels);
        current.frameSize=frameSize;
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
  return {start,stop,setSize,getState:()=>state,isRunning:()=>!!run};
}

module.exports={createNdiOutput};
