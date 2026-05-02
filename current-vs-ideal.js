'use strict';

(function(){
  var STORAGE_KEY = 'cronoAdm_currentVsIdeal_v1';
  var DEFAULT_ACTION = 'manter';

  var ACTIONS = {
    manter: { label: 'Manter', factor: 1.00, color: '#28a745', impact: 'sem redução' },
    eliminar: { label: 'Eliminar', factor: 0.00, color: '#dc3545', impact: 'remove a etapa' },
    combinar: { label: 'Combinar', factor: 0.50, color: '#fd7e14', impact: 'reduz 50%' },
    automatizar: { label: 'Automatizar', factor: 0.25, color: '#4dabf7', impact: 'reduz 75%' },
    transferir: { label: 'Transferir', factor: 0.90, color: '#6f42c1', impact: 'reduz 10%' },
    padronizar: { label: 'Padronizar', factor: 0.70, color: '#ffc107', impact: 'reduz 30%' }
  };

  var ACTION_ORDER = ['manter', 'eliminar', 'combinar', 'automatizar', 'transferir', 'padronizar'];

  function $(id){ return document.getElementById(id); }

  function loadMap(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }

  function saveMap(map){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
  }

  function getRows(){
    return Array.prototype.slice.call(document.querySelectorAll('.history-row'));
  }

  function getRowKey(row, index){
    return row.getAttribute('data-admin-row-key') || row.getAttribute('data-handoff-row-key') || row.getAttribute('data-ideal-row-key') || String(index);
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

  function optionHtml(selected){
    return ACTION_ORDER.map(function(key){
      var action = ACTIONS[key];
      return '<option value="'+key+'" '+(selected===key?'selected':'')+'>'+action.label+'</option>';
    }).join('');
  }

  function injectStyles(){
    if($('currentVsIdealStyle')) return;
    var style = document.createElement('style');
    style.id = 'currentVsIdealStyle';
    style.textContent = `
      .current-vs-ideal-card { border: 1px solid rgba(40,167,69,.30); }
      .current-vs-ideal-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; }
      .current-vs-ideal-box { background:rgba(255,255,255,.05); border:1px solid var(--border); border-radius:8px; padding:8px; text-align:center; }
      .current-vs-ideal-title { display:block; font-size:.58rem; color:var(--text-muted); text-transform:uppercase; font-weight:800; line-height:1.15; }
      .current-vs-ideal-value { display:block; font-size:1.02rem; font-weight:900; margin-top:4px; font-variant-numeric:tabular-nums; }
      .current-vs-ideal-sub { display:block; font-size:.66rem; color:var(--text-muted); font-weight:700; margin-top:2px; }
      .current-vs-ideal-note { margin-top:8px; font-size:.72rem; line-height:1.35; color:var(--text-muted); text-align:center; }
      .ideal-action-select { background:rgba(255,255,255,.06); color:var(--text-main); border:1px solid var(--border); border-radius:5px; font-size:.68rem; font-weight:800; padding:3px 5px; width:auto; min-width:94px; text-align:center; }
      .ideal-action-badge { display:inline-flex; align-items:center; justify-content:center; min-width:62px; padding:3px 5px; border-radius:4px; font-size:.62rem; font-weight:900; color:#fff; border:1px solid rgba(255,255,255,.22); text-transform:uppercase; white-space:nowrap; }
      html[data-theme="light"] .current-vs-ideal-box { background:#f0f4fa; }
      html[data-theme="light"] .ideal-action-select { background:#fff; color:#1a1f2e; }
      body.export-mode .current-vs-ideal-card { display:block !important; break-inside:avoid !important; page-break-inside:avoid !important; }
      body.export-mode .current-vs-ideal-grid { display:grid !important; grid-template-columns:repeat(4,1fr) !important; gap:6px !important; }
      body.export-mode .current-vs-ideal-box { background:#fff !important; color:#1a1f2e !important; border:1px solid #c8d0e0 !important; }
      body.export-mode .ideal-action-select { display:none !important; }
      body.export-mode .ideal-action-badge { font-size:6.6pt !important; min-width:50px !important; padding:2px 3px !important; }
    `;
    document.head.appendChild(style);
  }

  function injectCard(){
    if($('currentVsIdealCard')) return;
    var anchor = $('executiveSummaryCard') || $('adminParetoCard') || $('handoffsCard') || $('flowEfficiencyCard') || document.querySelector('.card');
    if(!anchor || !anchor.parentNode) return;
    var card = document.createElement('div');
    card.className = 'card current-vs-ideal-card';
    card.id = 'currentVsIdealCard';
    card.innerHTML = `
      <div class="chart-title">Processo Atual vs Processo Ideal</div>
      <div class="current-vs-ideal-grid" id="currentVsIdealGrid"></div>
      <div class="current-vs-ideal-note" id="currentVsIdealNote">Classifique cada etapa como manter, eliminar, combinar, automatizar, transferir ou padronizar para estimar o ganho.</div>
    `;
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  }

  function ensureRecords(){
    var rows = getRows();
    var map = loadMap();
    var changed = false;
    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      row.setAttribute('data-ideal-row-key', key);
      if(!map[key]){
        map[key] = DEFAULT_ACTION;
        changed = true;
      }
    });
    if(changed) saveMap(map);
    return map;
  }

  function badgeHtml(actionKey){
    var action = ACTIONS[actionKey] || ACTIONS[DEFAULT_ACTION];
    return '<span class="ideal-action-badge print-only" style="background:'+action.color+'" title="Ação proposta">'+action.label+'</span>';
  }

  function editorHtml(actionKey, index){
    return '<span class="screen-only ideal-action-slot" data-ideal-index="'+index+'"><select class="ideal-action-select">'+optionHtml(actionKey)+'</select></span>' + badgeHtml(actionKey);
  }

  function applyEditors(){
    var rows = getRows();
    var map = ensureRecords();
    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      var actionKey = map[key] || DEFAULT_ACTION;
      var slot = row.querySelector('.current-vs-ideal-slot');
      if(!slot){
        slot = document.createElement('span');
        slot.className = 'current-vs-ideal-slot';
        var anchor = row.querySelector('.handoff-slot') || row.querySelector('.admin-event-slot') || row.querySelector('.badge-va') || row.children[1];
        if(anchor && anchor.parentNode){
          anchor.parentNode.insertBefore(slot, anchor.nextSibling);
        }else{
          row.appendChild(slot);
        }
      }
      slot.innerHTML = editorHtml(actionKey, index);
    });
    bindEditors();
    renderSummary();
  }

  function bindEditors(){
    Array.prototype.slice.call(document.querySelectorAll('.ideal-action-select')).forEach(function(select){
      if(select.dataset.bound === '1') return;
      select.dataset.bound = '1';
      select.addEventListener('change', function(){
        var wrapper = this.closest('.ideal-action-slot');
        var index = wrapper ? Number(wrapper.getAttribute('data-ideal-index')) : -1;
        var row = getRows()[index];
        if(!row) return;
        var key = getRowKey(row, index);
        var map = loadMap();
        map[key] = this.value || DEFAULT_ACTION;
        saveMap(map);
        applyEditors();
      });
    });
  }

  function calculate(){
    var rows = getRows();
    var map = ensureRecords();
    var current = 0;
    var proposed = 0;
    var counts = { manter:0, eliminar:0, combinar:0, automatizar:0, transferir:0, padronizar:0 };
    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      var actionKey = map[key] || DEFAULT_ACTION;
      var action = ACTIONS[actionKey] || ACTIONS[DEFAULT_ACTION];
      var duration = getRowDuration(row);
      current += duration;
      proposed += duration * action.factor;
      counts[actionKey] = (counts[actionKey] || 0) + 1;
    });
    var gain = Math.max(0, current - proposed);
    var gainPct = current > 0 ? (gain / current) * 100 : 0;
    var actionsCount = counts.eliminar + counts.combinar + counts.automatizar + counts.transferir + counts.padronizar;
    return { rows: rows.length, current: current, proposed: proposed, gain: gain, gainPct: gainPct, counts: counts, actionsCount: actionsCount };
  }

  function renderSummary(){
    injectCard();
    var grid = $('currentVsIdealGrid');
    var note = $('currentVsIdealNote');
    if(!grid || !note) return;
    var data = calculate();
    grid.innerHTML = `
      <div class="current-vs-ideal-box"><span class="current-vs-ideal-title">Lead atual</span><span class="current-vs-ideal-value">${formatSeconds(data.current)}</span><span class="current-vs-ideal-sub">cenário medido</span></div>
      <div class="current-vs-ideal-box"><span class="current-vs-ideal-title">Lead ideal</span><span class="current-vs-ideal-value">${formatSeconds(data.proposed)}</span><span class="current-vs-ideal-sub">cenário proposto</span></div>
      <div class="current-vs-ideal-box"><span class="current-vs-ideal-title">Ganho</span><span class="current-vs-ideal-value">${formatSeconds(data.gain)}</span><span class="current-vs-ideal-sub">tempo reduzido</span></div>
      <div class="current-vs-ideal-box"><span class="current-vs-ideal-title">Redução</span><span class="current-vs-ideal-value">${data.gainPct.toFixed(1)}%</span><span class="current-vs-ideal-sub">estimada</span></div>
      <div class="current-vs-ideal-box"><span class="current-vs-ideal-title">Eliminar</span><span class="current-vs-ideal-value">${data.counts.eliminar}</span><span class="current-vs-ideal-sub">etapas</span></div>
      <div class="current-vs-ideal-box"><span class="current-vs-ideal-title">Combinar</span><span class="current-vs-ideal-value">${data.counts.combinar}</span><span class="current-vs-ideal-sub">etapas</span></div>
      <div class="current-vs-ideal-box"><span class="current-vs-ideal-title">Automatizar</span><span class="current-vs-ideal-value">${data.counts.automatizar}</span><span class="current-vs-ideal-sub">etapas</span></div>
      <div class="current-vs-ideal-box"><span class="current-vs-ideal-title">Padronizar</span><span class="current-vs-ideal-value">${data.counts.padronizar}</span><span class="current-vs-ideal-sub">etapas</span></div>
    `;

    if(data.rows === 0){
      note.textContent = 'Sem etapas registradas. Registre o processo atual para simular o cenário ideal.';
    }else if(data.actionsCount === 0){
      note.textContent = 'Nenhuma melhoria proposta ainda. Classifique as etapas para estimar redução de Lead Time.';
    }else{
      note.textContent = 'Leitura: o cenário ideal estima redução de ' + data.gainPct.toFixed(1) + '% no Lead Time. Priorize as ações com maior tempo acumulado e menor complexidade de implementação.';
    }

    window.cronoAdmCurrentVsIdeal = data;
  }

  function observe(){
    var timer = null;
    function schedule(){ clearTimeout(timer); timer = setTimeout(applyEditors, 160); }
    var observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  function init(){
    injectStyles();
    injectCard();
    applyEditors();
    observe();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
