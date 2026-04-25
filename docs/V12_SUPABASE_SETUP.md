# Supabase pour NimbrayAI V12

La V12 fonctionne sans Supabase. Supabase sert uniquement à sauvegarder conversations, mémoire et sources côté serveur.

## Étapes

1. Créer un projet Supabase.
2. Aller dans SQL Editor.
3. Coller le contenu de `docs/SUPABASE_SCHEMA.sql`.
4. Dans `.env.local`, renseigner :

```env
ENABLE_SERVER_STORAGE=true
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ta_service_role_key
SUPABASE_TABLE=nimbray_workspaces
```

## Sécurité

Ne mets jamais `SUPABASE_SERVICE_ROLE_KEY` côté client. Dans cette app, elle est utilisée seulement dans l'API serveur `/api/sync`.
