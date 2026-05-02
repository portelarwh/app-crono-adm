'use strict';

const APP_VERSION = 'v5.0.0';

function setupSplash(){
  const splash = document.createElement('div');
  splash.innerHTML = `<div style="position:fixed;inset:0;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:9999;font-family:sans-serif">
    <img src="assets/Icon-512.png" style="width:120px;margin-bottom:16px">
    <div style="font-size:20px;font-weight:bold">CRONO ADM</div>
    <div style="font-size:14px;opacity:0.7">MAPEAMENTO DE FLUXO ADMINISTRATIVO</div>
    <div style="margin-top:10px;font-size:12px;opacity:0.5">${APP_VERSION}</div>
  </div>`;
  document.body.appendChild(splash);
  setTimeout(()=> splash.remove(),1500);
}

function registerSW(){
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('sw.js');
    });
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  setupSplash();
  registerSW();
});
