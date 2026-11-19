const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const User=require('../src/models/users');
const Sesion=require('../src/models/sesion');
const Recuperacion=require('../src/models/recuperacion');
const service=require('../src/services/verificacionService');
const correo=require('../src/services/correoService');
const auth=require('../src/controllers/authController');
const repo=require('../src/repositories/userRepository');
const middleware=require('../src/middlewares/verificacionMiddleware');
const proteger=require('../src/middlewares/authMiddleware');
const uri=process.env.MIO_VERIFICACION_TEST_URI;
const password='Frase sintética segura 2026';
const respuesta=()=>({statusCode:200,set(){return this;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}});
const llamar=async(fn,body)=>{const r=respuesta();await fn({body},r);return r;};
test('verificación en MongoDB standalone aislado', {skip:!uri},async t=>{
  assert.match(uri,/^mongodb:\/\/127\.0\.0\.1:27191\/mio_pruebas_verificacion_[a-f0-9]{32}$/);
  process.env.JWT_SECRET='solo-test-verificacion'; process.env.EMAIL_VERIFICATION_LEGACY_MODE='off';
  await mongoose.connect(uri,{autoIndex:false,autoCreate:false,serverSelectionTimeoutMS:4000});
  t.after(()=>mongoose.disconnect());
  assert.equal((await mongoose.connection.db.admin().command({hello:1})).setName,undefined);
  // Solo índice de email ya declarado en el modelo, exclusivamente en esta base desechable.
  await User.collection.createIndex({email:1},{unique:true});
  const enviados=[];
  t.mock.method(correo,'enviarVerificacion',async(email,token,opts)=>{enviados.push({email,token,opts});});
  const fixture=async(extra={})=>User.create({nombre:'Sintético',email:crypto.randomUUID()+'@example.invalid',rol:'cliente',estado:'activo',
    password:await require('bcryptjs').hash(password,10),credentialVersion:crypto.randomUUID(),...service.inicial(),...extra});
  const emitir=async u=>{await service.procesar(u.email);return enviados.at(-1).token;};
  const acceso=async(token,fn=proteger)=>{let paso=false;const r=respuesta();await fn({headers:{authorization:'Bearer '+token}},r,()=>paso=true);return {paso,r};};
  await t.test('registro sin sesión completa; campos sensibles ignorados, duplicado y rol admin rechazados',async()=>{
    const email=crypto.randomUUID()+'@example.invalid';
    const datos={nombre:'Nuevo',email,password,rol:'cliente',emailVerifiedAt:new Date(),emailVerificationRequired:false};
    const r=await llamar(auth.registrar,datos);await service.esperarPendientes();
    assert.equal(r.statusCode,201);assert.equal(r.body.token,undefined);assert.equal(r.body.verificationRequired,true);
    assert.equal(await Sesion.countDocuments({}),0);
    const u=await User.findOne({email});assert.equal(u.emailVerifiedAt,null);assert.equal(u.emailVerificationRequired,true);
    assert.equal((await acceso(r.body.verificationToken)).paso,false);assert.equal((await acceso(r.body.verificationToken,middleware.identidad)).paso,true);
    assert.equal((await llamar(auth.registrar,datos)).statusCode,409);
    assert.equal((await llamar(auth.registrar,{...datos,email:'admin@example.invalid',rol:'admin'})).statusCode,400);
    const pendientes=await Promise.all([1,2].map(()=>llamar(auth.registrar,{...datos,email:'carrera@example.invalid'})));
    await service.esperarPendientes();assert.deepEqual(pendientes.map(r=>r.statusCode).sort(),[201,409]);
  });
  await t.test('login pendiente limitado; confirmación no da sesión y exige clave del dueño',async()=>{
    const u=await fixture();const token=await emitir(u);
    const antes=await llamar(auth.login,{email:u.email,password});assert.equal(antes.body.verificationRequired,true);
    assert.equal((await acceso(antes.body.verificationToken)).paso,false);
    assert.equal((await User.findById(u.id)).emailVerification.hash,service.hash(token));
    const claveFinal='Otra frase definitiva 2026';
    assert.ok(await service.confirmar(token,claveFinal));
    assert.equal(await service.confirmar(token,claveFinal),null);
    assert.equal((await acceso(antes.body.verificationToken,middleware.identidad)).paso,false);
    assert.equal((await llamar(auth.login,{email:u.email,password})).statusCode,401);
    const login=await llamar(auth.login,{email:u.email,password:claveFinal});assert.ok(login.body.token);assert.equal((await acceso(login.body.token)).paso,true);
  });
  await t.test('expiración, token ajeno a recuperación, correo asociado y cambio de dirección',async()=>{
    const u=await fixture();const token=await emitir(u);
    await User.updateOne({_id:u.id},{$set:{'emailVerification.expiresAt':new Date(Date.now()-1)}});
    assert.equal(await service.confirmar(token,password),null);
    assert.equal(await service.confirmar('a'.repeat(64),password),null);
    const v=await fixture();const enlace=await emitir(v);
    await repo.actualizarPorId(v.id,{email:crypto.randomUUID()+'@example.invalid'});
    assert.equal(await service.confirmar(enlace,password),null);assert.equal((await User.findById(v.id)).emailVerifiedAt,null);
    const w=await fixture();const viejo=await emitir(w);await User.updateOne({_id:w.id},{$set:{email:crypto.randomUUID()+'@example.invalid'}});
    assert.equal(await service.confirmar(viejo,password),null);
    assert.equal(await Recuperacion.countDocuments({}),0);
  });
  await t.test('confirmación simultánea: exactamente un ganador',async()=>{
    const u=await fixture();const token=await emitir(u);
    const r=await Promise.all([service.confirmar(token,password),service.confirmar(token,password)]);
    assert.equal(r.filter(Boolean).length,1);
  });
  await t.test('reenvío concurrente, cooldown, límite horario y vencimiento configurable',async()=>{
    process.env.EMAIL_VERIFICATION_TTL_HOURS='2';const u=await fixture();const n=enviados.length;
    await Promise.all(Array.from({length:8},()=>service.procesar(u.email)));assert.equal(enviados.length,n+1);
    const primer=enviados.at(-1).token;assert.ok(enviados.at(-1).opts.expiresAt-Date.now()>7100000);
    await service.procesar(u.email);assert.equal(enviados.length,n+1);
    for(let i=0;i<2;i++){await User.updateOne({_id:u.id},{$set:{'verificationRequest.nextAllowedAt':new Date(0)}});await service.procesar(u.email);}
    assert.equal(enviados.length,n+3);assert.equal(await service.confirmar(primer,password),null);
    await User.updateOne({_id:u.id},{$set:{'verificationRequest.nextAllowedAt':new Date(0)}});await service.procesar(u.email);assert.equal(enviados.length,n+3);
    delete process.env.EMAIL_VERIFICATION_TTL_HOURS;
  });
  await t.test('suspensión/baja/reactivación no activan enlaces anteriores',async()=>{
    for(const eliminado of [false,true]){
      const u=await fixture();const token=await emitir(u);
      if(eliminado) await repo.eliminarPorId(u.id);else await repo.actualizarPorId(u.id,{estado:'inactivo'});
      assert.equal(await service.confirmar(token,password),null);
      if(!eliminado){await repo.actualizarPorId(u.id,{estado:'activo'});assert.equal(await service.confirmar(token,password),null);}
    }
  });
  await t.test('cambio de correo durante confirmación: CAS evita validar dirección distinta',async t=>{
    const u=await fixture();const token=await emitir(u);const update=User.findOneAndUpdate.bind(User);let intercalado=false;
    const mock=t.mock.method(User,'findOneAndUpdate',async(filter,change,options)=>{
      if(change.$set?.emailVerifiedAt&&!intercalado){intercalado=true;await repo.actualizarPorId(u.id,{email:crypto.randomUUID()+'@example.invalid'});}
      return update(filter,change,options);
    });assert.equal(await service.confirmar(token,password),null);mock.mock.restore();
  });
  await t.test('vencimiento en escritura y fallo parcial no consumen ni activan el enlace', async t=>{
    const u=await fixture();const token=await emitir(u);const update=User.findOneAndUpdate.bind(User);
    let mock=t.mock.method(User,'findOneAndUpdate',async()=>{throw new Error('fallo-sintetico');});
    await assert.rejects(service.confirmar(token,password));mock.mock.restore();
    assert.equal((await User.findById(u.id)).emailVerification.hash,service.hash(token));
    mock=t.mock.method(User,'findOneAndUpdate',async(filter,change,options)=>{
      await User.updateOne({_id:u.id},{$set:{'emailVerification.expiresAt':new Date(0)}});
      return update(filter,change,options);
    });
    assert.equal(await service.confirmar(token,password),null);mock.mock.restore();
    assert.equal((await User.findById(u.id)).emailVerifiedAt,null);
    assert.equal((await llamar(auth.restablecerPassword,{token,password})).statusCode,400);
    const json=(await User.findById(u.id)).toJSON();
    assert.equal(json.emailVerification,undefined);assert.equal(json.verificationRequest,undefined);
  });
  await t.test('históricos: sesión heredada, obligaciones, modo gradual y verificación sin cambiar clave',async()=>{
    const u=await fixture({emailVerificationRequired:undefined,credentialVersion:undefined,registrationPendingUntil:undefined});
    const sesion=await Sesion.create({usuarioId:u._id,expiresAt:new Date(Date.now()+60000)});
    const token=jwt.sign({id:u.id,sid:sesion.id},process.env.JWT_SECRET);
    assert.equal((await acceso(token)).paso,true);assert.equal((await User.findById(u.id)).emailVerifiedAt,null);
    let pasa=false;const r=respuesta();process.env.EMAIL_VERIFICATION_LEGACY_MODE='sensitive';
    middleware.sensible({usuario:u},r,()=>pasa=true);assert.equal(pasa,false);assert.equal(r.statusCode,403);
    assert.equal((await acceso(token)).paso,true); // lecturas/obligaciones conservan sesión válida.
    const enlace=await emitir(u);assert.ok(await service.confirmar(enlace));assert.equal((await acceso(token)).paso,true);
    assert.ok((await llamar(auth.login,{email:u.email,password})).body.token);
    process.env.EMAIL_VERIFICATION_LEGACY_MODE='off';
  });
  await t.test('fallo SMTP mantiene seguridad y cuota; registro vencido no se borra',async t=>{
    const u=await fixture();const mock=t.mock.method(correo,'enviarVerificacion',async()=>{throw new Error('privado');});
    await assert.rejects(service.procesar(u.email));mock.mock.restore();
    const actual=await User.findById(u.id);assert.equal(actual.emailVerifiedAt,null);assert.equal(actual.verificationRequest.count,1);
    const vencido=await fixture({registrationPendingUntil:new Date(0)});const n=enviados.length;await service.procesar(vencido.email);assert.equal(enviados.length,n);assert.ok(await User.findById(vencido.id));
  });
  await t.test('HTTP: estado limitado, IP, cabeceras y acceso a recursos antes/después de confirmar',async t=>{
    const app=require('../src/expressApp');const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));
    const base='http://127.0.0.1:'+server.address().port;
    const u=await fixture();const proof=await emitir(u);const pending=await llamar(auth.login,{email:u.email,password});
    const send=(path,method='GET',body,token=pending.body.verificationToken)=>fetch(base+path,{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    assert.equal((await send('/api/auth/me')).status,401);
    assert.equal((await send('/api/solicitudes-apartado','POST',{productoId:'a'.repeat(24)})).status,401);
    const status=await send('/api/auth/email-verification/status');assert.equal(status.status,200);assert.equal(status.headers.get('cache-control'),'no-store');assert.equal((await status.json()).verified,false);
    assert.equal((await send('/api/auth/email-verification/resend','POST',{})).status,200);
    for(let i=0;i<8;i++)await send('/api/auth/email-verification/status');
    assert.equal((await send('/api/auth/email-verification/status')).status,429);
    await service.esperarPendientes();assert.ok(await service.confirmar(proof,password));
    const full=await llamar(auth.login,{email:u.email,password});assert.equal((await send('/api/auth/me','GET',undefined,full.body.token)).status,200);
    assert.equal((await send('/api/productos','POST',{},full.body.token)).status,403);
    const vendedor=await fixture({rol:'vendedor',emailVerificationRequired:undefined,registrationPendingUntil:undefined});
    const loginVendedor=await llamar(auth.login,{email:vendedor.email,password});
    const tokenVendedor=loginVendedor.body.token;
    const cliente=await require('../src/models/clientes').create({nombre:'Cliente sintético',vendedorId:vendedor._id});
    const pedido=await require('../src/models/pedidos').create({clienteId:cliente._id,vendedorId:vendedor._id,producto:'Histórico sintético',precio:10});
    process.env.EMAIL_VERIFICATION_LEGACY_MODE='sensitive';
    assert.equal((await send('/api/pedidos','GET',undefined,tokenVendedor)).status,200);
    assert.equal((await send('/api/pedidos','POST',{},tokenVendedor)).status,403);
    assert.equal((await send('/api/pedidos/'+pedido.id+'/pago','PATCH',{estadoPago:'pagado'},tokenVendedor)).status,200);
    assert.equal((await send('/api/pedidos/'+pedido.id,'PUT',{cantidad:2},tokenVendedor)).status,403);
    assert.equal((await require('../src/models/pedidos').findById(pedido.id)).estadoPago,'pagado');
    const enlaceVendedor=await emitir(vendedor);assert.ok(await service.confirmar(enlaceVendedor));
    // Tras verificar, la misma sesión histórica puede gestionar productos con su rol.
    assert.equal((await send('/api/productos','POST',{},tokenVendedor)).status,400);
    process.env.EMAIL_VERIFICATION_LEGACY_MODE='off'; // rol cliente sigue sin privilegios de vendedor.
  });
});
