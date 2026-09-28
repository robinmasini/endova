import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProgression, entre, phase, adoucir, useAnimationsReduites } from './useProgression.js';
import { ETAPES as CATALOGUE } from '../lib/examens.js';

// Échéancier de la coloscopie, le cas le plus complet, pour la démonstration.
const EXEMPLE = { examen: { renforce: false, schema: 'FRACTIONNE' } };
const ETAPES = ['j7', 'j3', 'j1', 'h5', 'h2'].map((id) => ({ ...CATALOGUE[id], cle: CATALOGUE[id].cle(EXEMPLE) }));
const HEURES = { j7: '10h00', j3: '09h00', j1: '18h00', h5: 'H-5', h2: 'H-2' };
import {
  AlertTriangle, ArrowLeft, Banknote, Check, ChevronRight, ListChecks,
  PhoneCall, ShieldCheck, Timer, UsersRound,
} from '../components/icones.js';

/* ------------------------------------------------------------------ Socle */

/** Section plein écran qui expose sa progression de défilement à ses enfants. */
function Scene({ enfants, hauteur = '220vh', id, fond }) {
  const ancre = useRef(null);
  const t = useProgression(ancre);
  const reduites = useAnimationsReduites();
  // Animations coupées : on fige à mi-course, l'état le plus lisible.
  return (
    <section ref={ancre} id={id} style={{ height: hauteur }} className="relative">
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        {fond ? fond(reduites ? 0.55 : t) : null}
        {enfants(reduites ? 0.55 : t)}
      </div>
    </section>
  );
}

/** Surface Liquid Glass de la présentation : plus contrastée que celle de l'app. */
function Verre({ children, className = '', style }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/55 backdrop-blur-2xl backdrop-saturate-[180%] ${className}`}
      style={{
        boxShadow:
          'inset 0 1px 0 0 rgba(255,255,255,0.95), 0 2px 6px 0 rgba(5,28,78,0.05), 0 28px 60px -18px rgba(5,28,78,0.22)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Oeil({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-magenta">{children}</p>
  );
}

/* ------------------------------------------------------------------ Scènes */

/**
 * Emplacements média. Déposer le fichier suffit à l'activer : le dégradé dessous
 * reste le rendu de repli, il n'y a donc jamais de cadre vide à l'écran.
 */
const MEDIA = {
  bloc: '/media/bloc.mp4',
  soignants: '/media/soignants.mp4',
};

/** Plan vidéo plein cadre, silencieux et en boucle. Absent, on ne voit que le fond. */
function Plan({ src, opacite = 0.55, className = '' }) {
  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 size-full object-cover ${className}`}
      style={{ opacity: opacite }}
    />
  );
}

