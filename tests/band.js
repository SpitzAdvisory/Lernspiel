/* Das Nachrichtenband: neue Fassung melden, Text ausrichten, und vor allem
   NICHT mitten in einem Durchgang stoeren - ein Neuladen wuerde die laufende
   Runde verwerfen. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8832);
const aus=[];
const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

async function mitAntwort(b,antwort,was){
 const ctx=await b.newContext({viewport:{width:1000,height:900},hasTouch:true});
 await ctx.route('**/nachricht.json*',r=>{
  if(antwort===null)return r.fulfill({status:404,body:''});
  r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(antwort)});});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8832/');
 await pg.waitForFunction(()=>typeof nachrichtZeigen==='function');
 await pg.waitForTimeout(900);
 const r=await pg.evaluate(was);
 await ctx.close();
 return {r,perr};
}

(async()=>{
 const b=await chromium.launch();
 const lies=()=>{const e=document.querySelector('.band');
  return e?{txt:e.innerText.replace(/\s+/g,' ').trim(),
   knopf:!!e.querySelector('.bandBtn'),zu:!!e.querySelector('.bandZu')}:null;};

 /* 1. Gleiche Fassung, kein Text: kein Band. */
 let a=await mitAntwort(b,{fassung:APPVER_PLATZ(),stand:'1',text:{de:''}},lies);
 pruef('Gleiche Fassung, kein Text: kein Band',a.r===null,JSON.stringify(a.r));

 /* 2. Neuere Fassung: Band mit Ladeknopf. */
 a=await mitAntwort(b,{fassung:'V999',stand:'2',text:{de:''}},lies);
 pruef('Neue Fassung meldet sich',!!a.r&&/V999/.test(a.r.txt),a.r&&a.r.txt);
 pruef('Band hat einen Ladeknopf',!!a.r&&a.r.knopf);
 pruef('Band laesst sich wegtippen',!!a.r&&a.r.zu);

 /* 3. Freier Text geht vor. */
 a=await mitAntwort(b,{fassung:'V999',stand:'3',text:{de:'Znacht in zehn Minuten.',en:'Dinner in ten minutes.'}},lies);
 pruef('Freier Text wird gezeigt',!!a.r&&/zehn Minuten|ten minutes/.test(a.r.txt),a.r&&a.r.txt);
 pruef('Beim Text kein Ladeknopf',!!a.r&&!a.r.knopf);

 /* 4. Keine Datei erreichbar: kein Band, kein Fehler. */
 a=await mitAntwort(b,null,lies);
 pruef('Ohne Datei bleibt es still',a.r===null&&a.perr.length===0,
  (a.r?'Band da':'kein Band')+', Fehler '+a.perr.length);

 /* 5. Mitten im Durchgang stoert nichts. */
 a=await mitAntwort(b,{fassung:'V999',stand:'5',text:{de:''}},()=>{
  document.querySelectorAll('.band').forEach(e=>e.remove());
  S.run={ended:false};
  NACHRICHT_OFFEN={art:'fassung',fassung:'V999',schluessel:'v:lauf'};
  nachrichtZeigen();
  const waehrend=!!document.querySelector('.band');
  S.run.ended=true;
  nachrichtZeigen();
  const danach=!!document.querySelector('.band');
  return {waehrend,danach};});
 pruef('Mitten im Durchgang kein Band',a.r&&a.r.waehrend===false,JSON.stringify(a.r));
 pruef('Nach dem Durchgang kommt es nach',a.r&&a.r.danach===true,JSON.stringify(a.r));

 /* 6. Einmal weggetippt, bleibt es weg. */
 a=await mitAntwort(b,{fassung:'V999',stand:'6',text:{de:''}},()=>{
  const zu=document.querySelector('.band .bandZu');
  if(zu)zu.click();
  const nachKlick=!!document.querySelector('.band');
  NACHRICHT_OFFEN={art:'fassung',fassung:'V999',schluessel:'v:V999'};
  nachrichtZeigen();
  return {nachKlick,wieder:!!document.querySelector('.band'),
   gemerkt:localStorage.getItem('spitz.band')};});
 pruef('Wegtippen entfernt das Band',a.r&&a.r.nachKlick===false,JSON.stringify(a.r));
 pruef('Dieselbe Fassung meldet sich nicht erneut',a.r&&a.r.wieder===false,JSON.stringify(a.r));
 pruef('Die Entscheidung wird gemerkt',a.r&&a.r.gemerkt==='v:V999',a.r&&a.r.gemerkt);

 /* 7. Die ausgelieferte Datei passt zur ausgelieferten Fassung. */
 const roh=fs.readFileSync(path.join(__dirname,'..','nachricht.json'),'utf8');
 let d=null,heil=true;try{d=JSON.parse(roh);}catch(e){heil=false;}
 pruef('nachricht.json ist gueltiges JSON',heil);
 const app=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const ver=(app.match(/const APPVER='([^']+)'/)||[])[1];
 pruef('nachricht.json nennt die ausgelieferte Fassung',!!d&&d.fassung===ver,
  (d&&d.fassung)+' gegen '+ver);
 pruef('nachricht.json hat ein Textfeld je Sprache',
  !!d&&d.text&&'de' in d.text&&'en' in d.text&&'fr' in d.text);

 let f=0;
 aus.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 await b.close();srv.close();process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});

function APPVER_PLATZ(){
 const app=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 return (app.match(/const APPVER='([^']+)'/)||[])[1];
}
