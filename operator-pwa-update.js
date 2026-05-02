'use strict';

(function(){
  var APP_VERSION='v5.0.3';
  window.APP_VERSION=APP_VERSION;

  var started=false;
  var updateToastShown=false;

  function setVersion(){
    var h=document.getElementById('appVersion'); if(h) h.textContent=APP_VERSION;
    var s=document.getElementById('splashVersion'); if(s) s.textContent=APP_VERSION;
    var p=document.getElementById('topActionsVersion'); if(p) p.textContent=APP_VERSION;
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

  function injectTopActionsStyle(){
    if(document.getElementById('topActionsPillStyle')) return;
    var style=document.createElement('style');
    style.id='topActionsPillStyle';
    style.textContent=`
      .top-actions-pill{
        display:inline-flex;align-items:center;justify-content:center;gap:0;
        border:1px solid rgba(255,255,255,.16);background:rgba(13,17,23,.92);
        color:#fff;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.28);
        overflow:hidden;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
        min-height:42px;max-width:100%;white-space:nowrap;z-index:30;
      }
      .top-actions-pill.is-floating{position:absolute;top:14px;right:14px;}
      .top-actions-pill span,.top-actions-pill button{
        height:42px;display:inline-flex;align-items:center;justify-content:center;
        padding:0 12px;border:0;border-left:1px solid rgba(255,255,255,.12);
        background:transparent;color:inherit;font-size:12px;font-weight:900;letter-spacing:.02em;
      }
      .top-actions-pill span:first-child,.top-actions-pill button:first-child{border-left:0;}
      .top-actions-pill button{cursor:pointer;touch-action:manipulation;}
      .top-actions-pill button:active{background:rgba(255,255,255,.12);}
      .top-actions-version{min-width:72px;color:#dbeafe;}
      .top-actions-update{min-width:92px;}
      .top-actions-theme{min-width:46px;font-size:18px!important;padding:0 13px!important;}
      .top-actions-host{display:flex;justify-content:flex-end;align-items:center;margin:-2px 0 10px 0;}
      html[data-theme="light"] .top-actions-pill{background:rgba(255,255,255,.94);color:#1a1f2e;border-color:rgba(26,31,46,.12);box-shadow:0 8px 24px rgba(15,23,42,.14);}
      html[data-theme="light"] .top-actions-version{color:#1d4ed8;}
      html[data-theme="light"] .top-actions-pill span,html[data-theme="light"] .top-actions-pill button{border-left-color:rgba(26,31,46,.10);}
      #forceUpdateAppBtn{position:static!important;right:auto!important;bottom:auto!important;box-shadow:none!important;opacity:1!important;border-radius:0!important;}
      @media(max-width:520px){
        .top-actions-host{margin:-4px 0 12px 0;}
        .top-actions-pill{min-height:38px;}
        .top-actions-pill span,.top-actions-pill button{height:38px;padding:0 9px;font-size:11px;}
        .top-actions-version{min-width:64px;}
        .top-actions-update{min-width:76px;}
        .top-actions-update .wide{display:none;}
        .top-actions-theme{min-width:42px;font-size:17px!important;padding:0 10px!important;}
      }
      body.export-mode .top-actions-pill, body.export-mode .top-actions-host{display:none!important;}
    `;
    document.head.appendChild(style);
  }

  function syncThemeButton(btn){
    var isLight=document.documentElement.getAttribute('data-theme')==='light';
    btn.textContent=isLight?'☀️':'🌙';
    btn.title=isLight?'Tema claro ativo':'Tema escuro ativo';
  }

  function toggleTheme(){
    var isLight=document.documentElement.getAttribute('data-theme')==='light';
    if(isLight){
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('operix_theme_v1','dark');
    }else{
      document.documentElement.setAttribute('data-theme','light');
      localStorage.setItem('operix_theme_v1','light');
    }
    var btn=document.getElementById('topActionsThemeBtn');
    if(btn) syncThemeButton(btn);
  }

  function injectTopActionsPill(){
    injectTopActionsStyle();
    if(document.getElementById('topActionsPill')) return;

    var pill=document.createElement('div');
    pill.id='topActionsPill';
    pill.className='top-actions-pill';
    pill.innerHTML='<span id="topActionsVersion" class="top-actions-version">'+APP_VERSION+'</span>'+
      '<button id="forceUpdateAppBtn" class="top-actions-update" type="button">↻ <span class="wide">Atualizar</span></button>'+
      '<button id="topActionsThemeBtn" class="top-actions-theme" type="button" aria-label="Alternar tema">🌙</button>';

    var firstCard=document.querySelector('.card');
    if(firstCard && firstCard.parentNode){
      var host=document.createElement('div');
      host.id='topActionsHost';
      host.className='top-actions-host';
      host.appendChild(pill);
      firstCard.insertBefore(host, firstCard.firstChild);
    }else{
      pill.classList.add('is-floating');
      document.body.appendChild(pill);
    }

    var updateBtn=document.getElementById('forceUpdateAppBtn');
    if(updateBtn){
      updateBtn.addEventListener('click',function(e){
        e.preventDefault();
        forceUpdateApp();
      });
    }

    var themeBtn=document.getElementById('topActionsThemeBtn');
    if(themeBtn){
      syncThemeButton(themeBtn);
      themeBtn.addEventListener('click',function(e){
        e.preventDefault();
        toggleTheme();
      });
    }

    var oldTheme=document.getElementById('op-theme-btn');
    if(oldTheme){ oldTheme.style.display='none'; }
  }

  async function forceUpdateApp(){
    if(sessionStorage.getItem('operix_force_update_running') === '1') return;
    sessionStorage.setItem('operix_force_update_running','1');
    toast('Atualizando app uma única vez...',2200);

    try{
      if(window.caches){
        var keys=await caches.keys();
        await Promise.all(keys.map(function(key){return caches.delete(key);}));
      }

      if('serviceWorker' in navigator){
        var regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function(reg){return reg.unregister();}));
      }
    }catch(error){}

    var url=new URL(window.location.href);
    url.searchParams.set('v',APP_VERSION);
    url.searchParams.set('refresh','1');
    window.location.replace(url.toString());
  }

  function watch(worker){
    if(!worker) return;
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed' && navigator.serviceWorker.controller && !updateToastShown){
        updateToastShown=true;
        toast('Nova versão disponível. Toque em Atualizar app.',2600);
      }
    });
  }

  function register(){
    setVersion();
    loadAdminEvents();
    injectTopActionsPill();

    if(!('serviceWorker'in navigator))return;

    window.addEventListener('load',()=>{
      if(started)return;
      started=true;

      navigator.serviceWorker.register('sw.js?v='+encodeURIComponent(APP_VERSION),{updateViaCache:'none'})
      .then(reg=>{
        if(reg.installing)watch(reg.installing);
        reg.addEventListener('updatefound',()=>watch(reg.installing));
        return reg.update();
      })
      .then(()=>{
        sessionStorage.removeItem('operix_force_update_running');
      })
      .catch(()=>{
        sessionStorage.removeItem('operix_force_update_running');
      });
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',register);
  }else register();
})();
