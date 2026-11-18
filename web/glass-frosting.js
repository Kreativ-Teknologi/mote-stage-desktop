// A real linear-light Gaussian filter for the inner facial render. Explicit
// base-level samples avoid exposing coarse mip texels through the glass.
const sigma=2.8;
const kernel=Array.from({length:17},(_,i)=>Math.exp(-((i-8)**2)/(2*sigma*sigma)));
const total=kernel.reduce((sum,value)=>sum+value,0);
export const FROSTING_WEIGHTS=Object.freeze(kernel.map(value=>value/total));

const vertexShader=`
  out vec2 vUv;
  void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;
const fragmentShader=`
  uniform sampler2D uSource;
  uniform vec2 uDirection,uSourceTexel;
  uniform float uSpacing,uWeights[17];
  in vec2 vUv;
  out vec4 frostingColor;
  void main(){
    vec4 filtered=vec4(0.);
    vec2 lower=uSourceTexel*.5;
    for(int i=-8;i<=8;i++){
      vec2 uv=clamp(vUv+uDirection*float(i)*uSpacing,lower,vec2(1.)-lower);
      filtered+=textureLod(uSource,uv,0.)*uWeights[i+8];
    }
    frostingColor=filtered;
  }
`;
const number=(value,fallback)=>{
  try {const n=Number(value);return Number.isFinite(n)?n:fallback;}catch{return fallback;}
};

export function createGlassFrosting(THREE,renderer){
  const target=()=>{
    const rt=new THREE.WebGLRenderTarget(1,1,{
      type:THREE.HalfFloatType,format:THREE.RGBAFormat,
      minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
      depthBuffer:false,stencilBuffer:false
    });
    rt.texture.colorSpace=THREE.LinearSRGBColorSpace;
    rt.texture.generateMipmaps=false;
    rt.texture.wrapS=THREE.ClampToEdgeWrapping;
    rt.texture.wrapT=THREE.ClampToEdgeWrapping;
    return rt;
  };
  const scratch=target(),filtered=target();
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const geometry=new THREE.PlaneGeometry(2,2);
  const material=new THREE.ShaderMaterial({
    glslVersion:THREE.GLSL3,vertexShader,fragmentShader,
    uniforms:{uSource:{value:null},uDirection:{value:new THREE.Vector2()},
      uSourceTexel:{value:new THREE.Vector2(1,1)},uSpacing:{value:0},
      uWeights:{value:[...FROSTING_WEIGHTS]}},
    depthTest:false,depthWrite:false,toneMapped:false,
    blending:THREE.NoBlending,transparent:false
  });
  const quad=new THREE.Mesh(geometry,material);
  quad.frustumCulled=false;scene.add(quad);
  let sourceWidth=2,sourceHeight=2,disposed=false;

  function resize(width,height){
    if(disposed)return;
    sourceWidth=Math.max(1,Math.round(number(width,2)));
    sourceHeight=Math.max(1,Math.round(number(height,2)));
    const w=Math.max(1,Math.ceil(sourceWidth/2)),h=Math.max(1,Math.ceil(sourceHeight/2));
    if(scratch.width!==w||scratch.height!==h){scratch.setSize(w,h);filtered.setSize(w,h);}
  }
  function pass(source,destination,x,y,inputWidth,inputHeight){
    material.uniforms.uSource.value=source;
    material.uniforms.uDirection.value.set(x,y);
    material.uniforms.uSourceTexel.value.set(1/inputWidth,1/inputHeight);
    renderer.setRenderTarget(destination);renderer.clear();renderer.render(scene,camera);
  }
  function render(sourceTexture,amount){
    const strength=Math.min(1,Math.max(0,number(amount,0)));
    if(disposed||!sourceTexture||strength===0)return sourceTexture;
    // These textures are private render destinations, never accepted as input.
    if(sourceTexture===scratch.texture||sourceTexture===filtered.texture)
      throw new Error('Glass frosting requires the original inner-scene texture.');
    const previous=renderer.getRenderTarget();
    material.uniforms.uSpacing.value=strength*.9;
    try {
      pass(sourceTexture,scratch,1/scratch.width,0,sourceWidth,sourceHeight);
      pass(scratch.texture,filtered,0,1/scratch.height,scratch.width,scratch.height);
      return filtered.texture;
    }finally{renderer.setRenderTarget(previous);}
  }
  function dispose(){
    if(disposed)return;disposed=true;
    material.uniforms.uSource.value=null;
    scene.remove(quad);geometry.dispose();material.dispose();scratch.dispose();filtered.dispose();
  }
  return {resize,render,dispose};
}
