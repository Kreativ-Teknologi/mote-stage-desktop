import {actionBodyPose} from './action-body.js';
import {actionSurfacePose} from './action-surface.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number.isFinite(n)?n:0));
const settle=(value,target,blend)=>Math.abs(target-value)<.00001?target:value+(target-value)*blend;
const smooth=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
// Retain the rendered pose between button presses. Blink/jaw tracking remain
// independent. Procedural time keeps moving forward across action replacement.
export function createCharacterPerformance(){
  const shape=[0,0,0,0],body=[0,0,0,0],a=[0,0,0,0],b=[0,0,0,0],dots=[0,0,0];
  let face=0,time=0;
  function pose(){
    const total=dots.reduce((sum,n)=>sum+n,0),center=total?dots.reduce((sum,n,i)=>sum+n*i,0)/total:0;
    return {surface:{a:[...a],b:[...b],time},body:{shape:[...shape],body:[...body],face,dots:[...dots],dotX:dots.map((_,i)=>(i-center)*.17),time}};
  }
  return {update(action,amount=1,delta=1/60,performanceTime){
    const dt=clamp(delta,0,.1);if(!dt)return pose();
    const blend=1-Math.exp(-dt*18);
    const nextBody=actionBodyPose(action,amount),nextSurface=actionSurfacePose(action,amount);
    for(const [current,target] of [[shape,nextBody.shape],[body,nextBody.body],[a,nextSurface.a],[b,nextSurface.b]]){
      for(let i=0;i<4;i++)current[i]=settle(current[i],target[i],blend);
    }
    let faceTarget=nextBody.face;
    const thinking=action?.kind==='expression'&&action.name==='thinking'&&action.elapsed<action.duration&&action.remaining>0;
    if(thinking&&action.elapsed<180){
      // The face has its own smooth handoff. Remove the body's duplicate attack
      // envelope so retriggering Thinking cannot flash the normal eyes back on.
      const attack=smooth(action.elapsed/180);
      faceTarget=attack>1e-6?clamp(faceTarget/attack,0,1):face;
    }
    face=settle(face,faceTarget,1-Math.exp(-dt*22));
    for(let i=0;i<3;i++)dots[i]=settle(dots[i],nextBody.dots[i],1-Math.exp(-dt*28));
    time=Number.isFinite(performanceTime)&&performanceTime>=0?performanceTime:time+dt;
    return pose();
  }};
}
