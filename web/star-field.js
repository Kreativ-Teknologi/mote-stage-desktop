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
  uniforms.blast={value:0};
  uniforms.pullback={value:0};
  uniforms.suction={value:0};
  uniforms.starWave={value:new THREE.Vector4()};
  uniforms.starPattern={value:new THREE.Vector3()};
  uniforms.waveTravel={value:0};
  uniforms.flightDistance={value:0};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
    vertexShader:`attribute float seed;uniform float pixelRatio,depth,twinkle,twinklePhase,glow,spread,blast,pullback,suction,time;uniform vec2 drift,sizeRange;uniform vec4 action,starWave;uniform vec3 starPattern;uniform float waveTravel,flightDistance;varying float brightness,colorSeed,streak;varying vec2 radialAxis;
      void main(){vec3 p=position;p.x=mod(p.x+16.+drift.x,32.)-16.;p.y=mod(p.y+11.+drift.y,22.)-11.;p.xy*=spread;p.z=-2.+(p.z+2.)*depth;
        float influence=1./(1.+dot(p.xy,p.xy)*.028);
        float rotation=action.y*influence;
        p.xy=mat2(cos(rotation),-sin(rotation),sin(rotation),cos(rotation))*p.xy*(1.+action.x*influence);
        p.xy*=(1.+blast)*(1.-pullback);
        float fall=suction*smoothstep(0.,1.,fract(seed*.91+time*.47));
        float twist=fall*(1.15+1.2*influence);
        p.xy=mat2(cos(twist),-sin(twist),sin(twist),cos(twist))*p.xy*(1.-fall*.74);
        float diagonal=(p.y+.52*p.x)/9.;
        float ripple=exp(-pow(abs(diagonal-waveTravel)*3.4,2.));
        p.xy+=vec2(.76,-.42)*ripple*starWave.y;
        p.xy*=1.+starWave.z*.09*(.35+seed);
        float pattern=starPattern.x, strength=starPattern.y, cueTime=starPattern.z;
        float patternLight=1., patternHue=0.;
        if(pattern==1.){
          vec2 cells=floor(p.xy*.75+.5);
          vec2 grid=cells/0.75+p.xy*.042;
          float turnGrid=cueTime*.55;
          grid=mat2(cos(turnGrid),-sin(turnGrid),sin(turnGrid),cos(turnGrid))*grid;
          p.xy=mix(p.xy,grid,strength*.94);
          patternHue=(cells.x+cells.y)*.14+cueTime*.26;
          patternLight+=strength*.82*pow(.5+.5*cos((cells.x-cells.y)*1.1-cueTime*15.7),4.);
        }else if(pattern==2.){
          float side=p.x<0.?-1.:1.;
          float amplitude=2.2*exp(-abs(p.x)*.09);
          p.x+=side*strength*(amplitude+.24*sin(p.y*2.4));
          p.y+=strength*.47*sin(p.x*3.0)*(p.y*.05);
          patternLight+=strength*.63*exp(-abs(p.x)*.13);
        }else if(pattern==3.){
          float localTime=fract(cueTime*.77+seed*4.37);
          float hop=sin(localTime*3.141593)*smoothstep(0.,.55,fract(seed*17.1));
          p.y+=strength*hop*hop*(.4+2.3*seed);
          p.x+=strength*hop*(seed-.5)*1.44;
          patternLight+=strength*pow(hop,4.)*.98;
          patternHue=.23*hop;
        }else if(pattern==4.){
          float swirl=sin(cueTime*6.6+seed*6.28318)*exp(-cueTime*1.8);
          float gust=sin(cueTime*2.2+seed*22.)*.32;
          float rise=2.6*smoothstep(.06,.55,cueTime);
          float settle=max(cueTime-.57,0.)*(1.2+2.85*seed);
          p.x+=strength*(swirl*2.7+gust);
          p.y+=strength*(rise-settle+swirl*.88);
          patternLight+=strength*(.20+.66*seed);
          patternHue=.06*seed;
        }
        float depthPhase=fract((-2.-p.z)/(20.*depth)-flightDistance);
        float warpDepth=-2.-depthPhase*20.*depth;
        p.z=mix(p.z,warpDepth,starWave.x);
        vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;
        float depthScale=clamp(14./-view.z,.5,1.6);
        gl_PointSize=clamp(mix(sizeRange.x,sizeRange.y,pow(seed,.8))*depthScale*pixelRatio*(1.-pullback),.3,20.*pixelRatio);
        radialAxis=normalize(vec2(view.x,-view.y)+vec2(.00001,0.));
        float radial=length(gl_Position.xy/max(gl_Position.w,.01));
        streak=starWave.x*smoothstep(.12,.95,radial)*mix(.55,1.,seed);
        gl_PointSize+=streak*min(53.*pixelRatio,72.);
        brightness=(.18+pow(seed,6.)*6.)*mix(1.,.65+.35*sin(twinklePhase*.18+seed*85.),twinkle)*glow*(1.+action.z*influence)*mix(1.,1.-smoothstep(.72,.98,fract(seed*.91+time*.47)),suction);brightness*=1.+.55*abs(starWave.y)*ripple+.48*starWave.z+streak*.8;
        brightness*=1.-max(-starWave.w,0.)*mix(.68,.97,smoothstep(-1.5,.7,diagonal));
        brightness*=mix(1.,smoothstep(.0,.12,depthPhase)*(1.-smoothstep(.88,1.,depthPhase)),starWave.x);
        brightness*=patternLight;
        colorSeed=fract(seed+action.w*influence+patternHue*strength);}`,
    fragmentShader:`${paletteGLSL} uniform float amount,softness;varying float brightness,colorSeed,streak;varying vec2 radialAxis;
      void main(){vec2 p=gl_PointCoord*2.-1.;
        vec2 ray=vec2(dot(p,radialAxis),dot(p,vec2(-radialAxis.y,radialAxis.x)));
        ray.x=mix(ray.x,(ray.x-.29)*1.4,streak);
        ray.y*=1.+streak*16.;
        float r=dot(ray,ray);if(r>1.)discard;
        float profile=exp(-r*mix(1.75,6.75,softness))*(1.-smoothstep(.65,1.,r));
        gl_FragColor=vec4(paletteColor(colorSeed)*brightness,profile*amount);}`});
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.renderOrder=-10;
  let lastTime=null,colorPhase=0,flightDistance=0;
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
    uniforms.blast.value=finite(input.action?.[4],0,0,.8);
    uniforms.pullback.value=finite(input.action?.[5],0,0,.5);
    uniforms.suction.value=finite(input.action?.[6],0,0,1);
    const speedWarp=finite(input.wave?.[0],0,0,1);
    flightDistance=speedWarp>.001?wrap(flightDistance+dt*(.25+1.75*speedWarp),1):0;
    uniforms.flightDistance.value=flightDistance;
    uniforms.starWave.value.set(speedWarp,finite(input.wave?.[1],0,-1,1),finite(input.wave?.[2],0,0,1),finite(input.wave?.[3],0,-1,1));
    uniforms.starPattern.value.set(finite(input.pattern?.[0],0,0,4),finite(input.pattern?.[1],0,0,1),finite(input.pattern?.[2],0,0,5));
    uniforms.waveTravel.value=finite(input.waveTravel,0,-2,4);
    uniforms.sizeRange.value.set(p.minSize,p.maxSize);uniforms.depth.value=p.depth;uniforms.twinkle.value=p.twinkle;uniforms.glow.value=p.glow;
    uniforms.twinklePhase.value+=dt*p.twinkleSpeed;uniforms.spread.value=p.spread;uniforms.softness.value=p.softness;
    colorPhase=wrap(colorPhase+dt*p.colorSpeed*.04,1);
    const follow=avatarPaletteUniforms?finite(input.followMix,Number(p.followAvatar),0,1):0;
    applyPalette(paletteUniforms,p.palette,p.colors,p.hue,p.saturation,1,input.resolvedColors);
    uniforms.uPalettePhase.value=colorPhase;uniforms.uDynamicHue.value=0;uniforms.uDynamicGain.value=1;
    if(follow>0){
      for(const [key,target] of Object.entries(paletteUniforms)){
        const source=avatarPaletteUniforms[key];if(!source)continue;
        if(follow<1&&target.value?.lerp)target.value.lerp(source.value,follow);
        else if(target.value?.copy)target.value.copy(source.value);
        else target.value=follow===1?source.value:target.value+(source.value-target.value)*follow;
      }
    }
    geometry.setDrawRange(0,p.count);points.visible=p.amount>.001&&p.count>0;
  },dispose(){geometry.dispose();material.dispose();}};
}
