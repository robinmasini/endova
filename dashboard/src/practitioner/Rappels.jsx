import { useState } from 'react';
import { useDossiers } from '../lib/store.js';
import { joursAvant } from '../lib/examens.js';
import FileRappels, { fileDAppels } from './FileRappels.jsx';
import { EnTete } from './Coquille.jsx';

/**
 * La file d'appels du secrétariat, en page à part : c'est sa tâche du matin.
 * Un patient = un appel ; les urgents d'abord, puis par date d'examen.
 */
const FILTRES = [
  { id: 'tous', label: 'Tous' },
  { id: 'urgent', label: 'Urgents' },
  { id: '48h', label: 'Examen sous 48 h' },
  { id: 'semaine', label: 'Cette semaine' },
];

export default function Rappels() {
  const { patients } = useDossiers();
  const [filtre, setFiltre] = useState('tous');
  const file = fileDAppels(patients.filter((p) => joursAvant(p) >= 0));

  const garde = {
    tous: () => true,
    urgent: (f) => f.motifs.some((m) => m.ton === 'ruby'),
    '48h': (f) => joursAvant(f.patient) <= 2,
    semaine: (f) => joursAvant(f.patient) <= 7,
  };
  const visibles = file.filter(garde[filtre]);

  return (
    <>
      <EnTete
        titre="À rappeler"
        question="Un patient, un appel : tous ses motifs regroupés, et la phrase à lui dire. Une alerte traitée sort de la file."
      />
      <div className="px-5 pt-6 sm:px-8">
        <div className="mb-5 flex gap-2 overflow-x-auto">
          {FILTRES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltre(f.id)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                filtre === f.id ? 'border-magenta/40 bg-magenta/[0.1] text-magenta' : 'border-navy/[0.09] bg-white/60 text-slate-600 hover:text-navy'
              }`}
            >
              {f.label} <span className="tabular-nums opacity-70">{file.filter(garde[f.id]).length}</span>
            </button>
          ))}
        </div>
        <div className="max-w-4xl">
          <FileRappels file={visibles} />
        </div>
      </div>
    </>
  );
}
