import { useEffect, useRef, useState } from 'react';

/**
 * Avancement d'un élément dans le défilement, de 0 à 1.
 *
 * 0 quand son haut touche le bas de la fenêtre, 1 quand son bas touche le haut.
 * Le calcul est fait dans une boucle rAF plutôt que dans l'écouteur `scroll` :
 * le navigateur émet les événements de défilement bien plus vite qu'il ne peint,
 * et recalculer à chaque événement provoque des à-coups sur les longues pages.
 *
 * `animation-timeline: scroll()` ferait cela nativement, mais Firefox ne le gère
 * pas encore — une démo commerciale ne peut pas dépendre du navigateur du client.
 */
export function useProgression(ref, { depart = 0, fin = 1 } = {}) {
  const [progression, setProgression] = useState(0);
  const valeur = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    let frame = 0;
    let visible = false;

    const mesurer = () => {
      const r = element.getBoundingClientRect();
      const course = window.innerHeight + r.height;
      const brut = (window.innerHeight - r.top) / course;
      const borne = Math.min(1, Math.max(0, (brut - depart) / (fin - depart)));
      if (Math.abs(borne - valeur.current) > 0.001) {
        valeur.current = borne;
        setProgression(borne);
      }
      frame = visible ? requestAnimationFrame(mesurer) : 0;
    };

    // On ne fait tourner la boucle que pendant que la section est à l'écran.
    const observateur = new IntersectionObserver(
      ([entree]) => {
        visible = entree.isIntersecting;
        if (visible && !frame) frame = requestAnimationFrame(mesurer);
        else if (!visible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
          mesurer();
        }
      },
      { rootMargin: '120px 0px' },
    );
    observateur.observe(element);
    mesurer();

    return () => {
      observateur.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, depart, fin]);

  return progression;
}

/** Interpolation linéaire, bornée aux extrémités. */
export const entre = (t, a, b) => a + (b - a) * Math.min(1, Math.max(0, t));

/** Ramène une sous-plage de `t` sur 0–1, pour enchaîner des temps dans une même section. */
export const phase = (t, debut, fin) => Math.min(1, Math.max(0, (t - debut) / (fin - debut)));

/** Adoucit une progression linéaire : démarrage et arrivée moins abrupts. */
export const adoucir = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Respecte le réglage système de réduction des animations. */
export function useAnimationsReduites() {
  const [reduites, setReduites] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const suivre = () => setReduites(mq.matches);
    mq.addEventListener('change', suivre);
    return () => mq.removeEventListener('change', suivre);
  }, []);
  return reduites;
}