/** Fond du cold open : bloc plongé dans le noir, un halo de scialytique au centre. */
function FondBloc(t) {
  const halo = entre(adoucir(phase(t, 0, 0.6)), 0.5, 1);
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#03102B]">
      <Plan src={MEDIA.bloc} opacite={0.42} />
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(42rem 30rem at 50% 32%, rgba(214,228,255,${0.16 * halo}), transparent 68%),` +
            'radial-gradient(60rem 40rem at 12% 96%, rgba(147,43,156,0.2), transparent 62%),' +
            'radial-gradient(48rem 38rem at 92% 8%, rgba(11,42,99,0.55), transparent 60%)',
        }}
      />
    </div>
  );
}

/** Fond du constat : le noir se lève vers la lumière, le récit bascule avec lui. */
function FondConstat(t) {
  const jour = adoucir(phase(t, 0.86, 1));
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: '#03102B' }}>
      <Plan src={MEDIA.soignants} opacite={entre(adoucir(phase(t, 0, 0.3)), 0.12, 0.36)} />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(56rem 40rem at 16% 4%, rgba(147,43,156,0.24), transparent 62%),' +
            'radial-gradient(52rem 44rem at 88% 92%, rgba(11,42,99,0.5), transparent 60%)',
          opacity: entre(jour, 1, 0),
        }}
      />
      <div className="absolute inset-0 bg-[#F4F5FA]" style={{ opacity: entre(jour, 0, 1) }} />
    </div>
  );
}

function Ouverture(t) {
  const sortie = adoucir(phase(t, 0.68, 1));
  return (
    <div
      className="relative mx-auto w-full max-w-4xl px-6 text-center"
      style={{ opacity: entre(sortie, 1, 0), transform: `translateY(${entre(sortie, 0, -50)}px)` }}
    >
      <p
        className="apparition font-marque text-5xl font-semibold tabular-nums text-white/90 sm:text-7xl"
        style={{ animationDelay: '0.1s' }}
      >
        08:30
      </p>
      <p
        className="apparition mt-3 text-[11px] uppercase tracking-[0.3em] text-white/45"
        style={{ animationDelay: '0.3s' }}
      >
        Salle d’endoscopie · deuxième patient
      </p>

      <h1
        className="apparition mt-10 text-balance text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl"
        style={{ animationDelay: '0.5s' }}
      >
        Le patient est endormi.
        <span className="mt-2 block text-[#E6A8F0]">Le côlon n’est pas propre.</span>
      </h1>

      <p
        className="apparition mx-auto mt-7 max-w-xl text-balance text-base leading-relaxed text-white/70 sm:text-lg"
        style={{ animationDelay: '0.72s' }}
      >
        Vous l’apprenez maintenant. Vous auriez pu le savoir hier soir, quand il a
        arrêté sa purge au deuxième verre.
      </p>

      <p
        className="apparition mt-14 text-[11px] uppercase tracking-[0.2em] text-white/35"
        style={{ animationDelay: '1s' }}
      >
        Faites défiler
      </p>
    </div>
  );
}

/** Révélation de la marque : elle arrive comme réponse, après le constat. */
function Revelation(t) {
  const a = adoucir(phase(t, 0.12, 0.5));
  const b = adoucir(phase(t, 0.38, 0.78));
  return (
    <div className="mx-auto w-full max-w-4xl px-6 text-center" style={{ perspective: '1200px' }}>
      <div
        className="brillance relative mx-auto block w-fit overflow-hidden rounded-[2rem]"
        style={{
          transform: `translate3d(0, ${entre(a, 46, 0)}px, ${entre(a, -340, 0)}px) rotateX(${entre(a, 30, 0)}deg)`,
          opacity: entre(a, 0, 1),
        }}
      >
        <img src={`${import.meta.env.BASE_URL}endova-mark.png`} alt="" className="size-28 rounded-[2rem] sm:size-36" />
      </div>

      <p
        className="mx-auto mt-6 flex w-28 justify-between font-marque text-sm font-semibold text-navy sm:w-36 sm:text-lg"
        aria-label="Endova"
        style={{ opacity: entre(phase(t, 0.3, 0.55), 0, 1) }}
      >
        {[...'ENDOVA'].map((l, i) => (
          <span key={`${l}-${i}`} aria-hidden="true">{l}</span>
        ))}
      </p>

      <h2
        className="mt-10 text-balance text-2xl font-bold leading-tight tracking-tight text-navy sm:text-4xl"
        style={{ transform: `translateY(${entre(b, 26, 0)}px)`, opacity: entre(b, 0, 1) }}
      >
        Douze heures plus tôt, il vous l’aurait dit.
      </h2>
      <p
        className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-slate-700 sm:text-lg"
        style={{ opacity: entre(phase(t, 0.52, 0.85), 0, 1) }}
      >
        Endova accompagne chaque patient par SMS, de J-7 à H-2, et remonte l’écart
        au moment où il est encore rattrapable.
      </p>
    </div>
  );
}

function Probleme(t) {
  const chiffres = [
    { valeur: 25, suffixe: ' %', libelle: 'des coloscopies jugées mal préparées', detail: 'Score de Boston insuffisant' },
    { valeur: 3, prefixe: '× ', libelle: 'de risque de manquer un adénome', detail: 'Adenoma miss rate' },
    { valeur: 1, suffixe: ' patient', libelle: 'à reconvoquer par examen à refaire', detail: 'Nouvelle préparation, nouveau créneau, nouvelle anesthésie' },
  ];
  const sortie = adoucir(phase(t, 0.82, 0.97));
  return (
    <div
      className="relative mx-auto w-full max-w-6xl px-6"
      style={{ perspective: '1400px', opacity: entre(sortie, 1, 0) }}
    >
      <div className="text-center" style={{ opacity: entre(phase(t, 0.04, 0.26), 0, 1) }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E6A8F0]">
          Le coût du silence
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Entre la consultation et l’examen, personne ne sait où en est le patient.
        </h2>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {chiffres.map((c, i) => {
          const q = adoucir(phase(t, 0.18 + i * 0.12, 0.58 + i * 0.12));
          const compte = Math.round(entre(q, 0, c.valeur));
          return (
            <div
              key={c.libelle}
              className="rounded-3xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-2xl"
              style={{
                transform: `translate3d(0, ${entre(q, 60, 0)}px, ${entre(q, -260, 0)}px) rotateY(${entre(q, -16, 0)}deg)`,
                opacity: entre(q, 0, 1),
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.18), 0 30px 60px -20px rgba(0,0,0,0.6)',
              }}
            >
              <p className="text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl">
                {c.prefixe}{compte}{c.suffixe}
              </p>
              <p className="mt-3 text-sm font-medium leading-snug text-white/85">{c.libelle}</p>
              <p className="mt-1.5 text-xs text-white/50">{c.detail}</p>
            </div>
          );
        })}
      </div>

      <p
        className="mx-auto mt-10 max-w-lg text-balance text-center text-sm leading-relaxed text-white/60"
        style={{ opacity: entre(phase(t, 0.62, 0.8), 0, 1) }}
      >
        Aucun de ces écarts n’est découvert trop tard par négligence. Ils sont
        découverts trop tard parce que personne n’a demandé.
      </p>
    </div>
  );
}

function Echeancier(t) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6" style={{ perspective: '1600px' }}>
      <div className="text-center" style={{ opacity: entre(phase(t, 0.02, 0.22), 0, 1) }}>
        <Oeil>L’échéancier</Oeil>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-2xl font-bold tracking-tight text-navy sm:text-4xl">
          Cinq messages, aux cinq moments qui décident de l’examen.
        </h2>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-5">
        {ETAPES.map((etape, i) => {
          const p = adoucir(phase(t, 0.16 + i * 0.1, 0.56 + i * 0.1));
          return (
            <Verre
              key={etape.id}
              className="p-5"
              style={{
                transform: `translate3d(${entre(p, i % 2 ? 60 : -60, 0)}px, ${entre(p, 70, 0)}px, ${entre(p, -420, 0)}px) rotateX(${entre(p, 24, 0)}deg)`,
                opacity: entre(p, 0, 1),
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-marque text-lg font-bold text-magenta">{etape.cle}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{HEURES[etape.id]}</p>
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-navy">{etape.titre}</p>
              <p className="mt-2.5 line-clamp-4 text-xs italic leading-relaxed text-slate-600">
                « {etape.sms.replace(/\{cabinet\}/g, 'Votre cabinet').replace(/\{examen\}/g, 'votre coloscopie').replace(/\{date\}/g, 'jour J').replace(/\{(heure|limite)\}/g, '8 h').replace(/\{lien\}/g, 'endova.fr/p/…')} »
              </p>
            </Verre>
          );
        })}
      </div>

      <p
        className="mx-auto mt-10 max-w-xl text-balance text-center text-sm leading-relaxed text-slate-700"
        style={{ opacity: entre(phase(t, 0.7, 0.92), 0, 1) }}
      >
        Chaque lien ouvre une page sécurisée par l’année de naissance. Aucune application
        à installer, aucun mot de passe à retenir.
      </p>
    </div>
  );
}

function Terrain(t) {
  const p = adoucir(phase(t, 0.08, 0.5));
  const ecrans = [
    { cle: 'J-7', titre: 'Logistique & anticoagulants', etat: 'fait' },
    { cle: 'J-3', titre: 'Régime sans résidu', etat: 'fait' },
    { cle: 'J-1', titre: 'Première fraction de purge', etat: 'actif' },
    { cle: 'H-4', titre: 'Seconde fraction & contrôle', etat: 'verrou' },
    { cle: 'H-2', titre: 'Verrou anesthésique', etat: 'verrou' },
  ];
  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-2" style={{ perspective: '1400px' }}>
      <div style={{ opacity: entre(phase(t, 0.05, 0.3), 0, 1) }}>
        <Oeil>Côté patient</Oeil>
        <h2 className="mt-4 text-balance text-2xl font-bold tracking-tight text-navy sm:text-4xl">
          Un minuteur qui impose le rythme de la purge.
        </h2>
        <p className="mt-5 text-balance text-base leading-relaxed text-slate-700">
          La nausée vient presque toujours d’une prise trop rapide, et un vomissement fait
          perdre le volume déjà ingéré. Endova découpe la fraction en verres espacés et
          bloque l’avance.
        </p>
        <ul className="mt-6 space-y-3">
          {[
            [Timer, 'Un verre toutes les 15 minutes, pause imposée entre deux'],
            [AlertTriangle, 'En cas de rejet, le protocole de compensation s’affiche aussitôt'],
            [ListChecks, 'Échelle visuelle d’évacuation dérivée du score de Boston'],
          ].map(([Icone, texte]) => (
            <li key={texte} className="flex items-start gap-3 text-sm leading-relaxed text-slate-800">
              <Icone size={17} className="mt-0.5 shrink-0 text-magenta" />
              {texte}
            </li>
          ))}
        </ul>
      </div>

      {/* Maquette téléphone : le cadre est en verre, l'écran reprend l'app réelle. */}
      <div className="flex justify-center">
        <div
          className="relative w-[248px] shrink-0 rounded-[2.4rem] border-[6px] border-navy/85 bg-white p-3 shadow-[0_40px_80px_-30px_rgba(5,28,78,0.55)]"
          style={{
            transform: `translate3d(0, ${entre(p, 60, 0)}px, ${entre(p, -280, 0)}px) rotateY(${entre(p, 22, -6)}deg) rotateX(${entre(p, 12, 2)}deg)`,
            opacity: entre(p, 0, 1),
          }}
        >
          <div className="absolute left-1/2 top-1.5 h-1.5 w-16 -translate-x-1/2 rounded-full bg-navy/85" />
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 px-1 pb-1">
              <img src={`${import.meta.env.BASE_URL}endova-glyphe.png`} alt="" className="size-5" />
              <span className="font-marque text-[9px] font-semibold tracking-[0.24em] text-navy">ENDOVA</span>
            </div>
            {ecrans.map((e, i) => {
              const q = adoucir(phase(t, 0.34 + i * 0.07, 0.6 + i * 0.07));
              const style =
                e.etat === 'fait'
                  ? 'border-emerald-400/50 bg-emerald-50/80'
                  : e.etat === 'actif'
                    ? 'border-magenta/40 bg-magenta/[0.08]'
                    : 'border-navy/[0.07] bg-white/60 opacity-60';
              return (
                <div
                  key={e.cle}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 ${style}`}
                  style={{ transform: `translateX(${entre(q, 26, 0)}px)`, opacity: entre(q, 0, 1) }}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-current/20 text-[9px] font-bold">
                    {e.etat === 'fait' ? <Check size={11} strokeWidth={3} className="text-emerald-700" /> : e.cle}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-navy">{e.titre}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pilotage(t) {
  const p = adoucir(phase(t, 0.1, 0.55));
  return (
    <div className="mx-auto w-full max-w-6xl px-6" style={{ perspective: '1500px' }}>
      <div className="text-center" style={{ opacity: entre(phase(t, 0.02, 0.24), 0, 1) }}>
        <Oeil>Côté cabinet</Oeil>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-2xl font-bold tracking-tight text-navy sm:text-4xl">
          Le matin, une seule question : dans quel ordre j’opère.
        </h2>
      </div>

      <Verre
        className="mt-12 overflow-hidden p-5 sm:p-7"
        style={{
          transform: `translate3d(0, ${entre(p, 80, 0)}px, ${entre(p, -340, 0)}px) rotateX(${entre(p, 18, 0)}deg)`,
          opacity: entre(p, 0, 1),
        }}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icone: <UsersRound size={15} />, libelle: 'Patients actifs', valeur: '4 / 5' },
            { icone: <AlertTriangle size={15} />, libelle: 'Patients en alerte', valeur: '2', ton: 'text-rose-700' },
            { icone: <ListChecks size={15} />, libelle: 'Conformité du suivi', valeur: '79 %', ton: 'text-amber-700' },
          ].map((k, i) => {
            const q = adoucir(phase(t, 0.34 + i * 0.08, 0.62 + i * 0.08));
            return (
              <div
                key={k.libelle}
                className="rounded-2xl border border-white/70 bg-white/70 p-4"
                style={{ transform: `translateY(${entre(q, 24, 0)}px)`, opacity: entre(q, 0, 1) }}
              >
                <p className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {k.libelle} <span className="text-magenta">{k.icone}</span>
                </p>
                <p className={`mt-2.5 text-2xl font-extrabold tracking-tight ${k.ton ?? 'text-navy'}`}>{k.valeur}</p>
              </div>
            );
          })}
        </div>

        <div
          className="mt-5 rounded-2xl border border-rose-400/50 bg-rose-50/70 p-4"
          style={{ opacity: entre(phase(t, 0.58, 0.82), 0, 1) }}
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <PhoneCall size={15} /> NKEMBA Joseph — coloscopie demain · 3 motifs
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-800">
            Anticoagulant sans consigne d’arrêt · écart au régime · fer oral non arrêté.
          </p>
          <p className="mt-2 text-xs italic leading-relaxed text-slate-700">
            « Ne modifiez surtout pas votre traitement vous-même. Nous vérifions avec votre médecin et vous envoyons la consigne par écrit. »
          </p>
        </div>

        <p
          className="mt-4 text-center text-[11px] leading-relaxed text-slate-600"
          style={{ opacity: entre(phase(t, 0.72, 0.95), 0, 1) }}
        >
          Chaque alerte arrive avec la phrase à dire au téléphone. Le secrétariat n’improvise pas.
        </p>
      </Verre>
    </div>
  );
}

