/* GitHub Pages administration. Firestore rules, never the UI, grant access. */
(function () {
  'use strict';
  const firebase=window.AdeFirebase, runtime=window.AdeRuntime;
  const available=Boolean(firebase?.available&&runtime?.staticMode&&!runtime.backendAvailable);
  const ownerEmail='asoadmiucuenca@gmail.com';
  const base='https://firestore.googleapis.com/v1/projects/'+window.ADE_FIREBASE_CONFIG?.projectId+'/databases/(default)/documents';
  const sessionKey='ade-cloud-admin:'+location.pathname.replace(/index\.html$/,'')+':session';
  const collections=['settings','resources','docentes','representantes','oportunidades','tutorias','introClasses','merch','physicalBooks','carreraCards','schedules'];
  const settings=('welcome mission vision heroTitle heroSubtitle heroEyebrow heroImage heroPrimaryLabel heroPrimarySection heroSecondaryLabel heroSecondarySection homeBlocks announcement sectionMeta kitVideo driveFolderUrl simplifiedDriveUrl driveRootFolderId driveRepositoryApiUrl enabledSections').split(' ');
  const fields=new Set(('id nombre cargo redes funciones ciclo email foto titulo materia whatsapp horario tipo institucion fecha link descripcion alertPriority tema nivel modalidad tutor syllabus domina videoUrl precio imagenes videos autor estado orden resumen detalle cycleId subjectId group day start end aula docente title typeId date url description uploader source driveFileId downloadUrl mimeType').split(' '));
  const statuses=['pendiente','en proceso','respondida','atendida','entregada','cancelada','archivada'];
  let session=null, publicCache=null;
  try { const stored=JSON.parse(sessionStorage.getItem(sessionKey)||'null'); if(stored?.provider==='firebase'&&stored.expires>Date.now()&&stored.user?.email===ownerEmail)session=stored; else sessionStorage.removeItem(sessionKey); } catch { sessionStorage.removeItem(sessionKey); }
  const fail=(message,status=400)=>Object.assign(new Error(message),{status});
  async function http(url,options={}) {
    const response=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(20000),...options});
    const result=await response.json().catch(()=>({}));
    if(!response.ok){
      const status=response.status, code=result.error?.status;
      const message=status===403?'Acceso restringido a la cuenta ASO con correo verificado.':status===401?'La sesión caducó. Vuelve a entrar.':status===409||status===412?'Otra sesión publicó cambios. Recarga el panel antes de guardar.':status===429?'Se alcanzó la cuota de Firebase. Conserva tus cambios y vuelve a intentarlo más tarde.':'No se pudo conectar con Firebase. Revisa la conexión y las reglas del proyecto.';
      throw Object.assign(fail(message,status),{code});
    }
    return result;
  }
  async function headers(selected=session) {
    if(!selected)throw fail('Inicia sesión con la cuenta ASO.',401);
    const token=await firebase.authorize(selected);
    if(selected===session)sessionStorage.setItem(sessionKey,JSON.stringify(selected));
    return {'Content-Type':'application/json',Authorization:'Bearer '+token};
  }
  async function doc(name,admin=false) {
    try {return await http(base+'/'+name,{headers:admin?await headers():{}});}
    catch(error){if(error.status===404&&error.code==='NOT_FOUND')return null;throw error;}
  }
  function unpack(document) {return document?{revision:Number(document.fields.revision.integerValue),...JSON.parse(document.fields.payload.stringValue)}:null;}
  async function seed(){const result=await http(new URL('./public-content.json',document.baseURI).href); if(!result.ok||!result.collections)throw fail('El contenido inicial no es válido.'); return result;}
  function publicSnapshot(source) {
    return Object.fromEntries(collections.map(key=>[key,key==='settings'
      ?Object.fromEntries(Object.entries(source.settings||{}).filter(([name])=>settings.includes(name)))
      :(source[key]||[]).filter(row=>!row.hidden).map(row=>Object.fromEntries(Object.entries(row).filter(([name])=>fields.has(name))))]));
  }
  function validateContent(source) {
    if(!source||typeof source!=='object'||Array.isArray(source)||Object.keys(source).some(key=>!collections.includes(key)))throw fail('Colección no permitida.');
    function visit(node,depth=0){
      if(depth>10)throw fail('Contenido demasiado anidado.');
      if(typeof node==='string'&&(node.length>16000||/[<>]/.test(node)))throw fail('Usa texto simple, sin etiquetas HTML.');
      if(Array.isArray(node)&&node.length>3000)throw fail('Demasiados registros.');
      if(node&&typeof node==='object')for(const [key,value]of Object.entries(node)){if(['__proto__','prototype','constructor','password','token','adminEmail'].includes(key))throw fail('Campo no permitido.');visit(value,depth+1);}
    }
    visit(source);
    for(const [key,value]of Object.entries(source)){
      if(key==='settings'){
        if(!value||Array.isArray(value)||Object.keys(value).some(name=>!settings.includes(name)))throw fail('Configuración no permitida.');
        if(value.enabledSections)value.enabledSections={...value.enabledSections,inicio:true,informacion:true};
      } else if(!Array.isArray(value)||value.some(row=>!row||typeof row!=='object'||typeof row.id!=='string')||new Set(value.map(row=>row.id)).size!==value.length)throw fail('Cada registro necesita un identificador único.');
    }
  }
  function write(name,value,revision,previous) {
    const payload=JSON.stringify(value);
    if(new TextEncoder().encode(payload).length>700000)throw fail('El contenido supera 700 KB. Usa enlaces de Drive para archivos y reduce registros antiguos.');
    return {update:{name:base.split('/v1/')[1]+'/'+name,fields:{revision:{integerValue:String(revision)},payload:{stringValue:payload}}},currentDocument:previous?{updateTime:previous.updateTime}:{exists:false}};
  }
  const commit=async writes=>http(base+':commit',{method:'POST',headers:await headers(),body:JSON.stringify({writes})});
  async function readContent(admin=false){
    if(!admin&&publicCache&&Date.now()-publicCache.at<60000)return structuredClone(publicCache.value);
    const stored=unpack(await doc(admin?'portal/private':'public/content',admin));
    const value=stored?{ok:true,revision:stored.revision,collections:stored.collections}:await seed();
    if(!admin)publicCache={at:Date.now(),value};
    return structuredClone(value);
  }
  async function publish(data){
    validateContent(data.collections);
    const [previous,visible]=await Promise.all([doc('portal/private',true),doc('public/content')]);
    const current=unpack(previous)||{...await seed(),audit:[]};
    if(data.revision!==current.revision)throw fail('Otra sesión publicó cambios. Recarga el panel antes de guardar.',409);
    const revision=previous?current.revision+1:1;
    const merged={...current.collections,...data.collections};
    const action=String(data.summary||'Publicó cambios en el portal').replace(/[<>]/g,'').slice(0,160);
    const audit=[{date:new Date().toISOString(),actor:session.user.email,action},...(current.audit||[])].slice(0,200);
    await commit([write('portal/private',{collections:merged,audit},revision,previous),write('public/content',{collections:publicSnapshot(merged)},revision,visible)]);
    publicCache=null;
    return {ok:true,revision};
  }
  function message(document){
    const raw=JSON.parse(document.fields.payload.stringValue),id=document.name.split('/').at(-1),date=document.fields.createdAt.timestampValue;
    const clean=document.fields.edited?.booleanValue?raw:Object.fromEntries(['type','name','email','phone','cycle','subject','message','materia','producto'].filter(key=>typeof raw[key]==='string').map(key=>[key,raw[key]]));
    return {...clean,id,date,status:document.fields.status.stringValue,trackingCode:'ADE-'+id.slice(0,8).toUpperCase(),...(!document.fields.edited?.booleanValue?{read:false,emailStatus:'sin configurar',history:[{date,status:'pendiente',actor:'Formulario del estudiante'}]}:{})};
  }
  async function inbox(all=false){
    const messages=[];let pageToken='';
    do {
      const query=new URLSearchParams({pageSize:'200',orderBy:'createdAt desc'});if(pageToken)query.set('pageToken',pageToken);
      const result=await http(base+'/inbox?'+query,{headers:await headers()});
      messages.push(...(result.documents||[]).map(message));pageToken=result.nextPageToken||'';
    }while(all&&pageToken);
    return {messages,hasMore:Boolean(pageToken)};
  }
  async function sendMessage(input){
    // The student store retains its own session; administration never borrows it.
    if(!window.AdeStudent?.getState().user)throw fail('Inicia sesión en Perfil para enviar tu solicitud. Tus datos del formulario siguen aquí.',401);
    const user=window.AdeStudent.getState().user;
    const selected=await window.AdeStudent.authorizeRequest();
    const allowed=['type','name','email','phone','cycle','subject','message','materia','producto'];
    const clean=Object.fromEntries(allowed.filter(key=>input[key]!==undefined).map(key=>[key,String(input[key]).trim()]));
    if(!['Consulta','Tutoría','Merch','Libro Físico','Introductorio'].includes(clean.type)||!clean.name||!clean.message||!/^\S+@\S+\.\S+$/.test(clean.email||''))throw fail('Completa nombre, correo y mensaje.');
    if(clean.type==='Consulta'&&!/^\+?[0-9][0-9 ()-]{6,18}[0-9]$/.test(clean.phone||''))throw fail('Ingresa un número de teléfono válido.');
    if(Object.values(clean).some(value=>/[<>]/.test(value)||value.length>2000))throw fail('Usa texto simple. El mensaje admite hasta 2000 caracteres.');
    const id=crypto.randomUUID().replaceAll('-',''),date=new Date().toISOString();
    const row={...clean,id,date,trackingCode:'ADE-'+id.slice(0,8).toUpperCase(),read:false,status:'pendiente',emailStatus:'sin configurar',history:[{date,status:'pendiente',actor:'Formulario del estudiante'}]};
    await http(base+':commit',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+selected},body:JSON.stringify({writes:[{update:{name:base.split('/v1/')[1]+'/inbox/'+id,fields:{owner:{stringValue:user.id},payload:{stringValue:JSON.stringify(clean)},status:{stringValue:'pendiente'},edited:{booleanValue:false}}},updateTransforms:[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}],currentDocument:{exists:false}}]})});
    return {ok:true,message:row};
  }
  async function updateMessage(data){
    if(!/^[a-f0-9]{32}$/.test(data.id||''))throw fail('Solicitud inválida.');
    const previous=await doc('inbox/'+data.id,true);if(!previous)throw fail('Solicitud no encontrada.',404);
    if(data.resend)throw fail('La solicitud está en la bandeja. El reenvío automático al correo aún requiere conectar Apps Script.');
    // Keep a tombstone so accidental deletes can be recovered from a backup.
    const row=message(previous),now=new Date().toISOString();
    if(data.remove){row.status='archivada';row.archivedAt=now;row.read=true;}
    else {
      const status=data.status||row.status;if(!statuses.includes(status))throw fail('Estado no permitido.');
      if(data.note!==undefined){if(typeof data.note!=='string'||data.note.length>1000||/[<>]/.test(data.note))throw fail('Nota interna inválida.');row.adminNote=data.note.trim();}
      if(status!==row.status)row.history=[...(row.history||[]),{date:now,status,actor:session.user.email}].slice(-50);
      row.status=status;if(data.read!==undefined)row.read=Boolean(data.read);
    }
    row.updatedAt=now;
    await commit([{update:{name:previous.name,fields:{...previous.fields,payload:{stringValue:JSON.stringify(row)},status:{stringValue:row.status},edited:{booleanValue:true}}},currentDocument:{updateTime:previous.updateTime}}]);
    return {ok:true,message:row};
  }
  async function login(data,mode='login'){
    if(String(data.email||'').trim().toLowerCase()!==ownerEmail)throw fail('Usa la cuenta autorizada de la ASO: '+ownerEmail,403);
    const selected=await firebase.request(mode==='register'?'register':'login',data);
    if(mode==='register'||mode==='verify'){
      await firebase.request('verifyEmail',{},selected);
      return {ok:true,verificationSent:true};
    }
    const identity=await firebase.request('identity',{},selected);
    if(!identity?.emailVerified)throw fail('Primero verifica el correo ASO. Pulsa «Enviar verificación», abre el enlace en Gmail y vuelve a entrar.',403);
    const old=session;session=selected;
    try{await doc('portal/private',true);sessionStorage.setItem(sessionKey,JSON.stringify(session));}
    catch(error){session=old;throw error;}
    return {ok:true,token:'firebase-admin',email:session.user.email};
  }
  async function request(path,data){
    if(!available)throw fail('La administración Firebase no está configurada.');
    if(path==='/api/login')return login(data);
    if(path==='/api/admin/register')return login(data,'register');
    if(path==='/api/admin/verify')return login(data,'verify');
    if(path==='/api/logout'){session=null;sessionStorage.removeItem(sessionKey);return {ok:true};}
    if(path==='/api/session'){await doc('portal/private',true);return {ok:true,token:'firebase-admin',email:session.user.email};}
    if(path.startsWith('/api/content'))return data===undefined?readContent(path.includes('admin=1')):publish(data);
    if(path==='/api/messages')return sendMessage(data);
    if(path==='/api/message')return updateMessage(data);
    if(path==='/api/admin'||path==='/api/backup'){
      const [privateDoc,list]=await Promise.all([doc('portal/private',true),inbox(path==='/api/backup')]);
      const content=unpack(privateDoc)||{...await seed(),audit:[]};
      if(path==='/api/backup')return {ok:true,kind:'aso-ade-backup',version:1,exportedAt:new Date().toISOString(),...content,messages:list.messages};
      return {ok:true,messages:list.messages,audit:content.audit||[],state:{revision:content.revision,mailRelay:false,cloud:true,inboxHasMore:list.hasMore}};
    }
    if(path==='/api/upload')throw fail('Sube el archivo a Drive y pega su enlace HTTPS. Esta versión gratuita no almacena archivos.');
    throw fail('Este servicio todavía no está conectado a la publicación.');
  }
  window.AdeCloudAdmin=Object.freeze({available,ownerEmail,request,publicSnapshot});
})();
