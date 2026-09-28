import { useState } from 'react';
import { TONS } from './ui.jsx';
import { etatSegments } from '../lib/anatomie.js';

const TRAIT = { emerald: '#059669', amber: '#D97706', ruby: '#BE123C', neutre: '#94A3B8' };

/**
 * Repères posés sur l'illustration anatomique. Les coordonnées sont en pourcentage
 * de l'image (1879 × 1850), relevées par balayage des tubes roses du PNG :
 * elles suivent donc le redimensionnement sans se décaler.
 */
const REPERES = [
  { id: 'haut', nom: 'Œsophage & estomac', sous: 'Zone du risque anesthésique', x: 62.0, y: 52.0 },
  { id: 'transverse', nom: 'Côlon transverse', sous: 'Entre les deux angles', x: 51.0, y: 64.0 },
  { id: 'droit', nom: 'Côlon droit', sous: 'Cæcum, ascendant, angle hépatique', x: 35.5, y: 76.0 },
  { id: 'gauche', nom: 'Côlon gauche & rectum', sous: 'Descendant, sigmoïde, rectum', x: 65.5, y: 74.0 },
  { id: 'grele', nom: 'Intestin grêle', sous: 'Transit des résidus alimentaires', x: 49.0, y: 80.0 },
];

function Marqueur({ repere, etat, selectionne, onClick }) {
  const couleur = TRAIT[etat.ton];
  const alerte = etat.ton === 'ruby' || etat.ton === 'amber';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${repere.nom} — ${etat.libelle}`}
      aria-pressed={selectionne}
      className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none"
      style={{ left: `${repere.x}%`, top: `${repere.y}%` }}
    >
      {/* Halo : c'est lui qui « allume » l'organe, l'illustration étant une image fixe. */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full blur-md transition-opacity duration-300"
        style={{ background: couleur, opacity: alerte ? 0.42 : selectionne ? 0.3 : 0.14 }}
      />
      {alerte ? (
        <span
          className="pointer-events-none absolute inset-0 animate-ping rounded-full"
          style={{ background: couleur, opacity: 0.28, animationDuration: '2.4s' }}
        />
      ) : null}
      <span
        className="relative size-5 rounded-full border-[3px] border-white transition-all duration-200"
        style={{
          background: couleur,
          boxShadow: selectionne
            ? `0 0 0 3px ${couleur}55, 0 2px 6px rgba(5,28,78,0.3)`
            : '0 2px 6px rgba(5,28,78,0.3)',
        }}
      />
    </button>
  );
}

export default function SchemaDigestif({ patient, compact = false }) {
  const etat = etatSegments(patient);
  const [actif, setActif] = useState(null);

  const choisi = REPERES.find((r) => r.id === actif);
  const etatChoisi = choisi ? etat[choisi.id] : null;

  return (
    <div>
      <div className="relative mx-auto w-full max-w-[21rem]">
        <img
          src={`${import.meta.env.BASE_URL}buste.png`}
          alt="Tube digestif, de l’œsophage au rectum"
          className="w-full select-none"
          draggable={false}
        />
        {REPERES.map((r) => (
          <Marqueur
            key={r.id}
            repere={r}
            etat={etat[r.id]}
            selectionne={actif === r.id}
            onClick={() => setActif(actif === r.id ? null : r.id)}
          />
        ))}
      </div>

      {/* Détail du repère sélectionné, sinon la légende de lecture. */}
      {choisi ? (
        <div className={`mt-3 rounded-xl border p-4 rise ${TONS[etatChoisi.ton].bord} ${TONS[etatChoisi.ton].fond}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">{choisi.nom}</p>
              <p className="mt-0.5 text-[11px] text-slate-600">{choisi.sous}</p>
            </div>
            {etatChoisi.boston !== null && etatChoisi.boston !== undefined ? (
              <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${TONS[etatChoisi.ton].fond} ${TONS[etatChoisi.ton].texte}`}>
                Boston {etatChoisi.boston}/3
              </span>
            ) : null}
          </div>
          <p className={`mt-2.5 text-xs font-semibold ${TONS[etatChoisi.ton].texte}`}>{etatChoisi.libelle}</p>
          {etatChoisi.note ? <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{etatChoisi.note}</p> : null}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {[
            ['emerald', 'Analysable'],
            ['amber', 'Résidus mineurs'],
            ['ruby', 'Non analysable'],
            ['neutre', 'Non évalué'],
          ].map(([ton, label]) => (
            <span key={ton} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="size-2.5 rounded-full border border-white" style={{ background: TRAIT[ton] }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {!compact ? (
        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
          {etat.inconnu
            ? 'Projection indisponible tant que l’auto-évaluation H-5 n’est pas remontée.'
            : 'Touchez un repère : Boston prévisionnel par segment, déduit des déclarations du patient — il ne remplace pas la cotation per-endoscopique.'}
        </p>
      ) : null}
    </div>
  );
}