function Cloture(t) {
  const p = adoucir(phase(t, 0.08, 0.5));
  return (
    <div className="mx-auto w-full max-w-4xl px-6 text-center" style={{ perspective: '1200px' }}>
      <Verre
        className="p-8 sm:p-12"
        style={{
          transform: `translate3d(0, ${entre(p, 70, 0)}px, ${entre(p, -300, 0)}px)`,
          opacity: entre(p, 0, 1),
        }}
      >
        <div className="brillance relative mx-auto block w-fit overflow-hidden rounded-[1.5rem]">
          <img src={`${import.meta.env.BASE_URL}endova-mark.png`} alt="" className="size-20 rounded-[1.5rem]" />
        </div>
        <h2 className="mt-7 text-balance text-2xl font-bold tracking-tight text-navy sm:text-4xl">
          Un créneau sauvé paie plusieurs mois d’abonnement.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-slate-700">
          Le calcul se fait sur votre propre taux de préparation inadéquate, mesuré avant
          et après mise en service. Pas sur une promesse.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-magenta/35 bg-magenta/[0.09] px-5 py-3.5 text-sm font-semibold text-magenta transition-all hover:brightness-95"
          >
            <Banknote size={16} /> Voir le tableau de bord
          </Link>
          <Link
            to="/p/e4c7a1"
            className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white/70 px-5 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-white"
          >
            <ShieldCheck size={16} /> Essayer le parcours patient
            <ChevronRight size={15} />
          </Link>
        </div>
        <p className="mt-5 text-[11px] leading-relaxed text-slate-500">
          Endova ne pose aucun diagnostic et ne remplace pas la consultation pré-anesthésique.
        </p>
      </Verre>
    </div>
  );
}

