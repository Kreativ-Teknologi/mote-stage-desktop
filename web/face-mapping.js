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
  const pair=name=>[signal(name+'Left'),signal(name+'Right')];
  const stretch=pair('mouthStretch'),dimple=pair('mouthDimple'),upper=pair('mouthUpperUp'),lower=pair('mouthLowerDown');
  const press=pair('mouthPress'),cheekSquint=pair('cheekSquint');
  const lookIn=pair('eyeLookIn'),lookOut=pair('eyeLookOut'),lookUp=pair('eyeLookUp'),lookDown=pair('eyeLookDown');
  const puff=signal('cheekPuff'),seal=signal('mouthClose');
  const average=a=>(a[0]+a[1])*.5;
  const jaw=clamp((clamp(face?.jawOpen)-.07)/.65*gain);
  const gap=clamp((clamp(face?.lipGap)-.10)*gain);
  const sideGap=clamp((clamp(face?.lipGapLeft)-clamp(face?.lipGapRight))*gain,-1,1);
  const corner=smile.map((value,i)=>.095*value-.07*frown[i]+.026*dimple[i]);
  return {
    cheek:[0,1].map(i=>clamp(puff+.26*smile[i]+.23*cheekSquint[i])),
    shift:clamp(.105*(signal('mouthRight')-signal('mouthLeft'))+.048*(signal('jawRight')-signal('jawLeft')),-.115,.115),
    apertureBias:clamp(.52*(upper[1]-upper[0]+lower[1]-lower[0])-.92*sideGap,-.62,.62),
    width:1+average(smile)*.55+average(stretch)*.40-pucker*.48,
    curve:average(frown)*.25-average(smile)*.25,
    opening:Math.pow(Math.max(jaw*(1-.85*seal),gap),.72)*.36*(1-.70*average(press))*(1-.88*puff*(1-gap)),
    skew:corner[1]-corner[0],
    bounce:.015+average(smile)*.025+average(wide)*.02,
    eyes:[0,1].map(i=>({
      x:(i===0?1:-1)*.052*(lookIn[i]-lookOut[i]),
      y:.066*(lookUp[i]-lookDown[i]),
      width:1+smile[i]*.19+down[i]*.10-pucker*.10,
      height:clamp(1-smile[i]*.62-squint[i]*.42-cheekSquint[i]*.32-puff*.16-frown[i]*.16+wide[i]*1.0+outer[i]*.22,.20,2),
      tilt:(i===0?-1:1)*(down[i]*.58-inner*.45-frown[i]*.34+smile[i]*.16),
      lift:inner*.045+outer[i]*.055-down[i]*.025
    }))
  };
}
