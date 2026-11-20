import {thinkingFaceHandoff} from './face-handoff.js';
import {eyeContourCurve,createGazeDriver} from './facial-animation.js';
import {createCharacterPerformance} from './character-performance.js';
import {surfaceFrameGLSL} from './surface-frame.js';
import {createStagePosition} from './head-motion.js';
import {actionBodyGLSL,createBodyForm} from './action-body.js';
import {createGlassFrosting} from './glass-frosting.js';
import {starFieldOptions} from './background-settings.js';
import {actionSurfaceGLSL} from './action-surface.js';
import {speechMouthPose} from './mouth-pose.js';
import {createSurfaceAnimation} from './surface-animation.js';
import {ACTOR_EXPRESSIONS,ACTOR_APERTURES,LIBRARY_EMOTES,blendActorEye,blendActorMouth,bubbleActionPose,libraryEmoteMotion,stageEffectPose,starActionPose,cometPath,COMET_EXIT} from './actor-actions.js';
import {glassOpticsGLSL} from './glass-optics.js';
import {renderScale} from './render-settings.js';
import {createPaletteUniforms,applyPalette,paletteGLSL} from './palettes.js';
import {createAudioFluidDriver,createVoiceEnvelope} from './fluid-motion.js';
import {mapWebcamExpression} from './face-mapping.js';
import {createStarField} from './star-field.js';
import {createPostProcessing} from './post-processing.js';
import {deformGlassMouth,featureLight,eyeOpenness,wrapEyeInsideGlass,wrapMouthInsideGlass} from './face-geometry.js';
/**
 * MOTE STAGE v0.4 - Three.js, real 3D geometry and two-pass screen-space glass.
 * Core and inner facial rig are rendered to an off-screen texture first.
 * The displaced outer shell then samples this scene through a refracted,
 * chromatically separated view and adds its own thin-film specular coating.
 * No 2D circle, sprite, static gradient, or CSS faux-glass is used.
 */
let THREE;
let loadError;
try {
  THREE = await import('./vendor/three.module.js');
} catch (localError) {
  throw new Error('Bundled 3D library is missing. Re-extract the complete desktop project.');
}

const vertexShader = /* glsl */`
  uniform float uTime, uMotion, uLevel, uDeform, uLayer, uBass, uMid, uFlowTime, uAudioFluid, uFlowScale, uFlowCurl, uFlowAngle, uSurfaceTension, uBreath;
  ${actionSurfaceGLSL}
  ${actionBodyGLSL}
  uniform mat3 uWorldNormal;
  varying vec3 vLocal, vWorld, vNormalW;
  varying float vWarp;
  float waveField(vec3 p, float t){
    float ca=cos(uFlowAngle),sa=sin(uFlowAngle);p.xy=mat2(ca,-sa,sa,ca)*p.xy;p*=uFlowScale*(.75+.25*uFlowCurl);
    float a = sin(4.2*p.x + 3.7*p.y - 2.1*p.z + t*.51)
            * sin(3.5*p.y - 4.0*p.z + t*.34);
    float b = sin(7.5*p.z + 2.6*p.x - t*.67)
            * sin(5.9*p.x - 2.7*p.y + t*.45);
    float c = sin(11.0*p.y + 7.4*p.x + 6.3*p.z + t*.89);
    float detailed=mix(sin(p.y*3.2+p.x*1.4+t*.5),.48*a+.36*b+.16*c,clamp(uFlowCurl*.65,0.,1.));
    float broad=sin(p.y*2.2+p.x*1.3+t*.32)*sin(p.z*1.7-p.x*.8-t*.21);
    return mix(detailed,broad,uSurfaceTension);
  }
  vec3 surfacePoint(vec3 point){
    vec3 p=normalize(point);float radius=length(point),t=uFlowTime;
    float shell=step(.5,uLayer);
    float deform=((1.-shell)*.076+shell*.050)*uDeform*(1.-clamp(uActionB.y,0.,1.)*.85);
    float breath=uAudioFluid*(.012+.008*shell);
    float pulse=sin(7.3*p.y-t*2.2+p.x*2.5)*uMid*uAudioFluid*.011;
    float displacement=actionSurfaceDisplacement(p)+radius*actionBodyDisplacement(p)
      +deform*waveField(p,t)+uBreath+breath*(.6+.4*sin(t*.85))+pulse;
    return point+p*displacement;
  }
  ${surfaceFrameGLSL}
  void main(){
    vec3 p=normalize(position),displaced=surfacePoint(position);
    vLocal=p;vWarp=waveField(p,uFlowTime);
    vec4 world=modelMatrix*vec4(displaced,1.);vWorld=world.xyz;
    // Derive curvature from the complete deformed surface in both tangent
    // directions. Rounded corners and changing radii retain continuous optics.
    vNormalW=normalize(uWorldNormal*radialSurfaceNormal(p,length(position)));
    gl_Position=projectionMatrix*viewMatrix*world;
  }

`;

const noiseGLSL = /* glsl */`
  ${paletteGLSL}
  float hash31(vec3 p){
    p=fract(p*.1031);
    p += dot(p,p.yzx+33.33);
    return fract((p.x+p.y)*p.z);
  }
  float noise3(vec3 p){
    vec3 i=floor(p), f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(
       mix(mix(hash31(i),hash31(i+vec3(1.,0.,0.)),f.x),
           mix(hash31(i+vec3(0.,1.,0.)),hash31(i+vec3(1.,1.,0.)),f.x),f.y),
       mix(mix(hash31(i+vec3(0.,0.,1.)),hash31(i+vec3(1.,0.,1.)),f.x),
           mix(hash31(i+vec3(0.,1.,1.)),hash31(i+vec3(1.,1.,1.)),f.x),f.y),f.z);
  }
  float fbm3(vec3 p){
    float a=.50, v=0.;
    for(int k=0;k<4;k++){
      v+=a*noise3(p);
      p=p*2.03+vec3(13.7,6.3,4.1);
      a*=.51;
    }
    return v;
  }
  vec3 palette(float x, float y, float z, float uPalette){
    x=smoothstep(.19,.83,x);
    y=smoothstep(.18,.86,y);
    vec3 c;
    if(uPalette<.5){
      c=mix(vec3(.24,.68,.94),vec3(.93,.85,1.),x);
      c=mix(c,vec3(.99,.74,.88),y*.24);
      c=mix(c,vec3(.65,1.,.93),z*.21);
    }else if(uPalette<1.5){
      c=mix(vec3(.99,.085,.48),vec3(.04,.92,1.0),x);
      c=mix(c,vec3(.42,.10,.94),y*.46);
      c+=vec3(.04,.04,.09)*z;
    }else if(uPalette<2.5){
      c=mix(vec3(.96,.37,.72),vec3(.21,.89,1.),x);
      c=mix(c,vec3(.98,.91,1.),y*.34);
      c=mix(c,vec3(.37,.24,.95),z*.21);
    }else{
      // Black glass, almost entirely dark except the controlled light ribbon.
      c=mix(vec3(.002,.007,.018),vec3(.009,.038,.076),x);
      c+=vec3(.008,.025,.052)*z*.35;
    }
    return c;
  }
`;

const coreFragment = /* glsl */`
  uniform float uFlowTime,uFlowScale,uFlowCurl,uFlowAngle;
  uniform float uTime,uMotion,uLevel,uPalette,uDepth,uBass,uMid,uTreble,uStyle,uFace,uShell;
  varying vec3 vLocal,vWorld,vNormalW;
  varying float vWarp;
  ${noiseGLSL}
  uniform sampler2D uBackground;
  uniform vec2 uResolution;
  void main(){
    vec3 N=normalize(vNormalW);
    N=faceforward(N,normalize(vWorld-cameraPosition),N);
    vec3 V=normalize(cameraPosition-vWorld);
    vec3 p=vLocal;float cs=cos(uFlowAngle),sn=sin(uFlowAngle);p.xy=mat2(cs,-sn,sn,cs)*p.xy;p*=uFlowScale;
    float t=uFlowTime*.65;
    // Spatially warped 3D noise, not UV-space paint.
    float a=fbm3(p*1.5+vec3(.12*t,-.11*t,.06*t));
    float b=fbm3(p*1.9+vec3(-.09*t,.07*t,.08*t)+11.3);
    vec3 q=p*1.72+vec3(a-b,b-.48,a-.52)*(1.1+uDepth*.55);
    float swirl=sin(q.y*2.3 + sin(q.x*1.7+q.z*1.2+t*.31)*1.7
                  + q.z*1.3-t*.43);
    float band=.5+.5*swirl;
    float twist=.5+.5*sin((q.x-q.y)*2.55+sin(q.z*2.05-t*.22)*1.45+t*.21);
    float haze=fbm3(q*1.2+vec3(.08*t,.02*t,-.06*t));
    vec3 c=paletteColor(band+twist*.2+haze*.1);
    float clearCenter=1.-smoothstep(.25,.88,length(p.xy));
    c=mix(c,vec3(.006,.016,.035),clearCenter*.92);
    // High-contrast physical depth: dark grazing edges, directional soft illumination.
    float ndv=clamp(dot(N,V),0.,1.);
    float key=max(dot(N,normalize(vec3(-.48,.72,.62))),0.);
    float innerShadow=.30+.64*key;
    float edgeDepth=.22+.78*pow(ndv,.43);
    float volumeDepth=.8+.20*uDepth*(.5+.5*sin(2.4*q.z+3.5*haze));
    c*=innerShadow*edgeDepth*volumeDepth;
    float lattice=smoothstep(.61,.86,twist)*smoothstep(.48,.8,haze);
    c+=vec3(.09,.23,.34)*lattice*(.12+.18*uDepth)*edgeDepth;
    if(uPalette>2.5){
      float yA=.08*sin(p.x*4.6+t*.44)+.12*sin(p.z*3.8-t*.32);
      float yB=-.09*sin(p.x*4.3-t*.28)+.12*sin(p.z*4.4+t*.41);
      float lineA=exp(-pow((p.y-yA)/.135,2.));
      float lineB=exp(-pow((p.y-yB)/.16,2.));
      vec3 ca=mix(vec3(.02,.84,1.),vec3(.29,.44,1.),.5+.5*p.x);
      vec3 cb=mix(vec3(.96,.16,.6),vec3(.56,.31,.99),.5+.5*p.x);
      c+=ca*lineA*(.48+.24*haze)+cb*lineB*(.4+.18*haze);
    }
    // A soft traveling caustic wave exists INSIDE the glass.
    float caustic=exp(-34.*pow(p.y-.14*sin(p.x*5.6+p.z*2.8+t*.58),2.));
    c+=mix(vec3(.15,.65,.95),vec3(.9,.21,.7),band)*caustic*(.055+.14*uDepth);
    c+=vec3(.07,.16,.22)*uBass*(.4+.6*band);
    c+=vec3(.12,.05,.17)*uMid*(.4+.6*twist);
    c+=vec3(.09,.2,.25)*uTreble*.23;
    float innerSpec=pow(max(dot(reflect(-normalize(vec3(-.4,.65,.55)),N),V),0.),70.);
    c+=vec3(.52,.7,.98)*innerSpec*.12;
    vec3 neutralGlass=vec3(.009,.019,.025);
    if(uStyle>1.5)neutralGlass=vec3(.018,.028,.032);
    if(uStyle>.5&&uStyle<1.5)c=mix(vec3(dot(c,vec3(.21,.72,.07))),c,.08)*.55;
    c=mix(c,neutralGlass,clearCenter*(uStyle>1.5?.88:.97));
    c=vec3(.001,.002,.003)+c*.025*(1.-clearCenter*.95);
    if(uStyle>1.5)c*=vec3(1.25,1.,.82);
    vec3 behind=texture2D(uBackground,gl_FragCoord.xy/uResolution).rgb;
    gl_FragColor=vec4(max(c,vec3(0.))*uShell+behind*mix(1.,.98,uShell),1.);
  }
`;

