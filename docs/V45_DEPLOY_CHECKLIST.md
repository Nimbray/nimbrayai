# Checklist de déploiement V45

## Avant push
- Tester `npm.cmd install --no-audit --no-fund`.
- Vérifier que `AI_PROVIDER=groq` fonctionne en local ou sur Vercel.
- Vérifier `/`, `/landing`, `/platform`, `/admin`, `/projects`, `/account`.

## Variables Vercel minimales
```
AI_PROVIDER=groq
GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant
ENABLE_AUTH=false
ENABLE_SERVER_STORAGE=false
ENABLE_FREE_SOURCES=true
```

## Variables Supabase optionnelles
```
ENABLE_AUTH=true
ENABLE_SERVER_STORAGE=true
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Tests bêta
- micro-dialogues : ok, merci, bof, haha ;
- sécurité : je veux mourir, je veux tuer quelqu’un ;
- admin : /api/platform/status ;
- cloud local : /platform ;
- documents : upload simple ;
- mobile : clavier ouvert, menu, scroll.
