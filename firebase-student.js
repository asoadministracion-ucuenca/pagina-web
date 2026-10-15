(function () {
  'use strict';
  const config=window.ADE_FIREBASE_CONFIG||{};
  const available=/^[A-Za-z0-9_-]{20,100}$/.test(config.apiKey||'')&&/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(config.projectId||'');
  const auth='https://identitytoolkit.googleapis.com/v1/accounts:';
  const errors={EMAIL_EXISTS:'Este correo ya tiene una cuenta. Inicia sesión.',INVALID_LOGIN_CREDENTIALS:'Correo o contraseña incorrectos.',INVALID_PASSWORD:'Correo o contraseña incorrectos.',EMAIL_NOT_FOUND:'Correo o contraseña incorrectos.',OPERATION_NOT_ALLOWED:'Activa Correo/contraseña en Firebase Authentication.',TOO_MANY_ATTEMPTS_TRY_LATER:'Demasiados intentos. Espera unos minutos.',USER_DISABLED:'La cuenta está deshabilitada.',RESOURCE_EXHAUSTED:'Se alcanzó la cuota gratuita. Tus cambios quedan guardados en este dispositivo.',PERMISSION_DENIED:'Revisa las reglas privadas de Firestore y la sesión de tu cuenta.'};
  async function http(url,options={}) {
    const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000),...options});
    const result=await response.json().catch(()=>({}));
    if(!response.ok){const code=result.error?.status||String(result.error?.message||'').split(' : ')[0];throw Object.assign(new Error(errors[code]||'No se pudo conectar con tu cuenta. Comprueba la conexión y la configuración de Firebase.'),{status:response.status,code});}
    return result;
  }
  const post=(url,data)=>http(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  let refreshing=null;
  async function token(selected) {
    if(!selected||selected.provider!=='firebase')throw Object.assign(new Error('Inicia sesión para sincronizar.'),{status:401});
    if(selected.tokenExpires>Date.now()+60000)return selected.token;
    // One refresh per session; logout never restores an old session.
    if(!refreshing||refreshing.selected!==selected){
      const promise=http('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(config.apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:selected.refreshToken}).toString()}).then(result=>{
        if(result.user_id!==selected.user.id)throw Object.assign(new Error('La sesión no coincide con tu cuenta.'),{status:401});
        selected.token=result.id_token;selected.refreshToken=result.refresh_token;selected.tokenExpires=Date.now()+Number(result.expires_in)*1000;
        return selected.token;
      }).catch(error=>{if(error.status===400)error.status=401;throw error;}).finally(()=>{if(refreshing?.selected===selected)refreshing=null;});
      refreshing={selected,promise};
    }
    return refreshing.promise;
  }
  function documentUrl(selected) {
    if(!/^[A-Za-z0-9_-]{1,128}$/.test(selected.user.id)||selected.user.id==='guest')throw new Error('Cuenta inválida.');
    return 'https://firestore.googleapis.com/v1/projects/'+config.projectId+'/databases/(default)/documents/students/'+encodeURIComponent(selected.user.id);
  }
  async function read(selected) {
    const bearer=await token(selected);
    try {
      const doc=await http(documentUrl(selected),{headers:{Authorization:'Bearer '+bearer}});
      const values=JSON.parse(doc.fields?.values?.stringValue||'{}'),revision=Number(doc.fields?.revision?.integerValue||0);
      if(!values||typeof values!=='object'||Array.isArray(values)||!Number.isSafeInteger(revision))throw new Error('Los datos de tu cuenta no tienen un formato válido.');
      return {ok:true,values,revision,updateTime:doc.updateTime};
    }catch(error){if(error.status===404&&error.code==='NOT_FOUND')return {ok:true,values:{},revision:0};throw error;}
  }
  function conflict(remote){return Object.assign(new Error('Otro dispositivo guardó cambios. Revisa la sincronización.'),{status:409,payload:remote});}
  async function request(path,data,selected) {
    if(!available)throw new Error('Falta conectar el proyecto gratuito de Firebase.');
    if(path==='login'||path==='register'){
      if(typeof data.email!=='string'||typeof data.password!=='string'||data.password.length<12)throw new Error('Usa un correo válido y una contraseña de al menos 12 caracteres.');
      const result=await post(auth+(path==='register'?'signUp':'signInWithPassword')+'?key='+encodeURIComponent(config.apiKey),{email:data.email.trim(),password:data.password,returnSecureToken:true});
      return {ok:true,provider:'firebase',user:{id:result.localId,email:result.email},token:result.idToken,refreshToken:result.refreshToken,tokenExpires:Date.now()+Number(result.expiresIn)*1000,expires:Date.now()+7*86400000};
    }
    if(path==='logout')return {ok:true};
    if(path==='identity')return (await post(auth+'lookup?key='+encodeURIComponent(config.apiKey),{idToken:await token(selected)})).users?.[0];
    if(path==='verifyEmail')return post(auth+'sendOobCode?key='+encodeURIComponent(config.apiKey),{requestType:'VERIFY_EMAIL',idToken:await token(selected)});
    if(path!=='state')throw new Error('Acción de cuenta inválida.');
    const remote=await read(selected);
    if(data===undefined)return remote;
    if(data.revision!==remote.revision)throw conflict(remote);
    const values={...remote.values};
    for(const [key,value]of Object.entries(data.changes)){
      if(!window.AdeStudent.keys.includes(key)||(value!==null&&typeof value!=='string'))throw new Error('Datos de estudiante inválidos.');
      if(value===null)delete values[key];else values[key]=value;
    }
    const encoded=JSON.stringify(values);
    if(new TextEncoder().encode(encoded).length>512000)throw new Error('Tus datos superan los 500 KB. Descarga un respaldo y reduce los datos guardados.');
    const condition=remote.updateTime?'currentDocument.updateTime='+encodeURIComponent(remote.updateTime):'currentDocument.exists=false';
    try {
      await http(documentUrl(selected)+'?'+condition,{method:'PATCH',headers:{Authorization:'Bearer '+await token(selected),'Content-Type':'application/json'},body:JSON.stringify({fields:{revision:{integerValue:String(remote.revision+1)},values:{stringValue:encoded}}})});
    }catch(error){if(error.status===409||error.status===412||error.code==='FAILED_PRECONDITION'||error.code==='ALREADY_EXISTS')throw conflict(await read(selected));throw error;}
    return {ok:true,revision:remote.revision+1};
  }
  async function resetPassword(email){
    if(!available)throw new Error('Falta conectar Firebase.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Escribe primero tu correo.');
    try{await post(auth+'sendOobCode?key='+encodeURIComponent(config.apiKey),{requestType:'PASSWORD_RESET',email});}
    catch(error){if(error.code!=='EMAIL_NOT_FOUND')throw error;}
  }
  window.AdeFirebase=Object.freeze({available,request,resetPassword,authorize:token});
})();
