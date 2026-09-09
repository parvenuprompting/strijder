# Strijder ⚔️

[![CI](https://img.shields.io/badge/CI-github_actions-blue?style=flat-square)](https://github.com/parvenuprompting/strijder/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Privacy](https://img.shields.io/badge/privacy-100%25_local-success?style=flat-square)]()
[![Platform](https://img.shields.io/badge/platform-PWA_(iOS_%2B_Android)-black?style=flat-square)]()
[![Cost](https://img.shields.io/badge/kosten-€0_vast-success?style=flat-square)]()
[![Made by](https://img.shields.io/badge/fabriek-Parvenu-9cf?style=flat-square)]()

**Strijder** — CBR theorie-oefenapp van de Parvenu-fabriek. Train. Slaag. Strijd. ⚔️

Gebouwd voor één leerling: de broer van Tiëndo. Offline bruikbaar (PWA), 100% lokaal, geen accounts, geen cloud, geen advertenties.

## Oefenmodi

- ⚡ **Snelle oefening** — 20 vragen, directe feedback per vraag
- 🎯 **Proefexamen** — CBR-formaat, score aan het eind, teller richting "klaar voor examen"
- 🎯 **Zwakke plekken** — alleen vragen uit hoofdstukken waar je < 70% scoort
- 🔁 **Herhalen** — vragen die je eerder fout had (spaced repetition)
- 👨‍👦 **Samen oefenen (vader-modus)** — vader leest de vraag hardop, laat hem nadenken vóór de opties verschijnen
- 🤖 **AI-trainer** — GLM via OpenRouter: genereert nieuwe quizzen, beantwoordt vragen (optioneel, eigen key, lokaal)

## De Strijder-coach

Na elke sessie één korte coach-spraak: wat ging goed, wat is de zwakste plek, wat is het plan voor morgen. Regel-gebaseerd (geen LLM nodig) — kleine, dagelijkse stappen winnen van veel-en-af-en-toe.

## Klaar-voor-examen meter

3 opeenvolgende proefexamens boven 70% = groen. Gebaseerd op het échte criterium, niet op "aantal vragen beantwoord".

## Privacy

- Geen accounts, geen cloud, geen tracking
- Voortgang in localStorage op het toestel
- AI-trainer optioneel: eigen OpenRouter-key, alleen als de leerling het zelf wil
- 100% geschikt voor een minderjarige

## Techniek

Pure HTML/CSS/JS — geen build-stap, geen framework. PWA met service worker (offline-capaciteit). Vragen in JSON (lokaal).

## Basis

Ontworpen door Genius (Parvenu Agent Family) in opdracht van Tiëndo, voor zijn broertje. Conceptvoorstel v1: Drive (10 sept 2026).
