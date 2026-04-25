# NimbrayAI V18 — Beta Public Release

V18 prépare NimbrayAI pour une première bêta publique contrôlée.

## Objectifs

- Montrer une landing page publique propre.
- Garder le mode local gratuit.
- Préparer un accès bêta avec invitation.
- Garder Supabase optionnel.
- Centraliser les feedbacks bêta.
- Garder l’interface simple : NimbrayAI décide seul du niveau de réponse.

## Coût

Tu peux tester sans payer :

- localement avec `npm run dev` ;
- avec Ollama sur ton PC ;
- avec Supabase Free si tu veux tester la sauvegarde serveur ;
- avec Vercel Hobby pour un projet personnel ou une bêta limitée.

Pour un usage commercial, une charge importante ou un vrai lancement public, il faudra probablement passer sur des offres payantes plus tard.

## Pages ajoutées

- `/landing` : présentation publique ;
- `/beta` : page d’accès bêta ;
- `/privacy` : modèle de confidentialité bêta ;
- `/terms` : modèle de conditions bêta ;
- `/` : application principale.

## Variables importantes

```env
ENABLE_AUTH=false
ENABLE_SERVER_STORAGE=false
ENABLE_BETA_ACCESS=false
BETA_INVITE_CODE=NIMBRAY-BETA
AI_PROVIDER=ollama
```

## Checklist bêta

- Tester en local.
- Tester Ollama.
- Tester upload de sources.
- Tester feedback bêta.
- Configurer Supabase seulement si besoin.
- Publier la landing.
- Inviter 3 à 10 testeurs au départ.
