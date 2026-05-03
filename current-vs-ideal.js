'use strict';

(function(){
  var STORAGE_KEY = 'cronoAdm_currentVsIdeal_v1';
  var DEFAULT_ACTION = 'manter';
  var longPressTimer = null;
  var longPressTriggered = false;

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
      .ideal-action-select { display:none !important; }
      .ideal-action-slot { display:inline-flex; align-items:center; justify-content:center; }
      .ideal-action-badge {
        display:inline-flex; align-items:center; justify-content:center; min-width:82px; padding:7px 10px;
        border-radius:7px; font-size:.68rem; font-weight:900; color:#fff; border:1px solid rgba(255,255,255,.22);
        text-transform:uppercase; white-space:nowrap; cursor:pointer; user-select:none; touch-action:manipulation;
        box-shadow:0 2px 8px rgba(0,0,0,.16);
      }
      .ideal-action-badge:active { transform:scale(.98); filter:brightness(1.08); }
      .ideal-action-menu {
        position:fixed; left:12px; right:12px; bottom:88px; z-index:99997;
        display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px;
        padding:10px; border-radius:14px; background:rgba(13,17,23,.96); border:1px solid rgba(255,255,255,.16);
        box-shadow:0 12px 30px rgba(0,0,0,.38); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      }
      .ideal-action-menu-title { grid-column:1/-1; color:#cbd5e1; font-size:.72rem; font-weight:900; text-align:center; text-transform:uppercase; letter-spacing:.04em; }
      .ideal-action-menu-btn {
        min-height:38px; border:1px solid rgba(255,255,255,.22); border-radius:9px; color:#fff; font-weight:900;
        text-transform:uppercase; font-size:.72rem; cursor:pointer;
      }
      html[data-theme="light"] .current-vs-ideal-box { background:#f0f4fa; }
      html[data-theme="light"] .ideal-action-menu { background:rgba(255,255,255,.98); border-color:rgba(26,31,46,.12); }
      html[data-theme="light"] .ideal-action-menu-title { color:#334155; }
      body.export-mode .current-vs-ideal-card { display:block !important; break-inside:avoid !important; page-break-inside:avoid !important; }
      body.export-mode .current-vs-ideal-grid { display:grid !important; grid-template-columns:repeat(4,1fr) !important; gap:6px !important; }
      body.export-mode .current-vs-ideal-box { background:#fff !important; color:#1a1f2e !important; border:1px solid #c8d0e0 !important; }
      body.export-mode .ideal-action-badge { font-size:6.6pt !important; min-width:50px !important; padding:2px 3px !important; box-shadow:none !important; }
      body.export-mode .ideal-action-menu { display:none !important; }
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
      <div class="current-vs-ideal-note" id="currentVsIdealNote">Toque no badge da ação para alternar. Toque e segure para abrir as opções.</div>
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

  function getNextActionKey(actionKey){
    var currentIndex = ACTION_ORDER.indexOf(actionKey);
    if(currentIndex < 0) currentIndex = 0;
    return ACTION_ORDER[(currentIndex + 1) % ACTION_ORDER.length];
  }

  function saveAction(index, actionKey){
    var row = getRows()[index];
    if(!row) return;
    var key = getRowKey(row, index);
    var map = loadMap();
    map[key] = actionKey || DEFAULT_ACTION;
    saveMap(map);
    applyEditors();
  }

  function badgeHtml(actionKey, index){
    var action = ACTIONS[actionKey] || ACTIONS[DEFAULT_ACTION];
    return '<button type="button" class="ideal-action-badge" data-ideal-index="'+index+'" data-action="'+actionKey+'" style="background:'+action.color+'" title="Toque para alternar. Segure para escolher.">'+action.label+'</button>';
  }

  function editorHtml(actionKey, index){
    return '<span class="screen-only ideal-action-slot" data-ideal-index="'+index+'">' + badgeHtml(actionKey, index) + '</span>';
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

  function closeMenu(){
    var menu = $('idealActionMenu');
    if(menu) menu.remove();
  }

  function openMenu(index){
    closeMenu();
    var menu = document.createElement('div');
    menu.id = 'idealActionMenu';
    menu.className = 'ideal-action-menu';
    menu.innerHTML = '<div class="ideal-action-menu-title">Selecionar ação proposta</div>' + ACTION_ORDER.map(function(key){
      var action = ACTIONS[key];
      return '<button type="button" class="ideal-action-menu-btn" data-action="'+key+'" style="background:'+action.color+'">'+action.label+'</button>';
    }).join('');
    document.body.appendChild(menu);
    Array.prototype.slice.call(menu.querySelectorAll('.ideal-action-menu-btn')).forEach(function(btn){
      btn.addEventListener('click', function(){
        saveAction(index, this.getAttribute('data-action') || DEFAULT_ACTION);
        closeMenu();
      });
    });
    setTimeout(function(){
      document.addEventListener('click', outsideMenuClose, { once:true });
    }, 0);
  }

  function outsideMenuClose(event){
    var menu = $('idealActionMenu');
    if(menu && !menu.contains(event.target)) closeMenu();
  }

  function bindEditors(){
    Array.prototype.slice.call(document.querySelectorAll('.ideal-action-badge')).forEach(function(badge){
      if(badge.dataset.bound === '1') return;
      badge.dataset.bound = '1';

      badge.addEventListener('pointerdown', function(){
        var index = Number(this.getAttribute('data-ideal-index'));
        longPressTriggered = false;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(function(){
          longPressTriggered = true;
          openMenu(index);
        }, 520);
      });

      badge.addEventListener('pointerup', function(){
        clearTimeout(longPressTimer);
      });

      badge.addEventListener('pointerleave', function(){
        clearTimeout(longPressTimer);
      });

      badge.addEventListener('click', function(event){
        var index = Number(this.getAttribute('data-ideal-index'));
        var current = this.getAttribute('data-action') || DEFAULT_ACTION;
        if(longPressTriggered){
          event.preventDefault();
          longPressTriggered = false;
          return;
        }
        saveAction(index, getNextActionKey(current));
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
      note.textContent = 'Nenhuma melhoria proposta ainda. Toque no badge de ação para classificar as etapas.';
    }else{
      note.textContent = 'Leitura: o cenário ideal estima redução de ' + data.gainPct.toFixed(1) + '% no Lead Time. Priorize ações com maior tempo acumulado e menor complexidade.';
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
