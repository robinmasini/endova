import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, FileCheck2, Copy, Check, RotateCcw, ChevronRight } from './icones.js';
import Jalon from './Jalon.jsx';
import { store } from '../lib/store.js';
import { etapesDe } from '../lib/examens.js';
import { traitement, comorbidite } from '../lib/terrain.js';
import { anesthesieDe, examenDe, protocoleDe } from '../lib/patient.js';

/**
 * L'enregistreur de consultation et son compte rendu.
 *
 * L'enregistrement est réel (micro du navigateur, onde tirée du signal). La
 * transcription demande un service de reconnaissance vocale hébergé HDS, qui
 * n'est pas encore branché : en attendant, le brouillon est rédigé depuis le
 * dossier du patient et laisse vide ce que seule la voix du médecin apporte.
 *
 * Pendant la rédaction, le glyphe Endova se remplit de couleur au rythme des
 * rubriques : le compte rendu « se remplit tout seul », et ça se voit.
 */

const NB_BARRES = 40;
const PAS_REMPLISSAGE = 550;
export const DEGRADE = 'linear-gradient(90deg, #2B3492 0%, #6A1FD1 55%, #9B19F5 100%)';

export function brouillon(p) {
  const ex = examenDe(p);
  const anesth = anesthesieDe(p);
  const protocole = protocoleDe(p);
  const traitements = (p.terrain.traitements ?? []).map(traitement).filter(Boolean);
  const comorbidites = (p.terrain.comorbidites ?? []).map(comorbidite).filter(Boolean).map((c) => c.label);
  const antecedents = [p.terrain.antecedents, ...comorbidites].filter(Boolean).join('. ');
  const critiques = traitements.filter((t) => t.critique);

  const conduite = [];
  if (anesth.cpa) conduite.push('Consultation d’anesthésie.');
  if (protocole) conduite.push(`Préparation colique : ${protocole.nom}${p.examen.renforce ? ', régime renforcé sur 5 jours' : ''}.`);
  if (critiques.length) conduite.push(`${critiques.map((t) => t.label).join(', ')} : arrêt selon la consigne du prescripteur.`);
  conduite.push('Suivi préopératoire par SMS programmé jusqu’au jour de l’examen.');

  return [
    { cle: 'motif', titre: 'Motif', texte: `${p.examen.indication}.` },
    { cle: 'antecedents', titre: 'Antécédents', texte: antecedents ? `${antecedents}.` : 'Pas d’antécédent notable.' },
    {
      cle: 'traitements',
      titre: 'Traitements',
      texte: traitements.length ? `${traitements.map((t) => `${t.label} (${t.exemples.split(',')[0]})`).join('. ')}.` : 'Aucun traitement à risque.',
    },
    { cle: 'allergies', titre: 'Allergies', texte: p.terrain.allergies || 'Aucune allergie connue.' },
    { cle: 'examen', titre: 'Examen clinique', texte: '' },
    { cle: 'conclusion', titre: 'Conclusion', texte: `Indication de ${ex.label.toLowerCase()} (${anesth.label.toLowerCase()}).` },
    { cle: 'conduite', titre: 'Conduite à tenir', texte: conduite.join(' ') },
  ];
}

const TITRES = ['Motif', 'Antécédents', 'Traitements', 'Allergies', 'Examen clinique', 'Conclusion', 'Conduite à tenir'];

const chrono = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const ETATS = {
  pret: { label: 'Prêt à enregistrer', classe: 'bg-[#EEEAF5] text-[#5B5470]', point: 'bg-[#9A93AE]' },
  enregistrement: { label: 'Enregistrement', classe: 'bg-rose-50 text-rose-700', point: 'bg-rose-500 animate-pulse' },
  redaction: { label: 'Rédaction', classe: 'bg-[#F1E8FD] text-[#6A1FD1]', point: 'bg-[#9B19F5] animate-pulse' },
  termine: { label: 'Prêt à signer', classe: 'bg-emerald-50 text-emerald-700', point: 'bg-emerald-500' },
};

