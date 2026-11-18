// surfacePoint is supplied by the renderer and evaluates the complete displaced
// 3D surface, including body shape, waves, voice and breathing.
export const surfaceFrameGLSL=/* glsl */`
  vec3 radialSurfaceNormal(vec3 p,float radius){
    vec3 axis=abs(p.y)<.88?vec3(0.,1.,0.):vec3(1.,0.,0.);
    vec3 T=normalize(cross(axis,p)),B=normalize(cross(p,T));
    float e=.004;
    vec3 alongT=surfacePoint(normalize(p+T*e)*radius)-surfacePoint(normalize(p-T*e)*radius);
    vec3 alongB=surfacePoint(normalize(p+B*e)*radius)-surfacePoint(normalize(p-B*e)*radius);
    vec3 N=normalize(cross(alongT,alongB));
    return dot(N,p)<0.?-N:N;
  }
`;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>{const length=Math.hypot(...v);return length>1e-9?v.map(x=>x/length):[0,0,1];};
// Reference used to validate true displaced-surface normals against analytical
// ellipsoids. This does not approximate a sphere's normal by changing its slope.
export function radialSurfaceNormal(direction,radiusAt,epsilon=.004){
  const p=unit(direction),axis=Math.abs(p[1])<.88?[0,1,0]:[1,0,0];
  const T=unit(cross(axis,p)),B=unit(cross(p,T));
  const point=q=>{q=unit(q);return q.map(n=>n*radiusAt(q));};
  const tangent=t=>{const plus=point(p.map((n,i)=>n+t[i]*epsilon)),minus=point(p.map((n,i)=>n-t[i]*epsilon));return plus.map((n,i)=>n-minus[i]);};
  let normal=unit(cross(tangent(T),tangent(B)));
  if(normal.reduce((sum,n,i)=>sum+n*p[i],0)<0)normal=normal.map(n=>-n);
  return normal;
}
