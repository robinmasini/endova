import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock } from '../components/icones.js';
import Dictee, { DEGRADE } from '../components/Dictee.jsx';
import HistoriqueCR, { comptesRendus } from '../components/HistoriqueCR.jsx';
import { useDossiers } from '../lib/store.js';
import { joursAvant } from '../lib/examens.js';
import { age, examenDe, nomComplet } from '../lib/patient.js';
import { EnTete } from './Coquille.jsx';

/**
 * Comptes rendus : on enregistre la consultation, Endova rédige.
 * En dessous, les derniers comptes rendus signés, tous patients confondus.
 */
export default function ComptesRendus() {
  const { patients } = useDossiers();
  const [params] = useSearchParams();
  const aVenir = patients
    .filter((p) => joursAvant(p) >= 0)
    .sort((a, b) => new Date(a.examen.date) - new Date(b.examen.date));
  const [patientId, setPatientId] = useState(params.get('patient') ?? aVenir[0]?.id ?? null);
  const patient = patients.find((p) => p.id === patientId) ?? null;
  const signes = comptesRendus(patients).slice(0, 12);

  return (
    <>
      <EnTete titre="Comptes rendus" question="Enregistrez la consultation, Endova rédige le compte rendu.">
        <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-white" style={{ background: DEGRADE }}>
          <Clock size={14} /> 8 min de saisie en moins
        </span>
      </EnTete>

      <div className="px-5 pt-6 sm:px-8">
        <label className="mb-5 flex max-w-xl flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Patient en consultation</span>
          <select
            value={patientId ?? ''}
            onChange={(e) => setPatientId(e.target.value)}
            className="rounded-xl border border-navy/[0.1] bg-white/80 px-3.5 py-2.5 text-sm text-navy outline-none focus:border-navy/40"
          >
            {aVenir.map((p) => (
              <option key={p.id} value={p.id}>{nomComplet(p)} · {age(p)} ans · {examenDe(p).label}</option>
            ))}
          </select>
        </label>

        {patient ? <Dictee patient={patient} /> : <p className="text-sm text-slate-600">Aucun patient à venir.</p>}

        <section className="mt-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Derniers comptes rendus signés</p>
          <HistoriqueCR liste={signes} avecPatient vide="Aucun compte rendu signé pour l’instant. Ils apparaîtront ici dès la première signature." />
        </section>
      </div>
    </>
  );
}
