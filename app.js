// Strijder — CBR theorie-oefening (fase 1 + coach + vader-modus + AI-trainer)
// 100% lokaal. localStorage voor voortgang. OpenRouter alleen voor de AI-trainer (optioneel).

const app = document.querySelector('#app');

// ===== state =====
let VRAGEN = [];
let STATE = {
  scherm: 'hoofd',
  modus: null,
  huidige: 0,
  rij: [],
  antwoorden: [],
  startedAt: null,
};
let vaderOptiesZichtbaar = false;
let BORDEN = [];

// ===== init =====
async function init() {
  VRAGEN = await laadVragen();
  try {
    const rb = await fetch('borden.json');
    BORDEN = (await rb.json()).borden;
  } catch (e) { BORDEN = []; }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
  toonHoofd();
}

async function laadVragen() {
  try {
    const r = await fetch('vragen.json');
    const data = await r.json();
    return data.vragen;
  } catch (e) {
    return [
      {id:'x1', hoofdstuk:'kennis', moeilijkheid:1, vraag:'Binnen de bebouwde kom geldt standaard...', opties:['30 km/u','50 km/u','70 km/u','90 km/u'], juist:1, uitleg:'Bebouwde kom = 50 km/u tenzij anders aangegeven.'}
    ];
  }
}

// ===== stats (localStorage) =====
function stats() {
  try { return JSON.parse(localStorage.getItem('strijder-stats') || '{}'); }
  catch { return {}; }
}
function statsWeg(s) { localStorage.setItem('strijder-stats', JSON.stringify(s)); }

function registreer(antwoord) {
  const s = stats();
  const d = new Date().toISOString().slice(0,10);
  s[antwoord.id] = s[antwoord.id] || {goed:0, fout:0, laatste:null};
  if (antwoord.juist) s[antwoord.id].goed++; else s[antwoord.id].fout++;
  s[antwoord.id].laatste = d;
  statsWeg(s);
}

function pctHoofdstuk(h) {
  const s = stats();
  const ids = VRAGEN.filter(v => v.hoofdstuk === h).map(v => v.id);
  let goed = 0, tot = 0;
  ids.forEach(id => {
    if (s[id]) { goed += s[id].goed; tot += s[id].goed + s[id].fout; }
  });
  return tot ? Math.round(100*goed/tot) : null;
}

function proefGeschiedenis() {
  const s = stats();
  return (s._proeven || []);
}

