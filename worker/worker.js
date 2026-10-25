/* SPITZ Lernen - Vermittler
 *
 * Die App laeuft auf GitHub Pages und haelt selbst keine Schluessel. Sie
 * schickt Tonaufnahme oder Bild hierher; dieser Worker haengt den Schluessel
 * an und gibt nur das Ergebnis zurueck. Im Geraet steht nie ein Schluessel,
 * sondern nur die Adresse dieses Workers.
 *
 * Secrets im Cloudflare-Konto (nicht im Code):
 *   ELEVEN_KEY     - Schluessel von ElevenLabs, fuer das Zuhoeren
 *   ANTHROPIC_KEY  - Schluessel von Anthropic, fuer die Handschrift
 * Optional:
 *   ZAEHLER        - KV-Namensraum fuer die Tagesgrenze
 *   TAGESGRENZE    - Zahl der erlaubten Anfragen je Tag (Standard 500)
 */

const ERLAUBT = ['https://spitzadvisory.github.io'];
const SCRIBE = ['scribe_v2', 'scribe_v1'];
const OCR_SYSTEM = 'You read handwriting from an image. Reply with the handwritten text and nothing else: no quotes, no explanation, no correction of spelling or grammar. Keep accents exactly as written. If several lines are written, separate them with a single newline. If the image holds no readable handwriting, reply with the single word EMPTY.';

function kopf(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
function antwort(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'content-type': 'application/json' }, kopf(origin)),
  });
}

/* Tagesgrenze. Ohne KV-Namensraum entfaellt sie; der Herkunftsnachweis
   bleibt die einzige Schranke. */
async function ueberGrenze(env) {
  if (!env.ZAEHLER) return false;
  const grenze = parseInt(env.TAGESGRENZE || '500', 10);
  const tag = new Date().toISOString().slice(0, 10);
  const n = parseInt((await env.ZAEHLER.get('tag:' + tag)) || '0', 10) + 1;
  await env.ZAEHLER.put('tag:' + tag, String(n), { expirationTtl: 172800 });
  return n > grenze;
}

async function zuhoeren(request, env, origin) {
  if (!env.ELEVEN_KEY) return antwort({ error: 'ELEVEN_KEY fehlt' }, 500, origin);
  const ein = await request.formData();
  const datei = ein.get('file');
  if (!datei) return antwort({ error: 'keine Datei' }, 400, origin);

  let letzter = '';
  for (const modell of SCRIBE) {
    const fd = new FormData();
    fd.append('model_id', modell);
    fd.append('language_code', String(ein.get('language_code') || 'fra'));
    fd.append('file', datei, 'aufnahme.wav');
    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVEN_KEY },
      body: fd,
    });
    const data = await r.json().catch(() => null);
    if (r.ok) return antwort({ text: String((data && data.text) || '').trim() }, 200, origin);
    letzter = (data && data.detail && (data.detail.message || data.detail)) || ('HTTP ' + r.status);
    if (typeof letzter !== 'string') letzter = JSON.stringify(letzter);
    if (!/model/i.test(letzter)) break;   /* nur ein falscher Modellname lohnt den zweiten Versuch */
  }
  return antwort({ error: String(letzter).slice(0, 200) }, 502, origin);
}

async function lesen(request, env, origin) {
  if (!env.ANTHROPIC_KEY) return antwort({ error: 'ANTHROPIC_KEY fehlt' }, 500, origin);
  const ein = await request.json().catch(() => null);
  const b64 = ein && ein.image;
  if (!b64) return antwort({ error: 'kein Bild' }, 400, origin);
  const model = (ein && ein.model) || 'claude-sonnet-5';

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      system: OCR_SYSTEM,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: b64 } },
        { type: 'text', text: 'Read the handwriting.' },
      ] }],
    }),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    const m = (data && data.error && data.error.message) || ('HTTP ' + r.status);
    return antwort({ error: String(m).slice(0, 200) }, 502, origin);
  }
  const txt = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  return antwort({ text: /^EMPTY$/i.test(txt) ? '' : txt }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      if (ERLAUBT.indexOf(origin) < 0) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: kopf(origin) });
    }
    if (ERLAUBT.indexOf(origin) < 0) return new Response('verboten', { status: 403 });
    if (request.method !== 'POST') return new Response('nur POST', { status: 405 });
    if (await ueberGrenze(env)) return antwort({ error: 'Tagesgrenze erreicht' }, 429, origin);

    if (url.pathname === '/stt') return zuhoeren(request, env, origin);
    if (url.pathname === '/ocr') return lesen(request, env, origin);
    return antwort({ error: 'unbekannter Pfad' }, 404, origin);
  },
};
