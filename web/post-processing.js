// Linear HDR camera optics. Scene geometry stays at full resolution.
const vertexShader=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const filterGLSL=`
  uniform sampler2D source;uniform vec2 texel;
  uniform float threshold,knee,extract;
  varying vec2 vUv;
  vec3 sampleLight(vec2 uv){
    vec3 c=texture2D(source,uv).rgb;
    float brightness=max(c.r,max(c.g,c.b));
    float soft=clamp(brightness-threshold+knee,0.,2.*knee);
    soft=soft*soft/(4.*knee+.00001);
    float contribution=max(brightness-threshold,soft)/max(brightness,.00001);
    return mix(c,c*contribution,extract);
  }
  void main(){
    // Normalized 13-tap downfilter keeps isolated highlights stable in motion.
    vec3 c=sampleLight(vUv)*.125;
    c+=(sampleLight(vUv+texel*vec2(-2.,-2.))+sampleLight(vUv+texel*vec2(2.,-2.))+
        sampleLight(vUv+texel*vec2(-2.,2.))+sampleLight(vUv+texel*vec2(2.,2.)))*.03125;
    c+=(sampleLight(vUv+texel*vec2(0.,-2.))+sampleLight(vUv+texel*vec2(-2.,0.))+
        sampleLight(vUv+texel*vec2(2.,0.))+sampleLight(vUv+texel*vec2(0.,2.)))*.0625;
    c+=(sampleLight(vUv+texel*vec2(-1.,-1.))+sampleLight(vUv+texel*vec2(1.,-1.))+
        sampleLight(vUv+texel*vec2(-1.,1.))+sampleLight(vUv+texel*vec2(1.,1.)))*.125;
    gl_FragColor=vec4(c,1.);
  }`;
const blurGLSL=`
  uniform sampler2D source;uniform vec2 direction;varying vec2 vUv;
  void main(){
    vec3 c=texture2D(source,vUv).rgb*.2270270270;
    c+=(texture2D(source,vUv+direction*1.3846153846).rgb+
        texture2D(source,vUv-direction*1.3846153846).rgb)*.3162162162;
    c+=(texture2D(source,vUv+direction*3.2307692308).rgb+
        texture2D(source,vUv-direction*3.2307692308).rgb)*.0702702703;
    gl_FragColor=vec4(c,1.);
  }`;
const flareGLSL=`
  uniform sampler2D source,streakSource;uniform vec2 texel,streakTexel;varying vec2 vUv;
  vec3 lightAt(sampler2D image,vec2 uv){
    float inside=step(0.,uv.x)*step(0.,uv.y)*step(uv.x,1.)*step(uv.y,1.);
    return texture2D(image,clamp(uv,vec2(.001),vec2(.999))).rgb*inside;
  }
  void main(){
    vec3 streak=vec3(0.);float total=0.;
    for(int i=-24;i<=24;i++){
      float x=float(i),w=exp(-abs(x)*.12);
      vec2 uv=vUv+vec2(x*streakTexel.x*2.5,0.);
      vec2 chroma=vec2(streakTexel.x*.6,0.);
      streak+=vec3(lightAt(streakSource,uv+chroma).r,lightAt(streakSource,uv).g,lightAt(streakSource,uv-chroma).b)*w;total+=w;
    }
    // Lens scatter stays aligned with its source; no mirrored face-shaped ghosts.
    gl_FragColor=vec4(streak/total*.16+lightAt(source,vUv)*.015,1.);
  }`;
const compositeGLSL=`
  #include <common>
  #include <dithering_pars_fragment>
  uniform sampler2D picture,bloom0,bloom1,bloom2,bloom3,bloom4,flare;
  uniform float bloomStrength,flareStrength,chromatic;uniform vec2 texel;varying vec2 vUv;
  vec3 cameraLight(vec2 uv){
    vec3 base=texture2D(picture,uv).rgb;
    vec3 bloom=texture2D(bloom0,uv).rgb*.42+texture2D(bloom1,uv).rgb*.26+
               texture2D(bloom2,uv).rgb*.17+texture2D(bloom3,uv).rgb*.10+
               texture2D(bloom4,uv).rgb*.05;
    // Add optical scatter in linear HDR, then perform the display transform once.
    return base+bloom*bloomStrength+texture2D(flare,uv).rgb*flareStrength;
  }
  void main(){
    vec3 c=cameraLight(vUv);
    if(chromatic>.001){vec2 shift=texel*vec2(3.+chromatic*14.,chromatic*1.5);c=vec3(cameraLight(vUv+shift).r,c.g,cameraLight(vUv-shift).b);}
    gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <dithering_fragment>
  }`;

