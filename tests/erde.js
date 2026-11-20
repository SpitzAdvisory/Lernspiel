/* Geography 7.2 - die Spieldatei und ihre Abbildungen.
   Urs am 20.11.2026: ein Spiel zur RZ-Pruefung vom 27. November, mit
   vielen Bildern, alles abgedeckt, und es muss auf iPhone und iPad
   laufen.

   Geprueft wird dreierlei: dass die App jede Aufgabe annimmt, dass
   jedes Kartenziel im Weltpaket wirklich existiert und jede genannte
   Abbildung gezeichnet wird, und dass auf dem Telefon keine Schrift
   unter die Lesbarkeitsgrenze faellt. Eine Aufgabe, die das Kind nicht
   lesen kann, ist keine Aufgabe. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':q.url.endsWith('.json')?'application/json':'text/html'});s.end(fs.readFileSync(f));}).listen(8897);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
/* Einzeln aufgerufen bediente sich diese Pruefung an der app.html, die
   gerade im Ordner lag - und mass einmal eine Fassung von vorgestern,
   ohne das zu melden. Sie legt die Seite darum selbst hin. Unter
   alles.js ist es dieselbe Datei, der Lauf aendert sich nicht. */
fs.mkdirSync(D,{recursive:true});
fs.copyFileSync(path.join(__dirname,'..','index.html'),path.join(D,'app.html'));
/* Spieldatei und Kartenkennungen liegen im Projekt, damit diese
   Pruefung auch auf dem Bauserver laeuft. Das Kennungspaket traegt
   dieselben Objekte wie das Weltpaket im Geraet, nur ohne die
   Umrisslinien - geprueft wird, dass es die Objekte gibt, nicht wie
   sie aussehen. */
const STOFF=path.join(__dirname,'stoff');
const SPIEL=path.join(STOFF,'20261120_Geography-7-2.json');
const BEIDE=path.join(STOFF,'20261120_Geography-7-1-und-7-2.json');
const PACK=path.join(STOFF,'weltpaket-kennungen.json');
for(const [von,nach] of [[SPIEL,'g72.json'],[PACK,'world.json']])
 try{fs.copyFileSync(von,path.join(D,nach));}catch(e){}

