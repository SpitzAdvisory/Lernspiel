/* Das Alter bestimmt die Anfangsstufe der Minispiele.
   Geprueft wird mit den drei echten Geburtstagen gegen ein festes Datum,
   damit der Test nicht an einem Geburtstag kippt. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8857);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8857/');
 await pg.waitForFunction(()=>typeof alterJahre==='function'&&typeof altersStufe==='function');

 /* ---------- Das Alter selbst ---------- */
 const a=await pg.evaluate(()=>{
  const am=(y,m,d)=>new Date(y,m-1,d);
  const j=(geb,bis)=>alterJahre({geb},bis);
  return {
   felix:j('2019-10-03',am(2026,11,5)),
   valentin:j('2016-09-28',am(2026,11,5)),
   johannes:j('2014-03-14',am(2026,11,5)),
   /* Der Tag davor und der Geburtstag selbst */
   vorher:j('2014-03-14',am(2027,3,13)),
   amTag:j('2014-03-14',am(2027,3,14)),
   ohne:alterJahre({}),
   unsinn:alterJahre({geb:'kein Datum'}),
   leer:alterJahre({geb:''}),
   zukunft:j('2030-01-01',am(2026,11,5))};});
 pruef('Felix ist am 5.11.2026 sieben',a.felix===7,a.felix);
 pruef('Valentin ist zehn',a.valentin===10,a.valentin);
 pruef('Johannes ist zwölf',a.johannes===12,a.johannes);
 pruef('Am Tag vor dem Geburtstag noch zwölf',a.vorher===12,a.vorher);
 pruef('Am Geburtstag selbst dreizehn',a.amTag===13,a.amTag);
 pruef('Ohne Geburtstag kein Alter',a.ohne===null,a.ohne);
 pruef('Ein unsinniges Datum ergibt kein Alter',a.unsinn===null,a.unsinn);
 pruef('Ein leeres Feld ergibt kein Alter',a.leer===null,a.leer);
 pruef('Ein Datum in der Zukunft ergibt kein Alter',a.zukunft===null,a.zukunft);

 /* ---------- Die Stufe aus dem Alter ---------- */
 const s=await pg.evaluate(()=>{
  /* Fuer feste Altersangaben statt echter Geburtstage: ein Datum, das
     heute genau n Jahre zurueckliegt. */
  const gebFuer=n=>{const d=new Date();d.setFullYear(d.getFullYear()-n);
   d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);};
  const tab={};for(let n=5;n<=16;n++)tab[n]=altersStufe({geb:gebFuer(n)});
  return {tab,ohne:altersStufe({}),
   bodenOhne:spielBoden({}),boden12:spielBoden({geb:gebFuer(12)}),
   /* Hochbegabung: ein Siebenjaehriger auf Stufe 4 muss dort bleiben
      duerfen. Eine Decke bei Alter plus eins haette ihn auf 2 geholt. */
   begabt7:spielStufe({geb:gebFuer(7),spielStufe:4}),
   begabt7hoch:spielStufe({geb:gebFuer(7),spielStufe:5})};});
 pruef('Fünf- bis Siebenjährige beginnen auf Stufe 1',
  s.tab[5]===1&&s.tab[6]===1&&s.tab[7]===1,JSON.stringify([s.tab[5],s.tab[6],s.tab[7]]));
 pruef('Acht- und Neunjährige auf Stufe 2',s.tab[8]===2&&s.tab[9]===2);
 pruef('Zehn- und Elfjährige auf Stufe 3',s.tab[10]===3&&s.tab[11]===3);
 pruef('Zwölf- und Dreizehnjährige auf Stufe 4',s.tab[12]===4&&s.tab[13]===4);
 pruef('Ab vierzehn auf Stufe 5',s.tab[14]===5&&s.tab[16]===5);
 pruef('Die Stufe steigt mit dem Alter und fällt nie',
  Object.keys(s.tab).map(Number).sort((x,y)=>x-y)
   .every((n,i,arr)=>i===0||s.tab[n]>=s.tab[arr[i-1]]),JSON.stringify(s.tab));
 pruef('Ohne Geburtstag bleibt es bei Stufe 1',s.ohne===1,s.ohne);
 pruef('Der Boden liegt eine Stufe unter dem Alter',s.boden12===3,s.boden12);
 pruef('Ohne Geburtstag liegt der Boden bei 1',s.bodenOhne===1,s.bodenOhne);
 pruef('Ein begabter Siebenjähriger behält Stufe 4',s.begabt7===4,s.begabt7);
 pruef('Und erreicht auch Stufe 5',s.begabt7hoch===5,s.begabt7hoch);

 /* ---------- Die drei Kinder ---------- */
 const k=await pg.evaluate(()=>{
  const nimm=geb=>{const p={geb};return {alter:alterJahre(p),start:altersStufe(p),
   stufe:spielStufe(p),boden:spielBoden(p)};};
  return {felix:nimm('2019-10-03'),valentin:nimm('2016-09-28'),johannes:nimm('2014-03-14')};});
 pruef('Felix beginnt ohne eigene Stufe auf Stufe 1',k.felix.start===1&&k.felix.stufe===1,JSON.stringify(k.felix));
 pruef('Valentin beginnt auf Stufe 3',k.valentin.start===3&&k.valentin.stufe===3,JSON.stringify(k.valentin));
 pruef('Johannes beginnt auf Stufe 4',k.johannes.start===4&&k.johannes.stufe===4,JSON.stringify(k.johannes));
 pruef('Johannes fällt nicht unter Stufe 3',k.johannes.boden===3,k.johannes.boden);

 /* ---------- Der Boden haelt beim Absteigen ---------- */
 const ab=await pg.evaluate(async()=>{
  const p={id:'pA',name:'Probe',avatar:'🦊',geb:'2014-03-14',spielStufe:4};
  S.profiles=S.profiles.filter(x=>x.id!=='pA').concat([p]);
  /* Seit V110 traegt jedes Spiel seine eigene Stufe, darum laeuft der
     Abstieg hier in einem benannten Spiel. */
  const id=SPIELE[0].id;
  /* Fuenfmal absteigen: der Boden muss halten */
  for(let i=0;i<5;i++)await spielStufeSetz(p,id,spielStufe(p,id)-1);
  const unten=spielStufe(p,id);
  /* Und nach oben bleibt der Weg frei */
  for(let i=0;i<9;i++)await spielStufeSetz(p,id,spielStufe(p,id)+1);
  const oben=spielStufe(p,id);
  return {unten,oben};});
 pruef('Wiederholtes Absteigen endet beim Boden',ab.unten===3,ab.unten);
 pruef('Nach oben bleibt Stufe 5 erreichbar',ab.oben===5,ab.oben);

 /* ---------- Bestehende Profile ohne Geburtstag bleiben unberuehrt ---------- */
 const alt=await pg.evaluate(()=>({
  leer:spielStufe({}),null_:spielStufe(null),zwei:spielStufe({spielStufe:2}),
  null0:spielStufe({spielStufe:0}),hoch:spielStufe({spielStufe:9}),
  mist:spielStufe({spielStufe:'x'})}));
 pruef('Ohne Angabe weiterhin Stufe 1',alt.leer===1&&alt.null_===1,JSON.stringify(alt));
 pruef('Gespeicherte Stufen bleiben erhalten',alt.zwei===2,alt.zwei);
 pruef('Die Grenzen 1 und 5 halten',alt.null0===1&&alt.hoch===5,alt.null0+'/'+alt.hoch);
 pruef('Unbrauchbare Werte fallen auf die Altersstufe zurück',alt.mist===1,alt.mist);

 /* ---------- Wortlaute ---------- */
 const w=await pg.evaluate(()=>{const fehlt=[];
  for(const key of ['birthday','birthNote','yearsOld','gameLevel'])
   for(const l of ['de','en','fr'])if(!T[l]||!T[l][key])fehlt.push(l+'.'+key);
  return fehlt;});
 pruef('Die neuen Wortlaute stehen in allen drei Sprachen',w.length===0,w.join(','));

 /* ---------- Das Feld im Formular ---------- */
 const f=await pg.evaluate(()=>{
  S.admin=true;
  editPlayer({id:'pB',name:'Probe',avatar:'🦊',geb:'2014-03-14'});
  const el=document.querySelector('#dlg input#pg');
  const info=el?el.parentElement.querySelector('p.small:not(.muted)'):null;
  const r={da:!!el,typ:el?el.type:'',wert:el?el.value:'',info:info?info.textContent:''};
  const dlg=document.querySelector('#dlg');if(dlg&&dlg.close)dlg.close();
  return r;});
 pruef('Das Formular hat ein Geburtstagsfeld',f.da===true);
 pruef('Es ist ein Datumsfeld',f.typ==='date',f.typ);
 pruef('Der gespeicherte Geburtstag steht darin',f.wert==='2014-03-14',f.wert);
 pruef('Daneben steht Alter und Spielstufe',/12|13/.test(f.info)&&/4/.test(f.info),f.info);

 for(const [s2,n,x] of aus)console.log(s2,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const fl=aus.filter(x=>x[0]==='FAIL').length;
 console.log(fl||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(fl||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
