const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
const wrap=v=>((v%1)+1)%1;
const approach=(a,b,dt,tau)=>a+(b-a)*(1-Math.exp(-dt/tau));
export const COLOR_MOTION_PRESETS={
  silk:{colorAnimation:true,paletteDrift:.16,hueWander:8,hueSpeed:.15,colorPulse:.10,colorPulseRate:6,ribbonSpeed:.18,ribbonWidth:.65,ribbonIntensity:1.1,voiceColor:.2,voiceColorGain:.2},
  tide:{colorAnimation:true,paletteDrift:.42,hueWander:28,hueSpeed:.22,colorPulse:.22,colorPulseRate:5,ribbonSpeed:-.28,ribbonWidth:.8,ribbonIntensity:1.3,voiceColor:.3,voiceColorGain:.3},
  voice:{colorAnimation:true,paletteDrift:.025,hueWander:0,hueSpeed:.15,colorPulse:0,colorPulseRate:6,ribbonSpeed:.08,ribbonWidth:.6,ribbonIntensity:1.15,voiceColor:.75,voiceColorGain:.65}
};

// Velocity integration avoids jumping animation when a speed/direction changes.
// All clocks use animation delta, so Freeze holds color and surface motion too.
export function createSurfaceAnimation(){
  let palette=0,offset=0,huePhase=0,pulsePhase=0,ribbonPhase=0,breathPhase=0;
  let voice=0,hue=0,gain=1,breath=0;
  return {update(delta,p={}){
    const dt=clamp(delta,0,.06,0),enabled=p.colorAnimation!==false;
    const amount=enabled?Math.pow(clamp(p.amplitude,0,1,0),.75):0;
    voice=approach(voice,amount,dt,amount>voice?.055:.32);
    if(voice<.0001)voice=0;
    if(enabled){
      palette=wrap(palette+dt*clamp(p.paletteDrift,-1,1,.12)*.035);
      huePhase+=dt*clamp(p.hueSpeed,0,2,.18)*Math.PI*2*.06;
      pulsePhase+=dt*clamp(p.colorPulseRate,0,30,6)*Math.PI*2/60;
      ribbonPhase+=dt*clamp(p.ribbonSpeed,-1,1,.2)*.26;
    }
    const targetOffset=enabled?wrap(palette+voice*clamp(p.voiceColor,0,1,.25)*.16):0;
    const difference=((targetOffset-offset+.5)%1+1)%1-.5;
    offset=wrap(offset+difference*(1-Math.exp(-dt/.18)));
    if(!enabled&&Math.min(offset,1-offset)<.00001)offset=0;
    const targetHue=enabled?(Math.sin(huePhase)*clamp(p.hueWander,0,180,0)+voice*clamp(p.voiceColor,0,1,.25)*18)*Math.PI/180:0;
    hue=approach(hue,targetHue,dt,.22);
    const targetGain=enabled?1+Math.sin(pulsePhase)*clamp(p.colorPulse,0,1,.08)*.6+voice*clamp(p.voiceColorGain,0,1,.2)*1.25:1;
    gain=approach(gain,targetGain,dt,.18);
    breathPhase+=dt*clamp(p.breathRate,0,30,8)*Math.PI*2/60;
    breath=approach(breath,Math.sin(breathPhase)*clamp(p.breathAmount,0,1,.12)*.018,dt,.2);
    return {palettePhase:offset,hue,gain,ribbonPhase,breath,voice};
  }};
}