(async()=>{
 const da=fs.existsSync(SPIEL)&&fs.existsSync(PACK);
 pruef('Spieldatei und Weltpaket liegen bereit',da);
 if(!da){for(const [s,n,x] of aus)console.log(s+' '+n);console.log('NICHT BESTANDEN: 1');process.exit(1);}
 const g=JSON.parse(fs.readFileSync(SPIEL,'utf-8'));
 const P=JSON.parse(fs.readFileSync(PACK,'utf-8'));
 const byId={};for(const L of P.layers)for(const f of L.f){f.layer=L.id;f.kind=L.kind;byId[f.id]=f;}

 pruef('Das Spiel heisst Geography 7.2',g.title==='Geography 7.2',g.title);
 pruef('Es traegt genug Aufgaben',g.items.length>=100,g.items.length);

 /* Zwei Rekorde, die sich beissen koennen: das laengste Gebirge an Land
    (Kordilleren, rund 14 000 km, aus dem Arbeitsblatt und nachrecherchiert)
    und das laengste unter Wasser (mittelozeanische Ruecken, ueber 60 000 km).
    Nennt eine Aufgabe eines davon unqualifiziert "das laengste Gebirge der
    Welt", gibt das Spiel zwei Antworten auf dieselbe Frage. */
 {const alles=[];
  for(const it of g.items)for(const L of ['de','en','fr']){
   const tr=(it.tr||{})[L]||{};
   alles.push(((tr.prompt||'')+' '+(tr.explanation||'')));}
  const streit=alles.filter(x=>/längste Gebirge der Welt|longest mountain range in the world|plus longue chaîne du monde/.test(x));
  pruef('Kein Rekord heisst unqualifiziert «das längste Gebirge der Welt»',
   streit.length===0,streit.length?streit[0].slice(0,70):'');
  const land=g.items.find(i=>/längste Gebirge an Land \(14 000 km\)/.test((i.tr&&i.tr.de&&i.tr.de.prompt)||''));
  pruef('Der Rekord «längstes Gebirge an Land» ist da',!!land);
  if(land){
   pruef('Er nennt die Kordilleren als Lösung',
    (land.options||[])[(land.correct||[0])[0]]==='Kordilleren',(land.options||[])[(land.correct||[0])[0]]);
   pruef('Die Erklärung sagt, woraus die Kette besteht',
    /Rocky Mountains/.test(land.tr.de.explanation||'')&&/Anden/.test(land.tr.de.explanation||''));
   /* "Anden" taugt nicht als Falschantwort: sie sind der Suedteil der Kette. */
   pruef('«Anden» steht nicht als falsche Antwort darunter',
    (land.options||[]).indexOf('Anden')<0,(land.options||[]).join(', '));}}
 pruef('Die Kennungen sind eindeutig',new Set(g.items.map(i=>i.id)).size===g.items.length);
 pruef('Es nennt das Weltpaket',(g.mapPacks||[]).indexOf('world')>=0);

 /* Die Sammelmappe: sie traegt keine eigenen Aufgaben, sondern nennt
    die beiden Spiele, aus denen sie besteht. */
 const bd=JSON.parse(fs.readFileSync(BEIDE,'utf-8'));
 pruef('Die Sammelmappe heisst nach beiden Spielen',bd.title==='Geography 7.1 + 7.2',bd.title);
 pruef('Sie trägt keine eigenen Aufgaben',Array.isArray(bd.items)&&bd.items.length===0,bd.items&&bd.items.length);
 pruef('Sie nennt beide Spiele',Array.isArray(bd.include)&&bd.include.length===2&&bd.include.indexOf(g.id)>=0,
  (bd.include||[]).join(', '));

 /* Jede Aufgabe in allen drei Sprachen - die App wird auch auf
    Englisch und Franzoesisch gespielt. */
 const ohne=g.items.filter(i=>!i.tr||!i.tr.de||!i.tr.en||!i.tr.fr);
 pruef('Jede Aufgabe steht in allen drei Sprachen',ohne.length===0,ohne.map(i=>i.id).join(', '));
 const leer=g.items.filter(i=>['de','en','fr'].some(l=>!(i.tr[l].prompt||'').trim()));
 pruef('Keine Frage ist leer',leer.length===0,leer.map(i=>i.id).join(', '));
 const optFehl=g.items.filter(i=>(i.type==='single'||i.type==='multi')&&
  ['de','en','fr'].some(l=>!Array.isArray(i.tr[l].options)||i.tr[l].options.length!==i.options.length));
 pruef('Die Auswahlen sind in jeder Sprache vollzaehlig',optFehl.length===0,optFehl.map(i=>i.id).join(', '));
 const scharf=g.items.filter(i=>/ß/.test(JSON.stringify(i.tr.de)));
 pruef('Kein scharfes s im Deutschen',scharf.length===0,scharf.map(i=>i.id).join(', '));

 /* Kartenziele muessen im Paket stehen, sonst bleibt die Karte leer. */
 const karten=g.items.filter(i=>i.type==='map');
 pruef('Das Spiel traegt viele Kartenaufgaben',karten.length>=40,karten.length);
 const fehlZiel=karten.filter(i=>!byId[i.map.target]);
 pruef('Jedes Kartenziel gibt es im Weltpaket',fehlZiel.length===0,fehlZiel.map(i=>i.map.target).join(', '));
 const hg=karten.filter(i=>byId[i.map.target]&&(byId[i.map.target].bg||byId[i.map.target].kind==='bg'));
 pruef('Kein Ziel ist blosser Hintergrund',hg.length===0,hg.map(i=>i.map.target).join(', '));
 const ebenen=new Set(karten.map(i=>byId[i.map.target].layer));
 pruef('Die Karte fragt nach mehreren Ebenen',ebenen.size>=4,[...ebenen].join(', '));

 /* ---------- Jetzt im Browser ---------- */
 const b=await chromium.launch();
 for(const [nm,w,hh] of [['iPhone',390,844],['iPad',810,1080]]){
  const pg=await (await b.newContext({viewport:{width:w,height:hh},screen:{width:w,height:hh}})).newPage();
  const perr=[];pg.on('pageerror',e=>perr.push(e.message));
  await pg.goto('http://127.0.0.1:8897/');
  await pg.waitForFunction(()=>typeof BILDER!=='undefined'&&typeof validItem!=='undefined');

  if(nm==='iPhone'){
   const r=await pg.evaluate(async()=>{
    const g=await (await fetch('/g72.json')).json();
    const P=await (await fetch('/world.json')).json();
    P.byId={};for(const L of P.layers)for(const f of L.f){f.layer=L.id;f.kind=L.kind;P.byId[f.id]=f;}
    PACKS.world=P;
    const schlecht=[];
    for(const it of g.items){const kopie=JSON.parse(JSON.stringify(it));
     if(!validItem(kopie))schlecht.push(it.id+' ('+it.type+')');}
    const ohneBild=[...new Set(g.items.filter(i=>i.bild).map(i=>i.bild.id))].filter(id=>!BILDER[id]);
    return {schlecht,ohneBild,mitBild:g.items.filter(i=>i.bild).length};});
   pruef('Die App nimmt jede Aufgabe an',r.schlecht.length===0,r.schlecht.slice(0,6).join(' | '));
   pruef('Jede genannte Abbildung gibt es',r.ohneBild.length===0,r.ohneBild.join(', '));
   pruef('Viele Aufgaben tragen ein Bild',r.mitBild>=15,r.mitBild);

   /* Das Kreisbild: jede Zahl muss in ihrem eigenen Stueck liegen. Lagen
      beide im blauen, las das Bild ab, Wasser sei 29 Prozent. */
   const tor=await pg.evaluate(()=>{
    const host=document.createElement('div');host.style.width='600px';
    document.body.replaceChildren(host);host.appendChild(bildEl({id:'erde-wasser-land'}));
    const svg=host.querySelector('svg'),cx=132,cy=118;
    /* Winkel im Uhrzeigersinn, 0 Grad oben. */
    const winkel=(x,y)=>{let g=Math.atan2(x-cx,-(y-cy))*180/Math.PI;return g<0?g+360:g;};
    const aus={};
    for(const t of svg.querySelectorAll('text')){
     const s=t.textContent.trim();
     if(s==='71 %'||s==='29 %')aus[s]=winkel(+t.getAttribute('x'),+t.getAttribute('y')-6);}
    return aus;});
   /* Blau laeuft von 0 bis 0.71 der Runde, also 0 bis 255.6 Grad. */
   pruef('«71 %» liegt im blauen Stück',tor['71 %']>5&&tor['71 %']<250,
    tor['71 %']===undefined?'fehlt':tor['71 %'].toFixed(1)+' Grad');
   pruef('«29 %» liegt im grünen Stück',tor['29 %']>261&&tor['29 %']<355,
    tor['29 %']===undefined?'fehlt':tor['29 %'].toFixed(1)+' Grad');

   /* Das Einschliessen: zwei Spiele und eine Mappe, die beide nennt.
      Nach dem Sammeln traegt die Mappe alle Aufgaben, und zwar jede
      genau einmal. */
   const sam=await pg.evaluate(()=>{
    const a={id:'aa',title:'A',items:[{id:'x1'},{id:'x2'}],mapPacks:['world']};
    const b={id:'bb',title:'B',items:[{id:'y1'}],mapPacks:['europe']};
    const m={id:'mm',title:'M',items:[],include:['aa','bb']};
    const kreis={id:'kk',title:'K',items:[{id:'z1'}],include:['kk','mm']};
    const liste=[a,b,m,kreis];sammelMappen(liste);
    return {mappe:m.items.map(i=>i.id),pakete:(m.mapPacks||[]).slice().sort(),
     unberuehrt:a.items.length===2&&b.items.length===1,
     kreis:kreis.items.map(i=>i.id)};});
   pruef('Die Mappe sammelt beide Spiele ein',sam.mappe.join(',')==='x1,x2,y1',sam.mappe.join(','));
   pruef('Sie erbt die Kartenpakete',sam.pakete.join(',')==='europe,world',sam.pakete.join(','));
   pruef('Die eingeschlossenen Spiele bleiben unberührt',sam.unberuehrt);
   pruef('Eine Mappe schliesst keine Mappe und sich selbst nicht ein',
    sam.kreis.join(',')==='z1',sam.kreis.join(','));}

  /* Die Abbildungen: passen sie aufs Geraet, und ist die Schrift lesbar? */
  const bil=await pg.evaluate((w)=>{
   const out=[];const host=document.createElement('div');
   host.style.cssText='position:fixed;left:-9999px;top:0;width:'+(w-32)+'px';document.body.appendChild(host);
   for(const id of Object.keys(BILDER)){
    host.replaceChildren();const el=bildEl({id});
    if(!el){out.push([id,0,0,0]);continue;}
    host.appendChild(el);
    const bb=el.getBoundingClientRect();
    const vb=el.getAttribute('viewBox').split(' ').map(Number);
    const fk=bb.width/vb[2];let min=99;
    el.querySelectorAll('text').forEach(t=>{const f=parseFloat(t.getAttribute('font-size')||16)*fk;if(f<min)min=f;});
    out.push([id,Math.round(bb.width),+min.toFixed(1),el.querySelectorAll('text').length]);}
   host.remove();return out;},w);
  pruef('Jede Abbildung wird gezeichnet ('+nm+')',bil.every(x=>x[1]>0),bil.filter(x=>!x[1]).map(x=>x[0]).join(', '));
  pruef('Keine Abbildung ist breiter als das Gerät ('+nm+')',
   bil.every(x=>x[1]<=w-32),bil.filter(x=>x[1]>w-32).map(x=>x[0]).join(', '));
  pruef('Jede Beschriftung ist lesbar ('+nm+')',
   bil.every(x=>x[2]>=11),bil.filter(x=>x[2]<11).map(x=>x[0]+' '+x[2]+' px').join(', '));
  pruef('Jede Abbildung trägt Beschriftung ('+nm+')',bil.every(x=>x[3]>=3),bil.filter(x=>x[3]<3).map(x=>x[0]).join(', '));
  if(perr.length)pruef('Keine Seitenfehler ('+nm+')',false,perr.slice(0,2).join(' | '));
  else pruef('Keine Seitenfehler ('+nm+')',true);}

 await b.close();srv.close();
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
