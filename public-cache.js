(function(){
  'use strict';
  const key='ade-public-content-v1:'+new URL('.',document.baseURI).pathname,ttl=1800000;
  let flight=null;
  function cached(){try{const item=JSON.parse(localStorage.getItem(key)||'null');return item?.data?.ok&&item.data.collections&&!item.data.messages?item:null;}catch{return null;}}
  window.AdePublicContentCache=Object.freeze({
    invalidate(){try{localStorage.removeItem(key);}catch{}},
    async read(load){
      const previous=cached();if(previous&&Date.now()-previous.at<ttl)return structuredClone(previous.data);
      if(flight)return structuredClone(await flight);
      flight=Promise.resolve().then(load).then(data=>{
        if(!data?.ok||!data.collections||data.messages)throw Error('Contenido público inválido.');
        try{localStorage.setItem(key,JSON.stringify({at:Date.now(),data}));}catch{}
        return data;
      }).catch(error=>{if(previous)return {...previous.data,stale:true};throw error;}).finally(()=>{flight=null;});
      return structuredClone(await flight);
    }
  });
})();
