import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck2, ChevronRight } from './icones.js';
import { horodatage, nomComplet } from '../lib/patient.js';

/** Les comptes rendus signés, tirés du journal des dossiers. Du plus récent au plus ancien. */
export function comptesRendus(patients) {
  return patients
    .flatMap((p) => (p.evenements ?? []).filter((e) => e.type === 'compte_rendu').map((e) => ({ ...e, patient: p })))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

function rubriquesDe(cr) {
  if (cr.rubriques?.length) return cr.rubriques;
  return (cr.detail ?? '').split('\n').map((l) => {
    const i = l.indexOf(' : ');
    return i > 0 ? { titre: l.slice(0, i), texte: l.slice(i + 3) } : { titre: '', texte: l };
  });
}

export default function HistoriqueCR({ liste, avecPatient = false, vide }) {
  const [ouvert, setOuvert] = useState(null);

  if (!liste.length) {
    return <p className="rounded-2xl border border-[#ECE8F3] bg-white/70 p-5 text-sm text-slate-600">{vide}</p>;
  }

  return (
    <ol className="flex flex-col gap-2.5">
      {liste.map((cr) => {
        const cle = `${cr.patient.id}-${cr.at}`;
        const deplie = ouvert === cle;
        return (
          <li key={cle} className="rounded-2xl border border-[#ECE8F3] bg-white shadow-[0_8px_22px_-18px_rgba(43,52,146,0.4)]">
            <button
              type="button"
              onClick={() => setOuvert(deplie ? null : cle)}
              aria-expanded={deplie}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F1ECFA] text-[#6A1FD1]"><FileCheck2 size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#13112A]">
                  {avecPatient ? nomComplet(cr.patient) : 'Compte rendu de consultation'}
                </span>
                <span className="block truncate text-xs text-slate-500">Signé le {horodatage(cr.at)} · {cr.auteur}</span>
              </span>
              <ChevronRight size={16} className={`shrink-0 text-slate-400 transition-transform ${deplie ? 'rotate-90' : ''}`} />
            </button>
            {deplie ? (
              <div className="flex flex-col gap-3 border-t border-[#ECE8F3] px-4 pb-4 pt-3">
                {rubriquesDe(cr).map((r, i) => (
                  <div key={`${r.titre}-${i}`}>
                    {r.titre ? <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6A1FD1]">{r.titre}</p> : null}
                    <p className="text-sm leading-relaxed text-[#2A2640]">{r.texte || '—'}</p>
                  </div>
                ))}
                {avecPatient ? (
                  <Link to={`/patients/${cr.patient.id}?onglet=comptes-rendus`} className="text-xs font-semibold text-[#6A1FD1] hover:underline">
                    Ouvrir le dossier du patient
                  </Link>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
