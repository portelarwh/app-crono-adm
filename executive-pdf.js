'use strict';

(function(){
  function $(id){ return document.getElementById(id); }

  function injectStyles(){
    if($('executivePdfStyle')) return;

    var style = document.createElement('style');
    style.id = 'executivePdfStyle';
    style.textContent = `
      body.export-mode .flow-efficiency-card,
      body.export-mode .handoffs-card,
      body.export-mode .admin-pareto-card,
      body.export-mode .executive-summary-card {
        display: block !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      body.export-mode .admin-events-card {
        display: none !important;
      }

      body.export-mode .flow-efficiency-grid,
      body.export-mode .handoffs-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 6px !important;
      }

      body.export-mode .flow-efficiency-box,
      body.export-mode .handoffs-box,
      body.export-mode .executive-summary-block {
        background: #ffffff !important;
        color: #1a1f2e !important;
        border: 1px solid #c8d0e0 !important;
        box-shadow: none !important;
      }

      body.export-mode .flow-efficiency-title,
      body.export-mode .handoffs-title,
      body.export-mode .flow-efficiency-sub,
      body.export-mode .handoffs-sub,
      body.export-mode .flow-efficiency-note,
      body.export-mode .handoffs-note,
      body.export-mode .admin-pareto-note,
      body.export-mode .executive-summary-risk {
        color: #4a5568 !important;
      }

      body.export-mode .flow-efficiency-value,
      body.export-mode .handoffs-value,
      body.export-mode .admin-pareto-label,
      body.export-mode .admin-pareto-value,
      body.export-mode .executive-summary-block {
        color: #1a1f2e !important;
      }

      body.export-mode .executive-summary-status {
        color: #0b5ed7 !important;
        background: #e8f1ff !important;
        border-color: #9ec5fe !important;
      }

      body.export-mode .admin-pareto-row {
        display: grid !important;
        grid-template-columns: 96px 1fr 74px !important;
        gap: 6px !important;
        align-items: center !important;
      }

      body.export-mode .admin-pareto-bar-wrap {
        background: #eef2f7 !important;
        border: 1px solid #c8d0e0 !important;
      }

      body.export-mode .admin-pareto-list {
        gap: 5px !important;
      }

      body.export-mode .handoff-input,
      body.export-mode .admin-event-select-inline,
      body.export-mode .screen-only {
        display: none !important;
      }

      body.export-mode .print-only {
        display: inline-flex !important;
      }

      body.export-mode .executive-pdf-cover {
        display: block !important;
        background: #ffffff !important;
        color: #1a1f2e !important;
        border: 1px solid #c8d0e0 !important;
        border-radius: 10px !important;
        padding: 12px !important;
        margin-bottom: 10px !important;
        page-break-inside: avoid !important;
      }

      .executive-pdf-cover { display: none; }
      .executive-pdf-title { font-size: 1.05rem; font-weight: 900; text-align: center; margin-bottom: 4px; }
      .executive-pdf-subtitle { font-size: .78rem; color: #4a5568; text-align: center; margin-bottom: 8px; }
      .executive-pdf-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-size: .72rem; }
      .executive-pdf-meta div { border: 1px solid #c8d0e0; border-radius: 6px; padding: 6px; background: #f8fafc; }
      .executive-pdf-meta b { display:block; font-size:.58rem; text-transform:uppercase; color:#4a5568; margin-bottom:2px; }

      @media print {
        .flow-efficiency-card,
        .handoffs-card,
        .admin-pareto-card,
        .executive-summary-card {
          display: block !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function val(id, fallback){
    var el = $(id);
    var value = el ? (el.value || el.textContent || el.innerText) : '';
    value = String(value || '').trim();
    return value || fallback || 'Não informado';
  }

  function ensureCover(){
    if($('executivePdfCover')) return;

    var wrapper = $('print-wrapper') || document.body;
    var cover = document.createElement('div');
    cover.className = 'executive-pdf-cover';
    cover.id = 'executivePdfCover';
    cover.innerHTML = `
      <div class="executive-pdf-title">Relatório Executivo — Crono ADM</div>
      <div class="executive-pdf-subtitle">Mapeamento de Fluxo Administrativo · Lean Office</div>
      <div class="executive-pdf-meta">
        <div><b>Processo</b><span id="executivePdfProcess">-</span></div>
        <div><b>Analista</b><span id="executivePdfAnalyst">-</span></div>
        <div><b>Data</b><span id="executivePdfDate">-</span></div>
      </div>
    `;

    wrapper.insertBefore(cover, wrapper.firstChild);
  }

  function refreshCover(){
    ensureCover();
    var process = $('executivePdfProcess');
    var analyst = $('executivePdfAnalyst');
    var date = $('executivePdfDate');
    if(process) process.textContent = val('equipName','Processo não informado');
    if(analyst) analyst.textContent = val('analystName','Não informado');
    if(date) date.textContent = new Date().toLocaleDateString('pt-BR');
  }

  function bindExportButtons(){
    document.addEventListener('click', function(event){
      var btn = event.target && event.target.closest ? event.target.closest('button') : null;
      if(!btn) return;
      var text = (btn.textContent || '').toLowerCase();
      if(text.includes('pdf') || text.includes('png') || text.includes('export')){
        refreshCover();
      }
    }, true);
  }

  function init(){
    injectStyles();
    ensureCover();
    refreshCover();
    bindExportButtons();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
