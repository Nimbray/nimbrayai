# NimbrayAI V39 — Quality & Self-Improvement Engine

La V39 renforce la qualité globale des réponses de NimbrayAI.

## Objectif

NimbrayAI doit moins répondre de façon vague, mieux comprendre les critiques, mieux gérer les erreurs et mieux adapter son ton aux sujets sensibles.

## Nouveautés

- `lib/quality-engine.ts` : routeur local de qualité.
- Réponses locales aux critiques : “c’est faux”, “trop long”, “pas clair”, “plus humain”.
- Mode prudent pour santé, droit, finance, sécurité, décès et administration.
- Meilleure consigne système envoyée à Groq.
- Moins d’erreurs techniques visibles.
- Sources toujours masquées par défaut.

## Principe de routage

1. Safety Router
2. Behavior Engine
3. Quality Engine
4. Local Brain
5. Practical / Knowledge Router
6. Groq seulement si nécessaire

## Pourquoi c’est important

Le but est que NimbrayAI ne soit pas seulement sympathique, mais fiable, corrigeable et plus mature dans ses réponses.
