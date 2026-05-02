'use strict';

(function(){
  var ADMIN_STORAGE_KEY = 'cronoAdm_adminEvents_v1';
  var DEFAULT_EVENT = 'execucao';

  var EVENTS = {
    execucao: { label: 'Execução', color: '#28a745', critical: false },
    analise: { label: 'Análise', color: '#4dabf7', critical: false },
    aprovacao: { label: 'Aprovação', color: '#ffc107', critical: true },
    espera: { label: 'Espera', color: '#dc3545', critical: true },
    retrabalho: { label: 'Retrabalho', color: '#fd7e14', critical: true },
    sistema: { label: 'Sistema', color: '#8e44ad', critical: false },
    comunicacao: { label: 'Comunicação', color: '#17a2b8', critical: false },
    decisao: { label: 'Decisão', color: '#6f42c1', critical: false }
  };

  function $(id){ return document.getElementById(id); }

  function loadAdminMap(){
    try { return JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }

  function getRows(){
    return Array.prototype.slice.call(document.querySelectorAll('.history-row'));
  }

  function getRowKey(row, index){
    return row.getAttribute('data-admin-row-key') || String(index);
  }

  function parseTimeToSeconds(text){
    var raw = String(text || '').trim();
    if(!raw) return 0;

    var match = raw.match(/(\d{1,2}:)?\d{1,2}:\d{2}(?:[\.,]\d+)?/);
    if(match){
      var parts = match[0].replace(',', '.').split(':').map(Number);
      if(parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
      if(parts.length === 2) return (parts[0] * 60) + parts[1];
    }

    var numberMatch = raw.replace(',', '.').match(/\d+(?:\.\d+)?/);
    return numberMatch ? Number(numberMatch[0]) : 0;
  }

  function getRowDuration(row){
    var timeNode = row.querySelector('.history-time');
    if(timeNode) return parseTimeToSeconds(timeNode.textContent || timeNode.innerText);
    return parseTimeToSeconds(row.textContent || row.innerText || '');
  }

  function formatSeconds(totalSeconds){
    var total = Math.max(0, Math.round(Number(totalSeconds) || 0));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    if(h > 0) return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function calculatePareto(){
    var rows = getRows();
    var map = loadAdminMap();
    var total = 0;
    var buckets = {};

    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      var eventKey = row.getAttribute('data-admin-event') || map[key] || DEFAULT_EVENT;
      var seconds = getRowDuration(row);
      total += seconds;

      if(!buckets[eventKey]){
        var meta = EVENTS[eventKey] || EVENTS[DEFAULT_EVENT];
        buckets[eventKey] = {
          key: eventKey,
          label: meta.label,
          color: meta.color,
          critical: !!meta.critical,
          seconds: 0,
          count: 0
        };
      }

      buckets[eventKey].seconds += seconds;
      buckets[eventKey].count += 1;
    });

    var items = Object.keys(buckets).map(function(key){ return buckets[key]; })
      .sort(function(a,b){ return b.seconds - a.seconds; });

    var criticalItems = items.filter(function(item){ return item.critical && item.seconds > 0; });

    return {
      rows: rows.length,
      total: total,
      items: items,
      criticalItems: criticalItems,
      hasCritical: criticalItems.length > 0,
      top: items[0] || null
    };
  }

  function injectStyles(){
    if($('adminParetoStyle')) return;
    var style = document.createElement('style');
    style.id = 'adminParetoStyle';
    style.textContent = `
      .admin-pareto-card { border: 1px solid rgba(220,53,69,.24); }
      .admin-pareto-list { display:flex; flex-direction:column; gap:7px; margin-top:8px; }
      .admin-pareto-row { display:grid; grid-template-columns: 92px 1fr 68px; gap:7px; align-items:center; }
      .admin-pareto-label { font-size:.7rem; font-weight:800; color:var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .admin-pareto-bar-wrap { height:16px; background:rgba(255,255,255,.07); border:1px solid var(--border); border-radius:999px; overflow:hidden; }
      .admin-pareto-bar { height:100%; min-width:2px; border-radius:999px; transition:width .2s ease; }
      .admin-pareto-value { font-size:.68rem; font-weight:800; color:var(--text-muted); text-align:right; font-variant-numeric:tabular-nums; }
      .admin-pareto-note { margin-top:8px; font-size:.72rem; line-height:1.35; color:var(--text-muted); text-align:center; }
      .admin-pareto-critical { color:#ffb3b3; }
      .admin-pareto-normal { color:var(--green); }
      html[data-theme="light"] .admin-pareto-bar-wrap { background:#f0f4fa; }
      html[data-theme="light"] .admin-pareto-critical { color:#b02a37; }
      body.export-mode .admin-pareto-card { display:none !important; }
    `;
    document.head.appendChild(style);
  }

  function injectCard(){
    if($('adminParetoCard')) return;

    var anchor = $('handoffsCard') || $('flowEfficiencyCard') || $('adminEventsCard') || document.querySelector('.card');
    if(!anchor || !anchor.parentNode) return;

    var card = document.createElement('div');
    card.className = 'card admin-pareto-card';
    card.id = 'adminParetoCard';
    card.innerHTML = `
      <div class="chart-title">Pareto de Eventos Administrativos</div>
      <div class="admin-pareto-list" id="adminParetoList"></div>
      <div class="admin-pareto-note" id="adminParetoNote">Classifique as etapas para visualizar concentração de eventos administrativos.</div>
    `;
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  }

  function renderPareto(){
    injectCard();

    var list = $('adminParetoList');
    var note = $('adminParetoNote');
    if(!list || !note) return;

    var data = calculatePareto();
    var maxSeconds = data.items.length ? data.items[0].seconds : 0;

    if(data.rows === 0){
      list.innerHTML = '';
      note.textContent = 'Sem etapas registradas. Registre o fluxo para gerar o Pareto de eventos administrativos.';
      window.cronoAdmPareto = data;
      return;
    }

    list.innerHTML = data.items.map(function(item){
      var pct = data.total > 0 ? (item.seconds / data.total) * 100 : 0;
      var width = maxSeconds > 0 ? Math.max(3, (item.seconds / maxSeconds) * 100) : 0;
      var labelClass = item.critical ? 'admin-pareto-critical' : 'admin-pareto-normal';
      return `
        <div class="admin-pareto-row">
          <div class="admin-pareto-label ${labelClass}" title="${item.label}">${item.label}</div>
          <div class="admin-pareto-bar-wrap"><div class="admin-pareto-bar" style="width:${width.toFixed(1)}%; background:${item.color};"></div></div>
          <div class="admin-pareto-value">${formatSeconds(item.seconds)} · ${pct.toFixed(1)}%</div>
        </div>
      `;
    }).join('');

    if(!data.hasCritical){
      note.textContent = 'Sem eventos críticos classificados. As perdas atuais estão associadas à variação natural ou ao fluxo normal do processo.';
    }else{
      var topCritical = data.criticalItems[0];
      note.textContent = 'Leitura: principal evento crítico classificado é ' + topCritical.label + ', com ' + formatSeconds(topCritical.seconds) + '. Avalie causa, responsável e ação para reduzir o Lead Time.';
    }

    window.cronoAdmPareto = data;
  }

  function observeChanges(){
    var timer = null;
    function schedule(){
      clearTimeout(timer);
      timer = setTimeout(renderPareto, 140);
    }

    var observer = new MutationObserver(function(){ schedule(); });
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });

    document.addEventListener('click', function(event){
      if(event.target && event.target.closest && event.target.closest('.admin-event-badge')) schedule();
    }, true);

    document.addEventListener('change', function(event){
      if(event.target && event.target.classList && event.target.classList.contains('admin-event-select-inline')) schedule();
    }, true);
  }

  function init(){
    injectStyles();
    injectCard();
    renderPareto();
    observeChanges();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
