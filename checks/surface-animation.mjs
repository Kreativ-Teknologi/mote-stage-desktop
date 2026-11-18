import assert from 'node:assert/strict';
import {createSurfaceAnimation,COLOR_MOTION_PRESETS} from '../web/surface-animation.js';
import {APPEARANCE_DEFAULTS,pickAppearance} from '../web/appearance-settings.js';
import * as THREE from '../web/vendor/three.module.js';
import {createPaletteUniforms} from '../web/palettes.js';
import {createStarField} from '../web/star-field.js';
const zero={colorAnimation:true,paletteDrift:0,hueWander:0,hueSpeed:0,colorPulse:0,colorPulseRate:0,ribbonSpeed:0,voiceColor:0,voiceColorGain:0,breathAmount:0,breathRate:0,amplitude:0};
const still=createSurfaceAnimation();let a;
for(let i=0;i<300;i++)a=still.update(1/60,zero);
assert.deepEqual(a,{palettePhase:0,hue:0,gain:1,ribbonPhase:0,breath:0,voice:0},'All zero controls produce a still unmodified palette');
const signed=x=>x>.5?x-1:x;
const forward=createSurfaceAnimation(),reverse=createSurfaceAnimation();let f,r;
for(let i=0;i<60;i++){f=forward.update(1/60,{...zero,paletteDrift:1});r=reverse.update(1/60,{...zero,paletteDrift:-1});}
assert.ok(signed(f.palettePhase)>0&&signed(r.palettePhase)<0,'Drift direction reverses');
const switched=forward.update(1/60,{...zero,paletteDrift:-1});assert.ok(Math.abs(switched.palettePhase-f.palettePhase)<.001,'Speed reversal cannot jump the palette');
const animated=createSurfaceAnimation();let moving;
const options={...APPEARANCE_DEFAULTS,...COLOR_MOTION_PRESETS.tide,breathAmount:1,amplitude:.8,audioFluid:false};
for(let i=0;i<90;i++)moving=animated.update(1/60,options);
assert.ok(Math.abs(moving.hue)>.01&&moving.gain>1&&moving.ribbonPhase<0&&Math.abs(moving.breath)>.001,'Hue, emitted light, ribbons and breathing all animate');
assert.ok(moving.voice>.8,'Color voice response is independent of voice deformation');
const frozen=animated.update(0,{...options,amplitude:0});for(const key of Object.keys(moving))assert.ok(Math.abs(frozen[key]-moving[key])<1e-12,'Freeze holds '+key);
let off;for(let i=0;i<360;i++)off=animated.update(1/60,{...options,colorAnimation:false,breathAmount:0});
assert.equal(off.palettePhase,0);assert.ok(Math.abs(off.hue)<1e-9&&Math.abs(off.gain-1)<1e-9,'Disabling color motion settles back to the base palette');
assert.equal(off.ribbonPhase,moving.ribbonPhase,'Disabled color animation holds ribbon position');
const palette=createPaletteUniforms(THREE),stars=createStarField(THREE,palette);
for(const key of ['uPalettePhase','uDynamicHue','uDynamicGain'])assert.notEqual(stars.points.material.uniforms[key],palette[key],'Stars own dynamic palette '+key);
palette.uDynamicGain.value=1.8;assert.equal(stars.points.material.uniforms.uDynamicGain.value,1,'Independent stars ignore avatar color motion');
stars.update({followAvatar:true});assert.equal(stars.points.material.uniforms.uDynamicGain.value,1.8,'Follow mode copies dynamic color values');
stars.update({followAvatar:false});assert.equal(stars.points.material.uniforms.uDynamicGain.value,1,'Independent mode restores its own gain');assert.equal(palette.uDynamicGain.value,1.8);stars.dispose();
for(const preset of Object.values(COLOR_MOTION_PRESETS)){
  const normalized=pickAppearance({...APPEARANCE_DEFAULTS,...preset});
  for(const [key,value] of Object.entries(preset))assert.equal(normalized[key],value,'Preset value is valid: '+key);
}
console.log('Verified color motion, reverse drift, continuous speed changes, voice light, breathing, freeze, master-off settling and optional star dynamics.');
