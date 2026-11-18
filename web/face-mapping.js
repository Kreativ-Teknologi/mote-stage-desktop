const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number(v)||0));
export function mapWebcamExpression(face,strength=1.8){
  const gain=clamp(strength,.5,3);
  const signal=name=>Math.pow(clamp((clamp(face?.[name])-.025)/.6*gain),.72);
  const smile=[signal('mouthSmileLeft'),signal('mouthSmileRight')];
  const frown=[signal('mouthFrownLeft'),signal('mouthFrownRight')];
  const down=[signal('browDownLeft'),signal('browDownRight')];
  const outer=[signal('browOuterUpLeft'),signal('browOuterUpRight')];
  const wide=[signal('eyeWideLeft'),signal('eyeWideRight')];
  const squint=[signal('eyeSquintLeft'),signal('eyeSquintRight')];
  const inner=signal('browInnerUp'),pucker=signal('mouthPucker');
  const average=a=>(a[0]+a[1])*.5;
  const jaw=clamp((clamp(face?.jawOpen)-.07)/.65*gain);
  return {
    width:1+average(smile)*.55-pucker*.48,
    curve:average(frown)*.25-average(smile)*.25,
    opening:Math.pow(jaw,.72)*.36,
    skew:(smile[0]-smile[1])*.05-(frown[0]-frown[1])*.05,
    bounce:.015+average(smile)*.025+average(wide)*.02,
    eyes:[0,1].map(i=>({
      width:1+smile[i]*.19+down[i]*.10-pucker*.10,
      height:clamp(1-smile[i]*.62-squint[i]*.42-frown[i]*.16+wide[i]*1.0+outer[i]*.22,.20,2),
      tilt:(i===0?-1:1)*(down[i]*.58-inner*.45-frown[i]*.34+smile[i]*.16),
      lift:inner*.045+outer[i]*.055-down[i]*.025
    }))
  };
}
