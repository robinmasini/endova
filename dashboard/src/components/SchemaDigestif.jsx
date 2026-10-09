import { useState } from 'react';
import { TONS } from './ui.jsx';
import { etatSegments } from '../lib/anatomie.js';

const TRAIT = { emerald: '#059669', amber: '#D97706', ruby: '#BE123C', neutre: '#94A3B8' };

/**
 * Projection anatomique, dessinée plutôt que photographiée.
 *
 * L'illustration précédente était une image fixe : impossible de colorer un
 * segment, il fallait poser un halo par-dessus et espérer qu'il tombe au bon
 * endroit. Ici chaque segment est un tracé, donc il s'allume lui-même, et les
 * repères sont des coordonnées du dessin — ils ne peuvent plus se décalquer
 * de travers au redimensionnement.
 *
 * Repère de lecture : on regarde le patient de face. Son côlon droit est donc
 * à gauche de l'écran, son côlon gauche à droite.
 */
const VUE = { l: 320, h: 332 };

const SEGMENTS = [
  {
    id: 'haut',
    nom: 'Œsophage & estomac',
    sous: 'Zone du risque anesthésique',
    // Œsophage puis estomac : un tracé ouvert et une poche fermée. L'estomac
    // occupe l'hypochondre gauche du patient, donc la droite de l'écran.
    trace: 'M 159 24 C 160 50 161 84 167 117',
    poche:
      'M 163 112 C 176 99 202 100 214 116 C 226 132 226 158 217 177 '
      + 'C 208 196 190 204 174 199 C 165 196 158 189 156 181 C 154 175 161 171 166 176 '
      + 'C 172 183 180 185 186 180 C 192 174 187 157 181 145 C 176 132 170 121 167 119 '
      + 'C 164 118 163 116 163 112 Z',
    point: [194, 150],
  },
  {
    id: 'droit',
    nom: 'Côlon droit',
    sous: 'Cæcum, ascendant, angle hépatique',
    trace: 'M 94 306 C 81 306 74 298 74 286 L 74 236 C 74 224 80 216 90 214',
    point: [74, 258],
  },
  {
    id: 'transverse',
    nom: 'Côlon transverse',
    sous: 'Entre les deux angles',
    trace: 'M 90 214 C 112 215 124 232 160 232 C 196 232 208 215 230 214',
    point: [160, 228],
  },
  {
    id: 'gauche',
    nom: 'Côlon gauche & rectum',
    sous: 'Descendant, sigmoïde, rectum',
    trace:
      'M 230 214 C 240 216 246 224 246 236 L 246 282 C 246 292 240 298 231 301 '
      + 'C 217 306 205 311 196 318 C 189 324 180 328 170 328',
    point: [248, 256],
  },
  {
    id: 'grele',
    nom: 'Intestin grêle',
    sous: 'Transit des résidus alimentaires',
    trace:
      'M 150 246 C 128 250 120 262 136 268 C 154 275 190 268 198 276 '
      + 'C 205 285 183 291 162 288 C 144 285 132 290 138 296 C 144 302 166 303 184 299',
    point: [166, 276],
  },
];

/** Buste de face, en négatif : il situe les organes sans les concurrencer. */
const BUSTE =
  'M 148 4 L 172 4 C 174 20 178 30 192 36 C 218 46 244 56 258 68 '
  + 'C 268 77 272 91 272 106 C 272 128 268 150 262 172 C 256 194 252 213 252 236 '
  + 'C 252 272 254 304 256 332 L 64 332 C 66 304 68 272 68 236 '
  + 'C 68 213 64 194 58 172 C 52 150 48 128 48 106 C 48 91 52 77 62 68 '
  + 'C 76 56 102 46 128 36 C 142 30 146 20 148 4 Z';

function Segment({ segment, etat, selectionne, onClick }) {
  const couleur = TRAIT[etat.ton];
  const alerte = etat.ton === 'ruby' || etat.ton === 'amber';
  const [x, y] = segment.point;
  const commun = { fill: 'none', stroke: couleur, strokeLinecap: 'round', strokeLinejoin: 'round' };

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${segment.nom} — ${etat.libelle}`}
      aria-pressed={selectionne}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer outline-none"
      style={{ transition: 'opacity .25s' }}
    >
      {/* Diffusion sous le tracé : c'est elle qui « allume » le segment. */}
      <g style={{ filter: 'blur(7px)', opacity: selectionne ? 0.5 : alerte ? 0.34 : 0 , transition: 'opacity .3s' }}>
        <path d={segment.trace} {...commun} strokeWidth={13} />
        {segment.poche ? <path d={segment.poche} fill={couleur} stroke="none" /> : null}
      </g>

      {segment.poche ? (
        <path d={segment.poche} fill={couleur} fillOpacity={selectionne ? 0.3 : 0.16} stroke={couleur} strokeWidth={5} strokeLinejoin="round" />
      ) : null}
      <path d={segment.trace} {...commun} strokeWidth={selectionne ? 9 : 7} style={{ transition: 'stroke-width .2s' }} />

      {/* Cible de pointage : large, transparente, elle rattrape les doigts. */}
      <path d={segment.trace} fill="none" stroke="transparent" strokeWidth={30} strokeLinecap="round" />
      {segment.poche ? <path d={segment.poche} fill="transparent" stroke="transparent" strokeWidth={24} /> : null}

      {alerte ? (
        <circle cx={x} cy={y} r={7} fill={couleur} opacity={0.3}>
          <animate attributeName="r" values="7;15;7" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2.4s" repeatCount="indefinite" />
        </circle>
      ) : null}
      <circle cx={x} cy={y} r={selectionne ? 7.5 : 6} fill={couleur} stroke="#fff" strokeWidth={2.5} style={{ transition: 'r .2s' }} />
    </g>
  );
}

export default function SchemaDigestif({ patient, compact = false }) {
  const etat = etatSegments(patient);
  const [actif, setActif] = useState(null);

  const choisi = SEGMENTS.find((s) => s.id === actif);
  const etatChoisi = choisi ? etat[choisi.id] : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${VUE.l} ${VUE.h}`}
        className="mx-auto block w-full max-w-[21rem] select-none"
        role="img"
        aria-label="Tube digestif, de l’œsophage au rectum"
      >
        <defs>
          <linearGradient id="buste-endova" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#932B9C" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#051C4E" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <path d={BUSTE} fill="url(#buste-endova)" stroke="#051C4E" strokeOpacity="0.14" strokeWidth="1.5" />

        {SEGMENTS.map((s) => (
          <Segment
            key={s.id}
            segment={s}
            etat={etat[s.id]}
            selectionne={actif === s.id}
            onClick={() => setActif(actif === s.id ? null : s.id)}
          />
        ))}
      </svg>

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
            : 'Touchez un segment : Boston prévisionnel, déduit des déclarations du patient — il ne remplace pas la cotation per-endoscopique.'}
        </p>
      ) : null}
    </div>
  );
}
