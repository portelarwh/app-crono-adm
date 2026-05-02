'use strict';

(function(){
  var APP_VERSION='v5.0.1';
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
    script.src=src+'?v='+encodeURIComponent(APP_VERSION)+'&t='+Date.now();
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
    appendScript('executivePdfScript','executive-pdf.js');
    appendScript('currentVsIdealScript','current-vs-ideal.js');
  }

  function toast(msg, duration){
    var el=document.createElement('div');
    el.style.cssText='position:fixed;bottom:90px;left:12px;right:12px;padding:10px 12px;background:#0d1117;color:#fff;border-radius:12px;z-index:99999;font-size:12px;opacity:.94;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.35)';
    el.innerText=msg;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),duration||1400);
  }

  function injectUpdateButton(){
    if(document.getElementById('forceUpdateAppBtn')) return;
    var btn=document.createElement('button');
    btn.id='forceUpdateAppBtn';
    btn.type='button';
    btn.textContent='↻ Atualizar app';
    btn.style.cssText='position:fixed;right:12px;bottom:14px;z-index:99998;padding:9px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:#0d1117;color:#fff;font-size:12px;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.35);opacity:.92';
    btn.addEventListener('click',function(e){
      e.preventDefault();
      forceUpdateApp();
    });
    document.body.appendChild(btn);
  }

  async function forceUpdateApp(){
    toast('Limpando cache e buscando versão nova...',2200);

    try{
      if('serviceWorker' in navigator){
        var regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function(reg){
          if(reg.active) reg.active.postMessage({type:'CLEAR_CACHE_AND_RELOAD'});
          if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
          return reg.update().catch(function(){});
        }));
      }

      if(window.caches){
        var keys=await caches.keys();
        await Promise.all(keys.map(function(key){return caches.delete(key);}));
      }

      if('serviceWorker' in navigator){
        var updatedRegs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(updatedRegs.map(function(reg){return reg.unregister();}));
      }
    }catch(error){}

    var url=new URL(window.location.href);
    url.searchParams.set('v',APP_VERSION);
    url.searchParams.set('t',Date.now());
    window.location.replace(url.toString());
  }

  function watch(worker){
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed' && navigator.serviceWorker.controller){
        toast('Nova versão encontrada. Atualizando...',1800);
        setTimeout(()=>worker.postMessage({type:'SKIP_WAITING'}),250);
      }
    });
  }

  function register(){
    setVersion();
    loadAdminEvents();
    injectUpdateButton();

    if(!('serviceWorker'in navigator))return;

    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing)return;
      refreshing=true;
      var url=new URL(window.location.href);
      url.searchParams.set('v',APP_VERSION);
      url.searchParams.set('t',Date.now());
      window.location.replace(url.toString());
    });

    window.addEventListener('load',()=>{
      if(started)return;
      started=true;

      toast('Buscando atualização...',1200);

      navigator.serviceWorker.register('sw.js?v='+encodeURIComponent(APP_VERSION),{updateViaCache:'none'})
      .then(reg=>{
        if(reg.installing)watch(reg.installing);
        if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
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
