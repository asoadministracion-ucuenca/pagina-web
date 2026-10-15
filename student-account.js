(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded',()=>{
    const service=window.AdeStudent,root=document.getElementById('studentAccount');
    if(!service||!root)return;
    const form=root.querySelector('form'),message=root.querySelector('[data-student-message]'),status=root.querySelector('[data-student-status]');
    const cloudAvailable=Boolean(window.AdeFirebase?.available||window.AdeRuntime.backendAvailable);
    const labels={local:'Guardado en este dispositivo. Inicia sesión para sincronizar.',connecting:'Conectando con tu cuenta…',pending:'Cambios guardados en el dispositivo; pendientes de sincronizar.',saving:'Guardando en tu cuenta…',saved:'Tus datos están sincronizados.',offline:'Sin conexión con tu cuenta. Tus cambios siguen guardados en este dispositivo.',expired:'La sesión expiró. Vuelve a ingresar para sincronizar los cambios pendientes.',conflict:'Otro dispositivo cambió los mismos datos. Elige qué versión conservar.'};
    function render() {
      const state=service.getState();
      status.textContent=labels[state.status]||labels.local;
      root.querySelector('[data-student-identity]').textContent=state.user?state.user.email:'Tu cuenta de estudiante';
      form.hidden=Boolean(state.user)&&state.status!=='expired';
      root.querySelector('[data-student-signed]').hidden=!state.user;
      root.querySelector('[data-student-conflict]').hidden=!state.conflict;
      root.querySelector('[data-student-register]').disabled=!cloudAvailable;
      root.querySelector('[data-student-login]').disabled=!cloudAvailable;
      root.querySelector('[data-student-unavailable]').hidden=cloudAvailable;
      root.querySelector('[data-student-reset]').hidden=!window.AdeFirebase?.available;
    }
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const mode=event.submitter?.value||'login',password=form.elements.password.value;
      if(mode==='register'&&password!==form.elements.confirm.value){message.textContent='Repite la misma contraseña para crear tu cuenta.';return;}
      const buttons=[...form.querySelectorAll('button')];buttons.forEach(button=>button.disabled=true);message.textContent='Conectando…';
      try {
        await service.signIn(mode,form.elements.email.value.trim(),password);
        form.reset();message.textContent=mode==='register'?'Cuenta creada. Guarda tu perfil y avance para sincronizarlos.':'Sesión iniciada.';
      } catch(error){message.textContent=error.message;}
      finally {buttons.forEach(button=>button.disabled=false);render();}
    });
    root.querySelector('[data-student-reset]').addEventListener('click',async event=>{
      event.target.disabled=true;
      try{await window.AdeFirebase.resetPassword(form.elements.email.value.trim());message.textContent='Si el correo tiene una cuenta, recibirás un enlace para cambiar la contraseña. Revisa también spam.';}
      catch(error){message.textContent=error.message;}
      finally{event.target.disabled=false;}
    });
    root.querySelector('[data-student-logout]').addEventListener('click',async event=>{
      event.target.disabled=true;
      try {await service.signOut();message.textContent='Sesión cerrada. Los datos de la cuenta quedan separados del perfil local.';}
      catch(error){message.textContent=error.message;}
      finally{event.target.disabled=false;render();}
    });
    root.querySelector('[data-student-sync]').addEventListener('click',async()=>{await service.refresh();await service.flush();});
    root.querySelectorAll('[data-student-resolve]').forEach(button=>button.addEventListener('click',()=>service.resolveConflict(button.dataset.studentResolve)));
    root.querySelector('[data-student-copy]').addEventListener('click',()=>{
      if(!confirm('¿Copiar a esta cuenta el perfil, malla y demás datos guardados en el modo local de este dispositivo? Esto reemplazará esos datos en tu cuenta.'))return;
      try {service.importValues(service.guestSnapshot());message.textContent='Datos locales copiados. Se sincronizarán con tu cuenta.';}catch(error){message.textContent=error.message;}
    });
    root.querySelector('[data-student-export]').addEventListener('click',()=>{
      const blob=new Blob([JSON.stringify({kind:'aso-ade-estudiante',version:1,exportedAt:new Date().toISOString(),values:service.snapshot()},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='mi-respaldo-aso-ade.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      message.textContent='Respaldo descargado. Contiene tus datos personales; guárdalo en un lugar privado.';
    });
    root.querySelector('[data-student-import]').addEventListener('change',async event=>{
      const file=event.target.files[0];if(!file)return;
      try {
        if(file.size>512000)throw new Error('El respaldo supera los 500 KB.');
        const backup=JSON.parse(await file.text());
        if(backup.kind!=='aso-ade-estudiante'||backup.version!==1)throw new Error('Este archivo no es un respaldo de estudiante del portal.');
        if(!confirm('¿Restaurar este respaldo? Se reemplazarán tus datos personales actuales.'))return;
        service.importValues(backup.values);message.textContent='Respaldo restaurado.';
      }catch(error){message.textContent=error.message;}
      finally{event.target.value='';}
    });
    window.addEventListener('ade-student-status',render);render();
  });
})();
