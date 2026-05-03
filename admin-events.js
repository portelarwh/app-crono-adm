'use strict';

(function(){
  var STORAGE_KEY = 'cronoAdm_adminEvents_v1';
  var PENDING_KEY = 'cronoAdm_pendingAdminEvent_v1';
  var DEFAULT_EVENT = 'execucao';

  var EVENTS = {
    execucao: { label: 'Execução', icon: '▶', color: '#28a745', kind: 'touch' },
    analise: { label: 'Análise', icon: '🔎', color: '#4dabf7', kind: 'touch' },
    aprovacao: { label: 'Aprovação', icon: '✓', color: '#ffc107', kind: 'wait' },
    busca_info: { label: 'Busca informação', icon: '🔍', color: '#20c997', kind: 'touch' },
    correcao: { label: 'Correção', icon: '🛠', color: '#e83e8c', kind: 'loss' },
    espera: { label: 'Espera', icon: '⏳', color: '#dc3545', kind: 'wait' },
    retrabalho: { label: 'Retrabalho', icon: '↻', color: '#fd7e14', kind: 'loss' },
    sistema: { label: 'Sistema', icon: '⚙', color: '#8e44ad', kind: 'touch' },
    comunicacao: { label: 'Comunicação', icon: '✉', color: '#17a2b8', kind: 'touch' }
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
      .admin-event-mini-summary {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px;
      }
      .admin-event-mini-box {
        background: rgba(255,255,255,.05); border: 1px solid var(--border);
        border-radius: 8px; padding: 6px; text-align: center;
      }
      .admin-event-mini-title { display:block; font-size:.58rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
      .admin-event-mini-value { display:block; font-size:.95rem; font-weight: 900; margin-top: 2px; }
      html[data-theme="light"] .admin-event-mini-box { background:#f0f4fa; }
      body.export-mode .admin-events-card { display: none !important; }
      body.export-mode .admin-event-badge { min-width: 76px !important; padding: 2px 3px !important; font-size: 6.8pt !important; }
      .admin-event-menu {
        position: fixed; z-index: 99999; min-width: 220px; max-width: 280px;
        background: rgba(10,14,24,.96); border: 1px solid var(--border); border-radius: 10px; padding: 8px;
        box-shadow: 0 14px 30px rgba(0,0,0,.35);
      }
      .admin-event-menu-btn {
        width: 100%; margin: 0 0 6px 0; border: 0; border-radius: 7px; padding: 7px 8px;
        color: #fff; font-weight: 800; font-size: .74rem; text-align: left; cursor: pointer;
      }
      .admin-event-menu-btn:last-child{ margin-bottom: 0; }
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

  function eventKeys(){
    return Object.keys(EVENTS);
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
    });

    if(changed) saveMap(map);
    bindBadgeInteractions();
    updateSummary(rows, map);
  }

  function bindBadgeInteractions(){
    Array.prototype.slice.call(document.querySelectorAll('.admin-event-slot .admin-event-badge')).forEach(function(badge){
      if(badge.dataset.bound === '1') return;
      badge.dataset.bound = '1';

      var holdTimer = null;
      var held = false;
      badge.addEventListener('pointerdown', function(){
        held = false;
        holdTimer = setTimeout(function(){
          held = true;
          var row = badge.closest('.history-row');
          if(!row) return;
          var index = Number(row.getAttribute('data-index') || '0');
          var key = getRowKey(row, index);
          var map = loadMap();
          var current = map[key] || DEFAULT_EVENT;
          openMenuForBadge(badge, current, function(selectedKey){
            map[key] = selectedKey;
            saveMap(map);
            applyEventsToRows();
          });
        }, 450);
      });
      badge.addEventListener('pointerup', function(){ clearTimeout(holdTimer); });
      badge.addEventListener('pointerleave', function(){ clearTimeout(holdTimer); });
      badge.addEventListener('click', function(){
        if(held) return;
        var row = badge.closest('.history-row');
        if(!row) return;
        var index = Number(row.getAttribute('data-index') || '0');
        var key = getRowKey(row, index);
        var map = loadMap();
        var options = eventKeys();
        var current = map[key] || DEFAULT_EVENT;
        var currIndex = options.indexOf(current);
        map[key] = options[(currIndex + 1) % options.length];
        saveMap(map);
        applyEventsToRows();
      });
    });
  }

  function openMenuForBadge(badge, currentKey, onSelect){
    closeOpenMenu();
    var menu = document.createElement('div');
    menu.className = 'admin-event-menu';
    eventKeys().forEach(function(key){
      var ev = EVENTS[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-event-menu-btn';
      btn.style.background = ev.color;
      btn.textContent = ev.icon + ' ' + ev.label + (key === currentKey ? ' ✓' : '');
      btn.addEventListener('click', function(){
        onSelect(key);
        closeOpenMenu();
      });
      menu.appendChild(btn);
    });
    var rect = badge.getBoundingClientRect();
    menu.style.left = Math.max(8, rect.left) + 'px';
    menu.style.top = Math.min(window.innerHeight - 12, rect.bottom + 8) + 'px';
    document.body.appendChild(menu);
    window.__cronoAdminMenu = menu;
    setTimeout(function(){
      document.addEventListener('click', closeOpenMenu, { once: true });
    }, 0);
  }

  function closeOpenMenu(){
    var active = window.__cronoAdminMenu;
    if(active && active.parentNode) active.parentNode.removeChild(active);
    window.__cronoAdminMenu = null;
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