const shellFragment = /* glsl */`
  uniform float uFlowTime,uFaceRadius,uFlowScale,uFlowCurl,uFlowAngle,uShell,uPopFlash,uPopReform;
  uniform vec4 uStageEffect;
  uniform float uEffectTravel;
  uniform mat4 uWorldToLocal,uLocalToClip;uniform mat3 uWorldNormal;
  uniform sampler2D uInner,uStudio,uFrostedInner,uBackground;
  uniform vec2 uResolution;
  uniform float uTime,uMotion,uLevel,uPalette,uGlass,uRefraction,uDispersion;
  uniform float uRipple,uDepth,uBass,uMid,uTreble,uStyle,uFace,uEdgeGlow,uEdgeSoftness,uSurfaceRoughness,uSurfaceFrosting,uIridescence,uRibbonPhase,uRibbonWidth,uRibbonIntensity;
  varying vec3 vLocal,vWorld,vNormalW;
  varying float vWarp;
  ${noiseGLSL}
  ${glassOpticsGLSL}
  vec3 insideLight(vec2 uv){
    vec2 px=1./uResolution;uv=clamp(uv,px,vec2(1.)-px);
    if(uSurfaceFrosting<.001)return textureLod(uInner,uv,0.).rgb;
    return texture2D(uFrostedInner,uv).rgb;
  }
  vec3 studioLight(vec2 uv){
    return pow(textureLod(uStudio,uv,uSurfaceRoughness*6.).rgb,vec3(2.2));
  }
  float ribbonFlow(vec3 p){
    return p.y+.32+(.25+.14*uFlowCurl)*sin(p.x*2.9+p.z*1.8+uRibbonPhase)+.19*sin(p.y*3.8-p.x*2.2-uRibbonPhase*.7);
  }
  vec2 curvedGlassUV(vec3 incident,vec3 normalW,float ior,float facing){
    vec3 origin=(uWorldToLocal*vec4(vWorld,1.)).xyz;
    vec3 direction=normalize(mat3(uWorldToLocal)*refract(incident,normalW,1./ior));
    vec3 hit=glassInteriorHit(origin,direction,uFaceRadius,uDepth,facing);
    vec4 projected=uLocalToClip*vec4(hit,1.);
    return projected.xy/projected.w*.5+.5;
  }
  void main(){
    vec3 N=normalize(vNormalW);
    N=faceforward(N,normalize(vWorld-cameraPosition),N);
    vec3 V=normalize(cameraPosition-vWorld);
    float t=uFlowTime*.65;
    // Secondary waviness acts on the actual surface normal.
    float n=fbm3(vLocal*4.4*uFlowScale+vec3(.11*t,-.13*t,.08*t));
    vec3 rip=vec3(sin(vLocal.y*12.+n*4.+t*.8),
                  cos(vLocal.x*13.-n*3.+t*.52),
                  sin(vLocal.z*11.+n*4.-t*.54));
    N=normalize(N+rip*(.025*uRipple));
    float nv=clamp(dot(N,V),0.,1.);
    float fres=pow(1.-nv,3.0);
    vec3 I=normalize(vWorld-cameraPosition);
    vec2 uv=gl_FragCoord.xy/uResolution;
    vec2 px=1./uResolution;
    vec3 radialNormal=normalize(uWorldNormal*normalize((uWorldToLocal*vec4(vWorld,1.)).xyz));
    // Use view incidence, not local XY: the lens follows a turned head correctly.
    float facing=clamp(dot(radialNormal,V),0.,1.);
    float edgeLens=glassEdge(facing);
    float dispersion=uDispersion*.035;
    vec3 opticalNormal=normalize(mix(radialNormal,N,.30+.70*edgeLens));
    // Do not weaken the face by another 88% after computing its optical path.
    vec2 redUV=mix(uv,curvedGlassUV(I,opticalNormal,1.44-dispersion,facing),uRefraction);
    vec2 greenUV=mix(uv,curvedGlassUV(I,opticalNormal,1.44,facing),uRefraction);
    vec2 blueUV=mix(uv,curvedGlassUV(I,opticalNormal,1.44+dispersion,facing),uRefraction);
    float red=insideLight(redUV).r;
    float green=insideLight(greenUV).g;
    float blue=insideLight(blueUV).b;
    vec3 through=vec3(red,green,blue);
    vec3 reflected=reflect(-V,N);
    vec2 envUV=vec2(atan(reflected.z,reflected.x)/6.2831853+.5,asin(clamp(reflected.y,-1.,1.))/3.14159265+.5);
    vec3 environment=studioLight(envUV);
    // Clear glass has a clear center, even with strong reflection or ripples.
    // Keep the full studio treatment only for the explicitly metallic material.
    float reflectionWindow=glassReflectionWindow(facing);
    if(uStyle>.5&&uStyle<1.5)reflectionWindow=1.;
    environment*=reflectionWindow;
    float fresnel=.04+.96*pow(1.-nv,5.);
    vec3 glassTint=paletteColor(.22);
    float reflectivity=uStyle>.5&&uStyle<1.5?.22+.76*pow(1.-nv,1.6):fresnel;
    // Depth changes transmitted contrast in every glass material, not just Luminous.
    vec3 transmission=through*exp(-uDepth*vec3(.72,.52,.35)*(1.-nv*.7));
    vec3 col=transmission*(1.-reflectivity*.68*uGlass)+environment*(2.18*uGlass)*reflectivity;
    col+=glassTint*pow(1.-nv,5.)*.125*uGlass;
    if(uStyle>1.5&&uStyle<2.5){
      // Companion is a broad, warm satin coating; Ethereal stays optically clear.
      vec3 satin=paletteColor(.12)*pow(1.-nv,2.2)*.185*uGlass;
      col=transmission*(1.-reflectivity*.42*uGlass)*vec3(1.025,1.,.975)+environment*reflectivity*uGlass*.48+satin;
    }
    if(uStyle>2.5){
      vec3 p=vLocal;float cs=cos(uFlowAngle),sn=sin(uFlowAngle);p.xy=mat2(cs,-sn,sn,cs)*p.xy;p*=uFlowScale;
      float slow=uRibbonPhase;
      float flow=ribbonFlow(p);
      float ribbon=exp(-pow(flow/(mix(.16,.43,uDepth)*mix(.45,1.55,uRibbonWidth)),2.));
      float veil=exp(-pow((flow-mix(.20,.48,uDepth))/.38,2.));
      float side=1.-smoothstep(-.75,.75,p.x+p.y*.58);
      float hue=.5+.5*sin(p.y*3.1-p.x*2.6+slow*.8);
      vec3 pastel=paletteColor(hue);
      vec3 cyan=paletteColor(.64);
      pastel=mix(pastel,cyan,exp(-pow((p.x+.6)/.25,2.))*.65);
      col=vec3(.001,.001,.002)+pastel*(ribbon*1.12+veil*.025)*uRibbonIntensity*(.10+.9*side);
      col+=paletteColor(.12)*pow(1.-nv,3.)*.24;
      col+=paletteColor(.83)*ribbon*side*pow(1.-nv,1.4)*.32*uRibbonIntensity;
      float faceZone=exp(-pow(p.x/.60,4.)-pow((p.y+.03)/.46,4.))*uFace;
      col=(col*(1.-faceZone*.72)+through*(1.-.18*uDepth))*(1.+.22*uLevel);
      col+=environment*fresnel*uGlass*(.18+.85*edgeLens)*mix(1.,.72,uEdgeSoftness);
    }
    if(uStyle<2.5){
      vec3 p=vLocal;float cs=cos(uFlowAngle),sn=sin(uFlowAngle);p.xy=mat2(cs,-sn,sn,cs)*p.xy;p*=uFlowScale;
      float sheet=exp(-pow(ribbonFlow(p)/(mix(.16,.43,uDepth)*mix(.45,1.55,uRibbonWidth)),2.));
      col+=paletteColor(.5+.5*sin(p.y*3.1-p.x*2.6+uRibbonPhase*.8))*sheet*uRibbonIntensity*.34*pow(1.-facing,.8);
    }
    float film=.5+.5*sin(nv*8.+n*2.-uRibbonPhase*.6);
    col+=paletteColor(film)*uIridescence*pow(1.-facing,1.7)*.42;
    // Light belongs to the silhouette; the post pass diffuses it into black.
    vec3 edgeColor=paletteColor(.5+.5*sin(vLocal.y*2.5-vLocal.x*1.8+uFlowTime*.04));
    // Spread energy over a wider Fresnel lobe instead of clipping a white wire rim.
    float edgePower=mix(9.,2.8,uEdgeSoftness);
    float edgeEnergy=mix(1.65,.80,uEdgeSoftness);
    col+=edgeColor*pow(1.-nv,edgePower)*edgeEnergy*uEdgeGlow;
    if(uStageEffect.z>.001){
      float mode=uStageEffect.x,age=uStageEffect.y,weight=uStageEffect.z;
      float rim=pow(1.-nv,2.1);
      float travel=uEffectTravel;
      float sweep=vLocal.y+.38*vLocal.x-travel;
      vec3 spectrum=.52+.48*cos(6.28318*(vLocal.y*.42+vLocal.x*.18-age*.52+vec3(0.,.67,.33)));
      if(mode==2.)col=mix(col,col*.62+spectrum*(.72+rim*.65),exp(-sweep*sweep*3.7)*weight*.74);
      if(mode==4.){
        float lead=(vLocal.y+.15*vLocal.x)-(-1.25+age*1.95);
        float follow=lead+.64;
        col+=paletteColor(.65)*(exp(-lead*lead*65.)+.64*exp(-follow*follow*75.))*(.24+rim*.92)*weight;
      }
      if(mode==5.){
        float arc=vLocal.x+.23*vLocal.y*vLocal.y-travel;
        float shadow=smoothstep(-.38,-.08,arc)*(1.-smoothstep(.25,.65,arc));
        vec3 clearFace=texture2D(uInner,uv).rgb;
        col=mix(col,clearFace*.91,shadow*weight*.82);
        col+=vec3(1.,.48,.13)*rim*exp(-arc*arc*24.)*weight*.87;
      }
      if(mode==6.)col+=spectrum*rim*weight*(.22+.35*pow(.5+.5*sin(age*8.+vLocal.y*10.),4.));
      if(mode==7.){
        float split=.025+.29*sin((travel*.5+.5)*3.14159);
        vec3 distanceToBand=vec3(vLocal.x-.35*vLocal.y-travel*.94)+vec3(-split,0.,split);
        col+=exp(-distanceToBand*distanceToBand*34.)*vec3(.70,.64,.94)*weight*(.26+rim*.61);
      }
      if(mode==8.)col+=vec3(1.,.17,.37)*(.17+rim*.92)*uStageEffect.w;
      if(mode==9.)col+=vec3(.27,.52,.89)*rim*weight*.31;
      if(mode==10.)col+=paletteColor(.18)*rim*weight*.34*smoothstep(-.15,.85,-vLocal.y);
      if(mode==11.){
        float curtain=vLocal.y-.31*sin(vLocal.x*4.8+age*1.85)-travel*.53;
        float fold=sin(29.*vLocal.x+5.*sin(vLocal.y*3.+age));
        float filaments=exp(-curtain*curtain*16.)*(.5+.5*fold);
        vec3 aurora=mix(vec3(.12,1.65,1.19),vec3(.74,.23,1.8),smoothstep(-.3,.6,curtain));
        col+=aurora*filaments*weight*(.35+rim);
      }
      if(mode==12.){
        vec2 point=vLocal.xy+vec2(.00001,0.);
        float radius=length(point);
        float spin=(1.-smoothstep(.13,.93,radius))*(1.25+.21*sin(age*1.6))*weight;
        vec2 turn=mat2(cos(spin),-sin(spin),sin(spin),cos(spin))*point;
        vec2 warpedUV=clamp(uv+(turn-point)*vec2(uResolution.y/uResolution.x,1.)*.25,vec2(.001),vec2(.999));
        vec3 bentStars=texture2D(uBackground,warpedUV).rgb;
        float disk=smoothstep(.31,.70,radius);
        float bend=radius-.69;
        float arc=smoothstep(-.66,.45,point.x+.24*point.y);
        vec3 lens=bentStars*(.025+.90*disk)+vec3(.23,.40,1.02)*exp(-bend*bend*26.)*(.10+.27*arc);
        col=mix(col,lens,weight*.97);
      }
      if(mode==13.){
        vec2 point=vLocal.xy+vec2(.00001,0.);
        float sector=floor((atan(point.y,point.x)+3.141593)*.95493);
        float planes=.5+.5*cos(sector*2.39996+vLocal.z*1.3);
        float glint=vLocal.y+.52*vLocal.x-travel*1.31;
        vec3 facetColor=mix(vec3(.08,.26,.63),vec3(.75,.42,1.12),planes);
        col=mix(col,col*(.69+.30*planes)+facetColor*(.12+rim*.43),weight*.83);
        col+=spectrum*exp(-glint*glint*82.)*(.69+rim*.77)*weight;
      }
      if(mode==14.){
        float cloud=fbm3(vLocal*3.1+vec3(age*.16,-age*.11,age*.19));
        float lit=smoothstep(.36,.74,cloud);
        col+=mix(vec3(.33,.12,1.22),vec3(1.4,.26,.72),lit)*lit*weight*(.13+rim*.80);
      }
    }
    float height=clamp(vLocal.y*.5+.5,0.,1.);
    float filmFill=mix(uShell,smoothstep(height-.22,height+.22,uShell),uPopReform);
    float seamDistance=(height-uShell)*9.;
    float seam=exp(-seamDistance*seamDistance)*uPopReform;
    vec3 popLight=mix(edgeColor,vec3(.9,.95,1.),.55);
    vec3 filmLight=popLight*pow(1.-nv,3.)*(uPopFlash*2.7+seam*1.25);
    gl_FragColor=vec4(mix(texture2D(uInner,uv).rgb,max(col,vec3(0.)),filmFill)+filmLight,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
  }
`;

