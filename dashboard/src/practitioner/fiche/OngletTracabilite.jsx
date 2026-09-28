import { useState } from 'react';
import { PhoneCall, Printer, History } from '../../components/icones.js';
import { TONS } from '../../components/ui.jsx';
import { store } from '../../lib/store.js';
import { chronologie, CATEGORIES } from '../../lib/sms.js';
import { examenDe, heure, jour, dateLongue, nomComplet } from '../../lib/patient.js';
import { Carte } from './elements.jsx';

const ISSUES = ['Joint', 'Messagerie laissée', 'Injoignable', 'Appel entrant'];

function TracerAppel({ patient }) {
  const [issue, setIssue] = useState(ISSUES[0]);
  const [note, setNote] = useState('');
  const [ok, setOk] = useState(false);

  function valider(e) {
    e.preventDefault();
    store.journaliser(patient.id, {
      type: 'appel',
      titre: issue === 'Appel entrant' ? 'Appel entrant du patient' : `Appel sortant — ${issue.toLowerCase()}`,
      detail: note.trim() || null,
    });
    setNote('');
    setOk(true);
    setTimeout(() => setOk(false), 2200);
  }

  return (
    <Carte titre="Tracer un appel" icone={<PhoneCall size={14} />} className="print:hidden">
      <form onSubmit={valider} className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {ISSUES.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIssue(i)}
              aria-pressed={issue === i}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                issue === i ? 'border-magenta/40 bg-magenta/[0.09] text-magenta' : 'border-navy/[0.09] bg-white/70 text-slate-600 hover:text-navy'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Ce qui a été dit, la consigne donnée…"
          className="w-full resize-none rounded-xl border border-navy/[0.1] bg-white/80 p-3 text-sm text-navy outline-none placeholder:text-slate-400 focus:border-magenta/50"
        />
        <button type="submit" className="w-full rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-125">
          {ok ? 'Appel tracé ✓' : 'Enregistrer l’appel'}
        </button>
      </form>
    </Carte>
  );
}

export default function OngletTracabilite({ patient, cabinet }) {
  const [filtre, setFiltre] = useState('tout');
  const tout = chronologie(patient, cabinet);
  const liste = filtre === 'tout' ? tout : tout.filter((e) => e.categorie === filtre);

  // Regroupement par jour : la lecture d'un journal se fait date par date.
  const jours = [];
  for (const e of liste) {
    const j = new Date(e.at).toDateString();
    if (jours.at(-1)?.j !== j) jours.push({ j, at: e.at, items: [] });
    jours.at(-1).items.push(e);
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Carte
        titre="Journal du dossier"
        icone={<History size={14} />}
        action={
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.09] bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white print:hidden"
          >
            <Printer size={13} /> Exporter
          </button>
        }
      >
        {/* En-tête d'impression : la pièce doit pouvoir être versée seule au dossier médical. */}
        <div className="mb-5 hidden border-b border-navy/20 pb-4 print:block">
          <p className="text-sm font-bold text-navy">{cabinet.nom}</p>
          <p className="mt-1 text-xs text-slate-700">
            Traçabilité de la préparation — {nomComplet(patient)}, né(e) le {dateLongue(patient.identite.naissance)}, dossier {patient.numero}
          </p>
          <p className="text-xs text-slate-700">
            {examenDe(patient).label} du {jour(patient.examen.date)} à {heure(patient.examen.date)} — {patient.examen.lieu}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Édité le {new Date().toLocaleString('fr-FR')}</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-1.5 print:hidden">
          {[['tout', 'Tout', tout.length], ...Object.entries(CATEGORIES).map(([k, c]) => [k, c.label, tout.filter((e) => e.categorie === k).length])].map(([k, label, n]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFiltre(k)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filtre === k ? 'border-magenta/40 bg-magenta/[0.09] text-magenta' : 'border-navy/[0.09] bg-white/70 text-slate-600 hover:text-navy'
              }`}
            >
              {label} <span className="tabular-nums opacity-60">{n}</span>
            </button>
          ))}
        </div>

        {jours.length ? (
          <div className="space-y-6">
            {jours.map((g) => (
              <section key={g.j}>
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{jour(g.at)}</p>
                <ol className="relative space-y-3 border-l border-navy/[0.1] pl-5">
                  {g.items.map((e, i) => {
                    const c = CATEGORIES[e.categorie];
                    return (
                      <li key={`${e.at}-${i}`} className="relative break-inside-avoid">
                        <span className={`absolute -left-[1.61rem] top-1.5 size-2.5 rounded-full border-2 border-white ${TONS[e.ton ?? c.ton].trait}`} />
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                          <span className="text-xs font-bold tabular-nums text-navy">{heure(e.at)}</span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${TONS[c.ton].texte}`}>{c.label}</span>
                          <span className="text-sm font-medium text-navy">{e.titre}</span>
                        </div>
                        {e.detail ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{e.detail}</p> : null}
                        <p className="mt-0.5 text-[11px] text-slate-400">{e.auteur}</p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Aucun événement dans cette catégorie.</p>
        )}
      </Carte>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
        <TracerAppel patient={patient} />
        <Carte titre="Valeur de la pièce" className="print:hidden">
          <p className="text-xs leading-relaxed text-slate-600">
            Chaque consigne envoyée, chaque ouverture du lien et chaque déclaration du patient est horodatée.
            L’export imprimable documente l’information délivrée avant l’examen et peut être versé au dossier médical.
          </p>
        </Carte>
      </div>
    </div>
  );
}
