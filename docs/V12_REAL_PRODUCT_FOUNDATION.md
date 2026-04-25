# NimbrayAI V12 — Real Product Foundation

Cette version est la base produit la plus complète de NimbrayAI à ce stade.

## Nouveautés principales

- Interface claire/translucide conservée.
- Réponses NimbrayAI à gauche sans bulle fermée.
- Messages utilisateur en bulle à droite.
- Moteur de conversation avec profils : Auto, Court, Détaillé, Expert, Créatif, Technique, Avec sources.
- RAG local léger : découpage des sources, scoring, sélection de passages.
- Upload de sources : TXT, MD, CSV, JSON, code, PDF, DOCX.
- Parsing serveur local pour PDF/DOCX via `pdf-parse` et `mammoth`.
- Mémoire locale.
- Cloud Ready : synchronisation Supabase optionnelle.
- Admin local : diagnostic IA, export, réinitialisation locale.
- Fallback Ollama si modèle manquant.

## Limites honnêtes

- Le RAG est local et léger, pas encore un vrai moteur vectoriel avec embeddings.
- Les PDF scannés nécessitent OCR, non inclus.
- L'authentification réelle n'est pas encore incluse ; elle est prévue pour une future version.
- La sauvegarde cloud est optionnelle et nécessite Supabase.

## Recommandation modèle

Pour tester gratuitement avec Ollama :

```powershell
ollama pull qwen2.5:3b
```

Puis `.env.local` :

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
ENABLE_FREE_SOURCES=true
ENABLE_DOCUMENT_PARSING=true
ENABLE_PDF_PARSE=true
ENABLE_DOCX_PARSE=true
```
