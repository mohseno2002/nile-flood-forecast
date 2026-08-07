/* مِرقاب الفيضان — Service Worker */
var VERSION = "nile-flood-forecast-v2.77";
var SHELL = ["./", "./index.html", "./manifest.json",
             "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
/* استثناء إلزامى: نطاقات البيانات الحية لا تدخل الكاش إطلاقاً (no-store)
   — عرض قراءة مخزّنة قديمة على أنها تصرف اليوم خطأ تشغيلى جسيم. */
var NETWORK_ONLY = ["open-meteo.com", "flood-api", "api.open-meteo", "firebasedatabase.app", "dataspace.copernicus.eu", "dahiti.dgfi.tum.de", "earth.gsfc.nasa.gov", "floodforecasting.googleapis.com", "googleapis.com", "workers.dev", "gstatic.com"];
function isNetworkOnly(u){
  for (var i = 0; i < NETWORK_ONLY.length; i++) { if (u.indexOf(NETWORK_ONLY[i]) > -1) return true; }
  return false;
}

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(function(c){
    return c.addAll(SHELL).catch(function(){ return null; });
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){
      if(k !== VERSION) return caches.delete(k);
      return null;
    }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var u = e.request.url;
  /* بيانات النماذج والأقمار لا تُخزَّن إطلاقاً — لا يجوز عرض قراءة قديمة كأنها حية */
  if(isNetworkOnly(u)) return; /* bypass cache — network only */
  if(e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function(r){
      var copy = r.clone();
      caches.open(VERSION).then(function(c){ c.put(e.request, copy).catch(function(){}); });
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(m){ return m || Response.error(); });
    })
  );
});
