import { Link } from 'react-router-dom';
import {
  IdCard, Stethoscope, HeartPulse, ClipboardCheck, PenLine, SquareCheck, Square, AlertTriangle, Info,
} from '../../components/icones.js';
import { store } from '../../lib/store.js';
import { traitement, facteursDe, comorbidite, renforceConseille } from '../../lib/terrain.js';
import { SCHEMAS } from '../../lib/examens.js';
import {
  age, examenDe, anesthesieDe, protocoleDe, heure, jour, dateLongue, telephoneLisible,
} from '../../lib/patient.js';
import { Carte, Champ, Puce } from './elements.jsx';

/** Ce que le cabinet doit avoir réuni avant l'examen, selon l'examen et l'anesthésie. */
function pointsDeControle(patient) {
  const ex = examenDe(patient);
  const anesth = anesthesieDe(patient);
  const out = [];
  if (anesth.cpa) out.push({ cle: 'cpa', label: 'Consultation d’anesthésie faite', detail: 'Obligatoire au moins 48 h avant' });
  out.push({ cle: 'consentement', label: 'Consentement éclairé signé', detail: 'Document d’information remis et signé' });
  if (ex.purge) out.push({ cle: 'ordonnance', label: 'Ordonnance de préparation remise', detail: protocoleDe(patient)?.nom });
  if (patient.examen.type === 'RECTO') out.push({ cle: 'ordonnance', label: 'Ordonnance de lavements remise', detail: '2 lavements type Normacol' });
  out.push({ cle: 'bonAdmission', label: 'Bon d’admission transmis', detail: patient.examen.lieu });
  return out;
}

