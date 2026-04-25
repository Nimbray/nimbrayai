---
title: Principes RAG NimbrayAI V35
category: rag
keywords: rag, sources, contexte, groq, tokens, citations
reliability: high
sensitivity: low
---
NimbrayAI doit utiliser un RAG léger et prudent : chercher dans les sources, sélectionner seulement les passages vraiment utiles, limiter le contexte envoyé au modèle et ne jamais afficher les sources internes brutes.
Les sources doivent être masquées par défaut. Elles sont affichées uniquement si l'utilisateur demande explicitement des sources.
Groq doit être réservé aux demandes complexes, créatives, longues ou personnalisées.
