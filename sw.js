/* Lucra · service worker: guarda o app no aparelho para abrir sem internet */
const V='lucra-edb7d34907';
const BASE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting())) });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())) });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(r.mode==='navigate'){            /* a página: tenta a versão nova, cai para a guardada se estiver sem internet */
    e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{ if(res.ok){ const c=res.clone(); caches.open(V).then(k=>k.put('./index.html',c)) } return res })
      .catch(()=>caches.match('./index.html')));
    return;
  }
  const fonte=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(u.origin!==location.origin&&!fonte)return;
  e.respondWith(caches.match(r).then(g=>{
    const rede=fetch(r).then(res=>{ if(res&&(res.ok||res.type==='opaque')){ const c=res.clone(); caches.open(V).then(k=>k.put(r,c)) } return res }).catch(()=>g);
    return g||rede;                   /* ícones e letras: usa o guardado e atualiza por trás */
  }));
});
