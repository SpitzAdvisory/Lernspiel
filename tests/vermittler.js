/* Der Vermittler liegt zweimal im Projekt.
   docs/20261108_SPITZ-Lernen_Vermittler_worker.js ist die gepflegte
   Fassung; worker/worker.js ist die, die der Arbeitslauf an Cloudflare
   schickt. Am 19.11.2026 war die zweite drei Aenderungen im Rueckstand:
   drei alte Stimmen statt der einen, kein Weg /agent, kein
   Ziffern-Auftrag. Ein Knopfdruck haette den laufenden Vermittler
   zurueckgedreht und das Sprechen abgestellt.

   Diese Pruefung haelt die beiden Fassungen zeichengleich. Sie braucht
   keinen Browser; gemessen wird am Quelltext im Projekt. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const W=path.join(__dirname,'..');
const QUELLE=path.join(W,'docs','20261108_SPITZ-Lernen_Vermittler_worker.js');
const AUSLIEFERUNG=path.join(W,'worker','worker.js');
const BAUPLAN=path.join(W,'worker','wrangler.toml');
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
const summe=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0,12);

const da=[QUELLE,AUSLIEFERUNG,BAUPLAN].every(f=>fs.existsSync(f));
pruef('Beide Fassungen und der Bauplan liegen im Projekt',da);
if(!da){
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 console.log('NICHT BESTANDEN: 1');process.exit(1);}

const q=fs.readFileSync(QUELLE,'utf8');
const a=fs.readFileSync(AUSLIEFERUNG,'utf8');
pruef('Die ausgelieferte Fassung ist zeichengleich mit der gepflegten',
 q===a, q===a?summe(QUELLE):summe(QUELLE)+' gegen '+summe(AUSLIEFERUNG));

/* Der Bauplan muss auf eben diese Datei zeigen, sonst geht die
   Gleichheit ins Leere. */
const plan=fs.readFileSync(BAUPLAN,'utf8');
pruef('Der Bauplan liefert worker.js aus',/^\s*main\s*=\s*"worker\.js"\s*$/m.test(plan));
pruef('Der Bauplan traegt den Namen des laufenden Vermittlers',
 /^\s*name\s*=\s*"spitz-lernen"\s*$/m.test(plan));

/* Was am 19.11. gefehlt hat, wird einzeln festgehalten - eine blosse
   Gleichheit saegt nicht, dass beide Fassungen aktuell sind. */
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
 !/sk-ant-|xi-[A-Za-z0-9]{20}|['"][A-Za-z0-9_-]{40,}['"]\s*;?\s*\/\/\s*key/i.test(q));
pruef('Die Schluessel kommen aus der Umgebung',
 /env\.ANTHROPIC_KEY/.test(q)&&/env\.ELEVEN_KEY/.test(q));

for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
const schlecht=aus.filter(x=>x[0]==='FAIL').length;
console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
process.exit(schlecht?1:0);
