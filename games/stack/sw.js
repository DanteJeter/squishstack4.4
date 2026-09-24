'use strict';
// Change VERSION whenever any app asset changes. Upload all new assets before sw.js.
const VERSION='v3-1';
const PREFIX='squishstack-'+self.registration.scope+'-';
const CACHE=PREFIX+VERSION;
const ASSETS=['./index.html','./style.css','./game.js','./app.js','./characters.png','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./squish-stack-share-v2.png'];
const assetURLs=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys()){if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);}await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),base=new URL(self.registration.scope);
 if(request.method!=='GET'||url.origin!==base.origin)return;
 // Serve a complete cached release; updates take effect only after player approval.
 const appNavigation=request.mode==='navigate'&&(url.pathname===base.pathname||url.pathname===new URL('index.html',base).pathname);
 if(appNavigation){event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match('./index.html')||fetch(request);})());return;}
 if(assetURLs.has(url.href)){event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(request)||fetch(request);})());}
});
