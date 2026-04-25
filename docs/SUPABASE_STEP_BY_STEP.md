# Configurer Supabase pour NimbrayAI V19

Supabase est optionnel. NimbrayAI fonctionne sans Supabase en mode local/demo.

## 1. Créer un projet Supabase

1. Crée un compte Supabase.
2. Crée un nouveau projet.
3. Récupère :
   - Project URL
   - anon public key
   - service role key

## 2. Exécuter le schéma SQL

Dans Supabase :

1. Ouvre SQL Editor.
2. Colle le contenu de `docs/SUPABASE_SCHEMA.sql`.
3. Exécute le script.

## 3. Variables à ajouter dans Vercel

```env
ENABLE_AUTH=true
ENABLE_SERVER_STORAGE=true
NEXT_PUBLIC_SUPABASE_URL=ton_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta_anon_key
SUPABASE_URL=ton_project_url
SUPABASE_SERVICE_ROLE_KEY=ta_service_role_key
SUPABASE_TABLE=nimbray_workspaces
SUPABASE_FEEDBACK_TABLE=nimbray_feedback
```

## 4. Sécurité

La service role key ne doit jamais être exposée côté navigateur.
Elle doit rester dans les variables serveur de Vercel.

## 5. Recommandation bêta

Commence avec :

```env
ENABLE_AUTH=false
ENABLE_SERVER_STORAGE=false
```

Puis active Supabase quand la landing page et l'expérience bêta sont validées.
