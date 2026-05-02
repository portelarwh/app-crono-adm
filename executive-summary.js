'use strict';

(function(){
  function $(id){ return document.getElementById(id); }

  function pct(value){
    return (Number(value) || 0).toFixed(1) + '%';
  }

  function safeText(value, fallback){
    var text = String(value == null ? '' : value).trim();
    return text || fallback || 'não identificado';
  }

  function getFlow(){
    return window.cronoAdmFlowEfficiency || {
      rows: 0,
      lead: 0,
      touch: 0,
      waiting: 0,
      loss: 0,
      efficiency: 0,
      waitingPct: 0,
      lossPct: 0,
      topEventLabel: 'não identificado'
    };
  }

  function getHandoffs(){
    return window.cronoAdmHandoffs || {
      rows: 0,
      handoffsTotal: 0,
      handoffsArea: 0,
      handoffsResp: 0,
      uniqueAreas: 0,
      uniqueResp: 0,
      filled: 0
    };
  }

  function getPareto(){
    return window.cronoAdmPareto || {
      rows: 0,
      hasCritical: false,
      criticalItems: [],
      top: null
    };
  }

  function getTopCritical(pareto){
    if(pareto && pareto.criticalItems && pareto.criticalItems.length){
      return pareto.criticalItems[0];
    }
    return null;
  }

  function buildSummary(){
    var flow = getFlow();
    var handoffs = getHandoffs();
    var pareto = getPareto();
    var topCritical = getTopCritical(pareto);

    var rows = Math.max(flow.rows || 0, handoffs.rows || 0, pareto.rows || 0);

    if(rows === 0){
      return {
        status: 'Sem dados suficientes',
        conclusion: 'Conclusão: ainda não há etapas registradas para avaliar o fluxo administrativo.',
        action: 'Ação recomendada: registrar as etapas do processo, classificar os eventos administrativos e preencher área/responsável para permitir uma leitura executiva confiável.',
        risk: 'Neutro'
      };
    }

    var lowEfficiency = flow.efficiency > 0 && flow.efficiency < 30;
    var highWaiting = flow.waitingPct >= 40;
    var highLoss = flow.lossPct >= 15;
    var highHandoffs = handoffs.handoffsTotal >= Math.max(3, Math.ceil(rows * 0.6));
    var criticalName = topCritical ? safeText(topCritical.label, 'evento crítico') : 'nenhum evento crítico predominante';

    var status = 'Fluxo controlado';
    var risk = 'Baixo';
    var conclusion = '';
    var action = '';

    if(lowEfficiency && (highWaiting || highLoss || highHandoffs)){
      status = 'Baixa eficiência de fluxo';
      risk = 'Alto';
      conclusion = 'Conclusão: o processo apresenta baixa eficiência de fluxo, com concentração relevante de tempo em espera, retrabalho ou excesso de passagens entre áreas. O principal ponto de atenção identificado é ' + criticalName + ', indicando oportunidade de reduzir Lead Time sem necessariamente aumentar esforço operacional.';
      action = 'Ação recomendada: definir SLA por etapa, reduzir aprovações intermediárias, padronizar a entrada de informações e revisar os handoffs para eliminar transferências que não agregam valor.';
    }else if(highWaiting){
      status = 'Alta espera no fluxo';
      risk = 'Médio';
      conclusion = 'Conclusão: o fluxo possui participação elevada de Waiting Time (' + pct(flow.waitingPct) + '), sugerindo que o processo fica parado aguardando aprovação, informação ou decisão entre etapas.';
      action = 'Ação recomendada: mapear os pontos de espera, estabelecer responsáveis claros, criar prazos de resposta e simplificar aprovações recorrentes.';
    }else if(highLoss){
      status = 'Retrabalho relevante';
      risk = 'Médio';
      conclusion = 'Conclusão: o processo apresenta retrabalho relevante (' + pct(flow.lossPct) + '), indicando falhas de entrada, conferência ou comunicação que aumentam o Lead Time.';
      action = 'Ação recomendada: revisar critérios de entrada, criar checklist de qualidade da informação e padronizar as condições para avanço entre etapas.';
    }else if(highHandoffs){
      status = 'Excesso de handoffs';
      risk = 'Médio';
      conclusion = 'Conclusão: o fluxo apresenta quantidade elevada de handoffs, com ' + handoffs.handoffsTotal + ' passagens mapeadas entre áreas ou responsáveis. Isso pode aumentar filas, esperas e perda de contexto.';
      action = 'Ação recomendada: consolidar responsabilidades, reduzir transferências entre áreas e definir claramente quem decide, executa e aprova em cada etapa.';
    }else if(pareto.hasCritical){
      status = 'Evento crítico localizado';
      risk = 'Médio';
      conclusion = 'Conclusão: o fluxo não apresenta desequilíbrio sistêmico evidente, porém há evento crítico classificado como ' + criticalName + '. Esse ponto deve ser tratado para evitar aumento de Lead Time.';
      action = 'Ação recomendada: priorizar a causa do evento crítico, definir ação corretiva simples e acompanhar a recorrência nas próximas medições.';
    }else{
      status = 'Fluxo administrativo estável';
      risk = 'Baixo';
      conclusion = 'Conclusão: o fluxo apresenta comportamento controlado, sem eventos críticos predominantes. As variações atuais parecem associadas ao fluxo normal do processo.';
      action = 'Ação recomendada: manter o monitoramento, validar se todas as etapas são necessárias e buscar simplificações pontuais para reduzir Lead Time.';
    }

    return { status: status, conclusion: conclusion, action: action, risk: risk };
  }

  function injectStyles(){
    if($('executiveSummaryStyle')) return;
    var style = document.createElement('style');
    style.id = 'executiveSummaryStyle';
    style.textContent = `
      .executive-summary-card { border: 1px solid rgba(77,171,247,.30); }
      .executive-summary-status { display:inline-flex; align-items:center; justify-content:center; padding:5px 8px; border-radius:999px; font-size:.68rem; font-weight:900; text-transform:uppercase; background:rgba(77,171,247,.14); color:#4dabf7; border:1px solid rgba(77,171,247,.35); margin:8px auto 6px auto; }
      .executive-summary-block { background:rgba(255,255,255,.05); border:1px solid var(--border); border-radius:8px; padding:9px; margin-top:7px; font-size:.78rem; line-height:1.38; color:var(--text-main); }
      .executive-summary-action { border-left:3px solid var(--green); }
      .executive-summary-conclusion { border-left:3px solid var(--blue); }
      .executive-summary-risk { font-size:.68rem; color:var(--text-muted); text-align:center; margin-top:7px; font-weight:700; }
      html[data-theme="light"] .executive-summary-block { background:#f0f4fa; }
      body.export-mode .executive-summary-card { display:none !important; }
    `;
    document.head.appendChild(style);
  }

  function injectCard(){
    if($('executiveSummaryCard')) return;

    var anchor = $('adminParetoCard') || $('handoffsCard') || $('flowEfficiencyCard') || document.querySelector('.card');
    if(!anchor || !anchor.parentNode) return;

    var card = document.createElement('div');
    card.className = 'card executive-summary-card';
    card.id = 'executiveSummaryCard';
    card.innerHTML = `
      <div class="chart-title">Conclusão Executiva Automática</div>
      <div style="text-align:center"><span class="executive-summary-status" id="executiveSummaryStatus">Aguardando dados</span></div>
      <div class="executive-summary-block executive-summary-conclusion" id="executiveSummaryConclusion">Conclusão: registre etapas para gerar a análise.</div>
      <div class="executive-summary-block executive-summary-action" id="executiveSummaryAction">Ação recomendada: preencher o fluxo administrativo.</div>
      <div class="executive-summary-risk" id="executiveSummaryRisk">Risco: neutro</div>
    `;
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  }

  function renderSummary(){
    injectCard();
    var data = buildSummary();

    var status = $('executiveSummaryStatus');
    var conclusion = $('executiveSummaryConclusion');
    var action = $('executiveSummaryAction');
    var risk = $('executiveSummaryRisk');

    if(status) status.textContent = data.status;
    if(conclusion) conclusion.textContent = data.conclusion;
    if(action) action.textContent = data.action;
    if(risk) risk.textContent = 'Risco: ' + data.risk;

    window.cronoAdmExecutiveSummary = data;
    window.getExecutiveSummaryText = function(){
      return data.conclusion + '\n' + data.action;
    };
  }

  function observeChanges(){
    var timer = null;
    function schedule(){
      clearTimeout(timer);
      timer = setTimeout(renderSummary, 220);
    }

    var observer = new MutationObserver(function(){ schedule(); });
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });

    document.addEventListener('input', schedule, true);
    document.addEventListener('change', schedule, true);
    document.addEventListener('click', function(event){
      if(event.target && event.target.closest && event.target.closest('.admin-event-badge')) schedule();
    }, true);
  }

  function init(){
    injectStyles();
    injectCard();
    renderSummary();
    observeChanges();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
