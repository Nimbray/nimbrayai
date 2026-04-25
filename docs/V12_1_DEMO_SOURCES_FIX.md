# NimbrayAI V12.1 — Correction Demo & Sources

Cette version corrige deux problèmes observés en test :

1. Le mode demo répondait trop génériquement à certaines questions simples.
2. Des sources internes pouvaient s'afficher alors qu'elles n'étaient pas demandées.

## Changements

- Réponse dédiée à : "que ne sais-tu pas faire ?"
- Sources affichées uniquement si l'utilisateur demande des sources ou si le mode "Avec sources" est actif.
- Suppression des notes de sources locales dans les réponses normales du mode demo.
- Meilleures réponses de secours pour les demandes générales.

## Recommandation

Pour juger la vraie puissance de NimbrayAI, utiliser :

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:3b
```

Le mode demo sert surtout à tester l'interface et le comportement de base.
