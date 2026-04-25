# NimbrayAI V31 — Smart Router & Local Brain

La V31 réduit la dépendance à Groq et rend NimbrayAI plus rapide, plus stable et plus humain.

## Principe

Groq ne doit pas être appelé pour tout et rien. NimbrayAI suit maintenant cet ordre :

1. Safety Router
2. Local Brain Router
3. Micro-dialogue Router
4. Connaissances stables locales
5. Sources/RAG si l’utilisateur les demande
6. Groq uniquement si nécessaire

## Local sans Groq

- ok, merci, bof, haha, pas mal, non, stop, ta gueule, parle pas
- suicide, violence, meurtre, danger
- ciel bleu, mer salée, pluie, atome, électricité
- recettes simples
- obsèques, héritage, plainte, menace
- hors-jeu, langues, Révolution française
- blagues simples

## Groq réservé à

- analyse longue
- création originale
- code complexe
- stratégie business
- rédaction personnalisée
- demandes ambiguës ou longues

## Objectif

Plus rapide, moins cher en tokens, moins de rate limits, plus agréable pour les testeurs.
