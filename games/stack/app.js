'use strict';
(()=>{
 const status=document.getElementById('app-status'),install=document.getElementById('install-app'),guide=document.getElementById('install-guide'),native=document.getElementById('native-install');
 let promptEvent=null,offlineReady=false,waitingWorker=null,reloading=false;
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
 function render(){
  document.body.classList.toggle('is-offline',!navigator.onLine);
  document.getElementById('offline-shopping').hidden=navigator.onLine;
  install.hidden=standalone();
  status.textContent=offlineReady?(navigator.onLine?'Ready for offline play':'Offline play · Shopping needs internet'):(navigator.onLine?'Preparing offline play…':'Offline setup is incomplete. Reconnect to finish.');
 }
 function openGuide(){if(typeof mode!=='undefined'&&mode==='playing')togglePause();native.hidden=!promptEvent;guide.showModal();}
 install.onclick=openGuide;
 document.getElementById('close-install').onclick=()=>guide.close();
 native.onclick=async()=>{if(!promptEvent)return;const pending=promptEvent;promptEvent=null;native.hidden=true;await pending.prompt();const result=await pending.userChoice;if(result.outcome==='accepted')guide.close();};
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;native.hidden=false;});
 window.addEventListener('appinstalled',()=>{promptEvent=null;guide.close();install.hidden=true;});
 window.addEventListener('online',render);window.addEventListener('offline',render);
 document.querySelectorAll('.shop-link').forEach(link=>link.addEventListener('click',event=>{if(!navigator.onLine){event.preventDefault();document.getElementById('offline-shopping').hidden=false;}}));
 function showUpdate(worker){waitingWorker=worker;document.getElementById('update-bar').hidden=false;}
 document.getElementById('apply-update').onclick=()=>{if(waitingWorker){reloading=true;waitingWorker.postMessage({type:'SKIP_WAITING'});}};
 render();
 if('serviceWorker' in navigator&&window.isSecureContext){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.reload();});
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
   if(reg.waiting)showUpdate(reg.waiting);
   reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(worker);if(worker.state==='redundant'&&!offlineReady)status.textContent='Offline setup could not finish. Reconnect and reload to retry.';});});
   navigator.serviceWorker.ready.then(()=>{offlineReady=true;render();});
  }).catch(()=>{status.textContent='Play online. Offline setup could not finish; reload to retry.';});
 }else{status.textContent='Play online · Home-screen installation needs HTTPS and a supported browser.';}
})();
