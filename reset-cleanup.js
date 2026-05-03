'use strict';

(function(){
  var AUX_KEYS = [
    'cronoAdm_handoffs_v1',
    'cronoAdm_adminEvents_v1',
    'cronoAdm_currentVsIdeal_v1'
  ];

  function clearAuxiliaryData(){
    AUX_KEYS.forEach(function(key){
      try { localStorage.removeItem(key); } catch(error) {}
    });

    window.cronoAdmHandoffs = null;
    window.cronoAdmPareto = null;
    window.cronoAdmCurrentVsIdeal = null;

    document.querySelectorAll('.handoff-slot, .admin-event-slot, .current-vs-ideal-slot').forEach(function(slot){
      slot.remove();
    });

    document.querySelectorAll('#handoffsCard, #adminParetoCard, #currentVsIdealCard').forEach(function(card){
      card.remove();
    });

    document.dispatchEvent(new CustomEvent('cronoAdm:auxiliaryDataCleared'));
  }

  function isResetIntent(button){
    var text = String(button.textContent || button.innerText || '').toLowerCase();
    var id = String(button.id || '').toLowerCase();
    var cls = String(button.className || '').toLowerCase();

    return text.includes('zerar') || text.includes('limpar') || id.includes('reset') || cls.includes('reset');
  }

  function bindResetCleanup(){
    document.addEventListener('click', function(event){
      var button = event.target && event.target.closest ? event.target.closest('button') : null;
      if(!button || !isResetIntent(button)) return;

      setTimeout(clearAuxiliaryData, 80);
      setTimeout(clearAuxiliaryData, 300);
    }, true);
  }

  function init(){
    bindResetCleanup();
    document.addEventListener('cronoAdm:fullReset', clearAuxiliaryData);
    window.cronoAdmClearAuxiliaryData = clearAuxiliaryData;
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