/**
 * Déroulé automatique, pour filmer la page ou la projeter sans toucher la souris.
 *
 * "/presentation?auto" lance la lecture, "?auto=40" impose une durée en secondes.
 * Le défilement suit le temps réel plutôt qu'un pas fixe par image : un
 * enregistrement d'écran fait chuter la cadence, et un pas par image allongerait
 * alors la vidéo sans prévenir.
 */
function useDerouleAuto(secondes) {
  useEffect(() => {
    if (!secondes) return undefined;
    let frame = 0;
    let debut = 0;
    let stop = false;

    const course = () => document.body.scrollHeight - window.innerHeight;
    const avancer = (horodatage) => {
      if (!debut) debut = horodatage;
      const t = Math.min(1, (horodatage - debut) / (secondes * 1000));
      // Départ et arrivée adoucis : un démarrage sec se voit à l'image.
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      window.scrollTo(0, course() * e);
      if (t < 1 && !stop) frame = requestAnimationFrame(avancer);
    };

    // Laisser l'animation d'entrée du cold open se jouer avant de bouger.
    const amorce = setTimeout(() => {
      frame = requestAnimationFrame(avancer);
    }, 2200);

    // La moindre intervention reprend la main : on ne lutte pas contre l'utilisateur.
    const interrompre = () => {
      stop = true;
      if (frame) cancelAnimationFrame(frame);
    };
    window.addEventListener('wheel', interrompre, { passive: true });
    window.addEventListener('touchstart', interrompre, { passive: true });
    window.addEventListener('keydown', interrompre);

    return () => {
      clearTimeout(amorce);
      interrompre();
      window.removeEventListener('wheel', interrompre);
      window.removeEventListener('touchstart', interrompre);
      window.removeEventListener('keydown', interrompre);
    };
  }, [secondes]);
}

