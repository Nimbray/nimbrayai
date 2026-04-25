# NimbrayAI V71 — Natural Intelligence Layer

## Objectif

La V71 améliore le cœur conversationnel de NimbrayAI sans refondre toute l’interface. Elle ajoute une couche d’intelligence naturelle placée avant les anciens moteurs locaux et avant les fournisseurs IA externes.

## Nouveautés principales

- `lib/natural-intelligence.ts`
- silence persistant mieux respecté ;
- reprise de conversation après silence ;
- réponses plus naturelles à `rien`, `parle`, `merci`, `bof`, `jsp` ;
- meilleure gestion de la solitude ;
- meilleure gestion des questions d’identité/orientation comme `je crois que je suis bi` ;
- consignes système V71 injectées dans le prompt des modèles ;
- post-traitement léger pour retirer certaines formules robotiques.

## Fichiers modifiés

- `app/api/chat/route.ts`
- `lib/natural-intelligence.ts`
- `lib/conversation-engine.ts`
- `package.json`
- `README.md`
- `docs/V71_NATURAL_INTELLIGENCE_LAYER.md`

## Tests recommandés

Comparer V70 et V71 avec :

- `rien`
- `rien` puis `rien`
- `arrête`
- `ne réponds plus`
- `parle`
- `je me sens seul`
- `je crois que je suis bi`
- `merci`
- `bof`
- `tu peux faire plus naturel`
- une demande longue technique
- une demande sensible

## Déploiement conseillé

1. Déployer en preview Vercel.
2. Tester les micro-dialogues et sujets sensibles.
3. Vérifier que les réponses longues continuent de passer par Groq/Ollama/OpenRouter selon la configuration.
4. Passer en production seulement après comparaison avec V70.
