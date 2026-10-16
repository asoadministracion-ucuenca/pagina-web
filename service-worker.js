const CACHE_NAME='portal-ade-v16-app-performance';
const ASSETS=['./','./index.html','./local-entry.js','./public-config.js','./firebase-config.js','./firebase-student.js','./firebase-admin.js','./runtime.js','./live-snapshot.js','./live-data.json','./public-cache.js','./pwa.js','./print-schedule.js','./assets/app-icon.svg','./public-content.json','./student-store.js','./student-account.js','./student-account.css','./styles.css','./design.css','./home.css','./experience.js','./constants.js','./curriculum.js','./assets/logo-aso-ade-384.png','./portal.js','./admin.js','./admin.css','./assets/logo-aso-ade-192.png','./vendor/purify.min.js','./favicon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('portal-ade-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/uploads/'))return;
 const versioned=url.searchParams.has('v')&&/\.(js|css)$/.test(url.pathname);
 const image=/\.(png|svg|webp|jpg)$/.test(url.pathname);
 const network=()=>fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;
 });
 event.respondWith((async()=>{
   if(versioned||image){const cached=await caches.match(request);if(cached){if(image)event.waitUntil(network().catch(()=>{}));return cached;}}
   try{return await network();}
   catch{return await caches.match(request,{ignoreSearch:true})||(request.mode==='navigate'?await caches.match('./index.html'):Response.error());}
 })());
});
