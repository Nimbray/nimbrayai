# NimbrayAI V45 — Product Platform Edition

V45 regroupe les axes V41, V42, V43 et V45 dans une seule grosse base produit.

## Objectif

Transformer NimbrayAI en plateforme bêta structurée : comptes prêts, cloud optionnel, documents, admin, feedback et projets.

## Modules inclus

### V41 — User Cloud & Accounts
- mode invité conservé ;
- Supabase Auth prêt ;
- profil utilisateur ;
- mémoire utilisateur ;
- conversations cloud préparées ;
- sources utilisateur préparées.

### V42 — Document Intelligence
- upload TXT/MD/CSV/JSON/code/PDF/DOCX conservé ;
- moteur RAG local conservé ;
- sources classées ;
- citations propres quand demandées ;
- réduction du contexte envoyé à Groq.

### V43 — Admin & Analytics Center
- page `/admin` ;
- route `/api/platform/status` ;
- diagnostic IA/cloud ;
- feedback bêta structuré ;
- base pour métriques qualité.

### V45 — Workspace / Projects
- page `/projects` ;
- route `/api/platform/projects` ;
- structure projets ;
- mémoire et sources par projet préparées.

## Modes de fonctionnement

### Local gratuit
```
ENABLE_AUTH=false
ENABLE_SERVER_STORAGE=false
AI_PROVIDER=groq
```

### Cloud Supabase optionnel
```
ENABLE_AUTH=true
ENABLE_SERVER_STORAGE=true
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Le mode cloud est optionnel. La V45 reste utilisable sans paiement obligatoire en local et sur Vercel avec Groq free tier.
