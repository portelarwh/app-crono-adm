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

  function getRecords(){
    var map = loadMap();
    return getRows().map(function(row, index){
      var key = getRowKey(row, index);
      var record = map[key] || {};
      return {
        areaAtual: clean(record.areaAtual),
        responsavel: clean(record.responsavel),
        proximaArea: clean(record.proximaArea)
      };
    });
  }

  function calculateFixedHandoffs(){
    var rows = getRows();
    var records = getRecords();
    var filled = 0;
    var handoffsArea = 0;
    var handoffsResp = 0;
    var explicitNextArea = 0;
    var inferredAreaChange = 0;

    records.forEach(function(record){
      if(record.areaAtual || record.responsavel || record.proximaArea) filled++;
    });

    records.forEach(function(record, index){
      var currentArea = record.areaAtual;
      var nextArea = record.proximaArea;

      if(nextArea){
        if(!currentArea || nextArea !== currentArea){
          handoffsArea++;
          explicitNextArea++;
        }
        return;
      }

      if(index > 0){
        var previous = records[index - 1];
        var previousArea = previous.proximaArea || previous.areaAtual;
        var previousHadExplicitNext = !!previous.proximaArea;

        if(!previousHadExplicitNext && previousArea && currentArea && previousArea !== currentArea){
          handoffsArea++;
          inferredAreaChange++;
        }
      }
    });

    for(var i = 1; i < records.length; i++){
      var previousResp = records[i - 1].responsavel;
      var currentResp = records[i].responsavel;
      if(previousResp && currentResp && previousResp !== currentResp) handoffsResp++;
    }

    var uniqueAreas = Array.from(new Set(records
      .flatMap(function(r){ return [r.areaAtual, r.proximaArea]; })
      .filter(Boolean)
    ));

    var uniqueResp = Array.from(new Set(records
      .map(function(r){ return r.responsavel; })
      .filter(Boolean)
    ));

    var handoffsTotal = handoffsArea + handoffsResp;

    return {
      rows: rows.length,
      filled: filled,
      handoffsArea: handoffsArea,
      handoffsResp: handoffsResp,
      handoffsTotal: handoffsTotal,
      explicitNextArea: explicitNextArea,
      inferredAreaChange: inferredAreaChange,
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
        <span class="handoffs-sub">área + responsável</span>
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
        <span class="handoffs-sub">inclui próx. área</span>
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
      note.textContent = 'Informe área, responsável ou próxima área nas etapas para calcular handoffs administrativos.';
    }else if(data.handoffsArea === 0 && data.handoffsResp === 0){
      note.textContent = 'Leitura: nenhuma passagem identificada. Preencha Próxima área ou altere Área/Responsável entre etapas para mapear os handoffs.';
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

    document.addEventListener('input', function(event){
      if(event.target && event.target.classList && event.target.classList.contains('handoff-input')) schedule();
    }, true);

    document.addEventListener('change', function(event){
      if(event.target && event.target.classList && event.target.classList.contains('handoff-input')) schedule();
    }, true);

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
