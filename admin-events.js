'use strict';

(function(){
  var STORAGE_KEY = 'cronoAdm_adminEvents_v1';
  var PENDING_KEY = 'cronoAdm_pendingAdminEvent_v1';
  var DEFAULT_EVENT = 'execucao';

  var EVENTS = {
    execucao: { label: 'Execução', icon: '▶', color: '#28a745', kind: 'touch' },
    analise: { label: 'Análise', icon: '🔎', color: '#4dabf7', kind: 'touch' },
    aprovacao: { label: 'Aprovação', icon: '✓', color: '#ffc107', kind: 'wait' },
    espera: { label: 'Espera', icon: '⏳', color: '#dc3545', kind: 'wait' },
    retrabalho: { label: 'Retrabalho', icon: '↻', color: '#fd7e14', kind: 'loss' },
    sistema: { label: 'Sistema', icon: '⚙', color: '#8e44ad', kind: 'touch' },
    comunicacao: { label: 'Comunicação', icon: '✉', color: '#17a2b8', kind: 'touch' },
    decisao: { label: 'Decisão', icon: '◆', color: '#6f42c1', kind: 'touch' }
  };

  function $(id){ return document.getElementById(id); }

  function loadMap(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }

  function saveMap(map){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
  }

  function getPending(){
    return localStorage.getItem(PENDING_KEY) || DEFAULT_EVENT;
  }

  function setPending(value){
    localStorage.setItem(PENDING_KEY, value || DEFAULT_EVENT);
  }

  function injectStyles(){
    if($('adminEventsStyle')) return;
    var style = document.createElement('style');
    style.id = 'adminEventsStyle';
    style.textContent = `
      .admin-events-card { border: 1px solid rgba(77,171,247,.22); }
      .admin-events-helper { font-size: .72rem; color: var(--text-muted); line-height: 1.35; margin-top: 6px; text-align: center; }
      .admin-event-badge {
        display: inline-flex; align-items: center; justify-content: center; gap: 4px;
        min-width: 78px; padding: 4px 6px; border-radius: 4px;
        font-size: .68rem; font-weight: 800; color: #fff;
        border: 1px solid rgba(255,255,255,.22); box-sizing: border-box;
        text-transform: uppercase; white-space: nowrap;
      }
      .admin-event-badge.wait, .admin-event-badge.loss { color: #111; }
      .admin-event-select-inline {
        background: rgba(255,255,255,.06); color: var(--text-main);
        border: 1px solid var(--border); border-radius: 5px;
        font-size: .72rem; font-weight: 700; padding: 3px 5px;
        width: auto; min-width: 104px; text-align: center;
      }
      .admin-event-mini-summary {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px;
      }
      .admin-event-mini-box {
        background: rgba(255,255,255,.05); border: 1px solid var(--border);
        border-radius: 8px; padding: 6px; text-align: center;
      }
      .admin-event-mini-title { display:block; font-size:.58rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
      .admin-event-mini-value { display:block; font-size:.95rem; font-weight: 900; margin-top: 2px; }
      html[data-theme="light"] .admin-event-select-inline { background:#fff; color:#1a1f2e; }
      html[data-theme="light"] .admin-event-mini-box { background:#f0f4fa; }
      body.export-mode .admin-events-card { display: none !important; }
      body.export-mode .admin-event-select-inline { display:none !important; }
      body.export-mode .admin-event-badge { min-width: 76px !important; padding: 2px 3px !important; font-size: 6.8pt !important; }
    `;
    document.head.appendChild(style);
  }

  function optionHtml(selected){
    return Object.keys(EVENTS).map(function(key){
      var ev = EVENTS[key];
      return '<option value="'+key+'" '+(selected===key?'selected':'')+'>'+ev.label+'</option>';
    }).join('');
  }

  function injectControlCard(){
    if($('adminEventsCard')) return;

    var firstCard = document.querySelector('.card');
    if(!firstCard || !firstCard.parentNode) return;

    var card = document.createElement('div');
    card.className = 'card admin-events-card';
    card.id = 'adminEventsCard';
    card.innerHTML = `
      <div class="input-group">
        <label for="adminEventNext">Categoria administrativa da próxima etapa</label>
        <select id="adminEventNext">
          ${optionHtml(getPending())}
        </select>
        <div class="admin-events-helper">
          Use para classificar o fluxo administrativo: execução, análise, aprovação, espera, retrabalho, sistema, comunicação ou decisão.
        </div>
      </div>
      <div class="admin-event-mini-summary" id="adminEventSummary">
        <div class="admin-event-mini-box"><span class="admin-event-mini-title">Etapas</span><span class="admin-event-mini-value">0</span></div>
        <div class="admin-event-mini-box"><span class="admin-event-mini-title">Espera</span><span class="admin-event-mini-value">0</span></div>
        <div class="admin-event-mini-box"><span class="admin-event-mini-title">Retrab.</span><span class="admin-event-mini-value">0</span></div>
        <div class="admin-event-mini-box"><span class="admin-event-mini-title">Aprov.</span><span class="admin-event-mini-value">0</span></div>
      </div>
    `;

    firstCard.parentNode.insertBefore(card, firstCard.nextSibling);

    var select = $('adminEventNext');
    if(select){
      select.addEventListener('change', function(){ setPending(this.value); });
    }
  }

  function getRowKey(row, index){
    return row.getAttribute('data-admin-row-key') || String(index);
  }

  function badgeHtml(key){
    var ev = EVENTS[key] || EVENTS[DEFAULT_EVENT];
    var tone = ev.kind === 'wait' ? 'wait' : ev.kind === 'loss' ? 'loss' : 'touch';
    return '<span class="admin-event-badge '+tone+'" style="background:'+ev.color+'" title="Categoria administrativa">'
      + '<span>'+ev.icon+'</span><span>'+ev.label+'</span></span>';
  }

  function inlineSelectHtml(key, index){
    return '<select class="admin-event-select-inline" data-admin-index="'+index+'">'+optionHtml(key)+'</select>';
  }

  function applyEventsToRows(){
    var rows = Array.prototype.slice.call(document.querySelectorAll('.history-row'));
    var map = loadMap();
    var changed = false;

    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      row.setAttribute('data-admin-row-key', key);

      if(!map[key]){
        map[key] = index === rows.length - 1 ? getPending() : DEFAULT_EVENT;
        changed = true;
      }

      row.setAttribute('data-admin-event', map[key]);

      var old = row.querySelector('.admin-event-slot');
      if(!old){
        var slot = document.createElement('span');
        slot.className = 'admin-event-slot';

        var anchor = row.querySelector('.badge-va') || row.querySelector('.type-badge') || row.children[1];
        if(anchor && anchor.parentNode){
          anchor.parentNode.insertBefore(slot, anchor.nextSibling);
        }else{
          row.insertBefore(slot, row.firstChild);
        }
        old = slot;
      }

      old.innerHTML = '<span class="screen-only">'+badgeHtml(map[key])+'</span><span class="print-only">'+badgeHtml(map[key])+'</span>';

      var select = row.querySelector('.admin-event-select-inline');
      if(!select){
        var inline = document.createElement('span');
        inline.className = 'screen-only admin-event-inline-editor';
        inline.innerHTML = inlineSelectHtml(map[key], index);
        old.parentNode.insertBefore(inline, old.nextSibling);
      }
    });

    if(changed) saveMap(map);
    bindInlineSelectors();
    updateSummary(rows, map);
  }

  function bindInlineSelectors(){
    Array.prototype.slice.call(document.querySelectorAll('.admin-event-select-inline')).forEach(function(select){
      if(select.dataset.bound === '1') return;
      select.dataset.bound = '1';
      select.addEventListener('change', function(){
        var index = Number(this.getAttribute('data-admin-index'));
        var row = document.querySelectorAll('.history-row')[index];
        var key = row ? getRowKey(row, index) : String(index);
        var map = loadMap();
        map[key] = this.value;
        saveMap(map);
        applyEventsToRows();
      });
    });
  }

  function updateSummary(rows, map){
    var box = $('adminEventSummary');
    if(!box) return;

    var counts = { total: rows.length, espera: 0, retrabalho: 0, aprovacao: 0 };
    rows.forEach(function(row, index){
      var key = getRowKey(row, index);
      var value = map[key] || DEFAULT_EVENT;
      if(value === 'espera') counts.espera++;
      if(value === 'retrabalho') counts.retrabalho++;
      if(value === 'aprovacao') counts.aprovacao++;
    });

    box.innerHTML = `
      <div class="admin-event-mini-box"><span class="admin-event-mini-title">Etapas</span><span class="admin-event-mini-value">${counts.total}</span></div>
      <div class="admin-event-mini-box"><span class="admin-event-mini-title">Espera</span><span class="admin-event-mini-value">${counts.espera}</span></div>
      <div class="admin-event-mini-box"><span class="admin-event-mini-title">Retrab.</span><span class="admin-event-mini-value">${counts.retrabalho}</span></div>
      <div class="admin-event-mini-box"><span class="admin-event-mini-title">Aprov.</span><span class="admin-event-mini-value">${counts.aprovacao}</span></div>
    `;
  }

  function observeHistory(){
    var target = document.body;
    var timer = null;
    var observer = new MutationObserver(function(){
      clearTimeout(timer);
      timer = setTimeout(applyEventsToRows, 120);
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function bindCaptureButtons(){
    document.addEventListener('click', function(event){
      var btn = event.target && event.target.closest ? event.target.closest('.btn-lap-pessoa, .btn-lap-maquina, .btn-lap-processo, .btn-add-manual') : null;
      if(!btn) return;
      var select = $('adminEventNext');
      setPending(select ? select.value : getPending());
      setTimeout(applyEventsToRows, 250);
    }, true);
  }

  function init(){
    injectStyles();
    injectControlCard();
    bindCaptureButtons();
    observeHistory();
    applyEventsToRows();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
