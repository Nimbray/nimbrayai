# NimbrayAI V35 — Real RAG Engine

V35 est une grosse version centrée sur l'intelligence documentaire. L'objectif est de rendre NimbrayAI plus solide dans sa manière de sélectionner, classer et utiliser ses sources avant d'appeler Groq.

## Objectifs

- Utiliser les sources locales de façon plus propre.
- Réduire le contexte envoyé à Groq.
- Masquer les sources par défaut.
- Afficher les sources uniquement quand l'utilisateur les demande.
- Prioriser les fiches fiables, stables et pertinentes.
- Éviter les doublons et les passages inutiles.
- Garder les réponses simples quand la question est simple.

## Pipeline RAG recommandé

1. Détecter l'intention utilisateur.
2. Traiter localement si c'est un micro-dialogue, une question stable ou une sécurité critique.
3. Chercher les fiches pertinentes dans le cerveau local.
4. Sélectionner maximum 2 à 4 passages courts.
5. Résumer le contexte avant envoi à Groq.
6. Répondre sans afficher les sources, sauf demande explicite.
7. Si l'utilisateur demande les sources, afficher les titres courts des fiches utilisées.

## Règle importante

NimbrayAI ne doit jamais envoyer tout son cerveau à Groq. Il doit envoyer uniquement le minimum utile.
