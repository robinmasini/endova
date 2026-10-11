import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Connexion from './practitioner/Connexion.jsx';
import InstallationCabinet from './practitioner/InstallationCabinet.jsx';
import { useSession } from './lib/session.js';
import { store } from './lib/store.js';
import { useEffect, useState } from 'react';
import Coquille from './practitioner/Coquille.jsx';
import Dashboard from './practitioner/Dashboard.jsx';
import ListePatients from './practitioner/ListePatients.jsx';
import Echeancier from './practitioner/Echeancier.jsx';
import Reglages from './practitioner/Reglages.jsx';
import ApercuSuivi from './practitioner/ApercuSuivi.jsx';
import FichePage from './practitioner/fiche/FichePage.jsx';
import NouveauDossier from './practitioner/NouveauDossier.jsx';
import Rappels from './practitioner/Rappels.jsx';
import Vacations from './practitioner/Vacations.jsx';
import PatientApp from './patient/PatientApp.jsx';
import Presentation from './presentation/Presentation.jsx';
import Chargement from './components/Chargement.jsx';

/**
 * La coquille du cabinet, derrière la session.
 *
 * Sans Supabase configuré, `phase` vaut « ouvert » : la maquette reste
 * accessible comme avant. Avec, il faut une session — les dossiers ne sont
 * plus sur la machine de celui qui regarde.
 */
function CoquilleGardee() {
  const { phase } = useSession();
  // 'attente' tant que l'état du cabinet n'est pas revenu de la base.
  const [lien, setLien] = useState('attente');

  const ouvrir = () => store.ouvrirSession().then(setLien);

  useEffect(() => {
    if (phase === 'connecte') { ouvrir(); return; }
    if (phase === 'ouvert') { setLien('local'); return; }
    if (phase === 'anonyme') store.fermerSession();
  }, [phase]);

  if (phase === 'chargement' || (phase === 'connecte' && lien === 'attente')) return <Chargement />;
  if (phase === 'anonyme') return <Connexion />;
  if (lien === 'sans-cabinet') return <InstallationCabinet onInstalle={ouvrir} />;
  if (lien === 'erreur') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-5">
        <div className="max-w-sm rounded-2xl border border-rose-400/50 bg-rose-50/70 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">La base n’a pas répondu</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">{store.dernierSouci()}</p>
          <button type="button" onClick={ouvrir} className="mt-4 text-xs font-medium text-navy hover:underline">Réessayer</button>
        </div>
      </div>
    );
  }
  return <Coquille />;
}

export default function App() {
  return (
    <BrowserRouter basename="/dashboard">
      <Routes>
        {/* Logiciel du cabinet : sections sous une coquille commune (sidebar / barre mobile). */}
        <Route element={<CoquilleGardee />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<ListePatients />} />
          <Route path="/patients/nouveau" element={<NouveauDossier />} />
          <Route path="/patients/:id" element={<FichePage />} />
          <Route path="/patients/:id/modifier" element={<NouveauDossier />} />
          <Route path="/rappels" element={<Rappels />} />
          <Route path="/vacations" element={<Vacations />} />
          <Route path="/echeancier" element={<Echeancier />} />
          <Route path="/apercu" element={<ApercuSuivi />} />
          <Route path="/reglages" element={<Reglages />} />
        </Route>
        {/* Page commerciale : plein écran, sans coquille ni navigation d'app. */}
        <Route path="/presentation" element={<Presentation />} />
        {/* La PWA patient vit hors de la coquille : plein écran, sans navigation. */}
        <Route path="/p/:token" element={<PatientApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
