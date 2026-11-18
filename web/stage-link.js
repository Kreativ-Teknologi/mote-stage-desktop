// Direct opener transport works when embedded and top-level storage are partitioned.
// BroadcastChannel also supports independently opened same-origin stage tabs.
export function createStageLink(env,onMessage){
  const peers=new Set(),seen=new Set();
  const sender=env.crypto.randomUUID();let sequence=0,channel;
  try{channel=new env.BroadcastChannel('mote-stage-channel-v1');}catch{}
  function deliver(message){
    if(!message||message.moteStage!==1||typeof message.id!=='string'||seen.has(message.id))return;
    seen.add(message.id);if(seen.size>512)seen.delete(seen.values().next().value);
    onMessage({data:message});
  }
  function incoming(event){
    if(event.origin!==env.location.origin||!event.source)return;
    if(event.data?.moteStage!==1)return;
    if(event.data.type==='hello')peers.add(event.source);
    if(event.source!==env.opener&&!peers.has(event.source))return;
    deliver(event.data);
  }
  env.addEventListener('message',incoming);
  if(channel)channel.onmessage=e=>deliver(e.data);
  return {
    add(win){if(win)peers.add(win);},
    post(payload){
      const message={...payload,moteStage:1,id:sender+':'+(++sequence)};
      try{channel?.postMessage(message);}catch{}
      const targets=new Set(peers);if(env.opener)targets.add(env.opener);
      for(const win of targets){try{if(win.closed){peers.delete(win);continue;}win.postMessage(message,env.location.origin);}catch{}}
    },
    close(){channel?.close();env.removeEventListener('message',incoming);peers.clear();}
  };
}