const haloFragment=/* glsl */`
  ${paletteGLSL}
  uniform float uVoiceEnvelope,uVoiceHalo,uFlowTime;
  varying vec3 vLocal,vWorld,vNormalW;
  void main(){
    vec3 V=normalize(cameraPosition-vWorld);
    float facing=abs(dot(normalize(vNormalW),V));
    // Zero energy at the outer boundary, occluded by the character at the center.
    float density=pow(facing,2.8)*smoothstep(0.,.35,facing);
    float side=.45+.55*(.5+.5*sin(vLocal.y*2.2-vLocal.x*2.8+uFlowTime*.1));
    vec3 light=paletteColor(.5+.5*sin(vLocal.y*2.5-vLocal.x*1.8+uFlowTime*.04));
    gl_FragColor=vec4(light*3.*(.18+uVoiceEnvelope*3.6)*uVoiceHalo,density*side);
  }
`;

function make(canvas,{monitor=false}={}){
  if(!THREE){
    canvas.style.background='#000';
    canvas.dataset.engineError=String(loadError||'Three.js is missing');
    return {fallback:true,error:'Three.js is not available. Run setup_offline.command before the show.',draw(){}};
  }
  let renderer;
  try {
    renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'high-performance',stencil:false,preserveDrawingBuffer:false});
  }catch(err){
    return {fallback:true,error:'WebGL could not initialize on this computer: '+err.message,draw(){}};
  }
  renderer.setClearColor(0x000000,1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x000000);
  const camera=new THREE.PerspectiveCamera(34,16/9,.1,40);
  camera.position.set(0,0,3.85);
  camera.lookAt(0,0,0);
  const orb=new THREE.Group();scene.add(orb);
  const particleGlassBackground={value:null},particleGlassResolution={value:new THREE.Vector2(2,2)};
  function particleGlass(tint,bend){
    return new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,
      uniforms:{uBackdrop:particleGlassBackground,uViewport:particleGlassResolution,uTint:{value:tint},uBend:{value:bend},uVisibility:{value:0}},
      vertexShader:`
        varying vec3 vNormal,vView;
        void main(){
          vec4 viewPosition=modelViewMatrix*vec4(position,1.);
          vView=-viewPosition.xyz;
          vNormal=normalMatrix*normal;
          gl_Position=projectionMatrix*viewPosition;
        }
      `,
      fragmentShader:`
        uniform sampler2D uBackdrop;
        uniform vec2 uViewport;
        uniform vec3 uTint;
        uniform float uBend,uVisibility;
        varying vec3 vNormal,vView;
        void main(){
          vec3 normal=normalize(vNormal),view=normalize(vView);
          vec2 uv=gl_FragCoord.xy/uViewport;
          vec2 shift=(refract(-view,normal,1./1.43).xy+view.xy)*uBend*vec2(uViewport.y/uViewport.x,1.);
          vec3 through=vec3(
            texture2D(uBackdrop,clamp(uv+shift*1.14,0.,1.)).r,
            texture2D(uBackdrop,clamp(uv+shift,0.,1.)).g,
            texture2D(uBackdrop,clamp(uv+shift*.86,0.,1.)).b
          );
          vec3 milkGlass=mix(vec3(.45),uTint*.62,.55);
          vec3 color=mix(through*mix(vec3(1.),uTint,.14),milkGlass,.42);
          gl_FragColor=vec4(color,uVisibility);
        }
      `
    });
  }
  const heartShape=new THREE.Shape();
  heartShape.moveTo(0,-.12);
  heartShape.bezierCurveTo(-.06,-.06,-.21,.015,-.125,.10);
  heartShape.bezierCurveTo(-.085,.145,-.025,.12,0,.072);
  heartShape.bezierCurveTo(.025,.12,.085,.145,.125,.10);
  heartShape.bezierCurveTo(.21,.015,.06,-.06,0,-.12);
  const heartGeometry=new THREE.ExtrudeGeometry(heartShape,{depth:.019,bevelSize:.018,bevelThickness:.016,bevelSegments:5,curveSegments:24});
  const heartMaterial=particleGlass(new THREE.Color(1.35,.22,.51),.08);
  const dropletGeometry=new THREE.SphereGeometry(.029,16,12);
  const hearts=Array.from({length:6},()=>new THREE.Mesh(heartGeometry,heartMaterial));
  const droplets=Array.from({length:42},(_,index)=>{
    const tint=new THREE.Color(1.35,.46,1.04).lerp(new THREE.Color(.35,.97,1.4),(1+Math.sin(index*2.39996))*.5);
    const drop=new THREE.Mesh(dropletGeometry,particleGlass(tint,.026));
    drop.renderOrder=6;
    return drop;
  });
  scene.add(...hearts,...droplets);
  const wakeSegments=46,wakePositions=new Float32Array((wakeSegments+1)*6);
  const wakeUVs=new Float32Array((wakeSegments+1)*4),wakeIndices=[];
  for(let index=0;index<=wakeSegments;index++){
    wakeUVs.set([index/wakeSegments,0,index/wakeSegments,1],index*4);
    const vertex=index*2;
    if(index<wakeSegments)wakeIndices.push(vertex,vertex+1,vertex+2,vertex+1,vertex+3,vertex+2);
  }
  const wakeGeometry=new THREE.BufferGeometry();
  wakeGeometry.setAttribute('position',new THREE.BufferAttribute(wakePositions,3).setUsage(THREE.DynamicDrawUsage));
  wakeGeometry.setAttribute('uv',new THREE.BufferAttribute(wakeUVs,2));
  wakeGeometry.setIndex(wakeIndices);
  const wakeMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uWakeAlpha:{value:0}},
    vertexShader:`varying vec2 vWake;void main(){vWake=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vWake;uniform float uWakeAlpha;void main(){
      float across=abs(vWake.y*2.-1.);
      float feather=1.-smoothstep(.04,1.,across);
      float filament=.55+.45*sin(vWake.x*17.+vWake.y*18.);
      vec3 color=mix(vec3(.92,2.15,3.65),vec3(.62,.24,1.65),across);
      gl_FragColor=vec4(color,uWakeAlpha*feather*filament*pow(clamp(1.-vWake.x,0.,1.),1.35));
    }`
  });
  const cometWake=new THREE.Mesh(wakeGeometry,wakeMaterial);
  cometWake.frustumCulled=false;cometWake.visible=false;scene.add(cometWake);
  cometWake.renderOrder=6;
  const cometCoreGeometry=new THREE.PlaneGeometry(2,2);
  const cometCoreMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uCoreAlpha:{value:0}},
    vertexShader:`varying vec2 vCore;void main(){vCore=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vCore;uniform float uCoreAlpha;void main(){
      float radius=dot(vCore,vCore);
      float light=(exp(-radius*19.)*.85+exp(-radius*5.)*.32)*(1.-smoothstep(.64,1.,radius));
      vec3 color=mix(vec3(.23,1.35,3.3),vec3(4.2,4.8,5.4),exp(-radius*25.));
      gl_FragColor=vec4(color,light*uCoreAlpha);
    }`
  });
  const cometCore=new THREE.Mesh(cometCoreGeometry,cometCoreMaterial);
  cometCore.visible=false;cometCore.renderOrder=7;scene.add(cometCore);
  const shockGeometry=new THREE.PlaneGeometry(2,2);
  const shockRings=Array.from({length:1},()=>{
    const ring=new THREE.Mesh(shockGeometry,new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      uniforms:{uStrength:{value:0},uAge:{value:0},uAtmosphere:{value:0}},
      vertexShader:`varying vec2 vRing;void main(){vRing=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`
        varying vec2 vRing;
        uniform float uStrength,uAge,uAtmosphere;
        ${noiseGLSL}
        void main(){
          vec2 point=vRing+vec2(1.e-5,0.);
          float radius=length(point),angle=atan(point.y,point.x);
          if(uAtmosphere>0.){
            float feather=1.-smoothstep(.57,.99,radius);
            float wisps=fbm3(vec3(point*3.8,uAge*.21));
            if(uAtmosphere==11.){
              float sweep=point.y-.21-.25*sin(point.x*5.+uAge*1.5);
              float lower=point.y+.20-.19*sin(point.x*6.-uAge*1.2);
              float veils=exp(-sweep*sweep*34.)+.60*exp(-lower*lower*38.);
              vec3 tint=mix(vec3(.13,1.8,1.16),vec3(.81,.22,1.6),smoothstep(.21,.73,wisps+.19*point.y));
              gl_FragColor=vec4(tint,uStrength*feather*veils*(.37+.63*wisps));return;
            }
            if(uAtmosphere==12.){
              vec2 disk=vec2(point.x,point.y*2.7);
              float distance=length(disk),azimuth=atan(disk.y,disk.x+.00001);
              float band=distance-.70;
              float filament=.46+.54*fbm3(vec3(disk*5.3,uAge*.53));
              float arc=.28+.72*smoothstep(-.8,.7,cos(azimuth-uAge*.65));
              vec3 tint=mix(vec3(.24,.34,1.38),vec3(1.55,.73,.37),arc);
              gl_FragColor=vec4(tint,uStrength*feather*exp(-band*band*25.)*filament*arc);return;
            }
            float swirl=sin(angle*2.-radius*5.+uAge*.64);
            float cloud=smoothstep(.30,.76,wisps+.17*swirl);
            vec3 tint=mix(vec3(.25,.12,1.18),vec3(1.47,.31,.78),smoothstep(.35,.8,cloud));
            gl_FragColor=vec4(tint,uStrength*feather*cloud*smoothstep(.10,.40,radius));return;
          }
          float lobes=.69+.14*sin(angle*7.+.9)+.09*cos(angle*13.)+.045*sin(angle*23.);
          float billow=1.-smoothstep(lobes*.57,lobes,radius);
          float turbulence=.57+.23*sin(angle*17.+radius*29.-uAge*5.)+.16*cos(angle*9.-radius*43.+uAge*6.);
          float rays=pow(.5+.5*sin(angle*19.+1.9*sin(angle*7.)),9.);
          rays*=smoothstep(.30,.46,radius)*(1.-smoothstep(lobes*.72,1.,radius));
          float hot=exp(-radius*radius*7.)*(1.-smoothstep(.08,.46,uAge));
          vec3 color=mix(vec3(.75,.09,.36),vec3(2.6,.95,.22),clamp(hot+billow*.64,0.,1.));
          color=mix(color,vec3(3.2,2.6,1.65),hot*.72);
          gl_FragColor=vec4(color,uStrength*(billow*turbulence*.82+rays*.72+hot*.55));
        }
      `
    }));
    ring.visible=false;scene.add(ring);return ring;
  });
  const studioCanvas=document.createElement('canvas');studioCanvas.width=2048;studioCanvas.height=1024;
  const studioContext=studioCanvas.getContext('2d');
  studioContext.fillStyle='#05090e';studioContext.fillRect(0,0,2048,1024);
  function softbox(x,y,w,h,color){
    const grad=studioContext.createRadialGradient(x,y,0,x,y,Math.max(w,h));
    grad.addColorStop(0,color);grad.addColorStop(.32,color);grad.addColorStop(1,'#05090e');
    studioContext.save();studioContext.translate(x,y);studioContext.scale(w/Math.max(w,h),h/Math.max(w,h));
    studioContext.fillStyle=grad;studioContext.translate(-x,-y);studioContext.fillRect(x-Math.max(w,h),y-Math.max(w,h),Math.max(w,h)*2,Math.max(w,h)*2);studioContext.restore();
  }
  softbox(610,500,42,400,'#d4e4e8');softbox(1430,530,28,340,'#bca180');softbox(1024,880,500,70,'#617b86');
  const studioMap=new THREE.CanvasTexture(studioCanvas);studioMap.wrapS=THREE.RepeatWrapping;
  studioMap.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer);const studioEnvironment=pmrem.fromEquirectangular(studioMap);pmrem.dispose();
  scene.environment=studioEnvironment.texture;
  scene.add(new THREE.HemisphereLight(0xc9dbff,0x29152f,.65));
  const keyLight=new THREE.DirectionalLight(0xffe1ed,2.5);keyLight.position.set(-2,3,4);scene.add(keyLight);
  const fillLight=new THREE.DirectionalLight(0x719fff,1.2);fillLight.position.set(3,-1,2);scene.add(fillLight);
  const U={
    uWorldNormal:{value:new THREE.Matrix3()},uWorldToLocal:{value:new THREE.Matrix4()},uLocalToClip:{value:new THREE.Matrix4()},uFaceRadius:{value:.985},uBackground:{value:null},uStudio:{value:studioMap},
    uActionShape:{value:new THREE.Vector4()},uActionBody:{value:new THREE.Vector4()},uActionBodyTime:{value:0},
    uActionA:{value:new THREE.Vector4()},uActionB:{value:new THREE.Vector4()},uActionTime:{value:0},
    uFlowScale:{value:.8},uFlowCurl:{value:1},uFlowAngle:{value:0},uVoiceEnvelope:{value:0},uVoiceHalo:{value:.7},uFlowTime:{value:0},uAudioFluid:{value:0},uTime:{value:0},uMotion:{value:.7},uLevel:{value:0},uDeform:{value:.42},
    uSurfaceTension:{value:.35},uBreath:{value:0},uSurfaceRoughness:{value:.12},uSurfaceFrosting:{value:0},uIridescence:{value:.2},uRibbonPhase:{value:0},uRibbonWidth:{value:.5},uRibbonIntensity:{value:1},
    uEdgeSoftness:{value:.65},uFeatureSoftness:{value:.55},uEdgeGlow:{value:.7},uStyle:{value:0},uPalette:{value:1},uFace:{value:.23},uGlass:{value:.75},uShell:{value:1},
    uRefraction:{value:.58},uDispersion:{value:.28},uDepth:{value:.66},uPopFlash:{value:0},uPopReform:{value:0},uStageEffect:{value:new THREE.Vector4()},uEffectTravel:{value:0},
    uRipple:{value:.45},uBass:{value:0},uMid:{value:0},uTreble:{value:0},
    uResolution:{value:new THREE.Vector2(2,2)},uInner:{value:null},uFrostedInner:{value:null}
  };
  const paletteUniforms=createPaletteUniforms(THREE);Object.assign(U,paletteUniforms);applyPalette(U,0);
  const share=layer=>({...U,uLayer:{value:layer}});
  const innerTarget=new THREE.WebGLRenderTarget(2,2,{
    minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
    format:THREE.RGBAFormat,type:THREE.HalfFloatType,depthBuffer:true,stencilBuffer:false
  });
  innerTarget.texture.colorSpace=THREE.LinearSRGBColorSpace;innerTarget.texture.generateMipmaps=false;
  U.uInner.value=innerTarget.texture;
  const backgroundTarget=innerTarget.clone();backgroundTarget.texture.generateMipmaps=false;backgroundTarget.texture.minFilter=THREE.LinearFilter;U.uBackground.value=backgroundTarget.texture;
  particleGlassBackground.value=backgroundTarget.texture;
  const starField=createStarField(THREE,paletteUniforms);scene.add(starField.points);
  const postProcessing=createPostProcessing(THREE,renderer);
  const glassFrosting=createGlassFrosting(THREE,renderer);
  const geometryInner=new THREE.SphereGeometry(.942,144,96);
  const geometryGlass=new THREE.SphereGeometry(1.037,144,96);
  const inner=new THREE.Mesh(geometryInner,new THREE.ShaderMaterial({
    uniforms:share(0),vertexShader,fragmentShader:coreFragment,
    side:THREE.FrontSide,transparent:false,depthWrite:false,extensions:{derivatives:true}
  }));
  inner.renderOrder=0;orb.add(inner);
  const glass=new THREE.Mesh(geometryGlass,new THREE.ShaderMaterial({
    uniforms:share(1),vertexShader,fragmentShader:shellFragment,
    side:THREE.FrontSide,transparent:false,depthWrite:true,
    extensions:{derivatives:true}
  }));
  glass.renderOrder=5;orb.add(glass);
  const geometryHalo=new THREE.SphereGeometry(1.20,96,64);
  const halo=new THREE.Mesh(geometryHalo,new THREE.ShaderMaterial({uniforms:share(3),vertexShader,fragmentShader:haloFragment,side:THREE.BackSide,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false}));
  halo.renderOrder=4;orb.add(halo);

  // Facial rig is spatially inside the shell, with actual z-depth and parallax.
  const faceRig=new THREE.Group();orb.add(faceRig);
  const eyes=[];
  // Soften the geometric contour in the material, preserving full image resolution.
  function softenContour(material){
    material.onBeforeCompile=shader=>{
      shader.uniforms.uFeatureSoftness=U.uFeatureSoftness;
      shader.fragmentShader='uniform float uFeatureSoftness;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\n diffuseColor.a*=smoothstep(0.,mix(.18,.82,uFeatureSoftness),max(0.,dot(normal,normalize(vViewPosition))));');
    };
    material.customProgramCacheKey=()=> 'nord-soft-contour-v2';
    return material;
  }
  const eyeMaterial=softenContour(new THREE.MeshPhysicalMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:3.0,metalness:0,roughness:.42,transmission:.10,thickness:.035,ior:1.12,clearcoat:0,iridescence:0,envMapIntensity:.1,transparent:true,opacity:1,depthWrite:false,side:THREE.FrontSide}));
  const eyeGeom=new THREE.SphereGeometry(1,64,48);
  const eyeTemplate=new Float32Array(eyeGeom.attributes.position.array);
  // Nord's eyes are single, pupil-free volumes. No nested rings or facial artwork.
  for(const x of [-.235,.235]){
    const eye=new THREE.Mesh(eyeGeom.clone(),softenContour(eyeMaterial.clone()));
    eye.position.set(x,.135,.945);eye.scale.set(.132,.135,.047);
    eye.renderOrder=2;eyes.push(eye);faceRig.add(eye);
  }
  const thoughtGeometry=new THREE.SphereGeometry(1,32,24);
  const thoughtTemplate=new Float32Array(thoughtGeometry.attributes.position.array);
  const thoughtDots=[0,1,2].map(()=>{
    const dot=new THREE.Mesh(thoughtGeometry.clone(),softenContour(eyeMaterial.clone()));
    dot.position.set(0,0,.945);dot.scale.set(.047,.047,.035);dot.renderOrder=2;dot.visible=false;faceRig.add(dot);return dot;
  });
  // The filled speech aperture follows one soft three-dimensional contour.
  const cavityMat=softenContour(new THREE.MeshPhysicalMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:2.6,roughness:.6,envMapIntensity:0,transparent:true,depthWrite:false}));
  const cavityGeometry=new THREE.SphereGeometry(1,64,32);
  const cavity=new THREE.Mesh(cavityGeometry,cavityMat);
  const orbitGeometry=new THREE.SphereGeometry(1,40,28);
  const orbitMaterial=particleGlass(new THREE.Color(.66,.91,1.18),.072);
  const orbitFaceMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(2.5,2.6,2.8),transparent:true,depthWrite:false});
  const orbitCopies=Array.from({length:8},()=>{
    const group=new THREE.Group();
    const shell=new THREE.Mesh(orbitGeometry,orbitMaterial);shell.renderOrder=7;group.add(shell);
    const features=[...eyes,cavity].map(feature=>{
      const copy=new THREE.Mesh(feature.geometry,orbitFaceMaterial);copy.renderOrder=8;group.add(copy);return copy;
    });
    group.visible=false;scene.add(group);
    return {group,features};
  });
  cavity.position.set(0,-.285,.940);cavity.renderOrder=2;faceRig.add(cavity);
  const mouthTemplate=new Float32Array(cavityGeometry.attributes.position.array);
  function shapeMouth(width,height,curve,radius,skew=0){
    deformGlassMouth(cavityGeometry,mouthTemplate,width,height,curve,true,skew);
    wrapMouthInsideGlass(cavityGeometry,cavity.position,radius,faceRig.position.y);
  }
  // width, eye height, brow slope, brow lift, mouth curvature, mouth opening, bounce
  const profiles=[
    [1,1,0,0,-.018,0,.02],
    [1.08,1.25,-.15,.055,-.012,0,.045],
    [1.12,.42,.20,.07,-.13,0,.010],
    [1.12,.42,.55,-.035,.065,0,.025],
    [.95,.62,-.55,-.015,.18,0,.012],
    [.92,1.8,-.24,.10,.01,0,.025],
    [1,.65,-.24,.025,.035,0,.02],
    [1.1,1.25,0,.06,.01,0,.035]
  ];
  let expression=[...profiles[0]];
  const extraProfiles={
    flirting:[1.1,.79,.1,.04,-.16,0,0],
    laugh:[1.18,.30,.10,.065,-.19,0,.024],
    shy:[.92,.56,.08,-.06,-.095,0,0],
    surprise:[.31,.34,0,.065,0,0,0],
    sleepy:[1.04,.24,0,-.045,0,0,0],
    proud:[1.13,.62,.08,.025,-.15,0,0]
  };
  const eyeExpression=[0,1].map(()=>({width:1,height:1,tilt:0,lift:0,curve:0}));
  const stagePosition=createStagePosition(),characterPerformance=createCharacterPerformance(),gazeDriver=createGazeDriver();
  const bodyForm=createBodyForm();
  let mouthSkew=0,previousActorYaw=0,previousActorPitch=0,previousFlirtTilt=0;
  let previousWidth=0,previousHeight=0,previousScale=0;
  let mouseX=0,mouseY=0,dragging=false,dragX=0,dragY=0;
  const audience=new URLSearchParams(location.search).get('view')==='stage';
  if(!audience&&!monitor){
    canvas.style.cursor='grab';
    canvas.addEventListener('pointerdown',e=>{
      dragging=true;dragX=e.clientX;dragY=e.clientY;canvas.setPointerCapture?.(e.pointerId);canvas.style.cursor='grabbing';
    });
    canvas.addEventListener('pointerup',()=>{dragging=false;canvas.style.cursor='grab';});
    canvas.addEventListener('pointercancel',()=>{dragging=false;canvas.style.cursor='grab';});
    canvas.addEventListener('pointermove',e=>{
      if(!dragging)return;
      const box=canvas.getBoundingClientRect();
      mouseX=THREE.MathUtils.clamp(mouseX+(e.clientX-dragX)/Math.max(150,box.width)*2.2,-.9,.9);
      mouseY=THREE.MathUtils.clamp(mouseY+(e.clientY-dragY)/Math.max(150,box.height)*1.8,-.55,.55);
      dragX=e.clientX;dragY=e.clientY;
    });
    canvas.addEventListener('dblclick',()=>{mouseX=0;mouseY=0;});
  }

  function resize(quality){
    const box=canvas.getBoundingClientRect();
    const w=Math.max(2,Math.round(box.width)),h=Math.max(2,Math.round(box.height));
    const scale=monitor?1:renderScale(window.devicePixelRatio||1,quality);
    if(w===previousWidth&&h===previousHeight&&Math.abs(scale-previousScale)<.02)return;
    renderer.setPixelRatio(scale);
    renderer.setSize(w,h,false);
    const dw=renderer.domElement.width,dh=renderer.domElement.height;
    innerTarget.setSize(dw,dh);backgroundTarget.setSize(dw,dh);particleGlassResolution.value.set(dw,dh);
    postProcessing.resize(dw,dh);glassFrosting.resize(dw,dh);
    U.uResolution.value.set(dw,dh);
    camera.aspect=w/h;camera.position.z=3.85/Math.min(1,camera.aspect);camera.updateProjectionMatrix();
    previousWidth=w;previousHeight=h;previousScale=scale;
  }
  const audioFluid=createAudioFluidDriver(),voiceEnvelope=createVoiceEnvelope(),surfaceAnimation=createSurfaceAnimation();
  let fluidLastTime=null;
  let contextLost=false;
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();contextLost=true;
    canvas.dataset.engineError='WebGL context lost. Reload the page after checking GPU load.';
  });
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;});
  function number(v,def,min=0,max=1){const x=Number(v);return Number.isFinite(x)?THREE.MathUtils.clamp(x,min,max):def;}
  function draw(p){
    if(contextLost)return;
    resize(number(p.quality,1,.65,1.3));
    orb.rotation.y-=previousActorYaw;orb.rotation.x-=previousActorPitch;
    orb.rotation.z-=previousFlirtTilt;
    const t=number(p.time,0,0,1e8),lvl=number(p.level,0);
    const motion=number(p.motion,.55,0,2),intensity=number(p.intensity,.7);
    const performance=characterPerformance.update(p.actorAction,p.actionSurface??1,number(p.frameDelta,.016,0,.06),p.performanceTime);
    const actionSurface=performance.surface;
    U.uActionA.value.fromArray(actionSurface.a);U.uActionB.value.fromArray(actionSurface.b);U.uActionTime.value=actionSurface.time;
    const actionBody=performance.body;
    const form=bodyForm(p.bodyForm,number(p.frameDelta,.016,0,.06),actionBody);
    U.uActionShape.value.fromArray(form.shape);U.uActionBody.value.fromArray(actionBody.body);U.uActionBodyTime.value=actionBody.time;
    const faceHandoff=thinkingFaceHandoff(actionBody.face),faceLight=faceHandoff.normal;
    const gaze=gazeDriver.update(p.actorAction,number(p.frameDelta,.016,0,.06));
    U.uStyle.value=number(p.style,0,0,3);
    U.uTime.value=t;U.uMotion.value=motion;U.uLevel.value=lvl;
    const delta=t-(fluidLastTime??t);
    U.uVoiceEnvelope.value=voiceEnvelope.update(number(p.amplitude,lvl),delta);U.uVoiceHalo.value=number(p.voiceHalo,.7);
    // Grow the real back volume; no screen-space disc or fixed-radius glow ring.
    halo.scale.setScalar(.90+number(p.haloSpread,.45)*.40+U.uVoiceEnvelope.value*.065);
    const effect=stageEffectPose(p.actorAction);
    starField.update({time:t,pixelRatio:renderer.getPixelRatio(),...starFieldOptions(p),action:starActionPose(p.actorAction,effect)});
    scene.background.set(/^#[0-9a-f]{6}$/i.test(p.backgroundColor)?p.backgroundColor:'#000000');
    U.uFlowScale.value=number(p.flowScale,.8,.3,2);U.uFlowCurl.value=number(p.flowCurl,1,0,2);U.uFlowAngle.value=number(p.flowAngle,0,-180,180)*Math.PI/180;
    const fluid=audioFluid.update(number(p.amplitude,lvl),delta,p.audioFluid!==false,motion,number(p.audioResponse,1,0,2));
    fluidLastTime=t;U.uFlowTime.value=fluid.phase;U.uAudioFluid.value=fluid.level;
    const color=surfaceAnimation.update(delta,p);
    U.uPalettePhase.value=color.palettePhase;U.uDynamicHue.value=color.hue;U.uDynamicGain.value=color.gain;U.uRibbonPhase.value=color.ribbonPhase;U.uBreath.value=color.breath;
    U.uSurfaceRoughness.value=number(p.surfaceRoughness,.12);U.uSurfaceFrosting.value=number(p.surfaceFrosting,0);U.uSurfaceTension.value=number(p.surfaceTension,.35);U.uIridescence.value=number(p.iridescence,.2);
    U.uRibbonWidth.value=number(p.ribbonWidth,.5);U.uRibbonIntensity.value=number(p.ribbonIntensity,1,0,2);
    U.uDeform.value=Math.min(1.25,number(p.deform,0)+fluid.deform);
    U.uGlass.value=number(p.glass,.75);
    U.uEdgeGlow.value=number(p.edgeGlow,.7);
    U.uEdgeSoftness.value=number(p.edgeSoftness,.65);U.uFeatureSoftness.value=number(p.featureSoftness,.55);
    U.uPalette.value=number(p.palette,1,0,3);applyPalette(U,U.uPalette.value,p.customColors,number(p.hueShift,0,-180,180),number(p.colorSaturation,1,0,2),number(p.colorGain,1,0,2));
    U.uFace.value=number(p.face,.23);
    U.uRefraction.value=number(p.refraction,.58);
    U.uDispersion.value=number(p.dispersion,.28);
    U.uDepth.value=number(p.depth,.66);
    U.uRipple.value=number(p.ripple,.45);
    U.uBass.value=number(p.bass,0);
    U.uMid.value=number(p.mid,0);
    U.uTreble.value=number(p.treble,0);
    orb.scale.setScalar(number(p.size,1,.65,1.30)*(1+.007*fluid.level));
    if(!p.freeze){
    orb.rotation.y=THREE.MathUtils.lerp(orb.rotation.y,mouseX*.69+Math.sin(t*.23)*(.074+.053*motion),.055);
    orb.rotation.x=THREE.MathUtils.lerp(orb.rotation.x,mouseY*.67+Math.sin(t*.27)*(.035+.02*motion),.055);
    if(p.head){
      orb.rotation.y=THREE.MathUtils.lerp(orb.rotation.y,number(p.head.yaw,0,-1,1)*1.2,.28);
      orb.rotation.x=THREE.MathUtils.lerp(orb.rotation.x,number(p.head.pitch,0,-1,1)*1.2,.28);
    }
    orb.rotation.z=number(p.tilt,0,-1,1)*.92 + Math.sin(t*.33)*.018;
    if(p.head)orb.rotation.z=number(p.head.roll,0,-1,1);

    }
    previousActorYaw=number(p.actorHeadOffset?.yaw,0,-1,1)*1.2;
    previousActorPitch=number(p.actorHeadOffset?.pitch,0,-1,1)*1.2;
    orb.rotation.y+=previousActorYaw;orb.rotation.x+=previousActorPitch;
    const mood=Math.round(number(p.emotion,0,0,7));
    const target=[...profiles[mood]];
    const face=p.webcamFace;
    const coeff=k=>number(face?.[k],0);
    const facePose=face?mapWebcamExpression(face,number(p.faceStrength,1.8,.5,3)):null;
    if(facePose){
      target[0]=facePose.width;target[1]=1;target[2]=0;target[3]=0;
      target[4]=facePose.curve;target[5]=facePose.opening;target[6]=facePose.bounce;
    }
    const actor=p.actorAction;
    U.uStageEffect.value.set(effect?.mode??0,effect?.time??0,effect?.weight??0,effect?.cometFlare??effect?.beat??0);
    U.uEffectTravel.value=effect?.travel??0;
    const libraryEmote=actor?.kind==='expression'&&Object.hasOwn(LIBRARY_EMOTES,actor.name)?LIBRARY_EMOTES[actor.name]:null;
    const libraryWeight=libraryEmote?number(actor.weight,0):0;
    const emoteMotion=libraryEmote?libraryEmoteMotion(actor.name,actor.elapsed):null;
    const motionValue=key=>(emoteMotion?.[key]??0)*libraryWeight;
    const laughing=actor?.kind==='expression'&&actor.name==='laugh';
    const shy=actor?.kind==='expression'&&actor.name==='shy';
    const surprise=actor?.kind==='expression'&&actor.name==='surprise';
    const sleepy=actor?.kind==='expression'&&actor.name==='sleepy';
    const proud=actor?.kind==='expression'&&actor.name==='proud';
    const recoil=surprise?actor.weight*Math.exp(-actor.elapsed/360):0;
    const sleepyNod=sleepy?actor.weight*(.5-.5*Math.cos(Math.PI*2*actor.elapsed/actor.duration)):0;
    const proudLift=proud?actor.weight:0;
    const laughBeat=laughing?Math.pow(.5-.5*Math.cos(2*Math.PI*actor.elapsed*.0032),1.7):0;
    const shyDip=shy?actor.weight*(1-Math.exp(-actor.elapsed/230)):0;
    const bubble=bubbleActionPose(actor);
    previousFlirtTilt=bubble.tilt-.14*shyDip+motionValue('tilt');
    orb.rotation.z+=previousFlirtTilt;
    previousActorYaw+=motionValue('yaw');
    orb.rotation.y+=motionValue('yaw');
    const emotePitch=.19*shyDip-.22*recoil+.22*sleepyNod-.17*proudLift+motionValue('pitch');
    previousActorPitch+=emotePitch;
    orb.rotation.x+=emotePitch;
    const shell=effect?.shell??bubble.shell;
    U.uFace.value*=effect?.face??1;
    U.uShell.value=shell;
    U.uPopFlash.value=effect?.flash??bubble.flash;
    U.uPopReform.value=effect?.reform??bubble.reform;
    U.uVoiceHalo.value*=shell;
    const actorProfile=actor?.kind==='expression'?(libraryEmote?.face??extraProfiles[actor.name]??profiles[ACTOR_EXPRESSIONS.indexOf(actor.name)]):null;
    const actorWeight=actorProfile?number(actor.weight,0):0;
    const aperture=laughing?.062+.13*laughBeat:surprise?.29+.07*Math.exp(-actor.elapsed/950):proud?.068:Math.max(0,(libraryEmote?.aperture??ACTOR_APERTURES[actor?.name]??0)+(emoteMotion?.jaw??0));
    const orbitProfile=effect?.mode===9?[1.06,.84,.02,.025,-.14,0,0]:null;
    const mouthPose=blendActorMouth({width:target[0],curve:target[4],opening:target[5],bounce:target[6],skew:facePose?.skew||0},orbitProfile??actorProfile,orbitProfile?effect.split:actorWeight,orbitProfile?.115:aperture);
    target[0]=mouthPose.width;target[4]=mouthPose.curve;target[5]=mouthPose.opening;target[6]=mouthPose.bounce;
    const blend=1.-Math.exp(-number(p.frameDelta,t-(draw.lastTime??t),0,.06)*8.);
    draw.lastTime=t;
    expression=expression.map((v,i)=>THREE.MathUtils.lerp(v,target[i],blend));
    const [width,height,slope,lift,curve,opening,bounce]=expression;
    mouthSkew=THREE.MathUtils.lerp(mouthSkew,mouthPose.skew+motionValue('skew'),blend);

    const blink=number(p.blink,0);
    faceRig.position.y=mood===4?-.035:0;
    const facialRadius=.985-U.uDeform.value*.055;
    eyes.forEach((eye,i)=>{
      const actionBlink=Math.max(number(p.operatorBlink,0),number(p.actorHeadOffset?.blink,0));
      const openness=Math.min(face?eyeOpenness(coeff(i===0?'eyeBlinkLeft':'eyeBlinkRight'),true):eyeOpenness(blink),1-actionBlink,i===0?1-bubble.wink:1,1-.75*sleepyNod,1-motionValue('lids'));
      const base=profiles[mood];
      const baseEye=facePose?.eyes[i]||{width:base[0],height:base[1]*(mood===1&&i===0?1.25:1),tilt:(i===0?-1:1)*base[2],lift:base[3]};
      const goal={...blendActorEye(baseEye,actorProfile,i,actorWeight),curve:eyeContourCurve({trackedCurve:facePose?.curve??null,emotion:ACTOR_EXPRESSIONS[mood],action:actor,height:baseEye.height})};
      if(libraryEmote?.eyes)goal.height*=THREE.MathUtils.lerp(1,libraryEmote.eyes[i],libraryWeight);
      goal.height*=1+motionValue('eyeHeight')+(i===0?-1:1)*motionValue('eyeBias');
      goal.lift+=motionValue('eyeLift');
      for(const key of ['width','height','tilt','lift','curve'])eyeExpression[i][key]=THREE.MathUtils.lerp(eyeExpression[i][key],goal[key],blend);
      const pose=eyeExpression[i];
      eye.scale.x=.132*pose.width;eye.scale.y=.135*Math.max(.002,pose.height*openness);
      eye.position.x=(i===0?-.235:.235)+gaze.x;
      eye.position.y=.135+pose.lift+gaze.y;eye.rotation.z=pose.tilt;
      const light=featureLight(openness);
      eye.material.emissiveIntensity=3.0*light*faceLight*number(p.featureEmission,1,0,2);
      eye.material.opacity=U.uFace.value*light*faceLight;
      eye.visible=light*faceLight>.001;
      if(eye.visible)wrapEyeInsideGlass(eye.geometry,eyeTemplate,eye,facialRadius,faceRig.position.y,Math.min(pose.curve,.135*pose.height*.5)*openness);
    });

    const speaking=!face&&p.speaking?lvl:0;
    const baseMouthWidth=face?.17*width:(mood===5?.095:mood===2?.21:.17);
    const actionMouthWidth=libraryEmote?.width??({afraid:.115,joy:.225,flirting:.205,angry:.145,sad:.19,curious:.135,laugh:.24,shy:.149,surprise:.19,proud:.21})[actor?.name]??.17;
    const mouth=speechMouthPose({opening,voice:speaking,width:baseMouthWidth+(actionMouthWidth-baseMouthWidth)*actorWeight,curve,skew:mouthSkew,pucker:coeff('mouthPucker'),funnel:coeff('mouthFunnel'),bass:p.bass,treble:p.treble});
    cavity.visible=mouth.light*faceLight>.001;
    cavityMat.opacity=U.uFace.value*mouth.light*faceLight;
    cavityMat.emissiveIntensity=2.6*mouth.light*faceLight*number(p.featureEmission,1,0,2);
    cavity.position.y=-.285-mouth.drop;
    const gasp=surprise?actorWeight:0;
    shapeMouth(THREE.MathUtils.lerp(mouth.width,.215,gasp),Math.max(.003,THREE.MathUtils.lerp(mouth.height,.165,gasp)),mouth.curve*(1-gasp),facialRadius,mouth.skew);
    thoughtDots.forEach((dot,i)=>{
      const light=faceHandoff.thought*actionBody.dots[i];
      dot.visible=light>.001;
      dot.material.opacity=U.uFace.value*light;
      dot.material.emissiveIntensity=3.0*light*number(p.featureEmission,1,0,2);
      const radius=.047*(.72+.28*Math.sqrt(actionBody.dots[i]));
      dot.scale.set(radius,radius,.035);
      dot.position.x=actionBody.dotX[i];
      // Counter the resting mood's rig offset so the loading line stays central.
      dot.position.y=-faceRig.position.y;
      if(dot.visible)wrapEyeInsideGlass(dot.geometry,thoughtTemplate,dot,facialRadius,faceRig.position.y);
    });
    const position=stagePosition.update({head:p.head,delta:number(p.frameDelta,.016,0,.06),time:t,intensity,bounce,frequency:mood===2?4:1.8,freeze:p.freeze});
    const comet=effect?.mode===3;
    const projectComet=(stamp,weight)=>{
      const depth=stamp.z*weight;
      const halfHeight=(camera.position.z-position.z-depth)*Math.tan(camera.fov*Math.PI/360);
      return {x:stamp.x*weight*halfHeight*camera.aspect,y:stamp.y*weight*halfHeight,z:depth};
    };
    const flight=comet?projectComet(cometPath(effect.time),effect.weight):null;
    orb.position.set(position.x+(flight?.x??effect?.shift??0),position.y+.026*laughBeat*actorWeight-.018*shyDip+motionValue('lift')+(flight?.y??effect?.lift??0),position.z+(flight?.z??effect?.depth??0));
    orb.scale.y*=1.+Math.sin(t*3)*bounce*.45*intensity;
    const stretch=motionValue('stretch')+(effect?.stretch??0);
    orb.scale.x*=1-.55*stretch+(effect?.spread??0);
    orb.scale.y*=1+stretch;
    orb.scale.multiplyScalar(1+.042*(effect?.flash??bubble.flash));
    orb.scale.multiplyScalar(1+(effect?.compression??0));
    const split=effect?.split??0,orbitScale=orb.scale.x;
    orbitMaterial.uniforms.uVisibility.value=Math.min(1,split*1.6);
    orbitFaceMaterial.opacity=Math.min(1,split*1.6)*Math.max(.65,U.uFace.value);
    orbitCopies.forEach(({group,features},index)=>{
      group.visible=false;
      if(split<=.001)return;
      const angle=index*Math.PI/4+effect.time*2.25;
      const radial=(.08+1.37*split)*orbitScale;
      const horizontal=Math.cos(angle)*radial;
      group.position.set(orb.position.x+horizontal,orb.position.y+.65*Math.sin(angle)*radial+.18*horizontal,orb.position.z+.50*Math.sin(angle)*radial);
      group.rotation.z=.24*Math.sin(angle);
      group.scale.setScalar(.28*orbitScale*Math.sqrt(split));
      features.forEach((copy,featureIndex)=>{
        const source=featureIndex<eyes.length?eyes[featureIndex]:cavity;
        copy.position.copy(source.position);
        copy.position.y+=faceRig.position.y;
        copy.rotation.copy(source.rotation);copy.scale.copy(source.scale);
        copy.visible=source.visible;
      });
    });
    const cometFlare=effect?.cometFlare??0;
    orb.visible=split<.997&&!effect?.cometHidden&&cometFlare<.94;
    if(comet)orb.scale.multiplyScalar(1-.34*cometFlare);
    cometCore.visible=false;
    cometCore.position.copy(orb.position);
    cometCore.scale.setScalar(orb.scale.x*(1.28+.035*Math.max(0,-(effect?.depth??0))));
    cometCoreMaterial.uniforms.uCoreAlpha.value=effect?.cometHidden?0:cometFlare;
    orb.scale.multiplyScalar(Math.max(.002,1-split));
    shockRings.forEach(ring=>{
      const atmosphere=[11,12,14].includes(effect?.mode)?effect.mode:0;
      ring.material.uniforms.uAtmosphere.value=atmosphere;
      if(atmosphere){
        ring.visible=effect.weight>.001;
        ring.material.uniforms.uAge.value=effect.time;
        ring.material.uniforms.uStrength.value=effect.weight*(atmosphere===11?.57:atmosphere===12?.84:.52);
        ring.position.set(orb.position.x,orb.position.y,orb.position.z-.68);
        ring.rotation.z=atmosphere===11?-.14:atmosphere===12?-.31:.19;
        ring.scale.setScalar((atmosphere===11?2.15:atmosphere===12?2.18:1.58+.72*(1-Math.exp(-effect.time*1.8)))*orb.scale.x);
        return;
      }
      const age=effect?.mode===1?effect.time-.43:-1;
      const assembling=effect?.mode===1&&effect.time>=1.40&&effect.time<2.23;
      ring.visible=(age>=0&&age<1.00||assembling)&&effect.weight>.001;
      if(!ring.visible)return;
      const progress=assembling?1-effect.assembly:age/1.08;
      ring.material.uniforms.uAge.value=assembling?progress:age;
      ring.material.uniforms.uStrength.value=assembling
        ?effect.weight*Math.sin(Math.PI*effect.assembly)*.74
        :effect.weight*Math.min(1,age/.026)*(1-progress)**1.65;
      ring.position.set(orb.position.x,orb.position.y,orb.position.z-.37);
      ring.rotation.z=.14+age*.16;
      ring.scale.setScalar((1.16+2.18*(1-Math.exp(-(assembling?progress:age)*7)))*orb.scale.x);
    });
    cometWake.visible=false;
    wakeMaterial.uniforms.uWakeAlpha.value=0;
    if(effect?.mode===3&&effect.particles>.001){
      const end=Math.min(COMET_EXIT,effect.time);
      const start=Math.max(.08,effect.time-1.06);
      const width=orb.scale.x;
      wakeMaterial.uniforms.uWakeAlpha.value=end>start?.68*effect.particles:0;
      for(let index=0;index<=wakeSegments;index++){
        const fraction=index/wakeSegments,stampTime=THREE.MathUtils.lerp(end,start,fraction);
        const stamp=projectComet(cometPath(stampTime),effect.weight);
        const ahead=cometPath(Math.min(COMET_EXIT,stampTime+.015)),behind=cometPath(stampTime-.015);
        const heading=Math.atan2(ahead.y-behind.y,(ahead.x-behind.x)*camera.aspect);
        const span=(.23+.53*Math.sin(fraction*Math.PI*.85))*width;
        const x=position.x+stamp.x,y=position.y+stamp.y,z=position.z+stamp.z-.27;
        wakePositions.set([x-Math.sin(heading)*span,y+Math.cos(heading)*span,z,x+Math.sin(heading)*span,y-Math.cos(heading)*span,z],index*6);
      }
      wakeGeometry.attributes.position.needsUpdate=true;
    }
    heartMaterial.uniforms.uVisibility.value=bubble.hearts;
    hearts.forEach((heart,index)=>{
      const rise=(bubble.age*.40+index*.37)%1;
      heart.visible=false;
      heart.position.copy(orb.position).add(new THREE.Vector3((index%2?1:-1)*(1.12+.28*Math.sin(index*2.4+rise)),(rise-.48)*2.25,-.8));
      heart.rotation.set(.22,Math.sin(bubble.age+index)*.35,(index%2?-.24:.24));
      heart.scale.setScalar((.7+.12*(index%3))*Math.sin(Math.PI*rise));
    });
    droplets.forEach((drop,index)=>{
      const angle=index*Math.PI*2/droplets.length+.1*Math.sin(index*2.4);
      const travel=Math.max(0,bubble.age-.21),speed=.7+1.15*(.5+.5*Math.sin(index*5.7));
      const radius=.96+speed*travel/(1+1.35*travel);
      const size=(.26+.72*Math.pow(.5+.5*Math.cos(index*4.1),2))*(1-.56*Math.min(1,travel))*orb.scale.x;
      drop.material.uniforms.uVisibility.value=bubble.burst;
      drop.visible=false;
      drop.position.set(orb.position.x+Math.cos(angle)*radius*orb.scale.x,orb.position.y+Math.sin(angle)*radius*orb.scale.y-travel*travel*.72,orb.position.z+.1+.25*Math.sin(index*3.1));
      drop.rotation.z=angle;
      drop.scale.set(size*(1+speed*Math.exp(-travel*7)),size*.74,size);
      if(effect){
        const phase=angle+effect.time*(index%2?2.0:-1.5);
        const twinkle=.5+.5*Math.sin(effect.time*8+index*2.4);
        const count=effect.mode===3?0:42;
        drop.material.uniforms.uVisibility.value=index<count?effect.particles:0;
        if(effect.mode===6){
          const distance=(1.21+.21*Math.sin(index*3.7+effect.time*2))*orb.scale.x;
          drop.position.set(orb.position.x+Math.cos(phase)*distance,orb.position.y+Math.sin(phase)*distance,orb.position.z+Math.sin(phase)*.55);
          drop.scale.setScalar(.18+twinkle*.76);
          drop.material.uniforms.uVisibility.value*=twinkle*twinkle;
        }
      }
    });
    faceRig.position.y=mood===4?-.035:0;
    faceRig.visible=U.uFace.value>.006;
    camera.updateMatrixWorld();orb.updateMatrixWorld(true);
    U.uFaceRadius.value=facialRadius;
    U.uWorldToLocal.value.copy(orb.matrixWorld).invert();
    U.uWorldNormal.value.getNormalMatrix(orb.matrixWorld);
    U.uLocalToClip.value.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(orb.matrixWorld);

    // Capture the star volume before rendering the inner glass and facial volumes.
    inner.visible=false;glass.visible=false;halo.visible=false;faceRig.visible=false;
    if(!comet||orb.visible){
    renderer.setRenderTarget(backgroundTarget);renderer.clear();renderer.render(scene,camera);
    hearts.forEach(heart=>{heart.visible=bubble.hearts>.001;});
    faceRig.visible=U.uFace.value>.006;
    // Both facial volumes are curved just beneath the refracting shell.
    inner.visible=true;glass.visible=false;
    renderer.setRenderTarget(innerTarget);
    renderer.clear();
    renderer.render(scene,camera);

    U.uFrostedInner.value=glassFrosting.render(innerTarget.texture,U.uSurfaceFrosting.value);
    }

    // Pass 2: refract the first pass through the independent 3D glass surface.
    // The core and face are hidden here to prevent double-rendering / flat overlays.
    renderer.setRenderTarget(postProcessing.sceneTarget);
    renderer.clear();
    inner.visible=false;faceRig.visible=false;
    glass.visible=true;halo.visible=U.uVoiceHalo.value>.001;
    orbitCopies.forEach(({group})=>{group.visible=split>.001;});
    cometWake.visible=effect?.mode===3&&wakeMaterial.uniforms.uWakeAlpha.value>.001;
    cometCore.visible=cometCoreMaterial.uniforms.uCoreAlpha.value>.001;
    droplets.forEach(drop=>{drop.visible=drop.material.uniforms.uVisibility.value>.001;});
    renderer.render(scene,camera);
    inner.visible=true;faceRig.visible=U.uFace.value>.006;
    postProcessing.render({bloomStrength:number(p.bloomStrength,.48,0,1.5),flareStrength:number(p.flareStrength,.18),threshold:1.2,chromatic:number(p.crtChromatic,0)});
  }
  function dispose(){
    cometCoreGeometry.dispose();cometCoreMaterial.dispose();
    orbitGeometry.dispose();orbitMaterial.dispose();orbitFaceMaterial.dispose();
    wakeGeometry.dispose();wakeMaterial.dispose();
    shockGeometry.dispose();shockRings.forEach(ring=>ring.material.dispose());
    heartGeometry.dispose();heartMaterial.dispose();dropletGeometry.dispose();
    droplets.forEach(drop=>drop.material.dispose());
    postProcessing.dispose();glassFrosting.dispose();geometryHalo.dispose();halo.material.dispose();
    studioEnvironment.dispose();studioMap.dispose();starField.dispose();
    backgroundTarget.dispose();cavityGeometry.dispose();
    innerTarget.dispose();geometryInner.dispose();geometryGlass.dispose();
    inner.material.dispose();glass.material.dispose();
    thoughtDots.forEach(dot=>{dot.geometry.dispose();dot.material.dispose();});thoughtGeometry.dispose();
    eyes.forEach(eye=>{eye.geometry.dispose();eye.material.dispose();});eyeGeom.dispose();eyeMaterial.dispose();cavityMat.dispose();renderer.dispose();
  }
  return {draw,dispose,renderer,scene,camera,orb,three:true,version:'0.4 / two-pass refractive Three.js glass'};
}

window.MOTEOrb={make,engine:'three.js r187 / two-pass refraction',available:!!THREE};
