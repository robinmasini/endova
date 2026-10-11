/**
 * Écran d'attente.
 *
 * Il reprend mot pour mot l'amorce posée dans index.html — mêmes classes,
 * même animation, même fond — pour que le relais du HTML vers React ne se
 * voie pas. Rien ne bouge à l'écran au moment où l'application prend la main ;
 * seule la raison d'attendre change, et le lecteur n'a pas à le savoir.
 *
 * Les styles vivent dans la page, pas ici : l'amorce doit tenir avant que la
 * moindre feuille ne soit chargée, et deux copies finiraient par diverger.
 */
export default function Chargement({ libelle = 'Chargement' }) {
  return (
    <div className="amorce" role="status" aria-label={libelle}>
      <span className="amorce-marque" />
    </div>
  );
}
