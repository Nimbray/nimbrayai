# NimbrayAI V21 — Public AI + Mobile Premium

Cette version corrige deux problèmes observés sur la bêta publique :

1. Le site public tournait en `AI_PROVIDER=demo`, donc certaines questions simples recevaient une réponse trop générique.
2. L'expérience mobile devait être plus nette, plus lisible et plus naturelle.

## Corrections principales

- Mode démo amélioré pour les questions fréquentes.
- Réponse correcte à : “Pourquoi le ciel est bleu ?”.
- Moins de phrases génériques.
- Interface mobile plus stable.
- Drawer mobile plus propre.
- Composer plus accessible au doigt.
- Écran d’accueil du chat plus neutre.
- Sources masquées sauf demande explicite.

## Pour une vraie IA publique

Le mode `demo` reste limité. Pour une vraie expérience IA sur Vercel, utiliser :

```env
AI_PROVIDER=groq
GROQ_API_KEY=ta_cle_groq
GROQ_MODEL=llama-3.1-8b-instant
```

ou :

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=ta_cle_openrouter
OPENROUTER_MODEL=openrouter/auto
```

Ollama reste excellent en local, mais il ne fonctionne pas directement pour les visiteurs Vercel.
