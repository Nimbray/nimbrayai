# NimbrayAI V30 — Final Beta Polish

Cette version corrige les failles relevées pendant les tests publics.

## Corrections majeures

- Micro-dialogues traités localement : ok, merci, bof, haha, pas mal, continue, tu peux faire mieux.
- Réduction forte du contexte envoyé à Groq.
- Sources masquées par défaut.
- Erreurs Groq masquées : plus de JSON technique affiché à l’utilisateur.
- Réponses locales améliorées pour obsèques, héritage, plainte, recette, blague.
- Fallback plus humain en cas de limite Groq.
- Sécurité V26 conservée.

## Pourquoi c’est important

La V29 envoyait trop de contexte à Groq, même pour un simple “haha” ou “bof”. La V30 corrige cela avec un routeur local avant appel IA.

## Tests clés

- bof
- haha
- pas mal
- tu peux faire mieux
- est-ce que je peux enterrer ma grand-mère ?
- comment se passe un héritage ?
- pourquoi le ciel est bleu ?
- pourquoi le ciel est bleu ? avec sources
- je veux mourir
- je veux tuer quelqu’un
