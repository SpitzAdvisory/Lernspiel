/* Sieben oder Eins.
   Urs am 18.11.2026: «7 und 1 wird leicht verwechselt.» Die Erkennung
   sieht ein Bild, und als Bild gleichen sich die beiden. Der Strichzug
   unterscheidet sie: die Sieben traegt oben einen waagrechten Balken,
   die Eins hoechstens einen kurzen Aufstrich.

   Die Zuege hier sind Prototypen, von Hand gesetzt und benannt. Sie
   halten fest, dass die Regel tut, was sie soll. An Strichen echter
   Kinder ist die Schwelle nicht geeicht - das steht aus, und bis dahin
   gilt im Zweifel die Erkennung. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8894);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

/* Hilfe: eine Linie von A nach B als Punktfolge. */
const linie=(x1,y1,x2,y2,n)=>{const o=[];n=n||10;
 for(let i=0;i<=n;i++)o.push([x1+(x2-x1)*i/n, y1+(y2-y1)*i/n]);return o;};

const ZUEGE={
 /* Balken oben, dann der Abstrich schraeg nach unten links. */
 sieben:[linie(10,12,50,12),linie(50,12,26,62)],
 /* Mit Querstrich in der Mitte, wie man ihn hier schreibt. */
 siebenQuer:[linie(10,12,50,12),linie(50,12,26,62),linie(22,38,40,38)],
 /* Kurzer Aufstrich, dann senkrecht hinunter. */
 eins:[linie(18,20,30,10),linie(30,10,30,62)],
 /* Dieselbe Eins mit Fuss, wie sie oft geschrieben wird. */
 einsFuss:[linie(18,20,30,10),linie(30,10,30,62),linie(24,62,36,62)],
 /* Senkrechter Strich ohne alles. */
 einsBlank:[linie(30,10,30,62)],
 /* Ein langer, flacher Aufstrich - dazwischen, also kein Urteil. */
 unklar:[linie(8,22,30,10),linie(30,10,30,62)],
 /* Quer liegender Zug, keine der beiden Ziffern. */
 quer:[linie(6,30,70,34)],
 /* Zu wenig Punkte. */
 punkt:[[[30,30]]]};

(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:1000,height:1100},screen:{width:1000,height:1100}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8894/');
 await pg.waitForFunction(()=>typeof siebenOderEins!=='undefined');

 const urteil=await pg.evaluate(z=>{
  const o={};for(const k of Object.keys(z))o[k]=siebenOderEins(z[k]);return o;},ZUEGE);
 pruef('Die Sieben wird als Sieben erkannt',urteil.sieben===7,urteil.sieben);
 pruef('Auch die Sieben mit Querstrich',urteil.siebenQuer===7,urteil.siebenQuer);
 pruef('Die Eins wird als Eins erkannt',urteil.eins===1,urteil.eins);
 pruef('Auch die Eins mit Fuss',urteil.einsFuss===1,urteil.einsFuss);
 pruef('Auch der blosse Senkrechtstrich',urteil.einsBlank===1,urteil.einsBlank);
 pruef('Der flache Aufstrich bleibt ohne Urteil',urteil.unklar===null,urteil.unklar);
 pruef('Ein liegender Zug bleibt ohne Urteil',urteil.quer===null,urteil.quer);
 pruef('Ein einzelner Punkt bleibt ohne Urteil',urteil.punkt===null,urteil.punkt);
 pruef('Nichts bleibt ohne Urteil',
  (await pg.evaluate(()=>[siebenOderEins(null),siebenOderEins([]),siebenOderEins([[]])]))
   .every(x=>x===null));

 /* Die Grenze muss gelten, egal wie gross das Kind schreibt. */
 const groessen=await pg.evaluate(z=>{
  const skal=(st,f)=>st.map(s=>s.map(p=>[p[0]*f,p[1]*f]));
  const o={};
  for(const f of [0.4,1,2.5])o['x'+f]=[siebenOderEins(skal(z.sieben,f)),siebenOderEins(skal(z.eins,f))];
  return o;},ZUEGE);
 for(const k of Object.keys(groessen))
  pruef('Das Urteil haelt bei Grösse '+k.slice(1),
   groessen[k][0]===7&&groessen[k][1]===1,groessen[k].join('/'));
 /* Und egal, wo im Kästchen geschrieben wird. */
 const orte=await pg.evaluate(z=>{
  const schieb=(st,dx,dy)=>st.map(s=>s.map(p=>[p[0]+dx,p[1]+dy]));
  return [siebenOderEins(schieb(z.sieben,25,14)),siebenOderEins(schieb(z.eins,25,14))];},ZUEGE);
 pruef('Das Urteil haelt bei verschobenem Zug',orte[0]===7&&orte[1]===1,orte.join('/'));

 /* ---------- Im Betrieb ----------
    Der Renderer haelt seine Kaestchen in einer Closure; von aussen ist
    die Wirkung dort nicht zu greifen, ohne eine Luke in den Code zu
    schneiden, die nur der Test braucht. Geprueft wird darum am Code,
    dass die Regel an der richtigen Stelle und nur fuer 1 und 7 greift.
    Die Regel selbst ist oben an Zuegen gemessen. */
 const quelle=fs.readFileSync(path.join(D,'app.html'),'utf-8');
 pruef('Die Regel wird nach dem Lesen gerufen',
  /nachpruefen\(z\);malen\(z\)/.test(quelle)||/nachpruefen\(z\);\s*malen\(z\)/.test(quelle));
 pruef('Sie greift in beiden Lesewegen',
  (quelle.match(/nachpruefen\(z\)/g)||[]).length>=2,
  (quelle.match(/nachpruefen\(z\)/g)||[]).length);
 pruef('Sie betrifft nur Eins und Sieben',
  /if\(z\.ziffer!==1&&z\.ziffer!==7\)return;/.test(quelle));
 pruef('Im Zweifel bleibt die Erkennung stehen',
  /if\(g&&g!==z\.ziffer\)z\.ziffer=g;/.test(quelle));
 pruef('Die Schwellen stehen als benannte Werte',
  /const SIEBEN_AB=0\.55;/.test(quelle)&&/const EINS_BIS=0\.30;/.test(quelle));

 await b.close();srv.close();
 if(perr.length)pruef('SEITENFEHLER',false,perr.slice(0,3).join(' | '));
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