function CheckList({ patient }) {
  const adm = patient.administratif;
  const anesth = anesthesieDe(patient);
  const valeur = (cle) => (cle === 'cpa' ? adm.cpa?.faite : adm[cle]);

  function basculer({ cle, label }) {
    const actif = !valeur(cle);
    const patch = cle === 'cpa' ? { cpa: { faite: actif, date: actif ? new Date().toISOString() : null } } : { [cle]: actif };
    store.majDossier(patient.id, { administratif: patch }, { type: 'checklist', titre: `${label} — ${actif ? 'coché' : 'décoché'}` });
  }

  const points = pointsDeControle(patient);
  const faits = points.filter((p) => valeur(p.cle)).length;
  const accompagnant = patient.etapes.j7?.done ? patient.etapes.j7.accompagnant : undefined;

  return (
    <Carte
      titre="Check-list pré-examen"
      icone={<ClipboardCheck size={14} />}
      action={<span className={`text-xs font-bold tabular-nums ${faits === points.length ? 'text-emerald-700' : 'text-amber-700'}`}>{faits}/{points.length}</span>}
      note="Chaque case cochée ou décochée est horodatée dans l’onglet Traçabilité."
    >
      <div className="space-y-2">
        {points.map((p) => {
          const ok = valeur(p.cle);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => basculer(p)}
              aria-pressed={ok}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                ok ? 'border-emerald-400/40 bg-emerald-50/60' : 'border-navy/[0.08] bg-white/60 hover:bg-white'
              }`}
            >
              {ok ? <SquareCheck size={18} className="shrink-0 text-emerald-600" /> : <Square size={18} className="shrink-0 text-slate-400" />}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-navy">{p.label}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {p.cle === 'cpa' && adm.cpa?.date ? `Faite le ${dateLongue(adm.cpa.date)}` : p.detail}
                </span>
              </span>
            </button>
          );
        })}
        {anesth.accompagnant ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-navy/[0.12] p-3">
            {accompagnant ? <SquareCheck size={18} className="shrink-0 text-emerald-600" /> : <Square size={18} className={`shrink-0 ${accompagnant === false ? 'text-rose-500' : 'text-slate-400'}`} />}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-navy">Accompagnant pour le retour</span>
              <span className="block text-[11px] text-slate-500">
                {accompagnant === undefined ? 'Déclaré par le patient à J-7' : accompagnant ? 'Confirmé par le patient à J-7' : 'Le patient a déclaré ne pas en avoir'}
              </span>
            </span>
          </div>
        ) : null}
      </div>
    </Carte>
  );
}

export default function OngletDossier({ patient }) {
  const { identite, examen, terrain } = patient;
  const ex = examenDe(patient);
  const protocole = protocoleDe(patient);
  const a = age(patient);
  const facteurs = facteursDe(patient, a);
  const suggerer = ex.purge && !examen.renforce && renforceConseille(patient, a);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
      <Carte titre="Identité" icone={<IdCard size={14} />}>
        <dl>
          <Champ libelle="Nom">{identite.nom.toUpperCase()}</Champ>
          <Champ libelle="Prénom">{identite.prenom}</Champ>
          <Champ libelle="Naissance">{dateLongue(identite.naissance)} · {a} ans</Champ>
          <Champ libelle="Sexe">{{ F: 'Femme', M: 'Homme' }[identite.sexe]}</Champ>
          <Champ libelle="Téléphone">
            <a href={`tel:${identite.telephone}`} className="hover:text-magenta">{telephoneLisible(identite.telephone)}</a>
          </Champ>
          <Champ libelle="E-mail">{identite.email}</Champ>
          <Champ libelle="Médecin traitant">{identite.medecinTraitant}</Champ>
          <Champ libelle="N° de dossier">{patient.numero}</Champ>
        </dl>
      </Carte>

      <Carte
        titre="Examen"
        icone={<Stethoscope size={14} />}
        action={
          <Link to={`/patients/${patient.id}/modifier`} className="inline-flex items-center gap-1.5 text-xs font-medium text-magenta hover:underline print:hidden">
            <PenLine size={12} /> Modifier
          </Link>
        }
      >
        <dl>
          <Champ libelle="Acte">{ex.label}</Champ>
          <Champ libelle="Indication">{examen.indication}</Champ>
          <Champ libelle="Date">{jour(examen.date)} à {heure(examen.date)}</Champ>
          <Champ libelle="Lieu">{examen.lieu}</Champ>
          <Champ libelle="Opérateur">{examen.operateur}</Champ>
          <Champ libelle="Anesthésie">{anesthesieDe(patient).label}</Champ>
          {protocole ? (
            <>
              <Champ libelle="Préparation">{protocole.nom} <span className="font-normal text-slate-500">· {protocole.famille}</span></Champ>
              <Champ libelle="Schéma">{SCHEMAS[examen.schema]?.label}</Champ>
              <Champ libelle="Préparation renforcée" ton={examen.renforce ? 'marque' : undefined}>
                {examen.renforce ? 'Oui — régime 5 jours' : 'Non'}
              </Champ>
            </>
          ) : null}
        </dl>
      </Carte>

      <Carte titre="Terrain médical" icone={<HeartPulse size={14} />} className="lg:col-span-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Traitements à surveiller</p>
        {terrain.traitements.length ? (
          <ul className="mt-2 space-y-2">
            {terrain.traitements.map((id) => {
              const t = traitement(id);
              return (
                <li key={id} className={`rounded-xl border p-3 ${t.critique ? 'border-amber-400/45 bg-amber-50/50' : 'border-navy/[0.08] bg-white/60'}`}>
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-navy">{t.label}</span>
                    <span className="text-[11px] text-slate-500">{t.exemples}</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">{t.consigne}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Aucun traitement à risque déclaré.</p>
        )}

        <dl className="mt-4">
          <Champ libelle="Allergies" ton={terrain.allergies ? 'ruby' : undefined}>{terrain.allergies || 'Aucune connue'}</Champ>
          <Champ libelle="Antécédents">{terrain.antecedents}</Champ>
        </dl>

        {terrain.comorbidites?.length ? (
          <div className="mt-4 rounded-xl border border-rose-400/45 bg-rose-50/60 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700"><AlertTriangle size={13} /> Comorbidités limitant le choix de la purge</p>
            <p className="mt-1 text-xs text-slate-700">{terrain.comorbidites.map((c) => comorbidite(c)?.label).join(' · ')}</p>
          </div>
        ) : null}
      </Carte>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
        {ex.purge ? (
          <Carte titre="Risque de préparation insuffisante" icone={<Info size={14} />}>
            {facteurs.length ? (
              <div className="flex flex-wrap gap-2">
                {facteurs.map((f) => <Puce key={f.id} ton="amber">{f.label}</Puce>)}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Aucun facteur connu.</p>
            )}
            {suggerer ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-magenta/30 bg-magenta/[0.06] p-3">
                <p className="text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold text-magenta">Préparation renforcée conseillée.</span> Régime sans résidu sur 5 jours au lieu de 3.
                </p>
                <button
                  type="button"
                  onClick={() => store.majDossier(patient.id, { examen: { renforce: true } }, { type: 'modification', titre: 'Préparation renforcée activée', detail: 'Régime sans résidu avancé à J-5' })}
                  className="rounded-lg border border-magenta/35 bg-white px-3 py-1.5 text-xs font-semibold text-magenta hover:bg-magenta/[0.05]"
                >
                  Activer
                </button>
              </div>
            ) : null}
          </Carte>
        ) : null}
        <CheckList patient={patient} />
      </div>
    </div>
  );
}
