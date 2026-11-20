import {applyPalette,createPaletteUniforms,paletteGLSL} from './palettes.js';
import {BACKGROUND_DEFAULTS,starFieldOptions} from './background-settings.js';
export function createStarField(THREE,avatarPaletteUniforms=null){
  const capacity=6000,positions=new Float32Array(capacity*3),seeds=new Float32Array(capacity);let seed=82137;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<capacity;i++){positions.set([(random()-.5)*32,(random()-.5)*22,-2-random()*20],i*3);seeds[i]=random();}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('seed',new THREE.BufferAttribute(seeds,1));geometry.setDrawRange(0,1200);
  // Keep uniform objects stable: following the avatar copies values, never ownership.
  const paletteUniforms=createPaletteUniforms(THREE);applyPalette(paletteUniforms,0);
  const uniforms={...paletteUniforms,time:{value:0},amount:{value:.35},pixelRatio:{value:1},drift:{value:new THREE.Vector2()},sizeRange:{value:new THREE.Vector2(.65,2.2)},depth:{value:1},twinkle:{value:.2},twinklePhase:{value:0},glow:{value:1},spread:{value:1},softness:{value:.65}};
  uniforms.action={value:new THREE.Vector4()};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
    vertexShader:`attribute float seed;uniform float pixelRatio,depth,twinkle,twinklePhase,glow,spread;uniform vec2 drift,sizeRange;uniform vec4 action;varying float brightness,colorSeed;
      void main(){vec3 p=position;p.x=mod(p.x+16.+drift.x,32.)-16.;p.y=mod(p.y+11.+drift.y,22.)-11.;p.xy*=spread;p.z=-2.+(p.z+2.)*depth;
        float influence=1./(1.+dot(p.xy,p.xy)*.028);
        float rotation=action.y*influence;
        p.xy=mat2(cos(rotation),-sin(rotation),sin(rotation),cos(rotation))*p.xy*(1.+action.x*influence);
        vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;
        float depthScale=clamp(14./-view.z,.5,1.6);
        gl_PointSize=clamp(mix(sizeRange.x,sizeRange.y,pow(seed,.8))*depthScale*pixelRatio,.3,20.*pixelRatio);
        brightness=(.18+pow(seed,6.)*6.)*mix(1.,.65+.35*sin(twinklePhase*.18+seed*85.),twinkle)*glow*(1.+action.z*influence);colorSeed=fract(seed+action.w*influence);}`,
    fragmentShader:`${paletteGLSL} uniform float amount,softness;varying float brightness,colorSeed;
      void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
        float profile=exp(-r*mix(1.75,6.75,softness))*(1.-smoothstep(.65,1.,r));
        gl_FragColor=vec4(paletteColor(colorSeed)*brightness,profile*amount);}`});
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.renderOrder=-10;
  let lastTime=null,colorPhase=0;
  const finite=(v,f,a,b)=>typeof v==='number'&&Number.isFinite(v)?Math.min(b,Math.max(a,v)):f;
  const wrap=(v,size)=>(v%size+size)%size;
  return {points,update(input={}){
    const time=finite(input.time,lastTime??0,0,1e12),dt=Math.min(.1,Math.max(0,time-(lastTime??time)));lastTime=time;
    // Reuse the public settings sanitizer without exposing malformed values to GLSL.
    const p=starFieldOptions({...BACKGROUND_DEFAULTS,
      starField:input.amount,starCount:input.count,starSizeMin:input.minSize,starSizeMax:input.maxSize,
      starSpeed:input.speed,starDirection:input.direction,starDepth:input.depth,starTwinkle:input.twinkle,starGlow:input.glow,
      starFollowAvatar:input.followAvatar,starPalette:input.palette,starColors:input.colors,starHue:input.hue,
      starSaturation:input.saturation,starSpread:input.spread,starTwinkleSpeed:input.twinkleSpeed,
      starSoftness:input.softness,starColorSpeed:input.colorSpeed});
    const angle=p.direction*Math.PI/180,speed=p.speed*.40;
    uniforms.drift.value.x+=Math.cos(angle)*speed*dt;uniforms.drift.value.y+=Math.sin(angle)*speed*dt;
    uniforms.drift.value.x=wrap(uniforms.drift.value.x+16,32)-16;uniforms.drift.value.y=wrap(uniforms.drift.value.y+11,22)-11;
    uniforms.time.value=time;uniforms.amount.value=p.amount;uniforms.pixelRatio.value=finite(input.pixelRatio,1,.5,4);
    uniforms.action.value.set(finite(input.action?.[0],0,-.35,.45),finite(input.action?.[1],0,-.8,.8),finite(input.action?.[2],0,0,1.4),finite(input.action?.[3],0,-.5,.5));
    uniforms.sizeRange.value.set(p.minSize,p.maxSize);uniforms.depth.value=p.depth;uniforms.twinkle.value=p.twinkle;uniforms.glow.value=p.glow;
    uniforms.twinklePhase.value+=dt*p.twinkleSpeed;uniforms.spread.value=p.spread;uniforms.softness.value=p.softness;
    colorPhase=wrap(colorPhase+dt*p.colorSpeed*.04,1);
    if(p.followAvatar&&avatarPaletteUniforms){
      for(const [key,target] of Object.entries(paletteUniforms)){
        const source=avatarPaletteUniforms[key];if(!source)continue;
        if(target.value?.copy)target.value.copy(source.value);else target.value=source.value;
      }
    }else{
      applyPalette(paletteUniforms,p.palette,p.colors,p.hue,p.saturation);
      uniforms.uPalettePhase.value=colorPhase;uniforms.uDynamicHue.value=0;uniforms.uDynamicGain.value=1;
    }
    geometry.setDrawRange(0,p.count);points.visible=p.amount>.001&&p.count>0;
  },dispose(){geometry.dispose();material.dispose();}};
}
