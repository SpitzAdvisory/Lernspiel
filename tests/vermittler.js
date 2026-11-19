/* Der Vermittler liegt genau einmal im Projekt.
   Bis zum 19.11.2026 lag er zweimal: unter docs/ die gepflegte Fassung,
   unter worker/ die, die der Arbeitslauf an Cloudflare schickt. Die
   zweite war drei Aenderungen im Rueckstand - drei alte Stimmen statt
   der einen, kein Weg /agent, kein Ziffern-Auftrag. Ein Knopfdruck
   haette den laufenden Vermittler zurueckgedreht und das Sprechen
   abgestellt. Die Doppelung ist aufgeloest; worker/worker.js ist die
   einzige Fassung, und der Bauplan daneben liefert sie aus.

   Diese Pruefung haelt das fest. Sie braucht keinen Browser. */
const fs=require('fs'),path=require('path');
const W=path.join(__dirname,'..');
const VERMITTLER=path.join(W,'worker','worker.js');
const BAUPLAN=path.join(W,'worker','wrangler.toml');
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

const da=[VERMITTLER,BAUPLAN].every(f=>fs.existsSync(f));
pruef('Der Vermittler und sein Bauplan liegen im Projekt',da);
if(!da){
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 console.log('NICHT BESTANDEN: 1');process.exit(1);}

const q=fs.readFileSync(VERMITTLER,'utf8');

/* ---------- Nur eine Fassung ----------
   Gesucht wird nicht nach einem Dateinamen, sondern nach dem Inhalt:
   eine Kopie unter einem anderen Namen waere genauso schaedlich. */
const KENNZEICHEN="const OCR_SYSTEM = 'You read handwriting";
const UEBERGEHEN=new Set(['.git','node_modules','.github']);
const treffer=[];
(function suche(ordner){
 for(const e of fs.readdirSync(ordner,{withFileTypes:true})){
  if(UEBERGEHEN.has(e.name))continue;
  const p=path.join(ordner,e.name);
  if(e.isDirectory()){suche(p);continue;}
  if(!e.isFile())continue;
  if(!/\.(js|mjs|cjs|ts|txt|md)$/i.test(e.name))continue;
  if(p===path.join(__dirname,'vermittler.js'))continue;
  if(fs.statSync(p).size>400000)continue;
  if(fs.readFileSync(p,'utf8').indexOf(KENNZEICHEN)>=0)
   treffer.push(path.relative(W,p).replace(/\\/g,'/'));}})(W);
pruef('Der Vermittler steht nur an einer Stelle',
 treffer.length===1&&treffer[0]==='worker/worker.js',treffer.join(', ')||'keine');

/* ---------- Der Bauplan zeigt darauf ---------- */
const plan=fs.readFileSync(BAUPLAN,'utf8');
pruef('Der Bauplan liefert worker.js aus',/^\s*main\s*=\s*"worker\.js"\s*$/m.test(plan));
pruef('Der Bauplan traegt den Namen des laufenden Vermittlers',
 /^\s*name\s*=\s*"spitz-lernen"\s*$/m.test(plan));

/* ---------- Was am 19.11. gefehlt hat ---------- */
const WEGE=['/stt','/ocr','/tts','/frage','/agent'];
for(const w of WEGE)
 pruef('Der Weg '+w+' steht im Verteiler',
  q.indexOf("url.pathname === '"+w+"'")>=0);

pruef('Der Ziffern-Auftrag ist da',/const OCR_ZIFFERN = '/.test(q));
pruef('Er wird an /ocr benutzt',
 /system: \(ein && ein\.modus === 'ziffern'\) \? OCR_ZIFFERN : OCR_SYSTEM,/.test(q));
pruef('Auch die Anrede an das Modell unterscheidet die beiden Faelle',
 /\? 'Read the digits\.' : 'Read the handwriting\.'/.test(q));

/* Eine Stimme fuer alle drei Sprachen, von Johannes ausgesucht. */
const st=q.match(/const STIMMEN = \{([^}]+)\}/);
const stimmen=st?(st[1].match(/'([^']+)'/g)||[]).map(x=>x.slice(1,-1)):[];
pruef('Drei Sprachen tragen eine Stimme',
 stimmen.length===3&&new Set(stimmen).size===1,stimmen.join(', '));

/* Ein Schluessel gehoert ins Konto, nie in den Quelltext. */
pruef('Kein Schluessel steht im Klartext',
 !/sk-ant-|xi-[A-Za-z0-9]{20}/i.test(q));
pruef('Die Schluessel kommen aus der Umgebung',
 /env\.ANTHROPIC_KEY/.test(q)&&/env\.ELEVEN_KEY/.test(q));

for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
const schlecht=aus.filter(x=>x[0]==='FAIL').length;
console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
process.exit(schlecht?1:0);
