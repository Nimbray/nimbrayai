# NimbrayAI V17 — Auth & Cloud Beta

## Objectif

Préparer NimbrayAI pour une bêta publique avec comptes et stockage serveur, tout en gardant un mode local gratuit.

## Gratuit / sans paiement obligatoire

- En local : aucun paiement obligatoire.
- Supabase : optionnel. Tu peux rester en `ENABLE_AUTH=false` et `ENABLE_SERVER_STORAGE=false`.
- Ollama : gratuit localement si ton PC supporte les modèles.

## Modes

### Local

```env
ENABLE_AUTH=false
ENABLE_SERVER_STORAGE=false
AI_PROVIDER=ollama
```

### Cloud beta préparé

```env
ENABLE_AUTH=true
ENABLE_SERVER_STORAGE=true
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Supabase

1. Crée un projet Supabase si tu veux tester le cloud.
2. Exécute `docs/SUPABASE_AUTH_SCHEMA_V17.sql`.
3. Remplis les variables d’environnement.
4. Déploie sur Vercel si besoin.

## Ce qui est prêt

- schéma profils ;
- conversations ;
- messages ;
- mémoire ;
- sources ;
- feedback ;
- RLS préparé ;
- mode local conservé.

## Prochaine version

V18 pourra connecter l’interface complète à Supabase Auth et remplacer progressivement le stockage local par le stockage serveur.
