// A separate envelope keeps the vocal halo available when shape modulation is off.
export function createVoiceEnvelope(){
  let value=0;
  return {update(amplitude,delta){
    const target=Math.pow(Math.min(1,Math.max(0,Number(amplitude)||0)),.75);
    const dt=Math.min(.06,Math.max(0,Number(delta)||0));
    value+=(target-value)*(1-Math.exp(-dt/(target>value?.055:.32)));
    if(value<.0001)value=0;
    return value;
  }};
}
export function createAudioFluidDriver(){
  let level=0,phase=0;
  return {update(amplitude,delta,enabled,motion=.55,response=1){
    const dt=Math.min(.06,Math.max(0,Number(delta)||0));
    const target=enabled?Math.pow(Math.min(1,Math.max(0,Number(amplitude)||0)),.75)*response:0;
    level+=(target-level)*(1-Math.exp(-dt/(target>level?.065:.24)));
    if(level<.0001)level=0;
    // Integrate velocity: amplitude changes speed without jumping the noise phase.
    phase+=dt*(.95*motion+level*1.8);
    return {level,phase,deform:level*.85};
  }};
}
