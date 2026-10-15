(function () {
  'use strict';
  const keys = Object.freeze([
    'portal-ade-v2-local-preferences','portal_administracion_student_profile',
    'portal_administracion_favorites','favorites','studentSchedule','ade-curriculum-state-v2',
    'portal_administracion_pomodoro_sessions','apaList','taskTracker',
    'portal_administracion_ai_sources','portal_administracion_study_activity',
    'portal_administracion_selected_semester','ade-recent-tools','portal_administracion_quiz_history'
  ]);
  const scopedKeys = new Set([...keys, 'ade-pomodoro-state']);
  const native = window.localStorage;
  const scope = new URL('.', document.baseURI).pathname;
  const prefix = 'ade-student-v1:' + encodeURIComponent(scope) + ':';
  const sessionKey = prefix + 'session';
  const parse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  let session = parse(window.sessionStorage.getItem(sessionKey), null);
  const firebase=Boolean(window.AdeFirebase?.available);
  const validSession=firebase
    ? session?.provider==='firebase' && /^[A-Za-z0-9_-]{1,128}$/.test(session?.user?.id||'') && session.user.id!=='guest' && typeof session.refreshToken==='string' && session.refreshToken.length>20 && typeof session.token==='string'
    : !session?.provider && /^[a-f0-9]{32}$/.test(session?.user?.id||'') && /^[a-f0-9]{64}$/.test(session?.token||'');
  if (!validSession || !Number.isFinite(session?.expires) || session.expires <= Date.now()) session = null;
  let owner = session?.user.id || 'guest';
  const ns = (id = owner) => prefix + id + ':';
  let pending = parse(native.getItem(ns() + '_pending'), {});
  let base = parse(native.getItem(ns() + '_base'), {revision:0,values:{}});
  let status = session ? 'connecting' : 'local', conflict = null, flight = null, timer;
  const emit = name => window.dispatchEvent(new CustomEvent(name));
  const report = next => { status = next; emit('ade-student-status'); };
  const persistPending = () => native.setItem(ns() + '_pending', JSON.stringify(pending));
  const snapshot = (id = owner) => Object.fromEntries(keys.map(key=>[key,native.getItem(ns(id)+key)]).filter(([,value])=>value!==null));
  // Preserve existing personal data once, without assigning it to a signed-in account.
  if (!native.getItem(prefix + 'migrated')) {
    for (const key of scopedKeys) {
      const old = native.getItem(key);
      if (old !== null && native.getItem(ns('guest')+key) === null) native.setItem(ns('guest')+key, old);
    }
    native.setItem(prefix + 'migrated', '1');
  }
  async function api(path, data, selected = session) {
    if(firebase){
      try{return await window.AdeFirebase.request(path,data,selected);}
      finally{if(selected&&selected===session)window.sessionStorage.setItem(sessionKey,JSON.stringify(selected));}
    }
    const endpoint = window.AdeRuntime.apiUrl('/api/student/' + path);
    const response = await fetch(endpoint, {
      method:data===undefined?'GET':'POST', credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(15000),
      headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(selected?{Authorization:'Bearer '+selected.token}:{})},
      body:data===undefined?undefined:JSON.stringify(data)
    });
    let result; try { result = await response.json(); } catch { throw new Error('No se pudo conectar con tu cuenta. Tus datos siguen guardados en este dispositivo.'); }
    if (!response.ok || !result.ok) throw Object.assign(new Error(result.error || 'No se pudo sincronizar.'),{status:response.status,payload:result});
    return result;
  }
  function setBase(remote) {
    base = {revision:remote.revision,values:remote.values};
    native.setItem(ns()+'_base', JSON.stringify(base));
  }
  function applyRemote(remote) {
    for (const key of keys) {
      if (Object.hasOwn(pending,key)) continue;
      const value = remote.values[key];
      if (value == null) native.removeItem(ns()+key); else native.setItem(ns()+key,value);
    }
    setBase(remote);
    emit('ade-student-data');
  }
  function hasConflict(remote) {
    return Object.keys(pending).some(key=>(remote.values[key]??null)!==(base.values[key]??null) && (remote.values[key]??null)!==pending[key]);
  }
  function schedule() {
    clearTimeout(timer);
    if (session && !conflict) timer = setTimeout(()=>void flush(), firebase?2500:900);
  }
  const storage = Object.freeze({
    getItem(key) { return native.getItem(scopedKeys.has(key)?ns()+key:key); },
    setItem(key,value) {
      value = String(value);
      const target = scopedKeys.has(key)?ns()+key:key;
      if (native.getItem(target) === value) return;
      native.setItem(target,value);
      if (session && keys.includes(key)) { pending[key]=value; persistPending(); report(conflict?'conflict':'pending'); schedule(); }
    },
    removeItem(key) {
      native.removeItem(scopedKeys.has(key)?ns()+key:key);
      if (session && keys.includes(key)) { pending[key]=null; persistPending(); report(conflict?'conflict':'pending'); schedule(); }
    }
  });
  async function flush() {
    if (!session || conflict) return false;
    if (flight) return flight;
    const selected = session, selectedOwner = owner;
    flight = (async()=>{
      if (!Object.keys(pending).length) { report('saved'); return true; }
      report('saving');
      const changes = {...pending};
      try {
        const result = await api('state',{revision:base.revision,changes},selected);
        if (session!==selected || owner!==selectedOwner) return false;
        const values = {...base.values};
        for (const [key,value] of Object.entries(changes)) {
          if (value===null) delete values[key]; else values[key]=value;
          if (pending[key]===value) delete pending[key];
        }
        setBase({revision:result.revision,values}); persistPending();
        report(Object.keys(pending).length?'pending':'saved');
        if (Object.keys(pending).length) schedule();
        return true;
      } catch (err) {
        if (session!==selected) return false;
        if (err.status===409) {
          const remote=err.payload;
          if (hasConflict(remote)) { conflict=remote; report('conflict'); }
          else { applyRemote(remote); report('pending'); schedule(); }
        } else report(err.status===401?'expired':'offline');
        return false;
      }
    })().finally(()=>{flight=null;});
    return flight;
  }
  async function refresh() {
    if (!session || flight || conflict) return;
    const selected=session;
    try {
      const remote = await api('state',undefined,selected);
      if (session!==selected) return;
      if (Object.keys(pending).length && hasConflict(remote)) { conflict=remote; report('conflict'); return; }
      if (remote.revision!==base.revision || status==='connecting') applyRemote(remote);
      if (Object.keys(pending).length) await flush(); else report('saved');
    } catch (err) { if(session===selected) report(err.status===401?'expired':'offline'); }
  }
  async function signIn(mode,email,password) {
    if (!['login','register'].includes(mode)) throw new Error('Acción de cuenta inválida.');
    if (flight) await flight;
    const selected = await api(mode,{email,password},null);
    clearTimeout(timer);
    session=selected; owner=selected.user.id;
    window.sessionStorage.setItem(sessionKey,JSON.stringify(selected));
    pending=parse(native.getItem(ns()+'_pending'),{});
    base=parse(native.getItem(ns()+'_base'),{revision:0,values:{}});
    conflict=null;
    report('connecting'); emit('ade-student-data');
    await refresh();
  }
  async function signOut() {
    const selected=session;
    if (!Object.keys(pending).length && !flight && selected) {
      for (const key of scopedKeys) native.removeItem(ns()+key);
      native.removeItem(ns()+'_base'); native.removeItem(ns()+'_pending');
    }
    clearTimeout(timer); session=null; owner='guest'; pending={}; base={revision:0,values:{}}; conflict=null;
    window.sessionStorage.removeItem(sessionKey); report('local'); emit('ade-student-data');
    if (selected) void api('logout',{},selected).catch(()=>{});
  }
  function resolveConflict(choice) {
    if (!conflict) return;
    const remote=conflict; conflict=null;
    if (choice==='cloud') { pending={}; persistPending(); applyRemote(remote); report('saved'); }
    else if (choice==='local') { applyRemote(remote); report('pending'); schedule(); }
    else throw new Error('Elige una versión.');
  }
  function importValues(values) {
    if (!values || typeof values!=='object' || Array.isArray(values) || Object.keys(values).some(key=>!keys.includes(key))) throw new Error('El archivo no contiene un respaldo de estudiante válido.');
    if (JSON.stringify(values).length>512000) throw new Error('El respaldo es demasiado grande.');
    const arrayKeys=['portal_administracion_favorites','favorites','studentSchedule','apaList','taskTracker','portal_administracion_ai_sources','ade-recent-tools','portal_administracion_quiz_history'];
    for (const [key,value] of Object.entries(values)) {
      if(typeof value!=='string'||value.length>200000)throw new Error('El respaldo está dañado.');
      if(key==='portal_administracion_selected_semester')continue;
      let parsed;try{parsed=JSON.parse(value);}catch{throw new Error('El respaldo está dañado.');}
      function visit(node,depth=0){
        if(depth>12)throw new Error('El respaldo está demasiado anidado.');
        if(node&&typeof node==='object')for(const[name,child]of Object.entries(node)){
          if(['__proto__','constructor','prototype'].includes(name))throw new Error('El respaldo contiene campos no permitidos.');
          visit(child,depth+1);
        }
      }
      visit(parsed);
      if(arrayKeys.includes(key)){if(!Array.isArray(parsed))throw new Error('El respaldo contiene una lista inválida.');}
      else if(key==='portal_administracion_pomodoro_sessions'){if(!Number.isSafeInteger(parsed)||parsed<0)throw new Error('El contador de sesiones no es válido.');}
      else if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('El respaldo contiene datos inválidos.');
      if(key==='portal-ade-v2-local-preferences'&&Object.keys(parsed).some(name=>!['gradebook','curriculumStatus','studentSchedules'].includes(name)))throw new Error('Solo se pueden restaurar datos personales.');
      if(key==='ade-curriculum-state-v2'&&Object.values(parsed).some(value=>!['pendiente','en-curso','aprobada'].includes(value)))throw new Error('El respaldo contiene estados de malla inválidos.');
    }
    for (const key of keys) { if(Object.hasOwn(values,key)) storage.setItem(key,values[key]); else storage.removeItem(key); }
    emit('ade-student-data');
  }
  window.AdeStudent = Object.freeze({
    keys,storage,flush,refresh,signIn,signOut,resolveConflict,importValues,
    snapshot:()=>snapshot(), guestSnapshot:()=>snapshot('guest'),
    getState:()=>({user:session?.user||null,status,conflict:Boolean(conflict),pending:Object.keys(pending).length})
  });
  window.addEventListener('online',()=>void refresh());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) void refresh();});
  window.addEventListener('storage',event=>{ if(event.key?.startsWith(ns()) && !event.key.slice(ns().length).startsWith('_')) emit('ade-student-data'); });
  setInterval(()=>{
    if (!document.hidden && !document.activeElement?.matches('input,textarea,select')) void refresh();
  },firebase?300000:30000);
  document.addEventListener('DOMContentLoaded',()=>{if(session) void refresh();});
})();
