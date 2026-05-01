'use strict';

(function(){
  var STORAGE_KEY = 'cronoAdm_adminEvents_v1';
  var EVENT_ORDER = ['execucao', 'analise', 'aprovacao', 'espera', 'retrabalho', 'sistema', 'comunicacao', 'decisao'];
  var DEFAULT_EVENT = 'execucao';

  function loadMap(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }

  function saveMap(map){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
  }

  function nextEventKey(current){
    var index = EVENT_ORDER.indexOf(current || DEFAULT_EVENT);
    if(index < 0) return DEFAULT_EVENT;
    return EVENT_ORDER[(index + 1) % EVENT_ORDER.length];
  }

  function getRowIndex(row){
    var rows = Array.prototype.slice.call(document.querySelectorAll('.history-row'));
    return rows.indexOf(row);
  }

  function getRowKey(row, index){
    return row.getAttribute('data-admin-row-key') || String(index);
  }

  function cycleAdminCategory(row){
    var index = getRowIndex(row);
    if(index < 0) return;

    var select = row.querySelector('.admin-event-select-inline');
    var current = select ? select.value : (row.getAttribute('data-admin-event') || DEFAULT_EVENT);
    var next = nextEventKey(current);

    if(select){
      select.value = next;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    var map = loadMap();
    map[getRowKey(row, index)] = next;
    saveMap(map);
    row.setAttribute('data-admin-event', next);
  }

  function bindClickToBadge(){
    document.addEventListener('click', function(event){
      var badge = event.target && event.target.closest ? event.target.closest('.admin-event-badge') : null;
      if(!badge || document.body.classList.contains('export-mode')) return;

      var row = badge.closest ? badge.closest('.history-row') : null;
      if(!row) return;

      event.preventDefault();
      event.stopPropagation();
      cycleAdminCategory(row);
    }, true);
  }

  function injectHint(){
    var style = document.createElement('style');
    style.id = 'adminEventsClickFixStyle';
    style.textContent = '.admin-event-badge{cursor:pointer;transition:transform .08s ease,filter .08s ease}.admin-event-badge:active{transform:scale(.96);filter:brightness(1.08)}body.export-mode .admin-event-badge{cursor:default!important}';
    document.head.appendChild(style);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ injectHint(); bindClickToBadge(); });
  }else{
    injectHint();
    bindClickToBadge();
  }
})();
