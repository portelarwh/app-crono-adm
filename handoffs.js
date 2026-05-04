'use strict';

(function(){
  var STORAGE_KEY = 'cronoAdm_handoffs_v1';
  var DEFAULT_AREA = 'Não informado';

  function $(id){ return document.getElementById(id); }

  function getElementByRow(row){
    var id = Number(row.getAttribute('data-id'));
    if(!Array.isArray(window.elements)) return null;
    for(var i = 0; i < window.elements.length; i++){
      if(Number(window.elements[i].id) === id) return window.elements[i];
    }
    return null;
  }

  function getRecords(){
    var map = CronoUtils.loadJSON(STORAGE_KEY, {});
    return CronoUtils.getRows().map(function(row, index){
      var key = CronoUtils.getRowKey(row, index);
      row.setAttribute('data-handoff-row-key', key);
      var legacy = map[key] || {};
      var element = getElementByRow(row) || {};
      return {
        areaAtual: CronoUtils.clean(element.area || legacy.areaAtual, ''),
        responsavel: CronoUtils.clean(element.requester || legacy.responsavel, '')
      };
    });
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

  function calculateHandoffs(){
    var rows = CronoUtils.getRows();
    var records = getRecords();
    var filled = 0;
    var handoffsArea = 0;
    var handoffsResp = 0;

    records.forEach(function(record){
      if(record.areaAtual || record.responsavel) filled++;
    });

    var areaFlow = records.map(function(r){ return r.areaAtual; }).filter(Boolean);
    for(var a = 1; a < areaFlow.length; a++){
      if(areaFlow[a] !== areaFlow[a - 1]) handoffsArea++;
    }

    for(var i = 1; i < records.length; i++){
      var prev = records[i - 1].responsavel;
      var curr = records[i].responsavel;
      if(prev && curr && prev !== curr) handoffsResp++;
    }

    var uniqueAreas = Array.from(new Set(records.map(function(r){ return r.areaAtual; }).filter(Boolean)));
    var uniqueResp = Array.from(new Set(records.map(function(r){ return r.responsavel; }).filter(Boolean)));

    return {
      rows: rows.length,
      filled: filled,
      handoffsArea: handoffsArea,
      handoffsResp: handoffsResp,
      handoffsTotal: handoffsArea,
      uniqueAreas: uniqueAreas.length,
      uniqueResp: uniqueResp.length,
      firstArea: uniqueAreas[0] || DEFAULT_AREA,
      lastArea: uniqueAreas[uniqueAreas.length - 1] || DEFAULT_AREA
    };
  }

  function renderSummary(){
    injectSummaryCard();
    var grid = $('handoffsGrid');
    var note = $('handoffsNote');
    if(!grid || !note) return;

    var data = calculateHandoffs();
    var esc = CronoUtils.escapeHtml;

    grid.innerHTML = `
      <div class="handoffs-box">
        <span class="handoffs-title">Handoffs</span>
        <span class="handoffs-value">${esc(data.handoffsTotal)}</span>
        <span class="handoffs-sub">mudanças de área</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Áreas</span>
        <span class="handoffs-value">${esc(data.uniqueAreas)}</span>
        <span class="handoffs-sub">envolvidas</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Responsáveis</span>
        <span class="handoffs-value">${esc(data.uniqueResp)}</span>
        <span class="handoffs-sub">distintos</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Passagem área</span>
        <span class="handoffs-value">${esc(data.handoffsArea)}</span>
        <span class="handoffs-sub">entre etapas</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Mudança resp.</span>
        <span class="handoffs-value">${esc(data.handoffsResp)}</span>
        <span class="handoffs-sub">entre etapas</span>
      </div>
      <div class="handoffs-box">
        <span class="handoffs-title">Preenchidas</span>
        <span class="handoffs-value">${esc(data.filled)}/${esc(data.rows)}</span>
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
    var schedule = CronoUtils.debounce(renderSummary, 120);
    document.addEventListener('input', schedule, true);
    document.addEventListener('change', schedule, true);

    var observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList:true, subtree:true });
  }

  function init(){
    injectStyles();
    injectSummaryCard();
    renderSummary();
    bindEvents();
  }

  window.cronoAdmApplyHandoffs = renderSummary;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
