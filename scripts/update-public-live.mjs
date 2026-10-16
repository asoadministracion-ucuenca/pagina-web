import {readFile,writeFile} from 'node:fs/promises';
import {createLiveData} from '../live-data.mjs';
const file=new URL('../live-data.json',import.meta.url);
const previous=JSON.parse(await readFile(file,'utf8').catch(()=>'{}'));
const service=createLiveData();
const result={version:1,generatedAt:new Date().toISOString()};
for(const [key,load]of Object.entries(service)){
  try{result[key]={...await load(),refreshSeconds:3600};}
  catch(error){
    console.error(key+': '+error.message);
    result[key]=previous[key]?{...previous[key],stale:true}:{ok:false,items:[],stale:true};
  }
}
if(!result.indicators.ok&&!result.news.ok)throw Error('Las fuentes no respondieron; se conserva el archivo publicado.');
try{
  const contentResponse=await fetch('https://firestore.googleapis.com/v1/projects/pagina-web-aso-base-de-datos/databases/(default)/documents/public/content',{signal:AbortSignal.timeout(10000)});
  if(!contentResponse.ok)throw Error('Configuración pública no disponible.');
  const document=await contentResponse.json(),settings=JSON.parse(document.fields.payload.stringValue).collections.settings;
  const url=settings.driveRepositoryApiUrl;
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))throw Error('Lector público no configurado.');
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)}),drive=await response.json();
  if(!response.ok||!drive.ok||drive.publicFilesOnly!==true||!Array.isArray(drive.files))throw Error('Catálogo público no disponible.');
  result.drive=drive;
}catch(error){console.error('Drive: '+error.message);if(previous.drive)result.drive={...previous.drive,stale:true};}
await writeFile(file,JSON.stringify(result));
console.log('Actualizado: '+result.indicators.items.length+' indicadores y '+result.news.items.length+' titulares.');
