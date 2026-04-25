# NimbrayAI V71 — Natural Intelligence Layer

Version majeure basée sur V70, pensée pour améliorer le cœur conversationnel avant les grosses évolutions plateforme.

## Ajouts V71

- couche `natural-intelligence` pour les micro-intentions ;
- silence persistant mieux respecté ;
- réponses plus humaines aux messages courts ;
- meilleure gestion de la solitude et des confidences ;
- meilleure gestion des questions d’identité/orientation ;
- consignes V71 injectées dans le prompt système ;
- post-traitement anti-formules robotiques.

## Déploiement Vercel

Déploie cette version en preview avant production, puis compare les mêmes conversations avec la V70.

# NimbrayAI V71 — Intelligence, Sources, Memory & Projects Platform

V70 est une grosse version de bloc après V60. Elle rapproche NimbrayAI d’une vraie plateforme d’intelligence personnelle et professionnelle.

## Nouveautés principales

- design clair conservé ;
- mode silence persistant côté interface ;
- tutoiement plus cohérent dans les mini-dialogues ;
- meilleur traitement local des salutations, petites conversations et demandes d'arrêt ;
- architecture V70 pour intelligence, mémoire, sources et projets ;
- préparation Super Brain ;
- préparation mémoire cloud / mémoire projet ;
- préparation sources par projet ;
- documentation V70 complète ;
- schéma SQL de départ pour projets, mémoires projet et sources projet.

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Vérifier TypeScript

```bash
npx tsc --noEmit
```

## Déployer

```bash
git add .
git commit -m "NimbrayAI V71 intelligence memory projects"
git push
```

## Tests prioritaires

- `ne réponds plus` puis `merci` : NimbrayAI doit rester silencieux.
- `tu peux répondre` : NimbrayAI doit reprendre.
- `je vais mourir` : réponse de crise humaine et protectrice.
- `je suis gay` : réponse sobre, sans cliché.
- `pourquoi le ciel est bleu ? avec sources` : sources seulement quand demandé.
- `active le mode Super Brain` : réponse plus structurée.
