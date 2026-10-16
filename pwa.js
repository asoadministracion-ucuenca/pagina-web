(function(){
  'use strict';let invitation=null;
  const installed=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function labels(){document.querySelectorAll('[data-install-app]').forEach(button=>{button.textContent=installed()?'App instalada':'Instalar app';button.disabled=installed();});}
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();invitation=event;labels();});
  window.addEventListener('appinstalled',()=>{invitation=null;labels();});
  document.addEventListener('DOMContentLoaded',labels);
  document.addEventListener('click',async event=>{
    if(!event.target.closest('[data-install-app]'))return;
    if(installed())return;
    if(invitation){const current=invitation;invitation=null;await current.prompt();await current.userChoice;labels();return;}
    const dialog=document.createElement('dialog');dialog.className='app-install-dialog';
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
    dialog.innerHTML='<form method="dialog"><h2>Instalar ASO ADE</h2><p></p><p>La app abre en su propia ventana. Tus herramientas guardadas funcionan sin conexión; para iniciar sesión y sincronizar necesitas internet.</p><button class="btn-primary" type="submit">Entendido</button></form>';
    dialog.querySelector('p').textContent=ios?'En Safari, pulsa Compartir y después «Añadir a la pantalla de inicio».':'Abre el menú del navegador y busca «Instalar aplicación» o «Añadir a la pantalla de inicio». Si el navegador ofrece instalar este portal, confirma la instalación.';
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
  });
})();
