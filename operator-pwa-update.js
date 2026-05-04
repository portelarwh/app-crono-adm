'use strict';

(function(){
var APP_VERSION='v5.3.12';


  var started=false;

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
    appendScript('flowEfficiencyScript','flow-efficiency.js');
    appendScript('handoffsScript','handoffs.js');
    appendScript('adminParetoScript','admin-pareto.js');
    appendScript('executiveSummaryScript','executive-summary.js');
    appendScript('executivePdfScript','executive-pdf.js');
    appendScript('currentVsIdealScript','current-vs-ideal.js');
    appendScript('timerTopLayoutScript','timer-top-layout.js');
    appendScript('resetCleanupScript','reset-cleanup.js');
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
      .top-actions-host{width:100%;display:block;margin:0 0 8px 0;box-sizing:border-box;}
      .top-actions-pill{width:100%;height:34px;min-height:34px;display:grid;grid-template-columns:82px minmax(0,1fr) 48px;align-items:center;border:1px solid rgba(255,255,255,.12);background:rgba(13,17,23,.90);color:#fff;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.18);overflow:hidden;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);white-space:nowrap;z-index:30;}
      .top-actions-pill > span,.top-actions-pill > button{height:34px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;border:0;border-left:1px solid rgba(255,255,255,.10);background:transparent;color:inherit;font-size:10.5px;font-weight:900;letter-spacing:.01em;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .top-actions-pill > span:first-child,.top-actions-pill > button:first-child{border-left:0;}
      .top-actions-pill > button{cursor:pointer;touch-action:manipulation;}
      .top-actions-pill > button:active{background:rgba(255,255,255,.10);}
      .top-actions-version{color:#dbeafe;min-width:82px;}
      .top-actions-update{width:100%;min-width:0;color:#9fb3c8;}
      .top-actions-theme{min-width:48px;font-size:16px!important;padding:0!important;}
      .top-actions-update .desktop-label,.top-actions-update .mobile-label{border:0!important;padding:0!important;height:auto!important;background:transparent!important;display:inline;min-width:0!important;box-shadow:none!important;}
      .top-actions-update .mobile-label{display:none;}
      #appVersion,#op-theme-btn,.app-version-pill,.theme-floating-pill,.legacy-top-pill,.legacy-version-badge{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}
      #forceUpdateAppBtn{position:static!important;right:auto!important;bottom:auto!important;box-shadow:none!important;opacity:1!important;border-radius:0!important;min-width:0!important;}
      html[data-theme="light"] .top-actions-pill{background:rgba(255,255,255,.95);color:#1a1f2e;border-color:rgba(26,31,46,.10);box-shadow:0 4px 12px rgba(15,23,42,.08);}
      html[data-theme="light"] .top-actions-version{color:#1d4ed8;}
      html[data-theme="light"] .top-actions-update{color:#64748b;}
      html[data-theme="light"] .top-actions-pill > span,html[data-theme="light"] .top-actions-pill > button{border-left-color:rgba(26,31,46,.10);}
      @media(max-width:520px){.top-actions-host{margin:0 0 8px 0;}.top-actions-pill{height:32px;min-height:32px;grid-template-columns:78px minmax(0,1fr) 46px;}.top-actions-pill > span,.top-actions-pill > button{height:32px;font-size:10px;padding:0 4px;letter-spacing:0;}.top-actions-version{min-width:78px;}.top-actions-theme{min-width:46px;font-size:15px!important;}.top-actions-update .desktop-label{display:none!important;}.top-actions-update .mobile-label{display:inline!important;}}
      body.export-mode .top-actions-host,body.export-mode .top-actions-pill{display:none!important;}
    `;
    document.head.appendChild(style);
  }

  function removeLegacyTopPills(){
    ['#appVersion','#op-theme-btn','.app-version-pill','.theme-floating-pill','.legacy-top-pill','.legacy-version-badge'].forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(el){
        if(!el || el.id==='topActionsPill' || el.id==='topActionsHost') return;
        el.style.display='none';
        el.style.visibility='hidden';
        el.style.opacity='0';
        el.style.pointerEvents='none';
        if(selector !== '#appVersion' && selector !== '#op-theme-btn'){
          try{ el.remove(); }catch(error){}
        }
      });
    });
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

    removeLegacyTopPills();

    var pill=document.createElement('div');
    pill.id='topActionsPill';
    pill.className='top-actions-pill';
    pill.innerHTML='<span id="topActionsVersion" class="top-actions-version">'+APP_VERSION+'</span>'+
      '<button id="forceUpdateAppBtn" class="top-actions-update" type="button" title="Toque para verificar/forçar atualização"><span class="desktop-label">✓ Versão atualizada</span><span class="mobile-label">✓ Atualizada</span></button>'+
      '<button id="topActionsThemeBtn" class="top-actions-theme" type="button" aria-label="Alternar tema">🌙</button>';

    var firstCard=document.querySelector('.card');
    if(firstCard){
      var host=document.createElement('div');
      host.id='topActionsHost';
      host.className='top-actions-host';
      host.appendChild(pill);
      firstCard.insertBefore(host, firstCard.firstChild);
    }else{
      document.body.insertBefore(pill, document.body.firstChild);
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

    removeLegacyTopPills();
  }

  async function forceUpdateApp(){
    if(sessionStorage.getItem('operix_force_update_running') === '1') return;
    sessionStorage.setItem('operix_force_update_running','1');
    toast('Verificando e atualizando app...',2200);

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

  function clean(text){ return String(text == null ? '' : text).replace(/\s+/g,' ').trim(); }

  function txt(id, fallback){
    var el=document.getElementById(id);
    return clean((el&&(el.textContent||el.innerText||el.value))||fallback||'0');
  }

  function val(id, fallback){
    var el=document.getElementById(id);
    return clean((el&&(el.value||el.textContent||el.innerText))||fallback||'Não informado');
  }

  function fmt(value, fallback){
    return clean(value || fallback || '0');
  }

  function pct(value){
    var n = Number(value);
    return isFinite(n) ? n.toFixed(1)+'%' : '0,0%';
  }

  function topCriticalLabel(){
    var p = window.cronoAdmPareto || {};
    if(p.criticalItems && p.criticalItems.length){
      return p.criticalItems[0].label || 'Evento crítico';
    }
    if(p.top && p.top.label){ return p.top.label; }
    return 'Não identificado';
  }

  function buildWhatsAppSummary(){
    var processo = val('equipName','Processo não informado');
    var analyst = val('analystName','Não informado');
    var goal = val('goalTime','Não definido');
    var f = window.cronoAdmFlowEfficiency || {};
    var h = window.cronoAdmHandoffs || {};
    var e = window.cronoAdmExecutiveSummary || {};
    var formatSeconds = (window.CronoUtils && window.CronoUtils.formatSeconds) || function(n){ return String(n||0); };

    var conclusion = clean(e.conclusion || (window.getExecutiveSummaryText ? window.getExecutiveSummaryText() : 'Conclusão ainda não disponível.'));
    var action = clean(e.action || 'Definir próximos passos com base no maior evento crítico identificado.');
    var status = clean(e.status || 'Status não calculado');
    var risk = clean(e.risk || 'Não calculado');

    var lines=[
      '📊 *Resumo Executivo — Crono ADM*','',
      '📌 Processo: '+processo,
      '👤 Analista: '+analyst,
      '📅 Data: '+new Date().toLocaleDateString('pt-BR'),
      '🎯 Meta/Referência: '+goal,'',
      '⏱️ *Indicadores Lean Office*',
      '• Lead Time: '+formatSeconds(f.lead),
      '• Touch Time: '+formatSeconds(f.touch),
      '• Waiting Time: '+formatSeconds(f.waiting)+' ('+pct(f.waitingPct)+')',
      '• Retrabalho: '+formatSeconds(f.loss)+' ('+pct(f.lossPct)+')',
      '• Eficiência do Fluxo: '+pct(f.efficiency),
      '• Etapas: '+fmt(f.rows, txt('valSamples','0')),'',
      '🔁 *Handoffs*',
      '• Handoffs totais: '+fmt(h.handoffsTotal,'0'),
      '• Passagens de área: '+fmt(h.handoffsArea,'0'),
      '• Mudanças de responsável: '+fmt(h.handoffsResp,'0'),
      '• Áreas envolvidas: '+fmt(h.uniqueAreas,'0'),
      '• Responsáveis distintos: '+fmt(h.uniqueResp,'0'),'',
      '🔎 *Principal evento*',
      '• '+topCriticalLabel(),'',
      '📌 *Conclusão*',
      conclusion,'',
      '➡️ *Ação recomendada*',
      action,'',
      '🚦 *Status*: '+status+' | Risco: '+risk,'',
      'Gerado pelo Operix Crono ADM — Lean Office'
    ];

    return lines.join('\n');
  }

  function shareWhatsAppSimple(){
    var text=buildWhatsAppSummary();
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  }

  function bindWhatsAppButtons(){
    document.querySelectorAll('button').forEach(function(btn){
      if((btn.textContent||'').toLowerCase().includes('whatsapp')){
        btn.onclick=function(e){ e.preventDefault(); shareWhatsAppSimple(); };
      }
    });
  }

  window.buildCronoAdmWhatsAppSummary = buildWhatsAppSummary;

  function register(){
    setVersion();
    loadAdminEvents();
    injectTopActionsPill();
    removeLegacyTopPills();
    bindWhatsAppButtons();

    if(!('serviceWorker'in navigator))return;

    window.addEventListener('load',()=>{
      if(started)return;
      started=true;
      navigator.serviceWorker.register('sw.js?v='+encodeURIComponent(APP_VERSION),{updateViaCache:'none'})
      .then(reg=>reg.update())
      .then(()=>{sessionStorage.removeItem('operix_force_update_running');})
      .catch(()=>{sessionStorage.removeItem('operix_force_update_running');});
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',register);
  }else register();
})();
