// Coherent whole-body silhouettes, layered separately from the established
// angry spikes and afraid shiver. Every shape is a deformed three-dimensional mesh.
const finite=(v,f=0)=>{try{const n=Number(v);return Number.isFinite(n)?n:f;}catch{return f;}};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,finite(v)));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const zero=()=>({shape:[0,0,0,0],body:[0,0,0,0],time:0,face:0,dots:[0,0,0],dotX:[0,0,0]});
export const BODY_FORMS=['round','triangle','square','star','hexagon','diamond','capsule'];
export const BODY_FORM_LABELS={round:'Circle',triangle:'Triangle',square:'Square',star:'Star',hexagon:'Hexagon',diamond:'Diamond',capsule:'Capsule'};
export function createBodyForm(){
  const baseForms=['square','triangle','star','hexagon','diamond','capsule'];
  const weights=baseForms.map(()=>0);
  return (name,delta,action,combo,comboWeight=0)=>{
    const blend=1-Math.exp(-clamp(delta,0,.1)*12);
    const approach=(value,target)=>Math.abs(target-value)<.0001?target:value+(target-value)*blend;
    const mix=BODY_FORMS.includes(combo)?clamp(comboWeight):0;
    const target=form=>Number(name===form)*(1-mix)+Number(combo===form)*mix;
    for(const [index,form] of baseForms.entries())weights[index]=approach(weights[index],target(form));
    const [square,triangle,star]=weights;
    const shape=action.shape.map(value=>value*(1-mix));
    const body=action.body.map((value,index)=>index===2?value*(1-mix):value);
    const remaining=1-clamp(shape.reduce((sum,value)=>sum+value,0)+(body[2]||0));
    const baseExtra=weights.slice(3);
    return {base:[square,triangle,star,0],baseExtra,extra:baseExtra.map(value=>value*remaining),body,shape:[shape[0]+square*remaining,shape[1]+triangle*remaining,shape[2]+star*remaining,shape[3]]};
  };
}
export const ACTION_BODY_HINTS={neutral:'Settle into a smooth sphere',curious:'An inquisitive, turning teardrop',joy:'A wide smile with softly arched eyes',angry:'Spikes rise around the glass',sad:'A soft cushion settling into a frown',afraid:'A nervous shiver through the glass',thinking:'Rounded square → triangle → sphere, with animated thinking dots',listening:'A round body with gentle listening ripples'};
export function actionBodyPose(action,amount=1){
  if(action?.kind!=='expression'||(!Object.hasOwn(ACTION_BODY_HINTS,action.name)&&action.name!=='crystal'))return zero();
  const elapsed=Math.max(0,finite(action.elapsed)),duration=Math.max(1,finite(action.duration,4000));
  if(elapsed>=duration||(action.remaining!==undefined&&finite(action.remaining)<=0))return zero();
  const envelope=clamp(finite(action.weight)/(action.mode==='blend'?.86:1));
  if(!envelope)return zero();
  const out=zero(),p=elapsed/duration;out.time=elapsed/1000;
  const w=envelope*clamp(amount,0,1.5);
  if(action.name==='thinking'){
    out.shape[0]=w*smooth(.04,.17,p)*(1-smooth(.34,.55,p));
    out.shape[1]=w*smooth(.34,.55,p)*(1-smooth(.73,.94,p));
    // Facial replacement is an explicit part of Thinking, including when the
    // optional body strength is zero. Normalize the blend envelope to fully hide
    // tracked eyes and speech, then restore them through the same release.
    out.face=envelope;
    const phase=(out.time%1.2)/1.2;
    out.dots=[1,smooth(.27,.34,phase),smooth(.59,.66,phase)];
    const reset=1-smooth(.88,1,phase);
    out.dots[1]*=reset;out.dots[2]*=reset;
    const center=(out.dots[1]+2*out.dots[2])/(1+out.dots[1]+out.dots[2]);
    out.dotX=out.dots.map((_,i)=>(i-center)*.17);
  }else if(action.name==='sad')out.shape[3]=w;
  else if(action.name==='curious')out.body[0]=w;
  else if(action.name==='listening')out.body[1]=w;
  else if(action.name==='crystal')out.body[2]=w;
  return out;
}
export const actionBodyGLSL=/* glsl */`
  uniform vec4 uActionShape,uActionBody;
  uniform vec3 uBodyFormExtra;
  uniform float uActionBodyTime;
  float actionBodyDisplacement(vec3 p){
    if(dot(abs(uActionShape),vec4(1.))+dot(abs(uActionBody),vec4(1.))+dot(abs(uBodyFormExtra),vec3(1.))<.000001)return 0.;
    float radial=length(p.xy);
    vec2 q=p.xy/max(radial,1.e-6);
    // Keep the forward optical window and facial volumes clear while reshaping
    // the complete silhouette and curved sides, front and back.
    float rim=pow(radial,8.);
    float square=.91/pow(max(1.e-6,pow(abs(q.x),8.)+pow(abs(q.y),8.)),.125);
    float a=max(0.,dot(q,vec2(.8660254,.5)));
    float b=max(0.,dot(q,vec2(-.8660254,.5)));
    float c=max(0.,-q.y);
    float triangle=.69/pow(max(1.e-6,pow(a,12.)+pow(b,12.)+pow(c,12.)),1./12.);
    float t=uActionBodyTime;
    float angle=atan(q.y,q.x+1.e-7);
    // Polar ray/edge intersection of a five-point star. Slightly softening the
    // folded angle rounds the tips without turning the arms into flower lobes.
    float folded=acos(clamp(cos((angle-1.5707963+sin(t*.9)*.018)*5.)*.995,-1.,1.))/5.;
    float outer=1.27,inner=.72,corner=.62831853;
    float star=outer*inner*sin(corner)/(inner*sin(corner)*cos(folded)+(outer-inner*cos(corner))*sin(folded));
    float cushion=.95/pow(max(1.e-6,pow(abs(q.x)/1.10,6.)+pow(abs(q.y)/.88,6.)),1./6.);
    float sad=cushion-1.+.045*max(0.,-q.y);
    float focus=dot(q,normalize(vec2(sin(t*.8)*.65,.9)));
    float curious=.22*focus*focus*focus+.045;
    float listening=.17*pow(abs(q.x),6.)*sin(t*4.-q.y*10.+q.x*.6);
    float facet=acos(clamp(cos((angle-1.5708)*6.)*.995,-1.,1.))/6.;
    float crystal=.92/cos(facet)-1.+.13*pow(abs(q.y),5.);
    float hexagon=.92/cos(acos(clamp(cos(angle*6.)*.994,-1.,1.))/6.)-1.;
    float diamond=1.23/(sqrt(q.x*q.x+.004)+sqrt(q.y*q.y+.004))-1.;
    float side=length(p.xz);
    float wall=1./max(.00001,side);
    float capsule=(wall*abs(p.y)<.44?wall:.44*abs(p.y)+sqrt(1.-.44*.44*side*side))-1.;
    return rim*(uActionShape.x*(square-1.)+uActionShape.y*(triangle-1.)
      +uActionShape.z*(star-1.)+uActionShape.w*sad
      +uActionBody.x*curious+uActionBody.y*listening+uActionBody.z*crystal
      +dot(uBodyFormExtra.xy,vec2(hexagon,diamond)))+uBodyFormExtra.z*capsule;
  }
`;
// CPU reference mirrors the GLSL for optical containment and shape timing checks.
export function actionBodyDisplacement(position,pose=zero()){
  let [x,y,z]=(Array.isArray(position)?position:[position?.x,position?.y,position?.z]).map(v=>finite(v));
  const n=Math.hypot(x,y,z)||1;x/=n;y/=n;z/=n;
  const r=Math.hypot(x,y),qx=x/Math.max(r,1e-6),qy=y/Math.max(r,1e-6),rim=r**8;
  const [square,triangle,joy,sad]=(pose?.shape||[]).map(v=>clamp(v,0,1.5));
  const [curious,listening,crystal]=(pose?.body||[]).map(v=>clamp(v,0,1.5));const t=finite(pose?.time);
  const sq=.91/Math.max(1e-6,Math.abs(qx)**8+Math.abs(qy)**8)**.125;
  const a=Math.max(0,.8660254*qx+.5*qy),b=Math.max(0,-.8660254*qx+.5*qy),c=Math.max(0,-qy);
  const tri=.69/Math.max(1e-6,a**12+b**12+c**12)**(1/12);
  const angle=Math.atan2(qy,qx+1e-7),folded=Math.acos(Math.max(-1,Math.min(1,Math.cos((angle-Math.PI/2+Math.sin(t*.9)*.018)*5)*.995)))/5;
  const outer=1.27,inner=.72,corner=Math.PI/5;
  const star=outer*inner*Math.sin(corner)/(inner*Math.sin(corner)*Math.cos(folded)+(outer-inner*Math.cos(corner))*Math.sin(folded));
  const cushion=.95/Math.max(1e-6,(Math.abs(qx)/1.10)**6+(Math.abs(qy)/.88)**6)**(1/6);
  const fx=Math.sin(t*.8)*.65,focus=(qx*fx+qy*.9)/Math.hypot(fx,.9);
  const listen=.17*Math.abs(qx)**6*Math.sin(t*4-qy*10+qx*.6);
  const facet=Math.acos(Math.cos((angle-1.5708)*6)*.995)/6;
  const cut=.92/Math.cos(facet)-1+.13*Math.abs(qy)**5;
  const [hexagon,diamond,capsule]=pose?.extra??[0,0,0];
  const hex=.92/Math.cos(Math.acos(Math.cos(angle*6)*.994)/6)-1;
  const gem=1.23/(Math.sqrt(qx*qx+.004)+Math.sqrt(qy*qy+.004))-1;
  const side=Math.hypot(x,z),wall=1/Math.max(.00001,side);
  const pill=(wall*Math.abs(y)<.44?wall:.44*Math.abs(y)+Math.sqrt(1-.44*.44*side*side))-1;
  return rim*((square||0)*(sq-1)+(triangle||0)*(tri-1)+(joy||0)*(star-1)+(sad||0)*(cushion-1+.045*Math.max(0,-qy))+(curious||0)*(.22*focus**3+.045)+(listening||0)*listen+(crystal||0)*cut+hexagon*hex+diamond*gem)+capsule*pill;
}
