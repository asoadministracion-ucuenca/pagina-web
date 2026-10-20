(function(){
  'use strict';
  const available=Boolean(window.AdeRuntime?.staticMode&&!window.AdeRuntime.backendAvailable);
  const remote='https://raw.githubusercontent.com/asoadministracion-ucuenca/pagina-web/main/live-data.json';
  const key='ade-live-snapshot-v2:'+new URL('.',document.baseURI).pathname;
  let cache=null,flight=null;
  try{cache=JSON.parse(localStorage.getItem(key)||'null');}catch{}
  function valid(value){return value?.version===1&&['news','indicators'].every(name=>Array.isArray(value[name]?.items));}
  async function read(force=false){
    if(!force&&cache&&Date.now()-cache.at<300000&&valid(cache.data))return cache.data;
    if(flight)return flight;
    flight=(async()=>{
      for(const url of [remote+'?v='+Math.floor(Date.now()/300000),new URL('./live-data.json',document.baseURI).href]){
        try{
          const response=await fetch(url,{credentials:'omit',cache:'no-cache',signal:AbortSignal.timeout(8000)});
          if(!response.ok)continue;
          const data=await response.json();if(!valid(data))continue;
          cache={at:Date.now(),data};try{localStorage.setItem(key,JSON.stringify(cache));}catch{}return data;
        }catch{}
      }
      if(valid(cache?.data))return cache.data;
      throw Error('Las fuentes no están disponibles.');
    })().finally(()=>{flight=null;});return flight;
  }
  window.AdeLiveSnapshot=Object.freeze({available,async get(name,force=false){
    if(!['news','indicators','drive'].includes(name))throw Error('Fuente inválida.');
    const result=(await read(force))[name];
    if(!result?.ok)throw Error('Fuente no disponible.');
    return {...result,stale:Boolean(result.stale||Date.now()-Date.parse(result.updatedAt)>4*3600000),refreshSeconds:3600};
  }});
})();
