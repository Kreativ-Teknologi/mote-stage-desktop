const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(v,a=-1,b=1)=>Math.min(b,Math.max(a,finite(v)));
/** Webcam pose remains rotational by default; free mode adds calibrated stage translation. */
export function cameraHeadPose(camera,gesture={},{free=false,amount=1,tilt=0}={}){
  if(!camera&&!gesture.yaw&&!gesture.pitch)return null;
  const gain=clamp(amount,0,2);
  return {yaw:clamp(finite(camera?.yaw)+finite(gesture.yaw)),pitch:clamp(finite(camera?.pitch)+finite(gesture.pitch)),roll:camera?clamp(camera.roll):clamp(tilt),
    x:free?clamp(camera?.x)*gain*.65:0,y:free?clamp(camera?.y)*gain*.42:0,z:free?clamp(camera?.z)*gain*.24:0};
}

// Smooth the tracked anchor alone, then compose idle/expression offsets once.
// Feeding the previous rendered bob back into smoothing accumulates motion at
// high refresh rates and can carry the whole character out of frame.
export function createStagePosition(){
  const anchor={x:0,y:0,z:0};let held={...anchor};
  return {update({head=null,delta=1/60,time=0,intensity=1,bounce=0,frequency=1.8,freeze=false}={}){
    if(freeze)return {...held};
    const blend=1-Math.exp(-clamp(delta,0,.06)*9);
    for(const key of ['x','y','z'])anchor[key]+=(clamp(head?.[key],key==='x'?-1.3:key==='y'?-.84:-.48,key==='x'?1.3:key==='y'?.84:.48)-anchor[key])*blend;
    const strength=clamp(intensity,0,1),t=finite(time);
    held={...anchor,y:anchor.y+Math.sin(t*.82)*.006*strength+Math.sin(t*finite(frequency,1.8))*clamp(bounce,0,.15)*strength};
    return {...held};
  }};
}
