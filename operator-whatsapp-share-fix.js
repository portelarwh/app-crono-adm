'use strict';

(function(){
  function $(id){ return document.getElementById(id); }

  function clean(text){ return String(text == null ? '' : text).replace(/\s+/g,' ').trim(); }

  function txt(id,fallback){
    var el=$(id);
    return clean((el&&(el.textContent||el.innerText||el.value))||fallback||'0');
  }

  function val(id,fallback){
    var el=$(id);
    return clean((el&&(el.value||el.textContent||el.innerText))||fallback||'Não informado');
  }

  function flow(){
    return window.cronoAdmFlowEfficiency || {};
  }

  function handoffs(){
    return window.cronoAdmHandoffs || {};
  }

  function pareto(){
    return window.cronoAdmPareto || {};
  }

  function executive(){
    return window.cronoAdmExecutiveSummary || {};
  }

  function fmt(value, fallback){
    return clean(value || fallback || '0');
  }

  function pct(value){
    var n = Number(value);
    return isFinite(n) ? n.toFixed(1)+'%' : '0,0%';
  }

  function formatSeconds(totalSeconds){
    var total = Math.max(0, Math.round(Number(totalSeconds) || 0));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    if(h > 0) return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function topCriticalLabel(){
    var p = pareto();
    if(p.criticalItems && p.criticalItems.length){
      return p.criticalItems[0].label || 'Evento crítico';
    }
    if(p.top && p.top.label){ return p.top.label; }
    return 'Não identificado';
  }

  function buildSummaryText(){
    var processo = val('equipName','Processo não informado');
    var analyst = val('analystName','Não informado');
    var goal = val('goalTime','Não definido');
    var f = flow();
    var h = handoffs();
    var e = executive();

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

  async function shareWhatsApp(){
    var text=buildSummaryText();
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  }

  function bind(){
    document.querySelectorAll('button').forEach(function(btn){
      if((btn.textContent||'').toLowerCase().includes('whatsapp')){
        btn.onclick=function(e){e.preventDefault();shareWhatsApp();};
      }
    });

    var tbtn=$('op-theme-btn');
    if(tbtn){
      tbtn.onclick=function(){
        var isLight=document.documentElement.getAttribute('data-theme')==='light';
        if(isLight){
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('operix_theme_v1','dark');
        }else{
          document.documentElement.setAttribute('data-theme','light');
          localStorage.setItem('operix_theme_v1','light');
        }
      };
    }
  }

  window.buildCronoAdmWhatsAppSummary = buildSummaryText;

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bind);
  }else{bind();}
})();
