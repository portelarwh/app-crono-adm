'use strict';

(function(){
  function $(id){ return document.getElementById(id); }

  function clean(text){ return String(text == null ? '' : text).replace(/\s+/g,' ').trim(); }

  function txt(id,fallback){
    var el=$(id);
    return clean((el&&(el.textContent||el.innerText||el.value))||fallback||'0');
  }

  function val(id,fallback){
    var el=$(id);
    return clean((el&&(el.value||el.textContent||el.innerText))||fallback||'Não informado');
  }

  function buildSummaryText(){
    var equip = val('equipName','Operação não informada');
    var analyst = val('analystName','Não informado');
    var goal = val('goalTime','Não definido');

    var isSetup = val('studyType','operacional')==='operacional_setup';

    var lines=[
      '📊 *Resumo Executivo da Cronoanálise*','',
      '🏭 Operação: '+equip,
      '👤 Analista: '+analyst,
      '📅 Data: '+new Date().toLocaleDateString('pt-BR'),
      '📌 Tipo: '+(isSetup?'Operacional/Setup':'Operacional'),'',
      '⏱️ *Indicadores principais*',
      '• Tempo total: '+txt('valTempoTotal','0'),
      '• Meta: '+goal,
      '• Etapas: '+txt('valSamples','0'),'',
      '👤 *Distribuição*',
      '• Operador: '+txt('valTempoPessoa')+' ('+txt('valPercPessoa')+')',
      '• Máquina: '+txt('valTempoMaquina')+' ('+txt('valPercMaquina')+')',
      '• Processo: '+txt('valTempoProcesso')+' ('+txt('valPercProcesso')+')','',
      '🟢 *Valor*',
      '• VA: '+txt('valTempoVA')+' ('+txt('valPercVA')+')',
      '• NVA: '+txt('valTempoNVA')+' ('+txt('valPercNVA')+')',
      '• BNVA: '+txt('valTempoBNVA')+' ('+txt('valPercBNVA')+')'
    ];

    if(isSetup){
      lines=lines.concat(['','🔧 *Setup*',
        '• Total: '+txt('valTempoSetup'),
        '• Interno: '+txt('valTempoSetupInterno'),
        '• Externo: '+txt('valTempoSetupExterno')
      ]);
    }

    lines=lines.concat(['','📌 *Conclusão*',
      (window.getExecutiveSummaryText?clean(window.getExecutiveSummaryText()):'Resumo não disponível'),
      '','➡️ *Ação recomendada*',
      'Reduzir NVA, otimizar setup e balancear processo.','',
      'Gerado pelo Operix Cronoanálise'
    ]);

    return lines.join('\n');
  }

  async function shareWhatsApp(){
    var text=buildSummaryText();
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  }

  function bind(){
    document.querySelectorAll('button').forEach(function(btn){
      if((btn.textContent||'').toLowerCase().includes('whatsapp')){
        btn.onclick=function(e){e.preventDefault();shareWhatsApp();};
      }
    });

    var tbtn=$('op-theme-btn');
    if(tbtn){
      tbtn.onclick=function(){
        var isLight=document.documentElement.getAttribute('data-theme')==='light';
        if(isLight){
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('operix_theme_v1','dark');
        }else{
          document.documentElement.setAttribute('data-theme','light');
          localStorage.setItem('operix_theme_v1','light');
        }
      };
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bind);
  }else{bind();}
})();
