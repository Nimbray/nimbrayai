# NimbrayAI V19 — Deploy Ready

Cette version prépare NimbrayAI pour une mise en ligne simple avec Vercel + Supabase, tout en gardant le mode local gratuit.

## Objectif

- Mettre la landing page et l'application en ligne.
- Garder un mode gratuit de démonstration.
- Préparer Supabase pour l'authentification, la sauvegarde et le feedback.
- Pouvoir tester sans paiement obligatoire au départ.

## Architecture recommandée

```text
Vercel        -> héberge l'application Next.js
Supabase      -> auth, base de données, feedback, workspace utilisateur
Ollama local  -> seulement pour tes tests locaux
Groq/OpenRouter optionnels -> pour une IA cloud gratuite/limitée ou payante selon usage
```

## Important sur Ollama

Ollama installé sur ton PC ne sera pas accessible par les visiteurs d'une app Vercel.

Pour une bêta publique gratuite, utilise au départ :

```env
AI_PROVIDER=demo
ENABLE_AUTH=false
ENABLE_SERVER_STORAGE=false
```

Puis active progressivement Supabase et un provider cloud si besoin.

## Variables Vercel minimales

```env
AI_PROVIDER=demo
ENABLE_FREE_SOURCES=true
ENABLE_AUTH=false
ENABLE_SERVER_STORAGE=false
ENABLE_BETA_FEEDBACK=true
ENABLE_INVITE_MODE=false
```

## Variables Vercel avec Supabase

```env
AI_PROVIDER=demo
ENABLE_AUTH=true
ENABLE_SERVER_STORAGE=true
ENABLE_BETA_FEEDBACK=true
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_TABLE=nimbray_workspaces
SUPABASE_FEEDBACK_TABLE=nimbray_feedback
```

Ne mets jamais `SUPABASE_SERVICE_ROLE_KEY` dans le frontend. Dans Vercel, elle doit rester dans les Environment Variables serveur.

## Checklist avant publication

- [ ] Tester `npm install --no-audit --no-fund`
- [ ] Tester `npm run build`
- [ ] Vérifier `/landing`
- [ ] Vérifier `/beta`
- [ ] Vérifier `/privacy`
- [ ] Vérifier `/terms`
- [ ] Mettre `AI_PROVIDER=demo` pour une première bêta gratuite
- [ ] Déployer sur Vercel
- [ ] Tester l'URL publique
- [ ] Ajouter Supabase plus tard si nécessaire

## Prochaine version possible

V20 pourra ajouter les bases commerciales : comptes finalisés, quotas, monitoring, limites d'usage, sécurité renforcée et préparation Stripe.
