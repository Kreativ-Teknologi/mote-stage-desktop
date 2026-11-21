let tracker,measureLipOpenings;
self.onmessage=async ({data})=>{
  try{
    if(data.type==='init'){
      ({measureLipOpenings}=await import('./face-landmarks.js'));
      const {FaceLandmarker,FilesetResolver}=await import('./vendor/vision/vision_bundle.mjs');
      const files=await FilesetResolver.forVisionTasks(new URL('./vendor/vision/wasm',self.location.href).href);
      tracker=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('./vendor/vision/face_landmarker.task',self.location.href).href,delegate:'CPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true});
      postMessage({type:'ready'});
    }else if(data.type==='frame'){
      try{
        const r=tracker.detectForVideo(data.frame,data.time);
        const m=r.facialTransformationMatrixes?.[0]?.data;
        const shapes=Object.fromEntries((r.faceBlendshapes?.[0]?.categories||[]).map(c=>[c.categoryName,c.score]));
        const face=r.faceLandmarks?.[0];
        Object.assign(shapes,measureLipOpenings(face));
        const anchors=face?[234,454,10,152].map(i=>face[i]).filter(Boolean):[];
        const position=anchors.length===4?{x:anchors.reduce((n,p)=>n+p.x,0)/4*2-1,y:1-anchors.reduce((n,p)=>n+p.y,0)/4*2,scale:Math.hypot(face[454].x-face[234].x,face[454].y-face[234].y)}:null;
        const scaleZ=m?Math.hypot(m[8],m[9],m[10])||1:1;
        postMessage({type:'result',time:data.time,sample:m?{position,yaw:Math.atan2(m[8],m[10]),pitch:Math.asin(Math.max(-1,Math.min(1,-m[9]/scaleZ))),roll:Math.atan2(m[1],m[5]),shapes}:null});
      }finally{data.frame.close();}
    }
  }catch(e){postMessage({type:'error',message:e.message});}
};
