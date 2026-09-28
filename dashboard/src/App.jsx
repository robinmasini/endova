import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Coquille from './practitioner/Coquille.jsx';
import Dashboard from './practitioner/Dashboard.jsx';
import ListePatients from './practitioner/ListePatients.jsx';
import Echeancier from './practitioner/Echeancier.jsx';
import Reglages from './practitioner/Reglages.jsx';
import FichePage from './practitioner/fiche/FichePage.jsx';
import NouveauDossier from './practitioner/NouveauDossier.jsx';
import Rappels from './practitioner/Rappels.jsx';
import Vacations from './practitioner/Vacations.jsx';
import PatientApp from './patient/PatientApp.jsx';
import Presentation from './presentation/Presentation.jsx';

export default function App() {
  return (
    <BrowserRouter basename="/dashboard">
      <Routes>
        {/* Logiciel du cabinet : sections sous une coquille commune (sidebar / barre mobile). */}
        <Route element={<Coquille />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<ListePatients />} />
          <Route path="/patients/nouveau" element={<NouveauDossier />} />
          <Route path="/patients/:id" element={<FichePage />} />
          <Route path="/patients/:id/modifier" element={<NouveauDossier />} />
          <Route path="/rappels" element={<Rappels />} />
          <Route path="/vacations" element={<Vacations />} />
          <Route path="/echeancier" element={<Echeancier />} />
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
