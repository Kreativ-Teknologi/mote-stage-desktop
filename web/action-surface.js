const numeric=(value,fallback=0)=>{
  try {const number=Number(value);return Number.isFinite(number)?number:fallback;}catch{return fallback;}
};
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,numeric(value)));

// Positive radial movement keeps the facial rig inside the refracting shell.
// Calm is also used to relax the existing procedural displacement, rather than
// inventing an extra visible layer for the neutral action.
export const ACTION_SURFACE_PROFILES=Object.freeze({
  neutral:Object.freeze({calm:1}),
  curious:Object.freeze({ripple:.55,asymmetry:.95,swirl:.12}),
  joy:Object.freeze({swell:.22,ripple:.12,asymmetry:.05}),
  angry:Object.freeze({spike:1,ripple:.12,shiver:.20}),
  sad:Object.freeze({droop:.30,swell:.10,calm:.60}),
  afraid:Object.freeze({shiver:1,spike:.16,ripple:.15}),
  thinking:Object.freeze({swirl:1,calm:.25,asymmetry:.20}),
  listening:Object.freeze({swell:.15,ripple:.65,calm:.55})
});
const KEYS=['spike','ripple','droop','swell','shiver','calm','swirl','asymmetry'];
const idle=()=>({spike:0,ripple:0,droop:0,swell:0,shiver:0,calm:0,swirl:0,asymmetry:0,time:0,a:[0,0,0,0],b:[0,0,0,0],baseMotion:1});

/** An action's existing envelope controls the whole surface performance. */
export function actionSurfacePose(action,amount=1){
  const profile=action?.kind==='expression'&&Object.hasOwn(ACTION_SURFACE_PROFILES,action.name)?ACTION_SURFACE_PROFILES[action.name]:null;
  if(!profile)return idle();
  const elapsed=Math.max(0,numeric(action.elapsed));
  if((action.remaining!==undefined&&numeric(action.remaining)<=0)||
    (action.duration!==undefined&&elapsed>=Math.max(0,numeric(action.duration))))return idle();
  const weight=clamp(action.weight)*clamp(amount,0,1.5);
  if(!weight)return idle();
  const pose=Object.fromEntries(KEYS.map(key=>[key,(profile[key]||0)*weight]));
  pose.time=Math.min(1e4,elapsed/1000);
  pose.a=KEYS.slice(0,4).map(key=>pose[key]);
  pose.b=KEYS.slice(4).map(key=>pose[key]);
  pose.baseMotion=1-clamp(pose.calm)*.85;
  return pose;
}

/**
 * Seamless spherical fields. Include this in the shared core/shell vertex shader,
 * and evaluate the same function at the normal's two finite-difference samples.
 * uActionA = (spike, ripple, droop, swell)
 * uActionB = (shiver, calm, swirl, asymmetry)
 */
export const actionSurfaceGLSL=/* glsl */`
  uniform vec4 uActionA,uActionB;
  uniform float uActionTime;
  float actionSurfaceDisplacement(vec3 p){
    if(dot(abs(uActionA),vec4(1.))+abs(uActionB.x)+abs(uActionB.z)+abs(uActionB.w)<.000001)return 0.;
    float t=uActionTime;
    float seed=.5+.5*sin(p.x*14.+p.y*4.+t*.31)
      *sin(p.y*13.1-p.z*5.-t*.23)*sin(p.z*12.5+p.x*3.+t*.19);
    float spikes=pow(seed,6.);
    float ripple=.5+.5*sin(p.y*8.+p.x*3.-p.z*2.-t*2.1);
    float lower=pow(max(0.,-p.y),1.5)*(.78+.22*sin(p.z*3.+t*.55));
    float lobes=.5+.5*sin(p.x*3.1+t*1.8)*sin(p.y*3.6-p.z*2.2-t*1.3);
    float shiver=sin(p.x*22.+p.z*13.+t*26.)*sin(p.y*19.-p.z*7.-t*23.);
    // Three turns join exactly at the angular seam. The pole mask removes the
    // undefined azimuth at x=y=0, keeping normals continuous on the whole sphere.
    float pole=clamp(1.-p.z*p.z,0.,1.);
    float angle=atan(p.y,p.x+1.e-7);
    float swirl=(.5+.5*sin(angle*3.+p.z*7.-t*1.4))*pole;
    float asymmetric=max(0.,p.x)*(.5+.5*sin(p.y*3.+p.z*2.-t*.8));
    float raw=uActionA.x*.24*spikes+uActionA.y*.032*ripple
      +uActionA.z*.085*lower+uActionA.w*.067*lobes
      +uActionB.x*.013*shiver+uActionB.z*.055*swirl
      +uActionB.w*.060*asymmetric;
    // Smooth bounds preserve the optical surface and avoid hard clamped ridges.
    return raw>=0. ? .125*(1.-exp(-raw/.125)) : -.014*(1.-exp(raw/.014));
  }
`;

/** CPU reference for containment and continuity checks; no render dependency. */
export function actionSurfaceDisplacement(position,pose=idle()){
  const source=Array.isArray(position)?[position[0],position[1],position[2]]:[position?.x,position?.y,position?.z];
  let [x,y,z]=source.map(value=>numeric(value));
  const length=Math.hypot(x,y,z);
  if(length<1e-9){x=0;y=0;z=1;}else{x/=length;y/=length;z/=length;}
  const t=numeric(pose?.time);
  const c=key=>clamp(pose?.[key],0,1.5);
  const seed=.5+.5*Math.sin(x*14+y*4+t*.31)*Math.sin(y*13.1-z*5-t*.23)*Math.sin(z*12.5+x*3+t*.19);
  const spikes=seed**6;
  const ripple=.5+.5*Math.sin(y*8+x*3-z*2-t*2.1);
  const lower=Math.max(0,-y)**1.5*(.78+.22*Math.sin(z*3+t*.55));
  const lobes=.5+.5*Math.sin(x*3.1+t*1.8)*Math.sin(y*3.6-z*2.2-t*1.3);
  const shiver=Math.sin(x*22+z*13+t*26)*Math.sin(y*19-z*7-t*23);
  const pole=clamp(1-z*z);
  const swirl=(.5+.5*Math.sin(Math.atan2(y,x+1e-7)*3+z*7-t*1.4))*pole;
  const asymmetric=Math.max(0,x)*(.5+.5*Math.sin(y*3+z*2-t*.8));
  const raw=c('spike')*.24*spikes+c('ripple')*.032*ripple+c('droop')*.085*lower+c('swell')*.067*lobes+c('shiver')*.013*shiver+c('swirl')*.055*swirl+c('asymmetry')*.060*asymmetric;
  return raw>=0?.125*(1-Math.exp(-raw/.125)):-.014*(1-Math.exp(raw/.014));
}
