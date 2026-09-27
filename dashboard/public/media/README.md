# Emplacements vidéo de la page de présentation

Déposer un fichier ici suffit à l'activer : la page le détecte et le joue en fond.
Tant qu'il est absent, le dégradé dessous fait office de rendu — il n'y a jamais
de cadre vide ni de mention « placeholder » à l'écran, la page reste montrable.

| Fichier | Scène | Ce que le plan doit montrer |
|---|---|---|
| `bloc.mp4` | Ouverture (cold open) | Salle d'endoscopie, lumière de scialytique, ambiance sombre et calme. Plan large, très lent, quasi immobile. |
| `soignants.mp4` | Le constat | Équipe soignante en action — MAR, IDE, colonne vidéo. Mouvement lent, aucun visage identifiable net. |

## Contraintes techniques

- **Format** : MP4, H.264, sans piste audio (les balises sont `muted` + `loop`).
- **Durée** : 8 à 14 s, la boucle doit être imperceptible.
- **Cadrage** : 16:9 minimum, recadré en `object-cover` — ne rien placer d'important
  sur les bords, ils seront rognés selon la taille d'écran.
- **Poids** : viser moins de 3 Mo par plan. La page s'ouvre souvent en 4G lors
  d'une démonstration en cabinet.
- **Étalonnage** : les deux plans passent sous un voile navy `#03102B` à 35–42 %
  d'opacité. Un plan déjà sombre ressortira noir : livrer une image plutôt
  claire et contrastée, le voile fera le reste.

## Colorimétrie

Le dégradé de la marque va du magenta `#932B9C` au navy `#051C4E`. Éviter dans
les plans tout vert clinique saturé ou tout cyan franc : ils entrent en conflit
direct avec le violet du logo qui apparaît juste après, à la révélation.

## Droits

Ces plans seront diffusés sur une page commerciale. N'utiliser que des images
dont vous détenez les droits d'exploitation commerciale — production propre,
générations Higgsfield, ou licence explicite. Une photo de banque d'images prise
au hasard expose le cabinet autant que vous.

## Personnes filmées

Si des soignants ou des patients réels apparaissent et sont identifiables, il
faut leur autorisation écrite de diffusion. C'est la raison de la consigne
« aucun visage identifiable net » ci-dessus.
