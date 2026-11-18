// Actor profiles contain coefficients and head offsets only. No camera images.
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,finite(v)))||0;
const clone=x=>JSON.parse(JSON.stringify(x));
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const keys=['jawOpen','eyeBlinkLeft','eyeBlinkRight','mouthSmileLeft','mouthSmileRight','mouthFrownLeft','mouthFrownRight','mouthPucker','browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight','eyeWideLeft','eyeWideRight','eyeSquintLeft','eyeSquintRight'];
export const CALIBRATION_KEYS=Object.freeze(keys);
export function sanitizeCalibration(input){
  if(!input?.neutral||input.version!==1)return null;
  const shapes={};for(const key of keys)shapes[key]=clamp(input.neutral.shapes?.[key],0,.8);
  const head={};for(const key of ['yaw','pitch','roll'])head[key]=clamp(input.neutral[key],-Math.PI,Math.PI);
  const ranges={};for(const key of keys)if(Number.isFinite(Number(input.ranges?.[key])))ranges[key]=clamp(input.ranges[key],shapes[key]+.18,1);
  const position=input.neutral.position?{x:clamp(input.neutral.position.x,-1,1),y:clamp(input.neutral.position.y,-1,1),scale:clamp(input.neutral.position.scale,.03,1)}:null;
  return {version:1,neutral:{...head,position,shapes},ranges,capturedAt:typeof input.capturedAt==='string'?input.capturedAt:''};
}
export function normalizeActorSample(sample,calibration,center=null,positionCenter=null){
  if(!sample)return null;
  const c=sanitizeCalibration(calibration),shapes={...sample.shapes};
  if(c)for(const key of keys){
    const base=c.neutral.shapes[key],maximum=c.ranges[key]??1;
    const canonical=c.ranges[key]!==undefined?(key.startsWith('eyeBlink')?.65:.7):1;
    shapes[key]=clamp((finite(shapes[key])-base)/Math.max(.18,maximum-base)*canonical);
  }
  const origin=center||c?.neutral;
  const positionOrigin=origin?.position||positionCenter;
  const x=positionOrigin&&sample.position?-2*(finite(sample.position.x)-positionOrigin.x):0,y=positionOrigin&&sample.position?2*(finite(sample.position.y)-positionOrigin.y):0;
  const z=positionOrigin?.scale&&sample.position?((finite(sample.position.scale,positionOrigin.scale)/positionOrigin.scale)-1)*.65:0;
  return {x:clamp(x,-1,1),y:clamp(y,-1,1),z:clamp(z,-1,1),yaw:clamp(-angle(finite(sample.yaw)-finite(origin?.yaw)),-1,1),pitch:clamp(angle(finite(sample.pitch)-finite(origin?.pitch)),-1,1),roll:clamp(-angle(finite(sample.roll)-finite(origin?.roll)),-1,1),shapes};
}
export function createTrackingFilter(){
  let previous=null,last=null;
  return {reset(){previous=null;last=null;},update(sample,now){
    if(!sample)return null;
    if(!previous||last===null||now-last>600){previous=clone(sample);previous.shapes??={};for(const key of ['yaw','pitch','roll','x','y','z'])previous[key]=finite(previous[key]);last=now;return clone(previous);}
    const dt=Math.min(.15,Math.max(0,(now-last)/1000));last=now;
    if(!dt)return clone(previous);
    for(const key of ['yaw','pitch','roll','x','y','z']){
      const value=finite(sample[key]),delta=value-previous[key],speed=Math.abs(delta)/dt;
      const tau=speed>.9?.035:.085,goal=Math.abs(delta)<.0025?previous[key]:value;
      const bounded=previous[key]+clamp(goal-previous[key],-dt*7,dt*7);
      previous[key]+=(bounded-previous[key])*(1-Math.exp(-dt/tau));
    }
    for(const [key,value] of Object.entries(sample.shapes||{})){
      const old=finite(previous.shapes[key]),blink=key.startsWith('eyeBlink');
      const tau=blink?(value>old?.018:.045):key==='jawOpen'?.035:.065;
      previous.shapes[key]=clamp(old+(finite(value)-old)*(1-Math.exp(-dt/tau)));
    }
    return clone(previous);
  }};
}
const percentile=(values,p)=>{const a=[...values].sort((a,b)=>a-b);return a[Math.min(a.length-1,Math.floor((a.length-1)*p))];};
export function createCalibrationCapture(kind,calibration,now){
  const previous=sanitizeCalibration(calibration);
  if(kind==='range'&&!previous)throw new Error('Capture a relaxed face first.');
  const duration=kind==='neutral'?1500:3500,frames=[];
  return {kind,duration,startedAt:now,add(sample,time){if(sample)frames.push(clone(sample));return this.finish(time);},finish(time){
    if(time-now>duration+1800&&frames.length<10)return {done:true,error:'Face was not visible long enough. Try again.'};
    if(time-now<duration)return {done:false,progress:clamp((time-now)/duration)};
    if(frames.length<10)return {done:false,progress:.95};
    if(kind==='neutral'){
      const head={};for(const key of ['yaw','pitch','roll']){
        const values=frames.map(s=>finite(s[key]));
        if(percentile(values,.9)-percentile(values,.1)>.16)return {done:true,error:'Keep your head still during relaxed-face capture.'};
        head[key]=percentile(values,.5);
      }
      const shapes=Object.fromEntries(keys.map(key=>[key,percentile(frames.map(s=>clamp(s.shapes?.[key])),.5)]));
      if(shapes.jawOpen>.32||shapes.eyeBlinkLeft>.35||shapes.eyeBlinkRight>.35)return {done:true,error:'Relax your mouth and keep both eyes open, then capture again.'};
      const positions=frames.filter(s=>s.position);const position=positions.length?Object.fromEntries(['x','y','scale'].map(key=>[key,percentile(positions.map(s=>finite(s.position[key])),.5)])):null;
      return {done:true,calibration:{version:1,neutral:{...head,position,shapes},ranges:{},capturedAt:new Date().toISOString()}};
    }
    const ranges={...previous.ranges};let expressive=0;
    for(const key of keys){const peak=percentile(frames.map(s=>clamp(s.shapes?.[key])),key.startsWith('eyeBlink')?.97:.9),base=previous.neutral.shapes[key];if(peak-base>.1){ranges[key]=Math.max(base+.18,peak);expressive++;}}
    return expressive?{done:true,calibration:{...previous,ranges}}:{done:true,error:'No expressive motion captured. Try blinking, smiling and opening your mouth.'};
  }};
}
export function createActorProfileStore(storage,newId=()=>crypto.randomUUID()){
  const key='nord-actor-profiles-v1',activeKey='nord-active-actor-v1',trashKey='nord-actor-profile-trash-v1';
  const read=(name,fallback)=>{try{return JSON.parse(storage.getItem(name)||'null')??fallback;}catch{return fallback;}};
  const write=(name,value)=>storage.setItem(name,JSON.stringify(value));
  const record=p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&sanitizeCalibration(p.calibration)?{id:p.id,name:p.name.slice(0,48),calibration:sanitizeCalibration(p.calibration)}:null;
  const list=()=>{const raw=read(key,[]);return Array.isArray(raw)?raw.map(record).filter(Boolean).slice(0,40):[];};
  return {list,
    save(name,calibration){name=String(name||'').trim().slice(0,48);const c=sanitizeCalibration(calibration);if(!name)throw new Error('Name this actor profile.');if(!c)throw new Error('Capture a relaxed face before saving.');
      const items=list(),existing=items.find(p=>p.name.toLowerCase()===name.toLowerCase());if(!existing&&items.length>=40)throw new Error('40 actor profiles maximum. Remove a profile first.');
      const next={id:existing?.id||newId(),name,calibration:c};if(existing)items[items.indexOf(existing)]=next;else items.unshift(next);write(key,items);return next;},
    remove(id){const items=list(),index=items.findIndex(p=>p.id===id);if(index<0)return null;const removed=items.splice(index,1)[0];write(trashKey,{record:removed,index});write(key,items);return removed;},
    undo(){const trash=read(trashKey,null),p=record(trash?.record);if(!p)return null;const items=list();if(!items.some(x=>x.id===p.id))items.splice(clamp(trash.index,0,items.length),0,p);write(key,items);write(trashKey,null);return p;},
    get canUndo(){return !!record(read(trashKey,null)?.record);},
    active(){const raw=read(activeKey,null),calibration=sanitizeCalibration(raw?.calibration);return calibration?{profileId:typeof raw.profileId==='string'?raw.profileId:'',calibration}:null;},
    activate(profileId,calibration){const c=sanitizeCalibration(calibration);write(activeKey,c?{profileId:profileId||'',calibration:c}:null);}
  };
}
