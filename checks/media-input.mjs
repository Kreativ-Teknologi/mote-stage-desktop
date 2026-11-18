import assert from 'node:assert/strict';
import {requestLocalMedia} from '../web/media-input.js';
import {createWebcam} from '../web/webcam.js';
const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator'),originalWorker=globalThis.Worker;
const setMedia=getUserMedia=>Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia}},configurable:true});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const makeStream=()=>{let stopped=0;const track={stop(){stopped++;}};return{stream:{getTracks:()=>[track],getVideoTracks:()=>[track]},get stopped(){return stopped;}};};
try{
  const success=makeStream();let requested;
  setMedia(async constraints=>{requested=constraints;return success.stream;});
  const constraints={audio:true,video:false};assert.equal(await requestLocalMedia(constraints),success.stream);assert.equal(requested,constraints);assert.equal(success.stopped,0,'Successful input remains running');
  const denied=Object.assign(new Error('Permission denied'),{name:'NotAllowedError'});setMedia(async()=>{throw denied;});await assert.rejects(requestLocalMedia({video:true}),error=>error===denied,'Original browser failure is preserved');
  setMedia(()=>{throw denied;});await assert.rejects(requestLocalMedia({audio:true}),error=>error===denied,'Synchronous browser failures are rejected');
  const pending=deferred(),late=makeStream();setMedia(()=>pending.promise);
  await assert.rejects(requestLocalMedia({video:true},{timeoutMs:8}),error=>error.name==='TimeoutError'&&/Camera request timed out/.test(error.message));
  pending.resolve(late.stream);await flush();assert.equal(late.stopped,1,'A camera granted after timeout is immediately released');
  const cancelled=deferred(),cancelStream=makeStream(),controller=new AbortController();setMedia(()=>cancelled.promise);
  const request=requestLocalMedia({audio:true},{signal:controller.signal});controller.abort();await assert.rejects(request,{name:'AbortError'});cancelled.resolve(cancelStream.stream);await flush();assert.equal(cancelStream.stopped,1,'A microphone granted after cancellation is released');
  let calls=0;setMedia(()=>{calls++;return Promise.resolve(success.stream);});await assert.rejects(requestLocalMedia({audio:true},{signal:AbortSignal.abort()}),{name:'AbortError'});assert.equal(calls,0,'Already-cancelled requests do not open devices');
  const failedLate=deferred();setMedia(()=>failedLate.promise);await assert.rejects(requestLocalMedia({audio:true},{timeoutMs:8}),{name:'TimeoutError'});failedLate.reject(denied);await flush();
  Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});await assert.rejects(requestLocalMedia({video:true}),{name:'NotSupportedError'});
  // Cancellation also settles webcam startup while permission, video or model is pending.
  const permission=deferred(),permissionStream=makeStream();setMedia(()=>permission.promise);
  const video={srcObject:null,play:async()=>{},readyState:0},status={textContent:''};const webcam=createWebcam(video,status);
  let start=webcam.start();assert.equal(webcam.starting,true);webcam.stop();assert.equal(await start,false);assert.equal(webcam.starting,false);permission.resolve(permissionStream.stream);await flush();assert.equal(permissionStream.stopped,1);
  const play=deferred(),playing=makeStream();setMedia(async()=>playing.stream);video.play=()=>play.promise;
  start=webcam.start();await flush();assert.match(status.textContent,/video/);webcam.stop();assert.equal(await start,false,'Never-settling video.play can be cancelled');assert.equal(playing.stopped,1);play.reject(new Error('Video detached'));await flush();
  let worker;globalThis.Worker=class{constructor(){worker=this;}postMessage(){}terminate(){this.terminated=true;}};
  const modelStream=makeStream();setMedia(async()=>modelStream.stream);video.play=async()=>{};
  start=webcam.start();await flush();assert.ok(worker);assert.equal(webcam.starting,true);webcam.stop();assert.equal(await start,false,'Never-settling tracker init can be cancelled');assert.ok(worker.terminated);assert.equal(modelStream.stopped,1);
  worker.onmessage({data:{type:'ready'}});assert.equal(webcam.active,false,'Late worker events cannot restart cancelled tracking');assert.equal(status.textContent,'Camera off');
  globalThis.Worker=class{constructor(){worker=this;}postMessage(){queueMicrotask(()=>this.onmessage({data:{type:'ready'}}));}terminate(){}};
  const recovered=makeStream();setMedia(async constraints=>{requested=constraints;return recovered.stream;});
  assert.equal(await webcam.start('integrated-camera'),true,'Camera can start again after cancelling startup');
  assert.deepEqual(requested,{video:{width:{ideal:640},height:{ideal:480},deviceId:{exact:'integrated-camera'}},audio:false},'An explicit input bypasses the system default');
  assert.equal(webcam.starting,false);assert.equal(webcam.active,true);webcam.stop();assert.equal(recovered.stopped,1);
}finally{
  if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
  if(originalWorker===undefined)delete globalThis.Worker;else globalThis.Worker=originalWorker;
}
console.log('Verified bounded media permission requests, original failures, late-stream cleanup, cancellation during camera/video/model startup and successful recovery.');
