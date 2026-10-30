import Dictee from '../../components/Dictee.jsx';
import HistoriqueCR, { comptesRendus } from '../../components/HistoriqueCR.jsx';

/** Dans la fiche : la dictée pour ce patient, et ses comptes rendus déjà signés. */
export default function OngletComptesRendus({ patient }) {
  return (
    <div className="flex flex-col gap-8">
      <Dictee patient={patient} />
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Comptes rendus signés</p>
        <HistoriqueCR liste={comptesRendus([patient])} vide="Aucun compte rendu signé pour ce patient." />
      </section>
    </div>
  );
}