export function createPostProcessing(THREE,renderer){
  const target=(depth=false)=>{
    const rt=new THREE.WebGLRenderTarget(2,2,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,
      minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:depth,stencilBuffer:false});
    rt.texture.colorSpace=THREE.LinearSRGBColorSpace;rt.texture.generateMipmaps=false;return rt;
  };
  const sceneTarget=target(true);sceneTarget.samples=4;
  const levels=Array.from({length:5},()=>({light:target(),scratch:target()}));
  const flareTarget=target();
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const geometry=new THREE.PlaneGeometry(2,2);
  const material=(uniforms,fragmentShader,toneMapped=false)=>new THREE.ShaderMaterial({uniforms,
    vertexShader,fragmentShader,depthTest:false,depthWrite:false,toneMapped,dithering:toneMapped});
  const down=material({source:{value:null},texel:{value:new THREE.Vector2()},
    threshold:{value:1.2},knee:{value:.6},extract:{value:0}},filterGLSL);
  const blur=material({source:{value:null},direction:{value:new THREE.Vector2()}},blurGLSL);
  const flare=material({source:{value:null},streakSource:{value:null},texel:{value:new THREE.Vector2()},streakTexel:{value:new THREE.Vector2()}},flareGLSL);
  const compose=material({picture:{value:sceneTarget.texture},
    ...Object.fromEntries(levels.map((level,i)=>['bloom'+i,{value:level.light.texture}])),
    flare:{value:flareTarget.texture},bloomStrength:{value:.48},flareStrength:{value:.18},chromatic:{value:0},texel:{value:new THREE.Vector2()}},compositeGLSL,true);
  const quad=new THREE.Mesh(geometry,down);quad.frustumCulled=false;scene.add(quad);
  function pass(mat,destination){quad.material=mat;renderer.setRenderTarget(destination);renderer.clear();renderer.render(scene,camera);}
  function resize(width,height){
    sceneTarget.setSize(width,height);compose.uniforms.texel.value.set(1/width,1/height);
    levels.forEach((level,i)=>{const w=Math.max(2,Math.ceil(width/2**(i+1))),h=Math.max(2,Math.ceil(height/2**(i+1)));level.light.setSize(w,h);level.scratch.setSize(w,h);});
    flareTarget.setSize(levels[1].light.width,levels[1].light.height);
  }
  function render({bloomStrength=.48,flareStrength=.18,threshold=1.2,chromatic=0}={}){
    compose.uniforms.chromatic.value=Math.max(0,Math.min(1,chromatic));
    compose.uniforms.bloomStrength.value=Math.max(0,Math.min(1.5,bloomStrength));
    compose.uniforms.flareStrength.value=Math.max(0,Math.min(1,flareStrength));
    down.uniforms.threshold.value=Math.max(.01,threshold);down.uniforms.knee.value=Math.max(.005,threshold*.5);
    // Every target is overwritten this frame; closed features leave no residual light.
    let source=sceneTarget;
    levels.forEach((level,i)=>{
      down.uniforms.source.value=source.texture;down.uniforms.texel.value.set(1/source.width,1/source.height);
      down.uniforms.extract.value=i===0?1:0;pass(down,level.light);source=level.light;
    });
    levels.forEach(level=>{
      blur.uniforms.source.value=level.light.texture;blur.uniforms.direction.value.set(1/level.light.width,0);pass(blur,level.scratch);
      blur.uniforms.source.value=level.scratch.texture;blur.uniforms.direction.value.set(0,1/level.light.height);pass(blur,level.light);
    });
    flare.uniforms.source.value=levels[3].light.texture;flare.uniforms.streakSource.value=levels[1].light.texture;
    flare.uniforms.texel.value.set(1/levels[3].light.width,1/levels[3].light.height);
    flare.uniforms.streakTexel.value.set(1/levels[1].light.width,1/levels[1].light.height);pass(flare,flareTarget);
    pass(compose,null);
  }
  function dispose(){sceneTarget.dispose();flareTarget.dispose();levels.forEach(l=>{l.light.dispose();l.scratch.dispose();});[down,blur,flare,compose].forEach(m=>m.dispose());geometry.dispose();}
  return {sceneTarget,resize,render,dispose};
}
