# NimbrayAI V8 — Cloud Ready

Cette version garde le fonctionnement gratuit local, mais ajoute une base pour préparer la mise en ligne.

## Ce qui fonctionne sans rien payer

- Interface V7 claire et fluide
- Conversations locales
- Mémoire locale
- Sources locales uploadées
- Mode demo gratuit
- Ollama en local si installé
- Export JSON du workspace

## Ce qui devient possible avec Supabase

- Sauvegarde serveur optionnelle
- Restauration d'un workspace depuis un autre navigateur
- Préparation à des comptes utilisateurs réels
- Base pour une future V10 avec authentification

## Activer la sauvegarde serveur

1. Crée un projet Supabase.
2. Exécute `docs/SUPABASE_SCHEMA.sql` dans le SQL Editor.
3. Mets ces variables dans `.env.local` :

```env
ENABLE_SERVER_STORAGE=true
SUPABASE_URL=https://TON-PROJET.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ta_service_role_key
SUPABASE_TABLE=nimbray_workspaces
```

4. Redémarre NimbrayAI :

```powershell
CTRL + C
npm.cmd run dev
```

5. Dans l'app, ouvre le panneau **Cloud Ready** et clique sur **Sauvegarder côté serveur**.

## Important sécurité

La `SUPABASE_SERVICE_ROLE_KEY` doit rester côté serveur dans `.env.local`. Ne la mets jamais dans du code frontend ni sur GitHub.

## Prochaine étape V10

- Authentification réelle
- Conversations par utilisateur
- Sources par utilisateur
- RLS Supabase
- Upload PDF/DOCX avancé
- Streaming serveur réel