/* ------------------------------------------------------------------- Page */

export default function Presentation() {
  const [params] = useSearchParams();
  const auto = params.has('auto');
  useDerouleAuto(auto ? Number(params.get('auto')) || 55 : 0);

  // Le navigateur restaure la position au rechargement : inutile ici, et gênant
  // en démonstration — on doit toujours repartir de l'ouverture.
  useEffect(() => {
    const avant = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    return () => {
      history.scrollRestoration = avant;
    };
  }, []);

  return (
    <div className="relative">
      {/* Nappe colorée propre à la présentation : plus dense que celle de l'app,
          mais tenue dans le dégradé du logo pour ne pas jurer avec lui. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60rem 42rem at 10% -8%, rgba(147,43,156,0.22), transparent 60%),' +
            'radial-gradient(52rem 52rem at 94% 6%, rgba(82,35,127,0.2), transparent 58%),' +
            'radial-gradient(58rem 44rem at 26% 102%, rgba(11,42,99,0.18), transparent 62%),' +
            'radial-gradient(40rem 34rem at 82% 74%, rgba(147,43,156,0.14), transparent 60%)',
        }}
      />

      {auto ? null : (
      <Link
        to="/"
        className="fixed left-5 top-5 z-30 inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 backdrop-blur-xl transition-colors hover:text-navy"
      >
        <ArrowLeft size={14} /> Retour à l’app
      </Link>
      )}

      <Scene id="ouverture" hauteur="200vh" fond={FondBloc} enfants={Ouverture} />
      <Scene id="constat" hauteur="240vh" fond={FondConstat} enfants={Probleme} />
      <Scene id="revelation" hauteur="220vh" enfants={Revelation} />
      <Scene id="echeancier" hauteur="280vh" enfants={Echeancier} />
      <Scene id="terrain" hauteur="260vh" enfants={Terrain} />
      <Scene id="pilotage" hauteur="260vh" enfants={Pilotage} />
      <Scene id="cloture" hauteur="180vh" enfants={Cloture} />
    </div>
  );
}
