// Performance time origins share the browser's monotonic time base. Transport
// the controller's origin rather than resetting procedural motion per action.
// No clock information is stored in actor profiles, looks or exported shows.
export function createShowClock(localOrigin,authority=false){
  const local=Number.isFinite(localOrigin)?localOrigin:0;
  let origin=authority?local:null;
  return {
    receive(next){
      if(authority||typeof next!=='number'||!Number.isFinite(next)||next<=0)return;
      if(origin===null||next>=origin)origin=next;
    },
    sample(now){return Math.max(0,(local-(origin??local)+(Number.isFinite(now)?now:0))/1000);}
  };
}
