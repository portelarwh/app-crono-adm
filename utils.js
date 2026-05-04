'use strict';

(function(){
  var DEFAULT_DEBOUNCE_MS = 160;

  function loadJSON(key, fallback){
    try {
      var raw = localStorage.getItem(key);
      if(raw == null) return fallback == null ? {} : fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? (fallback == null ? {} : fallback) : parsed;
    } catch(e){
      return fallback == null ? {} : fallback;
    }
  }

  function saveJSON(key, value){
    try {
      localStorage.setItem(key, JSON.stringify(value == null ? {} : value));
      return true;
    } catch(e){
      return false;
    }
  }

  function parseTimeToSeconds(text){
    var raw = String(text == null ? '' : text).trim();
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

  function formatSeconds(totalSeconds){
    var total = Math.max(0, Math.round(Number(totalSeconds) || 0));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var pad = function(n){ return String(n).padStart(2, '0'); };
    if(h > 0) return pad(h) + ':' + pad(m) + ':' + pad(s);
    return pad(m) + ':' + pad(s);
  }

  function getRows(){
    return Array.from(document.querySelectorAll('.history-row'));
  }

  function getRowDuration(row){
    if(!row) return 0;
    var timeNode = row.querySelector('.history-time');
    if(timeNode) return parseTimeToSeconds(timeNode.textContent || timeNode.innerText);
    return parseTimeToSeconds(row.textContent || row.innerText || '');
  }

  function getRowKey(row, index){
    if(!row) return 'row-' + index;
    return row.getAttribute('data-admin-row-key')
        || row.getAttribute('data-handoff-row-key')
        || row.getAttribute('data-ideal-row-key')
        || String(index);
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

  function debounce(fn, ms){
    var wait = ms == null ? DEFAULT_DEBOUNCE_MS : ms;
    var timer = null;
    return function debounced(){
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function(){ fn.apply(ctx, args); }, wait);
    };
  }

  function clean(value, fallback){
    var text = String(value == null ? '' : value).trim();
    return text || (fallback == null ? '' : fallback);
  }

  window.CronoUtils = {
    loadJSON: loadJSON,
    saveJSON: saveJSON,
    parseTimeToSeconds: parseTimeToSeconds,
    formatSeconds: formatSeconds,
    getRows: getRows,
    getRowDuration: getRowDuration,
    getRowKey: getRowKey,
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr,
    debounce: debounce,
    clean: clean
  };
})();
