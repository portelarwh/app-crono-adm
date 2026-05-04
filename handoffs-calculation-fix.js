'use strict';

(function(){
  var STORAGE_KEY = 'cronoAdm_handoffs_v1';
  var DEFAULT_AREA = 'Não informado';

  function $(id){ return document.getElementById(id); }

  function clean(value){
    return String(value == null ? '' : value).trim();
  }

  function loadMap(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }

  function getRows(){
    return Array.prototype.slice.call(document.querySelectorAll('.history-row'));
  }

  function getRowKey(row, index){
    return row.getAttribute('data-admin-row-key') || row.getAttribute('data-handoff-row-key') || String(index);
  }

  function getElementByRow(row){
    var id = Number(row.getAttribute('data-id'));
    if(!Array.isArray(window.elements)) return null;
    for(var i = 0; i < window.elements.length; i++){
      if(Number(window.elements[i].id) === id) return window.elements[i];
    }
    return null;
  }

  function getRecords(){
    var map = loadMap();
    return getRows().map(function(row, index){
      var key = getRowKey(row, index);
      var legacy = map[key] || {};
      var element = getElementByRow(row) || {};
      return {
        areaAtual: clean(element.area || legacy.areaAtual),
        responsavel: clean(element.requester || legacy.responsavel)
      };
    });
  }

  function calculateFixedHandoffs(){
    var rows = getRows();
    var records = getRecords();
    var filled = 0;
    var handoffsArea = 0;
    var handoffsResp = 0;
    records.forEach(function(record){
      if(record.areaAtual || record.responsavel) filled++;
    });

    var areaFlow = records.map(function(record){ return record.areaAtual; }).filter(Boolean);
    for(var a = 1; a < areaFlow.length; a++){
      if(areaFlow[a] !== areaFlow[a - 1]) handoffsArea++;
    }

    for(var i = 1; i < records.length; i++){
      var previousResp = records[i - 1].responsavel;
      var currentResp = records[i].responsavel;
      if(previousResp && currentResp && previousResp !== currentResp) handoffsResp++;
    }

    var uniqueAreas = Array.from(new Set(records
      .map(function(r){ return r.areaAtual; })
      .filter(Boolean)
    ));

    var uniqueResp = Array.from(new Set(records
      .map(function(r){ return r.responsavel; })
      .filter(Boolean)
    ));

    var handoffsTotal = handoffsArea;

    return {
      rows: rows.length,
      filled: filled,
      handoffsArea: handoffsArea,
      handoffsResp: handoffsResp,
      handoffsTotal: handoffsTotal,
      uniqueAreas: uniqueAreas.length,
      uniqueResp: uniqueResp.length,
      lastArea: uniqueAreas[uniqueAreas.length - 1] || DEFAULT_AREA
    };
  }

  function renderFixedSummary(){
    var grid = $('handoffsGrid');
    var note = $('handoffsNote');
    if(!grid || !note) return;

    var data = calculateFixedHandoffs();

    grid.innerHTML = `
      <div class="handoffs-box">
        <span class="handoffs-title">Handoffs</span>
        <span class="handoffs-value">${data.handoffsTotal}</span>
        <span class="handoffs-sub">mudanças de área</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Áreas</span>
        <span class="handoffs-value">${data.uniqueAreas}</span>
        <span class="handoffs-sub">envolvidas</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Responsáveis</span>
        <span class="handoffs-value">${data.uniqueResp}</span>
        <span class="handoffs-sub">distintos</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Passagem área</span>
        <span class="handoffs-value">${data.handoffsArea}</span>
        <span class="handoffs-sub">entre etapas</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Mudança resp.</span>
        <span class="handoffs-value">${data.handoffsResp}</span>
        <span class="handoffs-sub">entre etapas</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Preenchidas</span>
        <span class="handoffs-value">${data.filled}/${data.rows}</span>
        <span class="handoffs-sub">etapas</span>
      </div>
    `;

    if(data.rows === 0){
      note.textContent = 'Sem etapas registradas. Registre o fluxo para mapear handoffs e responsáveis.';
    }else if(data.filled === 0){
      note.textContent = 'Preencha área e responsável no modal de cada etapa para calcular handoffs administrativos.';
    }else if(data.handoffsArea === 0 && data.handoffsResp === 0){
      note.textContent = 'Leitura: nenhuma passagem de área identificada nas etapas preenchidas.';
    }else if(data.handoffsTotal >= Math.max(3, Math.ceil(data.rows * 0.6))){
      note.textContent = 'Leitura: alto número de handoffs. Avalie excesso de transferências, aprovações intermediárias e dependência entre áreas.';
    }else{
      note.textContent = 'Leitura: handoffs controlados. Valide se as passagens são necessárias ou se podem ser simplificadas.';
    }

    window.cronoAdmHandoffs = data;
  }

  function bindEvents(){
    var timer = null;
    function schedule(){
      clearTimeout(timer);
      timer = setTimeout(renderFixedSummary, 90);
    }

    document.addEventListener('input', schedule, true);
    document.addEventListener('change', schedule, true);

    var observer = new MutationObserver(function(){ schedule(); });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  function init(){
    renderFixedSummary();
    bindEvents();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
