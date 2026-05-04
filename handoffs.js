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
      html[data-theme="light"] .handoffs-box { background:#f0f4fa; }
      body.export-mode .handoffs-card { display:none !important; }
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
      <div class="handoffs-note" id="handoffsNote">Handoffs administrativos são calculados automaticamente com base nos dados da etapa.</div>
    `;
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  }

  function inlineEditorHtml(){
    return '';
  }

  function printBadgeHtml(){
    return '';
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
    renderSummary();
  }

  function bindInputs(){
    return;
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
