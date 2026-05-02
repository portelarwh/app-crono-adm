'use strict';

(function(){
  function hasHistoryRows(){
    return document.querySelectorAll('.history-row').length > 0;
  }

  function hasHandoffFields(){
    return document.querySelectorAll('.handoff-input').length > 0;
  }

  function reloadHandoffsModule(){
    var existing = document.getElementById('handoffsScript');
    if(existing){
      existing.remove();
    }

    var version = window.APP_VERSION || 'v5.1.1';
    var script = document.createElement('script');
    script.id = 'handoffsScript';
    script.src = 'handoffs.js?v=' + encodeURIComponent(version) + '&r=' + Date.now();
    script.defer = true;
    document.head.appendChild(script);
  }

  function ensureHandoffRender(){
    if(!hasHistoryRows()) return;
    if(hasHandoffFields()) return;
    reloadHandoffsModule();
  }

  function scheduleEnsure(){
    setTimeout(ensureHandoffRender, 200);
    setTimeout(ensureHandoffRender, 600);
    setTimeout(ensureHandoffRender, 1200);
  }

  function init(){
    scheduleEnsure();
    document.addEventListener('cronoAdm:timerTopApplied', scheduleEnsure);

    var observer = new MutationObserver(function(){
      clearTimeout(window.__cronoAdmHandoffRenderFixTimer);
      window.__cronoAdmHandoffRenderFixTimer = setTimeout(ensureHandoffRender, 250);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
