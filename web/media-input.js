// Browser permission prompts cannot be forcibly dismissed; discard late streams.
export function requestLocalMedia(constraints,{timeoutMs=15000,signal}={}){
  const label=constraints?.video?(constraints?.audio?'Camera and microphone':'Camera'):'Microphone';
  const error=(name,message)=>Object.assign(new Error(message),{name});
  return new Promise((resolve,reject)=>{
    let settled=false,timer;
    const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
    const finish=(value,failed=false)=>{if(settled)return;settled=true;cleanup();failed?reject(value):resolve(value);};
    const abort=()=>finish(error('AbortError',label+' request cancelled.'),true);
    if(signal?.aborted){abort();return;}
    const media=globalThis.navigator?.mediaDevices;
    if(!media?.getUserMedia){finish(error('NotSupportedError',label+' input is unavailable in this application.'),true);return;}
    signal?.addEventListener('abort',abort,{once:true});
    const duration=Number.isFinite(Number(timeoutMs))?Math.max(1,Number(timeoutMs)):15000;
    timer=setTimeout(()=>finish(error('TimeoutError',label+' request timed out. Check system permissions, then try again.'),true),duration);
    try{
      Promise.resolve(media.getUserMedia(constraints)).then(stream=>{
        if(settled){for(const track of stream?.getTracks?.()||[])try{track.stop();}catch{}return;}
        finish(stream);
      },cause=>finish(cause,true));
    }catch(cause){finish(cause,true);}
  });
}