// ===== rij samenstellen =====
function rijVoor(modus) {
  if (modus === 'snel' || modus === 'vader') {
    return shuffle([...VRAGEN]).slice(0, 20);
  }
  if (modus === 'proef') {
    return shuffle([...VRAGEN]).slice(0, 30);
  }
  if (modus === 'zwak') {
    const s = stats();
    const zwakkeHfd = ['gevarenherkenning','kennis','inzicht'].filter(h => {
      const p = pctHoofdstuk(h);
      return p !== null && p < 70;
    });
    const pool = zwakkeHfd.length ? VRAGEN.filter(v => zwakkeHfd.includes(v.hoofdstuk)) : VRAGEN;
    return shuffle([...pool]).slice(0, 20);
  }
  if (modus === 'herhaal') {
    const s = stats();
    const fout_ids = Object.entries(s).filter(([k,v]) => k !== '_sessies' && k !== '_proeven' && v.fout > 0).map(([k]) => k);
    const pool = VRAGEN.filter(v => fout_ids.includes(v.id));
    return shuffle(pool).slice(0, 20);
  }
  return shuffle([...VRAGEN]).slice(0, 20);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== schermen =====
function toonHoofd() {
  STATE.scherm = 'hoofd';
  const proeven = proefGeschiedenis();
  const laatste3 = proeven.slice(-3);
  const klaar = laatste3.length >= 3 && laatste3.every(p => p.score >= 70);
  const gem = laatste3.length ? Math.round(laatste3.reduce((a,p)=>a+p.score,0)/laatste3.length) : null;
  const pctVul = klaar ? 100 : (gem || 0);

  const kleur = klaar ? 'var(--goed)' : gem >= 70 ? 'var(--goud)' : 'var(--accent)';
  const label = klaar ? 'KLAAR VOOR EXAMEN ⚔️' : gem !== null ? `${gem}% gemiddeld (laatste 3 proeven)` : 'Maak eerst een proefexamen';

  app.innerHTML = `
    <div class="hero">
      <div class="logo">⚔️</div>
      <h1>STRIJDER</h1>
      <div class="sub">Train. Slaag. Strijd.</div>
    </div>

    <div class="meter-card">
      <h2>Klaar voor examen?</h2>
      <div class="meter-bar"><div class="meter-vul" style="width:${pctVul}%; background:${kleur}"></div></div>
      <div class="meter-tekst"><span class="groot" style="color:${kleur}">${label}</span><span>${laatste3.length}/3</span></div>
    </div>

    <div class="modi">
      <button class="modus-knop" onclick="start('snel')">
        <div class="modus-icoon">⚡</div>
        <div><div class="modus-titel">Snelle oefening</div><div class="modus-sub">20 vragen, directe feedback</div></div>
      </button>
      <button class="modus-knop" onclick="start('proef')">
        <div class="modus-icoon">🎯</div>
        <div><div class="modus-titel">Proefexamen</div><div class="modus-sub">CBR-formaat, score aan het eind</div></div>
      </button>
      <button class="modus-knop" onclick="start('zwak')">
        <div class="modus-icoon">🎯</div>
        <div><div class="modus-titel">Zwakke plekken</div><div class="modus-sub">Alleen waar je onder de 70% zit</div></div>
      </button>
      <button class="modus-knop" onclick="start('herhaal')">
        <div class="modus-icoon">🔁</div>
        <div><div class="modus-titel">Herhalen</div><div class="modus-sub">Vragen die je eerder fout had</div></div>
      </button>
      <button class="modus-knop" onclick="toonVader()">
        <div class="modus-icoon">👨‍👦</div>
        <div><div class="modus-titel">Samen oefenen</div><div class="modus-sub">Vader-modus: jullie zitten naast elkaar</div></div>
      </button>
      <button class="modus-knop" onclick="startBorden()">
        <div class="modus-icoon">🛑</div>
        <div><div class="modus-titel">Verkeersborden</div><div class="modus-sub">Borden herkennen — gegarandeerd op het examen</div></div>
      </button>
      <button class="modus-knop" onclick="toonTrainer()">
        <div class="modus-icoon">🤖</div>
        <div><div class="modus-titel">AI-trainer</div><div class="modus-sub">Genereer quizzen, stel vragen</div></div>
      </button>
    </div>
  `;
}

function start(modus) {
  STATE.modus = modus;
  STATE.rij = rijVoor(modus);
  STATE.huidige = 0;
  STATE.antwoorden = [];
  STATE.startedAt = Date.now();
  vaderOptiesZichtbaar = false;
  toonVraag();
}

function toonVraag() {
  const v = STATE.rij[STATE.huidige];
  if (!v) { toonResultaat(); return; }
  const letters = ['A','B','C','D'];
  const vaderModus = STATE.modus === 'vader';

  if (vaderModus && !vaderOptiesZichtbaar) {
    // fase 1 vader-modus: vraag zónder opties — vader leest hardop, kind denkt na
    app.innerHTML = `
      <button class="terug" onclick="toonHoofd()">← Stoppen</button>
      <div class="vraag-header">
        <span class="vraag-tag">${v.hoofdstuk} · niveau ${v.moeilijkheid}</span>
        <span class="vraag-vooruitgang">${STATE.huidige+1}/${STATE.rij.length}</span>
      </div>
      <div class="coach-box"><div class="rol">👨‍👦 VADER-MODUS</div><div class="tekst">Vader leest de vraag voor. Laat hem eerst zélf nadenken en zijn antwoord in eigen woorden geven — vóór de opties verschijnen. Praat erover.</div></div>
      <div class="vraag-tekst">${v.vraag}</div>
      <button class="knop-volgende" onclick="vaderToonOpties()">Antwoord-opties tonen (vader drukt)</button>
    `;
    return;
  }

  app.innerHTML = `
    <button class="terug" onclick="toonHoofd()">← Stoppen</button>
    <div class="vraag-header">
      <span class="vraag-tag">${v.hoofdstuk} · niveau ${v.moeilijkheid}</span>
      <span class="vraag-vooruitgang">${STATE.huidige+1}/${STATE.rij.length}</span>
    </div>
    ${vaderModus ? `<div class="coach-box"><div class="rol">👨‍👦</div><div class="tekst">Vader: laat hem kiezen en vraag wáárom. Eerst praten, dan doorklikken.</div></div>` : ''}
    <div class="vraag-tekst">${v.vraag}</div>
    ${v.opties.map((o, i) => `
      <button class="optie" data-i="${i}" onclick="antwoord(${i})">
        <span class="letter">${letters[i]}</span> ${o}
      </button>
    `).join('')}
  `;
}

function vaderToonOpties() {
  vaderOptiesZichtbaar = true;
  toonVraag();
}

function antwoord(i) {
  const v = STATE.rij[STATE.huidige];
  const juist = i === v.juist;
  STATE.antwoorden.push({id: v.id, juist, gegeven: i});
  registreer({id: v.id, juist});

  document.querySelectorAll('.optie').forEach((el, idx) => {
    if (idx === v.juist) el.classList.add('juist');
    else if (idx === i) el.classList.add('verkeerd');
  });
  document.querySelectorAll('.optie').forEach(el => el.style.pointerEvents = 'none');

  const uitleg = document.createElement('div');
  uitleg.className = 'uitleg-box';
  uitleg.innerHTML = `<strong>${juist ? '✅ Goed!' : '❌ Niet juist.'}</strong> ${v.uitleg}`;
  app.appendChild(uitleg);

  const verder = document.createElement('button');
  verder.className = 'knop-volgende';
  verder.textContent = STATE.huidige + 1 >= STATE.rij.length ? 'Bekijk resultaat' : 'Volgende vraag →';
  verder.onclick = () => { STATE.huidige++; vaderOptiesZichtbaar = false; toonVraag(); };
  app.appendChild(verder);
  verder.scrollIntoView({behavior: 'smooth', block: 'nearest'});
}

function toonResultaat() {
  STATE.scherm = 'resultaat';
  const tot = STATE.antwoorden.length;
  const goed = STATE.antwoorden.filter(a => a.juist).length;
  const pct = tot ? Math.round(100*goed/tot) : 0;
  const klasse = pct >= 80 ? 'goed' : pct >= 60 ? 'mwa' : 'slecht';

  if (STATE.modus === 'proef') {
    const s = stats();
    s._proeven = s._proeven || [];
    s._proeven.push({datum: new Date().toISOString().slice(0,10), score: pct});
    statsWeg(s);
  }

  const coach = strijderCoach(pct, STATE.antwoorden);

  app.innerHTML = `
    <button class="terug" onclick="toonHoofd()">← Terug naar hoofd</button>
    <div class="resultaat-hero">
      <div class="resultaat-score ${klasse}">${pct}%</div>
      <div class="resultaat-sub">${goed} van ${tot} goed — ${STATE.modus === 'proef' ? 'PROEFEXAMEN' : 'oefening'}</div>
    </div>
    <div class="coach-box">
      <div class="rol">⚔️ DE STRIJDER-COACH</div>
      <div class="tekst">${coach}</div>
    </div>
    ${STATE.modus === 'vader' ? `<div class="coach-box"><div class="rol">👨‍👦 VOOR VADER</div><div class="tekst">Praat dit even door: wat ging goed, wat was lastig? Samen beslissen wat morgen de focus is.</div></div>` : ''}
    <button class="knop-volgende" onclick="toonHoofd()">Terug naar hoofd</button>
  `;
}

// ===== Strijder-coach (regel-gebaseerd, 0 tokens) =====
function strijderCoach(pct, antwoorden) {
  const hfdFouten = {};
  antwoorden.filter(a => !a.juist).forEach(a => {
    const v = VRAGEN.find(x => x.id === a.id);
    if (v) hfdFouten[v.hoofdstuk] = (hfdFouten[v.hoofdstuk]||0) + 1;
  });
  const slechtsteHfd = Object.entries(hfdFouten).sort((a,b)=>b[1]-a[1])[0];

  if (pct >= 90) return `Sterk bezig. Vandaag niets groot te verbeteren — morgen 20 vragen herhalen om het vast te houden. Je bent in vorm.`;
  if (pct >= 70) {
    if (slechtsteHfd) return `Goed bezig. Je zwakste punt vandaag: <strong>${slechtsteHfd[0]}</strong> (${slechtsteHfd[1]} fout). Morgen: 20 vragen in de zwakke-plekken-modus, dan zit je op 80%.`;
    return `Goed bezig. Morgen 20 vragen herhalen om het niveau vast te houden.`;
  }
  if (slechtsteHfd) return `Het was zwaar, maar je weet nu waar het scheelt: <strong>${slechtsteHfd[0]}</strong>. Niet méér vragen vandaag — morgen precies 20 vragen uit de zwakke-plekken-modus. Klein en dagelijks wint van veel en af en toe.`;
  return `Zwaar? Prima — je weet nu waar je staat. Morgen 20 vragen, zwakke-plekken-modus. Klein en dagelijks wint.`;
}

// ===== borden-modus =====
function startBorden() {
  if (!BORDEN.length) { alert('Borden nog niet geladen.'); return; }
  STATE.modus = 'snel';  // zelfde flow als snelle oefening (directe feedback)
  STATE.rij = shuffle(BORDEN.map(b => ({
    id: 'bord-' + b.bord.slice(0,20).replace(/\W/g,''),
    hoofdstuk: 'borden (' + (b.categorie||'algemeen') + ')',
    moeilijkheid: 2,
    vraag: '🛑 ' + b.bord,
    opties: b.opties,
    juist: b.juist,
    uitleg: b.uitleg,
  }))).slice(0, 20);
  STATE.huidige = 0;
  STATE.antwoorden = [];
  toonVraag();
}

// ===== vader-modus =====
function toonVader() {
  STATE.modus = 'vader';
  STATE.rij = rijVoor('vader');
  STATE.huidige = 0;
  STATE.antwoorden = [];
  vaderOptiesZichtbaar = false;
  toonVraag();
}

// ===== AI-trainer (OpenRouter, optioneel, key lokaal) =====
function toonTrainer() {
  const key = localStorage.getItem('strijder-or-key') || '';
  app.innerHTML = `
    <button class="terug" onclick="toonHoofd()">← Terug naar hoofd</button>
    <div class="hero" style="padding:20px 0 10px">
      <div class="logo">🤖</div>
      <h1 style="font-size:24px">AI-TRAINER</h1>
      <div class="sub">GLM Flash — maakt quizzen, beantwoordt vragen</div>
    </div>
    <div class="meter-card" style="margin-bottom:16px">
      <h2>OpenRouter API-key (blijft op dit toestel)</h2>
      <input id="or-key" type="password" value="${key}" placeholder="sk-or-..." style="width:100%;background:#0d1322;border:1px solid #1e2742;border-radius:10px;padding:12px;color:var(--ink);font-size:14px;margin-top:10px">
      <button class="knop-volgende" style="margin-top:10px" onclick="bewaarKey()">Key bewaren (lokaal)</button>
    </div>
    <div id="trainer-chat"></div>
    <div class="modi">
      <button class="modus-knop" onclick="trainerActie('genereer')">
        <div class="modus-icoon">📝</div>
        <div><div class="modus-titel">Genereer 10 nieuwe vragen</div><div class="modus-sub">AI maakt een quiz op maat</div></div>
      </button>
      <button class="modus-knop" onclick="trainerActie('uitleg')">
        <div class="modus-icoon">💡</div>
        <div><div class="modus-titel">Stel een vraag</div><div class="modus-sub">Verkeersregels, examentips, alles</div></div>
      </button>
    </div>
  `;
}

function bewaarKey() {
  const v = document.querySelector('#or-key').value.trim();
  if (v) { localStorage.setItem('strijder-or-key', v); alert('Key bewaard — alleen op dit toestel.'); }
}

async function trainerActie(wat) {
  const key = localStorage.getItem('strijder-or-key');
  if (!key) { alert('Vul eerst je OpenRouter-key in.'); return; }
  const chat = document.querySelector('#trainer-chat');
  chat.innerHTML = `<div class="coach-box"><div class="rol">🤖 AI-TRAINER</div><div class="tekst" id="trainer-tekst">Denk na...</div></div>`;
  const tekstEl = document.querySelector('#trainer-tekst');

  const sys = 'Je bent de AI-trainer van Strijder, een CBR theorie-oefenapp voor een jonge Nederlandse leerling die zijn autorijbewijs wil. Antwoord altijd in het Nederlands, kort, motiverend, geen opvoedtoon. Bij "genereer": maak 10 meerkeuzevragen (4 opties, 1 juist) over CBR theorie, met uitleg. Format per vraag: Vraag N: tekst / A) ... B) ... C) ... D) ... / Juist: X / Uitleg: ...';
  let user;
  if (wat === 'genereer') {
    user = 'Genereer 10 nieuwe CBR-oefenvragen (gemengde niveau en hoofdstukken).';
  } else {
    const v = prompt('Wat wil je vragen?');
    user = 'Beantwoord deze vraag van de leerling: ' + (v || 'Geef tips voor het CBR theorie-examen.');
  }

  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: 'z-ai/glm-4.5-flash',
        messages: [{role: 'system', content: sys}, {role: 'user', content: user}],
        max_tokens: 1500,
      }),
    });
    const data = await r.json();
    const antw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '(geen antwoord)';
    tekstEl.innerHTML = antw.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  } catch (e) {
    tekstEl.textContent = 'Fout bij AI-aanroep: ' + e.message;
  }
}

init();
