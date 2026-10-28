/* Der Vermittler ersetzt die Schluessel im Geraet. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8809);
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1000,height:900}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8809/');
 await pg.waitForFunction(()=>typeof vermittler==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  const echtesFetch=window.fetch;
  let gesehen=null;
  window.fetch=async(u,o)=>{
   const url=String(u);
   if(url.indexOf('vermittler.example')>=0){
    gesehen={url, hatKopf:!!(o.headers&&(o.headers['xi-api-key']||o.headers['x-api-key'])),
     typ:(o.body instanceof FormData)?'form':'json',
     inhalt:(o.body instanceof FormData)?Object.fromEntries([...o.body.keys()].map(k=>[k,1])):JSON.parse(o.body)};
    return {ok:true,json:async()=>({text:'la cloche'})};}
   if(url.indexOf('elevenlabs.io')>=0||url.indexOf('anthropic.com')>=0){
    gesehen={direkt:url};return {ok:true,json:async()=>({text:'direkt'})};}
   return echtesFetch(u,o);};

  await IDB.set('kv','proxyUrl','https://vermittler.example/');
  await IDB.set('kv','elevenKey','');await IDB.set('kv','apiKey','');
  HOERWEG=null;HOERKAPUTT=null;

  pruef('Adresse wird erkannt',(await vermittler())==='https://vermittler.example');
  const t1=await hoerScribe(new Float32Array(8000).fill(0.1));
  pruef('Zuhören geht an den Vermittler',!!gesehen&&/\/stt$/.test(gesehen.url||''),gesehen&&gesehen.url);
  pruef('Kein Schlüssel im Kopf',gesehen&&gesehen.hatKopf===false);
  pruef('Tondatei dabei',gesehen&&gesehen.typ==='form'&&!!gesehen.inhalt.file);
  pruef('Text kommt zurück',t1==='la cloche',JSON.stringify(t1));

  gesehen=null;
  const t2=await leseHandschrift('data:image/png;base64,AAAA');
  pruef('Handschrift geht an den Vermittler',!!gesehen&&/\/ocr$/.test(gesehen.url||''),gesehen&&gesehen.url);
  pruef('Kein Schlüssel im Kopf (Handschrift)',gesehen&&gesehen.hatKopf===false);
  pruef('Bild im Rumpf',gesehen&&gesehen.typ==='json'&&gesehen.inhalt.image==='AAAA');
  pruef('Text kommt zurück (Handschrift)',t2==='la cloche',JSON.stringify(t2));

  pruef('Ohne Schlüssel gilt der Vermittler als Weg',(await hoerWeg(()=>{}))==='eleven');

  /* Ohne Adresse bleibt der alte Weg */
  await IDB.set('kv','proxyUrl','');
  await IDB.set('kv','elevenKey','k');
  gesehen=null;HOERWEG=null;
  await hoerScribe(new Float32Array(8000).fill(0.1));
  pruef('Ohne Adresse weiterhin direkt',!!gesehen&&/elevenlabs\.io/.test(gesehen.direkt||''),gesehen&&gesehen.direkt);

  /* Unsinnige Adresse wird nicht genommen */
  await IDB.set('kv','proxyUrl','nicht-https');
  pruef('Adresse ohne https zählt nicht',(await vermittler())==='');

  window.fetch=echtesFetch;
  await IDB.set('kv','proxyUrl','');await IDB.set('kv','elevenKey','');
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
