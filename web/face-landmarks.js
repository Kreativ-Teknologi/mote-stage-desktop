// MediaPipe's inner lip contour gives local openings that jawOpen alone misses.
export function measureLipOpenings(face){
  const distance=(a,b)=>{
    const p=face?.[a],q=face?.[b];
    if(!p||!q||![p.x,p.y,q.x,q.y].every(Number.isFinite))return null;
    return Math.hypot(p.x-q.x,p.y-q.y,(Number.isFinite(p.z)?p.z:0)-(Number.isFinite(q.z)?q.z:0));
  };
  const width=distance(61,291);
  if(!Number.isFinite(width)||width<.025)return {};
  const shapes={};
  for(const [key,a,b] of [['lipGap',13,14],['lipGapLeft',312,317],['lipGapRight',82,87]]){
    const gap=distance(a,b);
    if(Number.isFinite(gap))shapes[key]=Math.min(1,gap/width);
  }
  return shapes;
}
