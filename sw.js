// Service worker: mở ngay từ bộ nhớ đệm (nhanh), đồng thời tải bản mới ở nền; có bản mới thì báo cho trang.
// Không đụng tới dữ liệu (Google Apps Script chạy ở tên miền khác).
var C='phucan-v2';
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(['./','icon-192.png']);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==C;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
function sig(r){return r?((r.headers.get('etag')||'')+'|'+(r.headers.get('last-modified')||'')+'|'+(r.headers.get('content-length')||'')):'';}
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin) return;
  e.respondWith(caches.open(C).then(function(c){
    return c.match(r).then(function(hit){
      var net=fetch(r).then(function(res){
        if(res&&res.ok){
          var changed=hit&&sig(hit)!==sig(res)&&r.mode==='navigate';
          c.put(r,res.clone()).then(function(){
            if(changed) self.clients.matchAll().then(function(cs){cs.forEach(function(cl){cl.postMessage('new-version');});});
          });
        }
        return res;
      }).catch(function(){return hit||c.match('./');});
      return hit||net;
    });
  }));
});
