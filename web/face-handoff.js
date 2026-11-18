const smooth=(a,b,v)=>{const t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t);};
// One face leaves before the other illuminates. This avoids the brief four-eye
// or mouth-plus-loading-dot ghost produced by overlapping emissive volumes.
export function thinkingFaceHandoff(value=0){
  const face=Number.isFinite(value)?Math.min(1,Math.max(0,value)):0;
  return {normal:1-smooth(0,.48,face),thought:smooth(.52,1,face)};
}
