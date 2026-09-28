import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, IdCard, Stethoscope, HeartPulse, Send } from '../components/icones.js';
import { store, useDossiers } from '../lib/store.js';
import { EXAMENS, ANESTHESIES, SCHEMAS, schemaConseille } from '../lib/examens.js';
import { PROTOCOLES } from '../lib/protocols.js';
import { TRAITEMENTS, FACTEURS, COMORBIDITES, comorbidite, renforceConseille } from '../lib/terrain.js';
import { planSms } from '../lib/sms.js';
import { age, horodatage } from '../lib/patient.js';
import { EnTete } from './Coquille.jsx';
import { Carte } from './fiche/elements.jsx';

const PAS = [
  { id: 'identite', label: 'Identité', icone: IdCard },
  { id: 'examen', label: 'Examen', icone: Stethoscope },
  { id: 'terrain', label: 'Terrain', icone: HeartPulse },
  { id: 'recap', label: 'Échéancier', icone: Send },
];

const champ = 'w-full rounded-xl border border-navy/[0.1] bg-white/80 px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-slate-400 focus:border-magenta/50';

function Etiquette({ libelle, children, requis, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-slate-700">
        {libelle}{requis ? <span className="text-magenta"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function Choix({ actif, onClick, children, detail }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
        actif ? 'border-magenta/40 bg-magenta/[0.08] font-semibold text-magenta' : 'border-navy/[0.09] bg-white/70 font-medium text-slate-700 hover:bg-white'
      }`}
    >
      {children}
      {detail ? <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{detail}</span> : null}
    </button>
  );
}

function Case({ actif, onClick, titre, detail }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        actif ? 'border-magenta/35 bg-magenta/[0.06]' : 'border-navy/[0.08] bg-white/60 hover:bg-white'
      }`}
    >
      <span className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-md border ${actif ? 'border-magenta bg-magenta text-white' : 'border-navy/20 bg-white'}`}>
        {actif ? <Check size={11} strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-navy">{titre}</span>
        {detail ? <span className="mt-0.5 block text-[11px] text-slate-500">{detail}</span> : null}
      </span>
    </button>
  );
}

const basculer = (liste, id) => (liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]);

function versInternational(t) {
  const n = t.replace(/[^\d+]/g, '');
  if (n.startsWith('+')) return n;
  if (n.startsWith('0') && n.length === 10) return `+33${n.slice(1)}`;
  return n;
}

const pad = (n) => String(n).padStart(2, '0');

function initial(patient, cabinet) {
  if (patient) {
    const d = new Date(patient.examen.date);
    return {
      identite: { ...patient.identite, telephone: patient.identite.telephone.replace('+33', '0') },
      examen: { ...patient.examen, jour: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, heure: `${pad(d.getHours())}:${pad(d.getMinutes())}` },
      terrain: { ...patient.terrain },
    };
  }
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return {
    identite: { nom: '', prenom: '', naissance: '', sexe: 'F', telephone: '', email: '', medecinTraitant: '' },
    examen: {
      type: 'COLO', indication: EXAMENS.COLO.indications[0], jour: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, heure: '09:00',
      lieu: cabinet.lieux[0], operateur: cabinet.praticiens[0], anesthesie: 'AG', protocole: 'MOVIPREP', schema: 'FRACTIONNE', renforce: false,
    },
    terrain: { traitements: [], facteurs: [], comorbidites: [], allergies: '', antecedents: '' },
  };
}

export default function NouveauDossier() {
  const { id } = useParams();
  const { patients, cabinet } = useDossiers();
  const existant = id ? patients.find((p) => p.id === id) : null;
  const navigate = useNavigate();
  const [pas, setPas] = useState(0);
  const [f, setF] = useState(() => initial(existant, cabinet));

  const maj = (section, patch) => setF((x) => ({ ...x, [section]: { ...x[section], ...patch } }));
  const ex = EXAMENS[f.examen.type];

  // Dossier tel qu'il sera enregistré : sert à l'aperçu des SMS et aux contrôles.
  const brouillon = useMemo(() => {
    const { jour, heure, ...examen } = f.examen;
    const date = new Date(`${jour}T${heure || '09:00'}`);
    return {
      id: 'apercu', token: existant?.token ?? '••••••', numero: existant?.numero ?? '—',
      identite: { ...f.identite, telephone: versInternational(f.identite.telephone) },
      examen: { ...examen, protocole: ex.purge ? examen.protocole : null, date: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString() },
      terrain: f.terrain,
      administratif: existant?.administratif ?? { cpa: { faite: false, date: null }, consentement: false, ordonnance: false, bonAdmission: false },
      etapes: existant?.etapes ?? {},
      evenements: existant?.evenements ?? [],
      alertesTraitees: existant?.alertesTraitees ?? {},
    };
  }, [f, ex.purge, existant]);

  const valide = [
    f.identite.nom.trim() && f.identite.prenom.trim() && /^\d{4}-\d{2}-\d{2}$/.test(f.identite.naissance) && versInternational(f.identite.telephone).length >= 12,
    f.examen.jour && f.examen.heure,
    true,
    true,
  ];

  const a = f.identite.naissance ? age(brouillon) : 0;
  const ci = ex.purge ? PROTOCOLES[f.examen.protocole].contreIndications.filter((c) => f.terrain.comorbidites.includes(c)) : [];
  const conseilRenforce = ex.purge && !f.examen.renforce && renforceConseille(brouillon, a);

  function choisirExamen(type) {
    const e = EXAMENS[type];
    maj('examen', { type, indication: e.indications[0], anesthesie: e.anesthesie });
  }

  function enregistrer() {
    const { identite, examen, terrain } = brouillon;
    if (existant) {
      const deplace = existant.examen.date !== examen.date;
      store.majDossier(existant.id, { identite, examen, terrain }, {
        type: 'modification',
        titre: deplace ? 'Examen déplacé' : 'Dossier modifié',
        detail: deplace ? `Nouvelle date : ${horodatage(examen.date)} — échéancier SMS recalculé` : null,
      });
      navigate(`/patients/${existant.id}`);
    } else {
      const nouveau = store.creerPatient({ identite, examen, terrain, administratif: brouillon.administratif });
      navigate(`/patients/${nouveau}`);
    }
  }

  const plan = planSms(brouillon, cabinet);

  return (
    <>
      <EnTete
        titre={existant ? 'Modifier le dossier' : 'Nouveau dossier'}
        question={existant ? `${existant.identite.prenom} ${existant.identite.nom} · n° ${existant.numero}` : 'Quatre étapes. L’échéancier SMS se programme tout seul à partir de la date d’examen.'}
      >
        <Link to={existant ? `/patients/${existant.id}` : '/patients'} className="text-xs font-medium text-slate-600 hover:text-navy">Annuler</Link>
      </EnTete>

      <div className="mx-auto max-w-4xl px-5 pt-6 sm:px-8">
        <ol className="mb-6 grid grid-cols-4 gap-2">
          {PAS.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={i > pas && !valide.slice(0, i).every(Boolean)}
                onClick={() => setPas(i)}
                className={`flex w-full flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                  i === pas ? 'border-magenta/40 bg-magenta/[0.07]' : 'border-navy/[0.08] bg-white/60 hover:bg-white'
                }`}
              >
                <span className={`h-1 w-full rounded-full ${i <= pas ? 'bg-magenta' : 'bg-navy/[0.08]'}`} />
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${i === pas ? 'text-magenta' : 'text-slate-600'}`}>
                  <p.icone size={13} /> <span className="hidden sm:inline">{i + 1}. </span>{p.label}
                </span>
              </button>
            </li>
          ))}
        </ol>

        {pas === 0 ? (
          <Carte titre="Identité du patient" icone={<IdCard size={14} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Etiquette libelle="Nom" requis><input className={champ} value={f.identite.nom} onChange={(e) => maj('identite', { nom: e.target.value })} autoFocus /></Etiquette>
              <Etiquette libelle="Prénom" requis><input className={champ} value={f.identite.prenom} onChange={(e) => maj('identite', { prenom: e.target.value })} /></Etiquette>
              <Etiquette libelle="Date de naissance" requis><input type="date" className={champ} value={f.identite.naissance} onChange={(e) => maj('identite', { naissance: e.target.value })} /></Etiquette>
              <Etiquette libelle="Sexe">
                <div className="grid grid-cols-2 gap-2">
                  <Choix actif={f.identite.sexe === 'F'} onClick={() => maj('identite', { sexe: 'F' })}>Femme</Choix>
                  <Choix actif={f.identite.sexe === 'M'} onClick={() => maj('identite', { sexe: 'M' })}>Homme</Choix>
                </div>
              </Etiquette>
              <Etiquette libelle="Téléphone portable" requis>
                <input type="tel" inputMode="tel" className={champ} placeholder="06 12 34 56 78" value={f.identite.telephone} onChange={(e) => maj('identite', { telephone: e.target.value })} />
              </Etiquette>
              <Etiquette libelle="E-mail"><input type="email" className={champ} value={f.identite.email} onChange={(e) => maj('identite', { email: e.target.value })} /></Etiquette>
              <Etiquette libelle="Médecin traitant" className="sm:col-span-2"><input className={champ} value={f.identite.medecinTraitant} onChange={(e) => maj('identite', { medecinTraitant: e.target.value })} /></Etiquette>
            </div>
            <p className="mt-4 text-[11px] text-slate-500">L’année de naissance sert de seconde clé à l’ouverture du lien SMS : vérifiez-la.</p>
          </Carte>
        ) : null}

        {pas === 1 ? (
          <Carte titre="Examen prescrit" icone={<Stethoscope size={14} />}>
            <div className="grid gap-2 sm:grid-cols-4">
              {Object.values(EXAMENS).map((e) => (
                <Choix key={e.id} actif={f.examen.type === e.id} onClick={() => choisirExamen(e.id)} detail={e.purge ? 'Avec purge' : e.id === 'RECTO' ? 'Lavements' : 'Jeûne seul'}>
                  {e.label}
                </Choix>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Etiquette libelle="Indication" className="sm:col-span-2">
                <select className={champ} value={f.examen.indication} onChange={(e) => maj('examen', { indication: e.target.value })}>
                  {ex.indications.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Etiquette>
              <Etiquette libelle="Date" requis><input type="date" className={champ} value={f.examen.jour} onChange={(e) => maj('examen', { jour: e.target.value })} /></Etiquette>
              <Etiquette libelle="Heure de passage" requis>
                <input
                  type="time" step={900} className={champ} value={f.examen.heure}
                  onChange={(e) => maj('examen', { heure: e.target.value, schema: schemaConseille(`2000-01-01T${e.target.value}`) })}
                />
              </Etiquette>
              <Etiquette libelle="Lieu de l’examen">
                <select className={champ} value={f.examen.lieu} onChange={(e) => maj('examen', { lieu: e.target.value })}>
                  {cabinet.lieux.map((l) => <option key={l}>{l}</option>)}
                </select>
              </Etiquette>
              <Etiquette libelle="Opérateur">
                <select className={champ} value={f.examen.operateur} onChange={(e) => maj('examen', { operateur: e.target.value })}>
                  {cabinet.praticiens.map((l) => <option key={l}>{l}</option>)}
                </select>
              </Etiquette>
              <Etiquette libelle="Anesthésie" className="sm:col-span-2">
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(ANESTHESIES).map((an) => (
                    <Choix key={an.id} actif={f.examen.anesthesie === an.id} onClick={() => maj('examen', { anesthesie: an.id })}>{an.label}</Choix>
                  ))}
                </div>
              </Etiquette>
            </div>

            {ex.purge ? (
              <div className="mt-5 border-t border-navy/[0.07] pt-5">
                <p className="mb-2.5 text-xs font-medium text-slate-700">Préparation colique</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  {Object.values(PROTOCOLES).map((p) => (
                    <Choix key={p.id} actif={f.examen.protocole === p.id} onClick={() => maj('examen', { protocole: p.id })} detail={p.famille}>{p.nom}</Choix>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {Object.values(SCHEMAS).map((s) => (
                    <Choix key={s.id} actif={f.examen.schema === s.id} onClick={() => maj('examen', { schema: s.id })} detail={s.detail}>{s.label}</Choix>
                  ))}
                </div>
                <div className="mt-4">
                  <Case
                    actif={f.examen.renforce}
                    onClick={() => maj('examen', { renforce: !f.examen.renforce })}
                    titre="Préparation renforcée"
                    detail="Régime sans résidu sur 5 jours au lieu de 3, pour les patients à risque de préparation insuffisante."
                  />
                </div>
              </div>
            ) : null}
          </Carte>
        ) : null}

        {pas === 2 ? (
          <div className="grid gap-5">
            <Carte titre="Traitements à surveiller" icone={<HeartPulse size={14} />} note="Consignes usuelles, à valider par le prescripteur. Le patient confirmera à J-7 avoir reçu sa consigne pour chaque traitement coché.">
              <div className="grid gap-2 sm:grid-cols-2">
                {TRAITEMENTS.map((t) => (
                  <Case
                    key={t.id}
                    actif={f.terrain.traitements.includes(t.id)}
                    onClick={() => maj('terrain', { traitements: basculer(f.terrain.traitements, t.id) })}
                    titre={t.label}
                    detail={t.exemples}
                  />
                ))}
              </div>
            </Carte>
            {ex.purge ? (
              <Carte titre="Facteurs de préparation insuffisante">
                <div className="grid gap-2 sm:grid-cols-2">
                  {FACTEURS.map((fa) => (
                    <Case key={fa.id} actif={f.terrain.facteurs.includes(fa.id)} onClick={() => maj('terrain', { facteurs: basculer(f.terrain.facteurs, fa.id) })} titre={fa.label} />
                  ))}
                </div>
                {conseilRenforce ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-magenta/30 bg-magenta/[0.06] p-3">
                    <p className="text-xs text-slate-700"><span className="font-semibold text-magenta">Préparation renforcée conseillée</span> pour ce profil.</p>
                    <button type="button" onClick={() => maj('examen', { renforce: true })} className="rounded-lg border border-magenta/35 bg-white px-3 py-1.5 text-xs font-semibold text-magenta">Activer</button>
                  </div>
                ) : null}
              </Carte>
            ) : null}
            <Carte titre="Comorbidités et allergies">
              <div className="grid gap-2 sm:grid-cols-2">
                {COMORBIDITES.map((c) => (
                  <Case key={c.id} actif={f.terrain.comorbidites.includes(c.id)} onClick={() => maj('terrain', { comorbidites: basculer(f.terrain.comorbidites, c.id) })} titre={c.label} />
                ))}
              </div>
              {ci.length ? (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/50 bg-rose-50/70 p-3 text-xs text-rose-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {PROTOCOLES[f.examen.protocole].nom} est contre-indiqué sur ce terrain ({ci.map((c) => comorbidite(c).label).join(', ')}). Choisissez une autre préparation à l’étape Examen.
                </p>
              ) : null}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Etiquette libelle="Allergies"><input className={champ} value={f.terrain.allergies} onChange={(e) => maj('terrain', { allergies: e.target.value })} placeholder="Aucune connue" /></Etiquette>
                <Etiquette libelle="Antécédents utiles"><input className={champ} value={f.terrain.antecedents} onChange={(e) => maj('terrain', { antecedents: e.target.value })} /></Etiquette>
              </div>
            </Carte>
          </div>
        ) : null}

        {pas === 3 ? (
          <Carte titre="Échéancier SMS programmé" icone={<Send size={14} />} note={`Expéditeur : ${cabinet.expediteur}. Les heures sont recalculées si la date d’examen change.`}>
            {ci.length ? (
              <p className="mb-4 flex items-start gap-2 rounded-xl border border-rose-400/50 bg-rose-50/70 p-3 text-xs text-rose-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" /> Préparation contre-indiquée sur ce terrain : le dossier sera créé avec une alerte rouge.
              </p>
            ) : null}
            <ol className="space-y-3">
              {plan.map((s) => (
                <li key={s.etape.id} className="rounded-xl border border-navy/[0.08] bg-white/65 p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-navy"><span className="text-magenta">{s.cle}</span> — {s.etape.titre}</p>
                    <p className={`text-[11px] ${s.envoi < new Date() ? 'font-semibold text-amber-700' : 'text-slate-500'}`}>
                      {s.envoi < new Date() ? 'Échéance passée — partira au prochain scan' : horodatage(s.envoi)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">« {s.texte} »</p>
                </li>
              ))}
            </ol>
          </Carte>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPas(pas - 1)}
            disabled={pas === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-navy/[0.09] bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 disabled:invisible"
          >
            <ArrowLeft size={15} /> Précédent
          </button>
          {pas < PAS.length - 1 ? (
            <button
              type="button"
              onClick={() => setPas(pas + 1)}
              disabled={!valide[pas]}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition-all hover:brightness-125 disabled:opacity-40"
            >
              Suivant <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={enregistrer}
              className="inline-flex items-center gap-2 rounded-xl bg-magenta px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(147,43,156,0.7)] transition-all hover:brightness-110"
            >
              <Check size={15} /> {existant ? 'Enregistrer les modifications' : 'Créer le dossier et programmer les SMS'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
