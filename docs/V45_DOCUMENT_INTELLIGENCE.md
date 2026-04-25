# Document Intelligence V45

La V45 conserve le socle document/RAG et prépare une exploitation plus avancée.

## Principes
- Découper les documents en passages courts.
- Classer par titre, catégorie, mots-clés, contenu et fiabilité.
- Masquer les sources par défaut.
- Afficher les sources seulement si l’utilisateur les demande.
- Réduire le contexte envoyé à Groq pour éviter les rate limits.

## Prochaines évolutions
- Vectorisation locale ou Supabase pgvector.
- Résumés automatiques par document.
- Questions/réponses documentaires plus précises.
- Sources par projet.
