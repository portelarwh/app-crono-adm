'use strict';

(function(){
  var ADMIN_STORAGE_KEY = 'cronoAdm_adminEvents_v1';
  var DEFAULT_EVENT = 'execucao';

  var TOUCH_EVENTS = ['execucao', 'analise', 'sistema', 'comunicacao', 'decisao'];
  var WAIT_EVENTS = ['espera', 'aprovacao'];
  var LOSS_EVENTS = ['retrabalho'];

  var LABELS = {
    execucao: 'Execução',
    analise: 'Análise',
    aprovacao: 'Aprovação',
    espera: 'Espera',
    retrabalho: 'Retrabalho',
    sistema: 'Sistema',
    comunicacao: 'Comunicação',
    decisao: 'Decisão'
  };

  function $(id){ return document.getElementById(id); }

  function loadAdminMap(){
    try { return JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
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

  function formatSeconds(totalSeconds){
    var total = Math.max(0, Math.round(Number(totalSeconds) || 0));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    if(h > 0) return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function getRowKey(row, index){
    return row.getAttribute('data-admin-row-key') || String(index);
  }

  function getRowDuration(row){
    var timeNode = row.querySelector('.history-time');
    if(timeNode) return parseTimeToSeconds(timeNode.textContent || timeNode.innerText);

    var text = row.textContent || row.innerText || '';
    return parseTimeToSeconds(text);
  }

  function classifyEvent(eventKey){
    if(TOUCH_EVENTS.indexOf(eventKey) >= 0) return 'touch';
    if(WAIT_EVENTS.indexOf(eventKey) >= 0) return 'wait';
    if(LOSS_EVENTS.indexOf(eventKey) >= 0) return 'loss';
    return 'touch';
  }

  function calculateFlow(){
    var rows = Array.prototype.slice.call(document.querySelectorAll('.history-row'));
    var map = loadAdminMap();
    var result = {
      rows: rows.length,
      lead: 0,
      touch: 0,
      waiting: 0,
      loss: 0,
      efficiency: 0,
      waitingPct: 0,
      lossPct: 0,
      topEvent: DEFAULT_EVENT,
      topEventLabel: LABELS[DEFAULT_EVENT],
      eventSeconds: {}
    };

    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      var eventKey = row.getAttribute('data-admin-event') || map[key] || DEFAULT_EVENT;
      var seconds = getRowDuration(row);
      var classification = classifyEvent(eventKey);

      result.lead += seconds;
      if(classification === 'touch') result.touch += seconds;
      if(classification === 'wait') result.waiting += seconds;
      if(classification === 'loss') result.loss += seconds;
      result.eventSeconds[eventKey] = (result.eventSeconds[eventKey] || 0) + seconds;
    });

    result.efficiency = result.lead > 0 ? (result.touch / result.lead) * 100 : 0;
    result.waitingPct = result.lead > 0 ? (result.waiting / result.lead) * 100 : 0;
    result.lossPct = result.lead > 0 ? (result.loss / result.lead) * 100 : 0;

    var topKey = Object.keys(result.eventSeconds).sort(function(a,b){
      return result.eventSeconds[b] - result.eventSeconds[a];
    })[0] || DEFAULT_EVENT;

    result.topEvent = topKey;
    result.topEventLabel = LABELS[topKey] || LABELS[DEFAULT_EVENT];

    return result;
  }

  function injectStyles(){
    if($('flowEfficiencyStyle')) return;
    var style = document.createElement('style');
    style.id = 'flowEfficiencyStyle';
    style.textContent = `
      .flow-efficiency-card { border: 1px solid rgba(40,167,69,.24); }
      .flow-efficiency-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; }
      .flow-efficiency-box { background:rgba(255,255,255,.05); border:1px solid var(--border); border-radius:8px; padding:8px; text-align:center; }
      .flow-efficiency-title { display:block; font-size:.58rem; color:var(--text-muted); text-transform:uppercase; font-weight:800; line-height:1.15; }
      .flow-efficiency-value { display:block; font-size:1.08rem; font-weight:900; margin-top:4px; font-variant-numeric:tabular-nums; }
      .flow-efficiency-sub { display:block; font-size:.68rem; color:var(--text-muted); font-weight:700; margin-top:2px; }
      .flow-efficiency-note { margin-top:8px; font-size:.72rem; line-height:1.35; color:var(--text-muted); text-align:center; }
      .flow-efficiency-main { color: var(--green); }
      .flow-efficiency-wait { color: var(--yellow); }
      .flow-efficiency-loss { color: var(--orange); }
      html[data-theme="light"] .flow-efficiency-box { background:#f0f4fa; }
      body.export-mode .flow-efficiency-card { display:none !important; }
    `;
    document.head.appendChild(style);
  }

  function injectCard(){
    if($('flowEfficiencyCard')) return;

    var anchor = $('adminEventsCard') || document.querySelector('.card');
    if(!anchor || !anchor.parentNode) return;

    var card = document.createElement('div');
    card.className = 'card flow-efficiency-card';
    card.id = 'flowEfficiencyCard';
    card.innerHTML = `
      <div class="chart-title">Eficiência do Fluxo Administrativo</div>
      <div class="flow-efficiency-grid" id="flowEfficiencyGrid"></div>
      <div class="flow-efficiency-note" id="flowEfficiencyNote">
        Classifique as etapas para separar trabalho efetivo, espera e retrabalho.
      </div>
    `;

    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  }

  function renderFlow(){
    injectCard();
    var grid = $('flowEfficiencyGrid');
    var note = $('flowEfficiencyNote');
    if(!grid || !note) return;

    var data = calculateFlow();

    grid.innerHTML = `
      <div class="flow-efficiency-box">
        <span class="flow-efficiency-title">Lead Time</span>
        <span class="flow-efficiency-value">${formatSeconds(data.lead)}</span>
        <span class="flow-efficiency-sub">tempo total</span>
      </div>
      <div class="flow-efficiency-box">
        <span class="flow-efficiency-title">Touch Time</span>
        <span class="flow-efficiency-value flow-efficiency-main">${formatSeconds(data.touch)}</span>
        <span class="flow-efficiency-sub">trabalho efetivo</span>
      </div>
      <div class="flow-efficiency-box">
        <span class="flow-efficiency-title">Waiting Time</span>
        <span class="flow-efficiency-value flow-efficiency-wait">${formatSeconds(data.waiting)}</span>
        <span class="flow-efficiency-sub">${data.waitingPct.toFixed(1)}% do fluxo</span>
      </div>
      <div class="flow-efficiency-box">
        <span class="flow-efficiency-title">Retrabalho</span>
        <span class="flow-efficiency-value flow-efficiency-loss">${formatSeconds(data.loss)}</span>
        <span class="flow-efficiency-sub">${data.lossPct.toFixed(1)}% do fluxo</span>
      </div>
      <div class="flow-efficiency-box">
        <span class="flow-efficiency-title">Eficiência</span>
        <span class="flow-efficiency-value flow-efficiency-main">${data.efficiency.toFixed(1)}%</span>
        <span class="flow-efficiency-sub">Touch ÷ Lead</span>
      </div>
      <div class="flow-efficiency-box">
        <span class="flow-efficiency-title">Maior evento</span>
        <span class="flow-efficiency-value">${data.topEventLabel}</span>
        <span class="flow-efficiency-sub">por tempo</span>
      </div>
    `;

    if(data.rows === 0){
      note.textContent = 'Sem etapas registradas. Registre o fluxo para calcular Lead Time, Touch Time, Waiting Time e eficiência.';
    }else if(data.efficiency < 30){
      note.textContent = 'Leitura: baixa eficiência de fluxo. Há concentração relevante de espera, aprovação ou retrabalho entre as etapas.';
    }else if(data.waitingPct > 40){
      note.textContent = 'Leitura: o processo possui alta participação de espera. Avalie aprovações, respostas pendentes e dependências entre áreas.';
    }else{
      note.textContent = 'Leitura: fluxo com boa proporção de trabalho efetivo. Ainda assim, valide eventos de espera e retrabalho para reduzir Lead Time.';
    }

    window.cronoAdmFlowEfficiency = data;
  }

  function observeChanges(){
    var timer = null;
    var observer = new MutationObserver(function(){
      clearTimeout(timer);
      timer = setTimeout(renderFlow, 160);
    });
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });

    document.addEventListener('change', function(event){
      if(event.target && event.target.classList && event.target.classList.contains('admin-event-select-inline')){
        setTimeout(renderFlow, 80);
      }
    }, true);

    document.addEventListener('click', function(event){
      if(event.target && event.target.closest && event.target.closest('.admin-event-badge')){
        setTimeout(renderFlow, 120);
      }
    }, true);
  }

  function init(){
    injectStyles();
    injectCard();
    renderFlow();
    observeChanges();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
