import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Coquille from './practitioner/Coquille.jsx';
import Dashboard from './practitioner/Dashboard.jsx';
import ListePatients from './practitioner/ListePatients.jsx';
import Echeancier from './practitioner/Echeancier.jsx';
import Reglages from './practitioner/Reglages.jsx';
import PatientApp from './patient/PatientApp.jsx';
import Presentation from './presentation/Presentation.jsx';

export default function App() {
  return (
    <BrowserRouter basename="/dashboard">
      <Routes>
        {/* Back-office : sections sous une coquille commune (sidebar / barre mobile). */}
        <Route element={<Coquille />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<ListePatients />} />
          <Route path="/echeancier" element={<Echeancier />} />
          <Route path="/reglages" element={<Reglages />} />
        </Route>
        {/* Page commerciale : plein écran, sans coquille ni navigation d'app. */}
        <Route path="/presentation" element={<Presentation />} />
        {/* La PWA patient vit hors de la coquille : plein écran, sans navigation. */}
        <Route path="/p/:token" element={<PatientApp />} />
        {/* L'ancienne section « À rappeler » est devenue un filtre de la liste. */}
        <Route path="/rappels" element={<Navigate to="/patients?filtre=alerte" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
