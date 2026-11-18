import {featureLight} from './face-geometry.js';

const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,finite(value)));

/**
 * Convert articulation strength into a broad, soft speech aperture.
 * `opening` is the mapped/actor articulation amount (0–.36), not mesh height.
 * `voice` is mic energy, supplied only when the microphone owns articulation.
 * The incoming width already includes tracked smile/pucker and actor blending.
 */
export function speechMouthPose({opening=0,voice=0,width=.17,curve=0,skew=0,pucker=0,funnel=0,bass=0,treble=0}={}){
  const jaw=clamp(finite(opening)/.36),energy=clamp(voice);
  // Combine sources without summing jaw travel into an oversized vertical oval.
  const articulation=1-(1-jaw)*(1-energy*.85);
  const drive=clamp((articulation-.02)/.98);
  const rounded=clamp(funnel),pursed=clamp(pucker);
  const bright=clamp(treble),low=clamp(bass);
  const baseWidth=clamp(width,.11,.29);
  const spread=drive*.052*(1-pursed*.72)+energy*bright*.012-rounded*drive*.012;
  const halfWidth=clamp(baseWidth+spread,.11,.31);
  // Even a fully open tracked jaw stays wider than it is tall. Lower-frequency
  // energy can round a vowel slightly, without turning speech into a scream.
  const heightLimit=Math.min(.105+rounded*.008,halfWidth*.52);
  const halfHeight=heightLimit*Math.pow(drive,.86)*(1+energy*(low-bright)*.045);
  const limit=halfWidth*.60;
  const curvature=Math.tanh(finite(curve)/limit)*limit*(1-drive*.28);
  const height=Math.min(halfWidth*.54,Math.max(0,halfHeight));
  return {
    width:halfWidth,
    height,
    // Give more travel to the lower jaw while keeping the upper edge steadier.
    drop:height*.32,
    curve:curvature,
    skew:clamp(skew,-.045,.045),
    light:featureLight(drive/.22),
    articulation:drive
  };
}
