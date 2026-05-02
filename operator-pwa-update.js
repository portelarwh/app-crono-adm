'use strict';

(function(){
  var APP_VERSION='v4.6.0';
  window.APP_VERSION=APP_VERSION;

  var refreshing=false;
  var started=false;

  function setVersion(){
    var h=document.getElementById('appVersion'); if(h) h.textContent=APP_VERSION;
    var s=document.getElementById('splashVersion'); if(s) s.textContent=APP_VERSION;
  }

  function appendScript(id, src){
    if(document.getElementById(id)) return;
    var script=document.createElement('script');
    script.id=id;
    script.src=src+'?v='+encodeURIComponent(APP_VERSION);
    script.defer=true;
    document.head.appendChild(script);
  }

  function loadAdminEvents(){
    appendScript('adminEventsScript','admin-events.js');
    appendScript('adminEventsClickFixScript','admin-events-click-fix.js');
    appendScript('flowEfficiencyScript','flow-efficiency.js');
    appendScript('handoffsScript','handoffs.js');
    appendScript('handoffsCalculationFixScript','handoffs-calculation-fix.js');
    appendScript('adminParetoScript','admin-pareto.js');
    appendScript('executiveSummaryScript','executive-summary.js');
  }

  function toast(msg){
    var el=document.createElement('div');
    el.style.cssText='position:fixed;bottom:90px;left:12px;right:12px;padding:10px 12px;background:#0d1117;color:#fff;border-radius:12px;z-index:99999;font-size:12px;opacity:.9';
    el.innerText=msg;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1200);
  }

  function watch(worker){
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed' && navigator.serviceWorker.controller){
        toast('Atualizando...');
        setTimeout(()=>worker.postMessage({type:'SKIP_WAITING'}),300);
      }
    });
  }

  function register(){
    setVersion();
    loadAdminEvents();
    if(!('serviceWorker'in navigator))return;

    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing)return;
      refreshing=true;
      location.reload();
    });

    window.addEventListener('load',()=>{
      if(started)return;
      started=true;

      toast('Buscando atualização...');

      navigator.serviceWorker.register('sw.js',{updateViaCache:'none'})
      .then(reg=>{
        if(reg.installing)watch(reg.installing);
        reg.addEventListener('updatefound',()=>watch(reg.installing));
        return reg.update();
      })
      .catch(()=>{});
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',register);
  }else register();
})();
