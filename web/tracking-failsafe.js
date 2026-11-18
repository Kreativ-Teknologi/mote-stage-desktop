// Arms after the first face. Brief gaps and single-frame reacquisitions cannot toggle power.
export function createTrackingFailsafe({lossDelay=1200,recoveryDelay=350}={}){
  let armed=false,lastSeen=0,recoverySince=null,blackout=false;
  return {
    update({now,tracked,enabled,cameraRequested}){
      if(!enabled||!cameraRequested){armed=false;recoverySince=null;blackout=false;return {blackout,armed,status:enabled?'Waiting for webcam':'Failsafe off'};}
      if(tracked){
        armed=true;lastSeen=now;
        if(blackout){if(recoverySince===null)recoverySince=now;if(now-recoverySince>=recoveryDelay){blackout=false;recoverySince=null;}}
      }else{
        recoverySince=null;
        if(armed&&now-lastSeen>=lossDelay)blackout=true;
      }
      return {blackout,armed,status:blackout?(tracked?'Tracking found · powering up shortly':'Tracking lost · Nord powered down'):armed?'Tracking failsafe armed':'Waiting for first face'};
    }
  };
}
