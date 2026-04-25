# Déployer NimbrayAI V18 gratuitement au départ

## Option recommandée gratuite

- Vercel Hobby pour l’interface et l’app Next.js.
- Supabase Free pour la base si tu actives la sauvegarde serveur.
- Ollama local seulement pour tes tests personnels.

## Important

Mettre l’interface en ligne gratuitement ne veut pas dire que l’IA open source locale sera accessible à tous.
Pour que tout le monde utilise Ollama, il faudra plus tard un serveur IA accessible en ligne.

Pour une bêta publique gratuite, tu peux commencer avec :

```env
AI_PROVIDER=demo
ENABLE_SERVER_STORAGE=true
```

Puis activer un provider cloud/free tier si nécessaire.

## Futur

Quand la bêta aura des utilisateurs, il faudra décider :

- serveur IA open source dédié ;
- provider free tier limité ;
- ou API payante maîtrisée avec quotas.
