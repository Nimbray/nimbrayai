# V35 — Scoring documentaire

Le score d'une source doit combiner :

- correspondance du titre ;
- correspondance des mots-clés ;
- correspondance du contenu ;
- catégorie pertinente ;
- fiabilité ;
- sensibilité ;
- récence si applicable ;
- longueur raisonnable du passage.

## Priorités

1. Sécurité humaine locale.
2. Micro-dialogue local.
3. Fiche stable exacte.
4. Source fiable locale.
5. Source publique externe si activée.
6. Groq seulement si la réponse demande de la génération ou du raisonnement.

## Anti-bruit

- Supprimer les passages dupliqués.
- Éviter les sources hors sujet.
- Ne pas afficher de source si l'utilisateur ne l'a pas demandée.
- Ne jamais afficher le JSON d'erreur d'un provider.
