// All facial surfaces are mesh geometry. No facial images or sprite planes.
export function createGlassLid(THREE){
  const segments=128,crossings=12,positions=[],indices=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments*Math.PI*2,c=Math.cos(t),s=Math.sin(t);
    for(let j=0;j<=crossings;j++){
      const q=j/crossings*Math.PI*2;
      const radius=1.025+(.045+.012*Math.sin(t))*Math.cos(q);
      positions.push(c*radius,s*radius,.20+.19*Math.sin(q));
    }
  }
  for(let i=0;i<segments;i++)for(let j=0;j<crossings;j++){
    const a=i*(crossings+1)+j,b=a+crossings+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function deformGlassMouth(geometry,template,width,height,curve,cavity=false,skew=0){
  const a=geometry.attributes.position;
  for(let i=0;i<a.count;i++){
    const bx=template[i*3],by=template[i*3+1],bz=template[i*3+2];
    if(cavity){a.setXYZ(i,bx*width,by*height+curve*(1.-bx*bx)+skew*bx,bz*.035-.024);continue;}
    const theta=Math.atan2(by,bx),c=Math.cos(theta),s=Math.sin(theta);
    const radial=(Math.hypot(bx,by)-1.)/.09;
    const normalX=height*c+2.*curve*c*s,normalY=width*s;
    const length=Math.hypot(normalX,normalY)||1;
    const thickness=(.009+.002*Math.abs(s))*(.65+.35*Math.sqrt(Math.max(0,1.-c*c)));
    a.setXYZ(i,c*width+normalX/length*thickness*radial,s*height+curve*(1.-c*c)+normalY/length*thickness*radial,bz/.09*thickness*.85);
  }
  a.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}

// Closure controls light independently of the expression's eye proportions.
export function featureLight(openness){
  const t=Math.min(1,Math.max(0,(openness-.06)/.79));
  return t*t*(3-2*t);
}

// Webcam blendshapes often reach a closed eye well below a coefficient of 1.
export function eyeOpenness(blink,webcam=false){
  const value=Math.min(1,Math.max(0,Number(blink)||0));
  if(!webcam)return 1-value;
  const t=Math.min(1,Math.max(0,(value-.08)/.42));
  return 1-t*t*(3-2*t);
}

// Curve the facial volumes just beneath the front of the spherical glass.
export function wrapEyeInsideGlass(geometry,template,mesh,radius,offsetY=0,curve=0){
  const a=geometry.attributes.position,c=Math.cos(mesh.rotation.z),s=Math.sin(mesh.rotation.z);
  for(let i=0;i<a.count;i++){
    const bx=template[i*3],x=bx*mesh.scale.x;
    const y=template[i*3+1]*mesh.scale.y+curve*(1-bx*bx);
    a.setX(i,bx);a.setY(i,y/mesh.scale.y);
    const gx=mesh.position.x+x*c-y*s,gy=mesh.position.y+offsetY+x*s+y*c;
    const surface=Math.sqrt(Math.max(.001,radius*radius-gx*gx-gy*gy));
    const z=surface-(1-template[i*3+2])*mesh.scale.z;
    a.setZ(i,(z-mesh.position.z)/mesh.scale.z);
  }
  a.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
export function wrapMouthInsideGlass(geometry,origin,radius,offsetY=0){
  const a=geometry.attributes.position;
  for(let i=0;i<a.count;i++){
    const x=a.getX(i)+origin.x,y=a.getY(i)+origin.y+offsetY;
    const surface=Math.sqrt(Math.max(.001,radius*radius-x*x-y*y));
    a.setZ(i,surface-.018+a.getZ(i)-origin.z);
  }
  a.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
