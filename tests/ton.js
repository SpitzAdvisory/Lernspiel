/* Die Tonschicht mit Sprache: Pfade, Stimmwahl, alter Weg unveraendert. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8819);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:900,height:900}});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8819/');
 await pg.waitForFunction(()=>typeof audioUrl==='function');
 const r=await pg.evaluate(()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  /* Pfade */
  const w='la cloche';
  pruef('Ohne Sprache weiterhin franzoesisch',audioUrl(w)==='audio/fr/'+fnv1a(w)+'.mp3',audioUrl(w));
  pruef('Deutscher Pfad',audioUrl('die Glocke','de')==='audio/de/'+fnv1a('die Glocke')+'.mp3',audioUrl('die Glocke','de'));
  pruef('Englischer Pfad',audioUrl('the bell','en')==='audio/en/'+fnv1a('the bell')+'.mp3',audioUrl('the bell','en'));
  pruef('Hash unveraendert gegenueber der alten Fassung',fnv1a('la cloche').length===8);
  /* Lesbarmachen: die franzoesischen Kuerzel nur auf Franzoesisch */
  pruef('qc wird nur auf Franzoesisch ausgeschrieben',
   lesbar('donner qc','fr')==='donner quelque chose'&&lesbar('qc und qn','de')==='qc und qn',
   lesbar('donner qc','fr')+' | '+lesbar('qc und qn','de'));
  /* Stimmwahl */
  const gewaehlt=[];
  const echt=window.speechSynthesis, echtU=window.SpeechSynthesisUtterance;
  /* Chromium nimmt an .voice nur echte Stimmen an; fuer die Pruefung
     deshalb auch den Erzeuger ersetzen. */
  window.SpeechSynthesisUtterance=function(txt){this.text=txt;this.lang='';this.voice=null;};
  /* speechSynthesis haengt als Getter am Fenster; eine einfache Zuweisung
     prallt ab. Darum neu definieren. */
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
   speaking:false,cancel(){},
   getVoices:()=>[{lang:'de-DE',name:'Anna'},{lang:'de-CH',name:'Petra'},
                  {lang:'fr-FR',name:'Amelie'},{lang:'en-US',name:'Sam'}],
   speak:u=>gewaehlt.push({lang:u.lang,voice:u.voice&&u.voice.name})}});
  ttsBrowser('Hallo','de');
  pruef('Deutsch nimmt die Schweizer Stimme',gewaehlt[0]&&gewaehlt[0].voice==='Petra',JSON.stringify(gewaehlt[0]));
  ttsBrowser('Bonjour','fr');
  pruef('Franzoesisch nimmt die franzoesische Stimme',gewaehlt[1]&&gewaehlt[1].voice==='Amelie',JSON.stringify(gewaehlt[1]));
  ttsBrowser('Hello','en');
  pruef('Englisch nimmt die englische Stimme',gewaehlt[2]&&gewaehlt[2].voice==='Sam',JSON.stringify(gewaehlt[2]));
  pruef('ttsFr bleibt franzoesisch',(ttsBrowser._x,ttsFr('Bonjour'),gewaehlt[3]&&gewaehlt[3].lang==='fr-FR'),
   JSON.stringify(gewaehlt[3]));
  /* Knopf */
  const b1=sndBtn('die Glocke',true,'de');
  pruef('Knopf laesst sich mit Sprache bauen',!!b1&&b1.classList.contains('sndb'));
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:echt});window.SpeechSynthesisUtterance=echtU;
  return aus;});
 for(const [s,n,x] of r)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.join(' | '));
 console.log(r.filter(x=>x[0]==='FAIL').length||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
})();
