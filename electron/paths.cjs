const path=require('node:path');
function isLocal(value){try{const u=new URL(value);return u.protocol==='mote:'&&u.hostname==='stage'&&!u.username&&!u.password;}catch{return false;}}
function resolveAsset(root,value){
  if(!isLocal(value))return null;
  try{
    const pathname=decodeURIComponent(new URL(value).pathname);
    if(pathname.includes('\0')||pathname.includes('\\'))return null;
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    return file.startsWith(root+path.sep)?file:null;
  }catch{return null;}
}
module.exports={resolveAsset,isLocal};
