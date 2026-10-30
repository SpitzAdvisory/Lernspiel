/* dis donc auf Englisch: die dritte Spalte der Karten und was sie steuert. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8823);
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1000,height:900}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8823/');
 await pg.waitForFunction(()=>typeof ddNatRoh==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

  /* Daten */
  let ges=0,ohneEn=[],ohneDe=[],langHinweis=0,falschePlaetze=[];
  for(const lz of DDV)for(const d of lz[5]){
   ges++;
   if(!d[1])ohneDe.push(d[0]);
   if(!d[2])ohneEn.push(d[0]);
   if(d.length>3&&d[3])langHinweis++;
   if(d.length>4)falschePlaetze.push(d[0]);
  }
  pruef('Alle Eintraege da',ges===1457,ges);
  pruef('Jeder Eintrag hat Deutsch',ohneDe.length===0,ohneDe.slice(0,3).join(' | '));
  pruef('Jeder Eintrag hat Englisch',ohneEn.length===0,ohneEn.slice(0,3).join(' | '));
  pruef('Hinweise stehen auf Platz vier',langHinweis===124,langHinweis);
  pruef('Kein Eintrag ist laenger als vier',falschePlaetze.length===0,falschePlaetze.slice(0,3).join(' | '));

  /* Ein Eintrag mit Hinweis und einer ohne */
  const mitH=[].concat(...DDV.map(l=>l[5])).find(d=>d[3]);
  const ohneH=[].concat(...DDV.map(l=>l[5])).find(d=>!d[3]);
  S.lang='de';
  pruef('Deutsch nimmt die deutsche Spalte',ddDeList(ohneH)[0]===String(ohneH[1]).split(';')[0],ddDeList(ohneH)[0]);
  pruef('Hinweis erscheint auf Deutsch',ddDe(mitH).indexOf('('+mitH[3]+')')>0,ddDe(mitH));
  S.lang='en';
  pruef('Englisch nimmt die englische Spalte',ddDeList(ohneH)[0]===ohneH[2],ddDeList(ohneH)[0]);
  pruef('Kein deutscher Hinweis auf Englisch',ddDe(mitH).indexOf('(')<0,ddDe(mitH));
  pruef('ddDeAll folgt ebenfalls',ddDeAll(ohneH)===ohneH[2],ddDeAll(ohneH));
  S.lang='fr';
  pruef('Franzoesisch faellt auf Deutsch zurueck',ddDeList(ohneH)[0]===String(ohneH[1]).split(';')[0]);

  /* Aufgaben: die franzoesische Antwort bleibt unberuehrt */
  const ddThemen=FRTOPICS.filter(t=>t.dd);
  pruef('dis-donc-Lernziele da',ddThemen.length===51,ddThemen.length);
  let abweichung=[],leerePrompts=[],natFalsch=[];
  for(const spr of ['de','en']){
   S.lang=spr;
   for(let k=0;k<200;k++){
    const tp=ddThemen[k%ddThemen.length];
    let it=null; try{ it=genItem(tp,1+(k%3),{}); }catch(_){ continue; }
    if(!it)continue;
    if(!String(it.prompt||'').trim())leerePrompts.push(tp.id);
    if(it.answer&&it.accept&&!it.accept.includes(it.answer))abweichung.push(it.answer);
    if(it.nat&&it.natSpr!==spr&&!(spr==='fr'))natFalsch.push(spr+':'+it.natSpr);
   }
  }
  pruef('Kein leerer Fragetext',leerePrompts.length===0,leerePrompts.slice(0,3).join(' | '));
  pruef('Die erwartete Antwort bleibt unter den zugelassenen',abweichung.length===0,abweichung.slice(0,3).join(' | '));
  pruef('Die Tonsprache folgt der App',natFalsch.length===0,natFalsch.slice(0,3).join(' | '));

  /* Im englischen Modus steht Englisch im Fragetext.
     Geprueft wird an Schreibaufgaben: nur die tragen eine Antwort, bei
     Auswahlaufgaben steckt sie in den Antwortmoeglichkeiten. */
  S.lang='en';
  const alle=[].concat(...DDV.map(l=>l[5]));
  let imText=0, falschePaare=[], ohneText=[];
  for(let k=0;k<400;k++){
   const tp=ddThemen[k%ddThemen.length];
   let it=null; try{ it=genItem(tp,1+(k%3),{}); }catch(_){ continue; }
   if(!it||!it.nat)continue;
   if(String(it.prompt||'').indexOf(it.nat)>=0)imText++; else ohneText.push(it.nat);
   if(it.type!=='input'||!it.answer)continue;
   /* Der Eintrag wird ueber die franzoesische Antwort gefunden, nicht ueber
      den englischen Text: mehrere Eintraege teilen sich eine Uebersetzung. */
   const d=alle.find(x=>x[0]===it.answer);
   if(!d||d[2]!==it.nat)falschePaare.push(it.answer+' -> '+it.nat+' statt '+(d&&d[2]));
  }
  pruef('Der englische Eintrag steht im Fragetext',ohneText.length===0,ohneText.slice(0,3).join(' | '));
  pruef('Solche Aufgaben kamen vor',imText>20,imText+' von 400');
  pruef('Franzoesische Antwort und englischer Text gehoeren zusammen',
   falschePaare.length===0,falschePaare.slice(0,3).join(' | '));
  S.lang='de';
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
