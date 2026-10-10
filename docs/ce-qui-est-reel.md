# Ce qui est réel dans Endova, et ce qui ne l'est pas

*9 octobre 2026. Écrit pour répondre à une phrase : « ça fait trop inventé ce
qu'on voit sur le dashboard, je veux du réel ».*

La réponse honnête est en deux parties, parce que le reproche recouvrait deux
choses différentes.

## « Je ne peux pas créer de patient pour de vrai »

Si. La création fonctionne et elle persiste.

Le formulaire en quatre temps — identité, examen, terrain, échéancier — écrit un
dossier complet, lui attribue un numéro, calcule son échéancier à partir du type
d'examen, et le garde au rechargement. Un dossier créé hier est toujours là
aujourd'hui.

Ce qui a pu donner le sentiment du contraire : les dix dossiers de démonstration
réapparaissent si le stockage du navigateur est vidé, et le bouton
« Réinitialiser la démo » les restaure. Un dossier créé à côté d'eux ne se
distingue pas visuellement — il se range dans la même liste, au milieu des
autres.

## « C'est que de l'apparence »

Sur un point, oui, et il est central : **aucun SMS ne part**.

Tout vit dans le navigateur. Il n'y a pas de serveur, pas de base de données,
pas d'opérateur SMS. Le dossier est rangé dans le stockage local du navigateur,
sous une seule clé. Le « plan SMS » calcule les heures d'envoi et le texte de
chaque message, l'échéancier les affiche, le bouton « Scan SMS » simule la
réception des réponses — mais rien ne sort de la machine.

Concrètement, pour passer au réel il manque :

- un hébergeur **certifié HDS**, puisque ce sont des données de santé ;
- une **passerelle SMS** avec un expéditeur déclaré (le nom court
  « TILLEULS-GE » visible dans les réglages est déjà au bon format) ;
- un **serveur** qui tienne l'échéancier et déclenche les envois à l'heure, même
  quand personne n'a le dashboard ouvert ;
- un **compte par praticien**, avec authentification ;
- la **relecture et la validation de toutes les consignes cliniques** par le
  prescripteur. C'est la condition la plus importante, et elle ne dépend pas
  de la technique.

Ce qui est réel aujourd'hui, en revanche : le modèle. Les examens, les
échéanciers, les poids de l'index de préparation, les protocoles de purge avec
leurs contre-indications, les traitements à arrêter et leurs délais, les
alertes, le calcul du Boston prévisionnel, la chronologie, de J-28 au jour J. Tout
cela est écrit, vérifié, et se branchera tel quel sur un serveur le jour venu.

L'application est une maquette fonctionnelle, pas une coquille : ce qu'elle
montre, elle le calcule vraiment. Elle ne parle simplement à personne.
