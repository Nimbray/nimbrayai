# Déployer NimbrayAI sur Vercel — étape par étape

## 1. Préparer GitHub

1. Crée un compte GitHub si besoin.
2. Crée un nouveau repository, par exemple `nimbrayai`.
3. Envoie le contenu du dossier `NimbrayAI_V19` dans ce repository.

## 2. Créer un projet Vercel

1. Va sur Vercel.
2. Clique sur **Add New Project**.
3. Importe ton repository GitHub.
4. Laisse Vercel détecter Next.js.
5. Ajoute les variables d'environnement.
6. Clique sur **Deploy**.

## 3. Variables d'environnement recommandées pour commencer

```env
AI_PROVIDER=demo
ENABLE_FREE_SOURCES=true
ENABLE_WIKIPEDIA=true
ENABLE_WIKIDATA=true
ENABLE_OPENLIBRARY=true
ENABLE_ARXIV=true
ENABLE_CROSSREF=true
ENABLE_PUBMED=true
ENABLE_STACKEXCHANGE=true
ENABLE_OFFICIAL_DOCS=true
ENABLE_AUTH=false
ENABLE_SERVER_STORAGE=false
ENABLE_BETA_FEEDBACK=true
ENABLE_INVITE_MODE=false
```

## 4. URL publique

Après déploiement, Vercel donnera une URL du type :

```text
https://ton-projet.vercel.app
```

Tu peux partager `/landing` ou `/beta` aux testeurs.

## 5. Limite importante

Si `AI_PROVIDER=ollama` est utilisé sur Vercel, ça ne fonctionnera pas avec ton Ollama local.
Garde `demo` pour une première bêta gratuite, ou configure un provider cloud.
