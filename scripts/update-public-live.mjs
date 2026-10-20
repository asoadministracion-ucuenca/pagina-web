import {readFile,writeFile} from 'node:fs/promises';
import {createLiveData} from '../live-data.mjs';
import {readPublicDrive} from './public-drive.mjs';
const file=new URL('../live-data.json',import.meta.url);
const previous=JSON.parse(await readFile(file,'utf8').catch(()=>'{}'));
const service=createLiveData();
const result={version:1,generatedAt:new Date().toISOString()};
for(const [key,load]of Object.entries(service)){
  if(previous[key]?.ok && Date.now()-Date.parse(previous[key].updatedAt)<3600000){result[key]=previous[key];continue;}
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
  result.drive=await readPublicDrive(settings);
}catch(error){console.error('::warning title=Drive sin actualizar::'+error.message);if(previous.drive)result.drive={...previous.drive,stale:true};}
await writeFile(file,JSON.stringify(result));
console.log('Actualizado: '+result.indicators.items.length+' indicadores y '+result.news.items.length+' titulares.');
