# Déploiement NimbrayAI V12.2

## Local

La V12.2 est d'abord prévue pour fonctionner localement gratuitement.

## Vercel

Possible pour l'interface et les routes API, mais Ollama local ne sera pas accessible depuis Vercel. Pour une IA réelle en ligne, il faut :

- Groq/OpenRouter avec clés côté serveur ; ou
- serveur IA privé avec Ollama/vLLM accessible en HTTPS ; ou
- mode demo pour landing/bêta.

## Supabase

Supabase est optionnel pour sauvegarder le workspace.

Voir `docs/V12.2_SUPABASE_SETUP.md`.

## Version publique recommandée plus tard

- Authentification
- Base PostgreSQL
- Stockage fichiers
- RAG vectoriel
- Quotas utilisateur
- Politique de confidentialité


## V12.2 Adaptive Conversation

Cette version retire le sélecteur Auto/Court/Détaillé/Expert de l’interface. NimbrayAI décide automatiquement du niveau de réponse selon la demande. Pour obtenir des sources, demande simplement “réponds avec sources” ou “cite tes sources”.