/** L'écran de chargement : le glyphe se colore de bas en haut, rubrique après rubrique. */
function Remplissage({ remplies }) {
  const pct = Math.round((remplies / TITRES.length) * 100);
  const glyphe = `${import.meta.env.BASE_URL}endova-glyphe.png`;
  return (
    <div className="flex flex-col items-center gap-6 py-2" role="status" aria-live="polite">
      <div className="relative grid size-44 place-items-center">
        <span aria-hidden="true" className="absolute inset-3 animate-pulse rounded-full bg-[radial-gradient(circle,rgba(155,25,245,0.22)_0%,rgba(155,25,245,0)_70%)]" />
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full [animation-duration:2.4s]"
          style={{
            background: 'conic-gradient(from 0deg, rgba(155,25,245,0) 0deg, #9B19F5 120deg, #2B3492 240deg, rgba(43,52,146,0) 360deg)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
          }}
        />
        <div className="relative h-28 w-20">
          <img src={glyphe} alt="" className="absolute inset-0 size-full object-contain opacity-[0.16] grayscale" draggable={false} />
          <img
            src={glyphe}
            alt=""
            className="absolute inset-0 size-full object-contain transition-[clip-path] duration-500 ease-out"
            style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}
            draggable={false}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="font-marque text-lg font-extrabold uppercase tracking-wide text-[#13112A]">Rédaction du compte rendu</p>
        <p className="mt-1 text-sm text-[#6B6480]">Endova remplit chaque rubrique à partir de la consultation.</p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6E0F0]">
        <span className="block h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: DEGRADE }} />
      </div>

      <ol className="flex w-full flex-col gap-2">
        {TITRES.map((t, i) => {
          const fait = i < remplies;
          const courant = i === remplies;
          return (
            <li
              key={t}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
                courant ? 'border-[#D9C6F7] bg-white' : fait ? 'border-[#EFE8FB] bg-[#FBF9FE]' : 'border-[#E9E4F1]'
              }`}
            >
              {fait ? (
                <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[#6A1FD1] text-white"><Check size={12} strokeWidth={3.2} /></span>
              ) : courant ? (
                <span aria-hidden="true" className="flex w-[22px] shrink-0 justify-center gap-[3px]">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-[5px] animate-pulse rounded-full bg-[#9B19F5]" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              ) : (
                <span className="size-[22px] shrink-0 rounded-full border-2 border-[#DDD6EA]" />
              )}
              <span className={`text-[15px] font-semibold ${fait || courant ? 'text-[#13112A]' : 'text-[#A39CB5]'}`}>{t}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function Dictee({ patient, lienSuivi = true }) {
  const [phase, setPhase] = useState('pret');
  const [secondes, setSecondes] = useState(0);
  const [niveaux, setNiveaux] = useState(() => Array(NB_BARRES).fill(0));
  const [audio, setAudio] = useState(null);
  const [micRefuse, setMicRefuse] = useState(false);
  const [remplies, setRemplies] = useState(0);
  const [cr, setCr] = useState(null);
  const [signe, setSigne] = useState(false);
  const [copie, setCopie] = useState(false);
  const res = useRef({});

  function liberer() {
    const r = res.current;
    cancelAnimationFrame(r.raf);
    clearInterval(r.tic);
    clearInterval(r.remplissage);
    r.flux?.getTracks().forEach((t) => t.stop());
    r.ctx?.close().catch(() => {});
    res.current = {};
  }

  useEffect(() => liberer, []);

  // Un autre patient : on repart d'une page blanche.
  useEffect(() => {
    liberer();
    setPhase('pret');
    setSecondes(0);
    setNiveaux(Array(NB_BARRES).fill(0));
    setAudio(null);
    setCr(null);
    setSigne(false);
  }, [patient?.id]);

  async function demarrer() {
    liberer();
    setAudio(null);
    setCr(null);
    setSigne(false);
    setSecondes(0);
    const r = res.current;
    const debut = Date.now();
    r.tic = setInterval(() => setSecondes(Math.floor((Date.now() - debut) / 1000)), 250);
    setPhase('enregistrement');

    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      r.flux = flux;
      const ctx = new AudioContext();
      r.ctx = ctx;
      const analyse = ctx.createAnalyser();
      analyse.fftSize = 256;
      ctx.createMediaStreamSource(flux).connect(analyse);
      const donnees = new Uint8Array(analyse.frequencyBinCount);
      const boucle = () => {
        analyse.getByteFrequencyData(donnees);
        const pas = Math.floor(donnees.length / NB_BARRES);
        setNiveaux(Array.from({ length: NB_BARRES }, (_, i) => donnees[i * pas] / 255));
        r.raf = requestAnimationFrame(boucle);
      };
      boucle();
      if (typeof MediaRecorder !== 'undefined') {
        const morceaux = [];
        const rec = new MediaRecorder(flux);
        rec.ondataavailable = (e) => morceaux.push(e.data);
        rec.onstop = () => setAudio(URL.createObjectURL(new Blob(morceaux, { type: rec.mimeType })));
        rec.start();
        r.rec = rec;
      }
      setMicRefuse(false);
    } catch {
      // Micro refusé ou absent : l'écran reste démontrable, l'onde est simulée.
      setMicRefuse(true);
      const boucle = () => {
        const t = Date.now() / 160;
        setNiveaux(Array.from({ length: NB_BARRES }, (_, i) => 0.25 + 0.6 * Math.abs(Math.sin(t + i * 0.55)) * Math.random()));
        r.raf = requestAnimationFrame(boucle);
      };
      boucle();
    }
  }

  function arreter() {
    if (res.current.rec?.state === 'recording') res.current.rec.stop();
    liberer();
    setNiveaux(Array(NB_BARRES).fill(0));
    setRemplies(0);
    setPhase('redaction');
    const r = res.current;
    let n = 0;
    r.remplissage = setInterval(() => {
      n += 1;
      if (n > TITRES.length) {
        clearInterval(r.remplissage);
        setCr(brouillon(patient));
        setPhase('termine');
      } else {
        setRemplies(n);
      }
    }, PAS_REMPLISSAGE);
  }

  function signer() {
    const texte = cr.map((r) => `${r.titre} : ${r.texte || '—'}`).join('\n');
    store.journaliser(patient.id, {
      type: 'compte_rendu',
      titre: 'Compte rendu de consultation signé',
      detail: texte,
      rubriques: cr.map(({ titre, texte: t }) => ({ titre, texte: t })),
    });
    setSigne(true);
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(cr.map((r) => `${r.titre.toUpperCase()}\n${r.texte || '—'}`).join('\n\n'));
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setCopie(false);
    }
  }

  const etat = ETATS[phase];
  const enCours = phase === 'enregistrement';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-6 rounded-[26px] border border-[#ECE8F3] bg-white p-6 text-[#13112A] shadow-[0_14px_34px_-22px_rgba(43,52,146,0.4)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-marque text-lg font-extrabold uppercase tracking-wide">1. Pendant votre consultation</p>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${etat.classe}`}>
            <span className={`size-2 rounded-full ${etat.point}`} /> {etat.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-7 sm:justify-start">
          <button
            type="button"
            onClick={enCours ? arreter : demarrer}
            disabled={phase === 'redaction' || !patient}
            aria-label={enCours ? 'Terminer l’enregistrement' : phase === 'termine' ? 'Nouvel enregistrement' : 'Démarrer l’enregistrement'}
            className={`relative grid size-32 shrink-0 place-items-center rounded-full text-white transition-transform active:scale-95 disabled:opacity-60 ${enCours ? '' : 'hover:scale-[1.03]'}`}
            style={{ background: 'linear-gradient(140deg, #9B19F5 0%, #6A1FD1 55%, #2B3492 100%)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), 0 18px 36px -14px rgba(106,31,209,0.6)' }}
          >
            {enCours ? <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-[#9B19F5]/25 [animation-duration:1.8s]" /> : null}
            {enCours ? (
              <span className="relative size-10 rounded-lg bg-white" />
            ) : phase === 'termine' ? (
              <RotateCcw size={42} className="relative" />
            ) : phase === 'redaction' ? (
              <FileCheck2 size={44} className="relative animate-pulse" />
            ) : (
              <Mic size={46} className="relative" />
            )}
          </button>

          <div className="flex min-w-0 flex-1 basis-64 flex-col gap-3.5">
            <p className="font-mono text-5xl leading-none tracking-wider tabular-nums text-[#13112A]">{chrono(secondes)}</p>
            <div className="flex h-14 items-center gap-[5px]" aria-hidden="true">
              {niveaux.map((n, i) => (
                <span
                  key={i}
                  className="w-[5px] rounded-full transition-[height] duration-75"
                  style={{ height: `${Math.max(6, n * 56)}px`, background: enCours ? '#9B19F5' : '#DDD6EA' }}
                />
              ))}
            </div>
            <p className="text-sm text-[#6B6480]">
              {enCours
                ? 'Parlez normalement : Endova écoute la consultation.'
                : phase === 'redaction'
                  ? 'Endova rédige le compte rendu…'
                  : phase === 'termine'
                    ? 'Relisez, complétez si besoin, puis signez.'
                    : 'Touchez le micro au début de la consultation.'}
            </p>
          </div>
        </div>

        {micRefuse && enCours ? (
          <p className="rounded-xl bg-[#F6F4FA] px-4 py-3 text-xs text-[#6B6480]">
            Le micro n’est pas accessible dans ce navigateur : l’enregistrement continue en mode démonstration.
          </p>
        ) : null}

        {audio ? (
          <div className="flex flex-col gap-2 border-t border-[#ECE8F3] pt-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6B6480]">Enregistrement de la consultation</p>
            <audio controls src={audio} className="w-full" />
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-[26px] border border-[#ECE8F3] bg-white p-6 text-[#13112A] shadow-[0_14px_34px_-22px_rgba(43,52,146,0.4)] sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="font-marque text-lg font-extrabold uppercase tracking-wide">2. Compte rendu</p>
          <span className="grid size-10 place-items-center rounded-xl bg-[#F1ECFA] text-[#2B3492]">
            <FileCheck2 size={19} />
          </span>
        </div>

        {phase === 'redaction' ? (
          <Remplissage remplies={remplies} />
        ) : cr ? (
          <>
            {cr.map((r, i) => (
              <label key={r.cle} className="flex flex-col gap-1.5 border-b border-[#ECE8F3] pb-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6A1FD1]">{r.titre}</span>
                <textarea
                  value={r.texte}
                  rows={r.cle === 'conduite' ? 3 : 2}
                  disabled={signe}
                  placeholder={r.cle === 'examen' ? 'Dicté pendant la consultation — à compléter' : ''}
                  onChange={(e) => setCr(cr.map((x, j) => (j === i ? { ...x, texte: e.target.value } : x)))}
                  className="resize-none rounded-lg border border-transparent bg-transparent p-1 text-[14.5px] leading-relaxed text-[#2A2640] outline-none placeholder:italic placeholder:text-slate-400 hover:border-[#ECE8F3] focus:border-[#C9A0FF] disabled:opacity-80"
                />
              </label>
            ))}

            {lienSuivi ? (
              <Link
                to={`/patients/${patient.id}?onglet=sms`}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white transition-[filter] hover:brightness-110"
                style={{ background: DEGRADE }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">CR rédigé + suivi SMS programmé</span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {etapesDe(patient).map((e) => <Jalon key={e.id} taille="xs">{e.cle(patient)}</Jalon>)}
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0" />
              </Link>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={signer}
                disabled={signe}
                className="inline-flex min-h-12 flex-1 basis-40 items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-[filter] hover:brightness-110 disabled:hover:brightness-100"
                style={{ background: signe ? '#059669' : DEGRADE }}
              >
                {signe ? <><Check size={16} /> Signé et versé au dossier</> : 'Valider et signer'}
              </button>
              <button
                type="button"
                onClick={copier}
                className="inline-flex min-h-12 flex-1 basis-40 items-center justify-center gap-2 rounded-full border-[1.5px] border-[#D8D1E6] bg-white text-sm font-semibold text-[#13112A] hover:bg-[#F7F4FA]"
              >
                {copie ? <><Check size={16} /> Copié</> : <><Copy size={15} /> Copier le texte</>}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {TITRES.map((t) => (
              <div key={t} className="flex flex-col gap-2 border-b border-[#ECE8F3] pb-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6A1FD1]/70">{t}</span>
                <span className="flex flex-col gap-1.5">
                  <span className="h-2.5 w-[92%] rounded-full bg-[#F1EDF7]" />
                  <span className="h-2.5 w-[64%] rounded-full bg-[#F1EDF7]" />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
