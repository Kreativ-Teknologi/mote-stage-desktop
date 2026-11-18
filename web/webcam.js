import {normalizeActorSample,createTrackingFilter,createCalibrationCapture,sanitizeCalibration} from './actor-calibration.js';
import {requestLocalMedia} from './media-input.js';
function waitForStartup(promise,signal,timeoutMs,message){
  return new Promise((resolve,reject)=>{
    let timer;const cleanup=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);};
    const abort=()=>{cleanup();reject(Object.assign(new Error('Camera request cancelled.'),{name:'AbortError'}));};
    if(signal.aborted){Promise.resolve(promise).catch(()=>{});abort();return;}
    signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{cleanup();reject(Object.assign(new Error(message),{name:'TimeoutError'}));},timeoutMs);
    Promise.resolve(promise).then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
  });
}
// Camera frames stay on this device; only animation values reach the stage tab.
export function createWebcam(video,status){
  let worker,stream,active=false,starting=false,startupController=null,busy=false,last=0,sample=null,raw=null,seen=0,origin=null,positionOrigin=null,generation=0;
  let calibration=null,capture=null,calibrationStatus='Capture a relaxed face to personalize tracking.';
  const filter=createTrackingFilter();
  function stop(){generation++;startupController?.abort();startupController=null;starting=false;active=false;busy=false;sample=null;raw=null;origin=null;positionOrigin=null;capture=null;filter.reset();worker?.terminate();worker=null;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;status.textContent='Camera off';calibrationStatus=calibration?'Calibration retained. Enable webcam to track.':'Enable webcam and find your face before calibrating.';}
  function acceptCapture(result){
    if(!result.done)return;
    capture=null;
    if(result.error){calibrationStatus=result.error;return;}
    calibration=sanitizeCalibration(result.calibration);origin=null;filter.reset();
    calibrationStatus=Object.keys(result.calibration.ranges||{}).length?'Expressive range captured. Save this actor profile.':'Relaxed face captured. Optionally capture expressive range, then save.';
  }
  function beginCapture(kind){
    if(!active||!raw||performance.now()-seen>350){calibrationStatus='A tracked face must be visible before capture.';return false;}
    try{capture=createCalibrationCapture(kind,calibration,performance.now());calibrationStatus=kind==='neutral'?'Hold still, relax your mouth, and keep your eyes open…':'Blink, smile, raise brows and open your mouth comfortably…';return true;}
    catch(error){calibrationStatus=error.message;return false;}
  }
  function centerHead(){if(active&&raw&&performance.now()-seen<350){origin={yaw:raw.yaw,pitch:raw.pitch,roll:raw.roll,position:raw.position?{...raw.position}:null};filter.reset();status.textContent='Head centered';return true;}status.textContent='Find your face before centering';return false;}
  async function start(deviceId=''){
    stop();const run=generation,controller=new AbortController();startupController=controller;starting=true;status.textContent='Requesting camera access…';
    try{
      const input=deviceId?{deviceId:{exact:deviceId}}:{facingMode:'user'};
      const camera=await requestLocalMedia({video:{width:{ideal:640},height:{ideal:480},...input},audio:false},{signal:controller.signal});
      if(run!==generation){camera.getTracks().forEach(t=>t.stop());return false;}
      stream=camera;video.srcObject=stream;status.textContent='Starting camera video…';await waitForStartup(video.play(),controller.signal,10000,'Camera video did not start. Try enabling the webcam again.');if(run!==generation)return false;
      status.textContent='Loading face tracker…';
      worker=new Worker(new URL('./face-worker.js',import.meta.url));
      await waitForStartup(new Promise((resolve,reject)=>{
        worker.onerror=e=>{const message=e.message||'Face tracker failed';reject(new Error(message));if(active){stop();status.textContent='Tracking stopped: '+message;}};
        worker.onmessage=({data})=>{
          if(run!==generation)return;
          if(data.type==='ready'){active=true;status.textContent='Find your face in the camera';resolve();}
          if(data.type==='error'){reject(new Error(data.message));if(active){stop();status.textContent='Tracking stopped: '+data.message;}}
          if(data.type==='result'){
            busy=false;const now=performance.now();
            if(data.sample){
              raw=data.sample;seen=now;if(!positionOrigin&&raw.position)positionOrigin={...raw.position};
              if(capture)acceptCapture(capture.add(raw,now));
              sample=filter.update(normalizeActorSample(raw,calibration,origin,positionOrigin),now);
              status.textContent='Tracking head · facial override is optional';
            }else{
              raw=null;sample=null;status.textContent='Face not in view';
              if(capture&&now-seen>350){capture=null;calibrationStatus='Face lost during capture. Keep your face visible and try again.';}
            }
          }
        };
        worker.postMessage({type:'init'});
      }),controller.signal,45000,'Face tracker loading timed out. Try enabling the webcam again.');
      if(run!==generation||!stream)return false;starting=false;startupController=null;stream.getVideoTracks()[0].onended=()=>stop();return true;
    }catch(e){if(run===generation){stop();status.textContent='Camera unavailable: '+e.message;}return false;}
  }
  return {start,stop,
    calibrate:centerHead,centerHead,
    captureNeutral(){return beginCapture('neutral');},captureRange(){return beginCapture('range');},
    setCalibration(value){const next=sanitizeCalibration(value);if(!next)return false;calibration=next;capture=null;origin=null;filter.reset();calibrationStatus='Actor calibration loaded.';return true;},
    resetCalibration(){calibration=null;capture=null;origin=null;filter.reset();calibrationStatus='Using uncalibrated tracking. Saved profiles are retained.';},
    get calibration(){return calibration?JSON.parse(JSON.stringify(calibration)):null;},
    get calibrationStatus(){return capture?calibrationStatus+' '+Math.min(99,Math.floor((performance.now()-capture.startedAt)/capture.duration*100))+'%':calibrationStatus;},
    get calibrating(){return !!capture;},get hasFace(){return active&&!!raw&&performance.now()-seen<350;},
    get active(){return active;},get starting(){return starting;},
    tick(now){
      if(capture&&now-seen>600){capture=null;calibrationStatus='Face lost during capture. Keep your face visible and try again.';}
      if(active&&!busy&&now-last>66&&video.readyState>=2){
        busy=true;last=now;const run=generation;
        createImageBitmap(video).then(frame=>{if(run!==generation||!worker){frame.close();return;}worker.postMessage({type:'frame',frame,time:now},[frame]);}).catch(()=>{busy=false;});
      }
      if(!active||!sample||now-seen>600)return null;
      return sample;
    }
  };
}
