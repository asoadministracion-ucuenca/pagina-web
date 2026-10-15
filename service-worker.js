const CACHE_NAME='portal-ade-v14-admin-session';
const ASSETS=['./','./index.html','./local-entry.js','./public-config.js','./firebase-config.js','./firebase-student.js','./firebase-admin.js','./runtime.js','./student-store.js','./student-account.js','./student-account.css','./styles.css','./design.css','./home.css','./experience.js','./constants.js','./curriculum.js','./assets/logo-aso-ade-384.png','./portal.js','./admin.js','./admin.css','./assets/logo-aso-ade-192.png','./vendor/purify.min.js','./favicon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('portal-ade-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/uploads/'))return;
 event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;
 }).catch(()=>caches.match(request,{ignoreSearch:true}).then(cached=>cached||(request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
