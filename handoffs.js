'use strict';

(function(){
  var STORAGE_KEY = 'cronoAdm_handoffs_v1';
  var DEFAULT_AREA = 'Não informado';

  function $(id){ return document.getElementById(id); }

  function loadMap(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }

  function saveMap(map){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
  }

  function clean(value, fallback){
    var text = String(value == null ? '' : value).trim();
    return text || fallback || '';
  }

  function getRows(){
    return Array.prototype.slice.call(document.querySelectorAll('.history-row'));
  }

  function getRowKey(row, index){
    var key = row.getAttribute('data-admin-row-key') || row.getAttribute('data-handoff-row-key') || row.getAttribute('data-ideal-row-key');
    if(!key){ key = 'row-' + index; }
    row.setAttribute('data-handoff-row-key', key);
    return key;
  }

  function defaultRecord(){
    return { areaAtual: '', responsavel: '' };
  }

  function normalizeRecord(record){
    return {
      areaAtual: clean(record && record.areaAtual, ''),
      responsavel: clean(record && record.responsavel, '')
    };
  }

  function ensureRecords(){
    var rows = getRows();
    var oldMap = loadMap();
    var nextMap = {};
    var changed = false;

    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      var record = oldMap[key] ? normalizeRecord(oldMap[key]) : defaultRecord();
      nextMap[key] = record;
      if(!oldMap[key] || JSON.stringify(oldMap[key]) !== JSON.stringify(record)) changed = true;
    });

    if(Object.keys(oldMap).length !== Object.keys(nextMap).length) changed = true;
    if(changed) saveMap(nextMap);
    return nextMap;
  }

  function injectStyles(){
    if($('handoffsStyle')) return;
    var style = document.createElement('style');
    style.id = 'handoffsStyle';
    style.textContent = `
      .handoffs-card { border: 1px solid rgba(253,126,20,.24); }
      .handoffs-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; }
      .handoffs-box { background:rgba(255,255,255,.05); border:1px solid var(--border); border-radius:8px; padding:8px; text-align:center; }
      .handoffs-title { display:block; font-size:.58rem; color:var(--text-muted); text-transform:uppercase; font-weight:800; line-height:1.15; }
      .handoffs-value { display:block; font-size:1.08rem; font-weight:900; margin-top:4px; font-variant-numeric:tabular-nums; }
      .handoffs-sub { display:block; font-size:.68rem; color:var(--text-muted); font-weight:700; margin-top:2px; }
      .handoffs-note { margin-top:8px; font-size:.72rem; line-height:1.35; color:var(--text-muted); text-align:center; }
      .handoff-slot { display:inline-flex; align-items:center; margin-left:2px; }
      .handoff-inline { display:inline-flex !important; gap:4px; align-items:center; flex-wrap:wrap; margin-left:2px; }
      .handoff-input {
        width:82px; min-width:64px; background:rgba(255,255,255,.06); color:var(--text-main);
        border:1px solid var(--border); border-radius:5px; font-size:.68rem; font-weight:700; padding:3px 4px;
        text-align:center; display:inline-flex !important; visibility:visible !important; opacity:1 !important;
      }
      .handoff-badge {
        display:inline-flex; align-items:center; justify-content:center; gap:3px; min-width:64px;
        padding:3px 5px; border-radius:4px; font-size:.62rem; font-weight:800;
        border:1px solid rgba(255,255,255,.2); color:#fff; background:#fd7e14;
        text-transform:uppercase; white-space:nowrap;
      }
      html[data-theme="light"] .handoffs-box { background:#f0f4fa; }
      html[data-theme="light"] .handoff-input { background:#fff; color:#1a1f2e; }
      body.export-mode .handoffs-card { display:none !important; }
      body.export-mode .handoff-input { display:none !important; }
      body.export-mode .handoff-badge { font-size:6.6pt !important; min-width:52px !important; padding:2px 3px !important; }
    `;
    document.head.appendChild(style);
  }

  function injectSummaryCard(){
    if($('handoffsCard')) return;

    var anchor = $('flowEfficiencyCard') || $('adminEventsCard') || document.querySelector('.card');
    if(!anchor || !anchor.parentNode) return;

    var card = document.createElement('div');
    card.className = 'card handoffs-card';
    card.id = 'handoffsCard';
    card.innerHTML = `
      <div class="chart-title">Handoffs e Responsáveis</div>
      <div class="handoffs-grid" id="handoffsGrid"></div>
      <div class="handoffs-note" id="handoffsNote">Informe área e responsável por etapa. A mudança de área entre etapas preenchidas será considerada handoff automaticamente.</div>
    `;
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  }

  function inlineEditorHtml(record, index){
    return `
      <span class="handoff-inline screen-only" data-handoff-index="${index}">
        <input class="handoff-input" data-field="areaAtual" placeholder="Área" value="${escapeAttr(record.areaAtual)}" title="Área da etapa">
        <input class="handoff-input" data-field="responsavel" placeholder="Resp." value="${escapeAttr(record.responsavel)}" title="Responsável da etapa">
      </span>
    `;
  }

  function printBadgeHtml(record){
    var area = clean(record.areaAtual, 'Área');
    var resp = clean(record.responsavel, 'Resp.');
    return '<span class="handoff-badge print-only" title="Área / responsável">' + escapeHtml(area) + ' · ' + escapeHtml(resp) + '</span>';
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value){
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function applyEditorsToRows(){
    var rows = getRows();
    var map = ensureRecords();

    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      var record = normalizeRecord(map[key] || defaultRecord());
      var slot = row.querySelector('.handoff-slot');

      if(!slot){
        slot = document.createElement('span');
        slot.className = 'handoff-slot';
        var anchor = row.querySelector('.admin-event-slot') || row.querySelector('.badge-va') || row.querySelector('.type-badge') || row.children[1];
        if(anchor && anchor.parentNode){
          anchor.parentNode.insertBefore(slot, anchor.nextSibling);
        }else{
          row.appendChild(slot);
        }
      }

      slot.innerHTML = inlineEditorHtml(record, index) + printBadgeHtml(record);
    });

    bindInputs();
    renderSummary();
  }

  function bindInputs(){
    Array.prototype.slice.call(document.querySelectorAll('.handoff-input')).forEach(function(input){
      if(input.dataset.bound === '1') return;
      input.dataset.bound = '1';

      input.addEventListener('input', function(){
        var wrapper = this.closest('.handoff-inline');
        if(!wrapper) return;
        var index = Number(wrapper.getAttribute('data-handoff-index'));
        var row = getRows()[index];
        if(!row) return;

        var key = getRowKey(row, index);
        var map = ensureRecords();
        var record = normalizeRecord(map[key] || defaultRecord());
        record[this.getAttribute('data-field')] = this.value;
        map[key] = record;
        saveMap(map);
        renderSummary();
      });
    });
  }

  function calculateHandoffs(){
    var rows = getRows();
    var map = ensureRecords();
    var flowAreas = [];
    var flowResp = [];
    var filled = 0;

    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      var record = normalizeRecord(map[key] || defaultRecord());
      var area = clean(record.areaAtual, '');
      var resp = clean(record.responsavel, '');

      if(area || resp) filled++;
      if(area) flowAreas.push(area);
      if(resp) flowResp.push(resp);
    });

    var handoffsArea = 0;
    var handoffsResp = 0;

    for(var i=1; i<flowAreas.length; i++){
      if(flowAreas[i] !== flowAreas[i-1]) handoffsArea++;
    }
    for(var r=1; r<flowResp.length; r++){
      if(flowResp[r] !== flowResp[r-1]) handoffsResp++;
    }

    var uniqueAreas = Array.from(new Set(flowAreas));
    var uniqueResp = Array.from(new Set(flowResp));

    return {
      rows: rows.length,
      filled: filled,
      handoffsArea: handoffsArea,
      handoffsResp: handoffsResp,
      handoffsTotal: handoffsArea,
      uniqueAreas: uniqueAreas.length,
      uniqueResp: uniqueResp.length,
      firstArea: flowAreas[0] || DEFAULT_AREA,
      lastArea: flowAreas[flowAreas.length - 1] || DEFAULT_AREA
    };
  }

  function renderSummary(){
    injectSummaryCard();
    var grid = $('handoffsGrid');
    var note = $('handoffsNote');
    if(!grid || !note) return;

    var data = calculateHandoffs();

    grid.innerHTML = `
      <div class="handoffs-box"><span class="handoffs-title">Handoffs</span><span class="handoffs-value">${data.handoffsTotal}</span><span class="handoffs-sub">mudanças de área</span></div>
      <div class="handoffs-box"><span class="handoffs-title">Áreas</span><span class="handoffs-value">${data.uniqueAreas}</span><span class="handoffs-sub">nas etapas</span></div>
      <div class="handoffs-box"><span class="handoffs-title">Responsáveis</span><span class="handoffs-value">${data.uniqueResp}</span><span class="handoffs-sub">distintos</span></div>
      <div class="handoffs-box"><span class="handoffs-title">Mudança área</span><span class="handoffs-value">${data.handoffsArea}</span><span class="handoffs-sub">entre etapas</span></div>
      <div class="handoffs-box"><span class="handoffs-title">Mudança resp.</span><span class="handoffs-value">${data.handoffsResp}</span><span class="handoffs-sub">entre etapas</span></div>
      <div class="handoffs-box"><span class="handoffs-title">Preenchidas</span><span class="handoffs-value">${data.filled}/${data.rows}</span><span class="handoffs-sub">etapas</span></div>
    `;

    if(data.rows === 0){
      note.textContent = 'Sem etapas registradas. Registre o fluxo para mapear handoffs e responsáveis.';
    }else if(data.filled === 0){
      note.textContent = 'Informe área e responsável nas etapas para calcular handoffs administrativos.';
    }else{
      note.textContent = 'Leitura: o cálculo ignora a área informativa do cabeçalho e considera a sequência de áreas preenchidas nas etapas.';
    }

    window.cronoAdmHandoffs = data;
  }

  function observeChanges(){
    var timer = null;
    var observer = new MutationObserver(function(){
      clearTimeout(timer);
      timer = setTimeout(applyEditorsToRows, 160);
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  function init(){
    injectStyles();
    injectSummaryCard();
    applyEditorsToRows();
    observeChanges();
  }

  window.cronoAdmApplyHandoffs = applyEditorsToRows;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
