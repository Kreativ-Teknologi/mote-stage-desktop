// Bounded 3D optical transport for the rounded liquid-glass meniscus.
// The captured source includes Nord's real eye/mouth meshes and the star field.
export const glassOpticsGLSL=/* glsl */`
  float glassEdge(float facing){
    return pow(clamp(1.-facing,0.,1.),.7);
  }
  float glassReflectionWindow(float facing){
    return smoothstep(.08,.55,1.-clamp(facing,0.,1.));
  }
  vec3 glassInteriorHit(vec3 origin,vec3 direction,float faceRadius,float depth,float facing){
    float edge=glassEdge(facing);
    float gap=max(.025,length(origin)-faceRadius);
    // A shallow clear center rolls into a thicker, rounded optical edge.
    float thickness=gap+.055+edge*(.30+.22*depth);
    float inward=max(.35,-dot(normalize(origin),direction));
    float path=thickness/inward;
    // Bound the path to this volume. No discriminant-miss branch or UV snap.
    float exitDistance=max(.001,-2.*dot(origin,direction));
    return origin+direction*min(path,exitDistance*.72);
  }
`;

// Reference model used by the numerical continuity/containment checks.
export function glassInteriorHit(origin,direction,faceRadius,depth,facing){
  const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0),radius=Math.hypot(...origin);
  const edge=Math.max(0,Math.min(1,1-facing))**.7;
  const gap=Math.max(.025,radius-faceRadius);
  const thickness=gap+.055+edge*(.30+.22*depth);
  const inward=Math.max(.35,-dot(origin.map(x=>x/radius),direction));
  const exitDistance=Math.max(.001,-2*dot(origin,direction));
  const distance=Math.min(thickness/inward,exitDistance*.72);
  return origin.map((x,i)=>x+direction[i]*distance);
}
