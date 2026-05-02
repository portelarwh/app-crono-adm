'use strict';

(function(){
  function $(id){ return document.getElementById(id); }

  function injectStyles(){
    if($('timerTopLayoutStyle')) return;
    var style = document.createElement('style');
    style.id = 'timerTopLayoutStyle';
    style.textContent = `
      .timer-top-card {
        border: 1px solid rgba(77,171,247,.22);
        margin-top: 0;
        margin-bottom: 10px;
      }

      .timer-top-card .live-timer {
        margin: 2px 0 8px 0;
        font-size: 2.45rem;
        line-height: 1.05;
      }

      .timer-top-card .btn-row {
        margin-bottom: 8px;
      }

      .timer-top-card .btn-start,
      .timer-top-card .btn-stop,
      .timer-top-card .btn-reset {
        padding-top: 10px;
        padding-bottom: 10px;
      }

      .timer-top-card .fixed-bottom {
        position: static !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 4px 0 0 0 !important;
        background: transparent !important;
        display: flex !important;
        gap: 6px !important;
        transform: none !important;
        -webkit-transform: none !important;
        z-index: auto !important;
      }

      .timer-top-card .btn-lap-pessoa,
      .timer-top-card .btn-lap-maquina,
      .timer-top-card .btn-lap-processo {
        padding: 11px 5px;
        border-radius: 9px;
      }

      .timer-top-card .lap-icon {
        font-size: 1.22rem;
      }

      .timer-top-card .lap-text {
        font-size: 0.66rem;
      }

      .timer-top-hint {
        display: block;
        margin: 0 0 6px 0;
        text-align: center;
        color: var(--text-muted);
        font-size: .66rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .04em;
      }

      body.timer-top-active {
        padding-bottom: 24px !important;
      }

      body.export-mode .timer-top-hint {
        display: none !important;
      }

      body.export-mode .timer-top-card {
        display: none !important;
      }

      @media(max-width:520px){
        .timer-top-card .live-timer {
          font-size: 2.25rem;
        }
        .timer-top-card .btn-start,
        .timer-top-card .btn-stop,
        .timer-top-card .btn-reset {
          padding-top: 9px;
          padding-bottom: 9px;
          font-size: .8rem;
        }
        .timer-top-card .btn-lap-pessoa,
        .timer-top-card .btn-lap-maquina,
        .timer-top-card .btn-lap-processo {
          padding: 10px 4px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function findTimerCard(){
    var liveTimer = document.querySelector('.live-timer');
    if(!liveTimer) return null;
    return liveTimer.closest('.card') || liveTimer.parentElement;
  }

  function findConfigCard(){
    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    var timerCard = findTimerCard();
    return cards.find(function(card){ return card !== timerCard; }) || null;
  }

  function ensureHint(timerCard){
    if(!timerCard || timerCard.querySelector('.timer-top-hint')) return;
    var hint = document.createElement('span');
    hint.className = 'timer-top-hint';
    hint.textContent = 'Cronômetro e captura de etapas';
    timerCard.insertBefore(hint, timerCard.firstChild);
  }

  function moveCaptureButtons(timerCard){
    if(!timerCard) return;
    var captureBar = document.querySelector('.fixed-bottom');
    if(!captureBar || timerCard.contains(captureBar)) return;
    timerCard.appendChild(captureBar);
  }

  function moveTimerToTop(){
    var timerCard = findTimerCard();
    var configCard = findConfigCard();
    if(!timerCard || !configCard || !configCard.parentNode) return false;

    timerCard.classList.add('timer-top-card');
    document.body.classList.add('timer-top-active');

    ensureHint(timerCard);
    moveCaptureButtons(timerCard);

    if(configCard.nextSibling !== timerCard){
      configCard.parentNode.insertBefore(timerCard, configCard.nextSibling);
    }

    return true;
  }

  function init(){
    injectStyles();
    var attempts = 0;
    var timer = setInterval(function(){
      attempts += 1;
      if(moveTimerToTop() || attempts >= 20){
        clearInterval(timer);
      }
    }, 120);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
