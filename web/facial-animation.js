const finite=(v,f=0)=>{try{const n=Number(v);return Number.isFinite(n)?n:f;}catch{return f;}};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,finite(v)));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
// Rounded smile arcs come from the existing expression mapping. Other actions
// retain their approved eye contours, with no pupils, lashes or extra outlines.
export function eyeContourCurve({trackedCurve=null,emotion='neutral',action=null,height=1,openness=1}={}){
  let curve=trackedCurve===null?(emotion==='joy'?.024:0):clamp(-finite(trackedCurve)*.1,0,.026);
  if(action?.kind==='expression'){
    const weight=clamp(action.weight),goal=action.name==='joy'?.024:0;
    curve+=(goal-curve)*weight;
  }
  return Math.min(curve,.135*clamp(height,.002,2)*.5)*clamp(openness);
}
export function actionGaze(action){
  const zero={x:0,y:0};
  if(action?.kind!=='gesture'||!['look-left','look-right','nod'].includes(action.name))return zero;
  const elapsed=finite(action.elapsed),duration=Math.max(1,finite(action.duration,4000));
  if(elapsed<0||elapsed>=duration||(action.remaining!==undefined&&finite(action.remaining)<=0))return zero;
  const t=elapsed/1000,w=clamp(action.weight);
  const lead=smooth(0,.11,t)*(1-smooth(.23,.85,t))*w;
  if(!lead)return zero;
  return action.name==='nod'?{x:0,y:-.010*lead}:{x:(action.name==='look-left'?-1:1)*.028*lead,y:0};
}
export function createGazeDriver(){
  let x=0,y=0;
  return {update(action,delta){
    const target=actionGaze(action),blend=1-Math.exp(-clamp(delta,0,.1)*24);
    if(blend){x+=(target.x-x)*blend;y+=(target.y-y)*blend;}
    if(Math.abs(x)<1e-6&&target.x===0)x=0;if(Math.abs(y)<1e-6&&target.y===0)y=0;
    return {x,y};
  }};
}
