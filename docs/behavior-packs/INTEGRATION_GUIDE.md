# Guide d’intégration des Behavior Packs

## Priorité du routeur

1. Safety Router : suicide, automutilation, violence, danger, illégal.
2. Micro-dialogue Router : ok, merci, haha, bof, pas mal, stop, silence.
3. Emotion Router : tristesse, doute, honte, solitude, stress.
4. Common Sense Router : demandes pratiques simples.
5. Knowledge Router : fiches stables.
6. Groq/Ollama : demandes longues, créatives, analytiques, personnalisées.

## Pourquoi local-first ?

- Réponses plus rapides.
- Moins de coûts.
- Moins de rate-limit Groq.
- Comportement plus stable.
- Sécurité plus contrôlée.

## Format des packs

Chaque pack contient :
- id
- name
- purpose
- triggers
- rules
- responses
- avoid
- escalation

## Sécurité

Les packs d’humour et d’enthousiasme ne doivent jamais s’appliquer aux sujets de crise, deuil, violence, suicide, abus ou danger immédiat.
