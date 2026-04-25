# NimbrayAI V22 — Public Intelligence + Mobile Premium + Groq Ready

## Objectif

Cette version corrige le problème observé par les premiers testeurs : en mode public sans provider IA, NimbrayAI répondait parfois avec des phrases trop génériques.

La V22 améliore :

- le mode démo public ;
- l'expérience mobile ;
- la préparation Groq ;
- les textes de version visibles.

## Mode demo public

Le mode `demo` reste limité, mais il sait mieux répondre aux demandes simples :

- pourquoi le ciel est bleu ;
- que peux-tu faire ;
- recettes simples ;
- mails simples ;
- idées business ;
- aide code basique ;
- présentation de NimbrayAI.

## Groq recommandé pour la vraie IA publique

Sur Vercel, Ollama local n'est pas accessible aux visiteurs. Pour une vraie IA publique, la solution recommandée est Groq.

Dans Vercel → Project Settings → Environment Variables :

```env
AI_PROVIDER=groq
GROQ_API_KEY=ta_cle_groq
GROQ_MODEL=llama-3.1-8b-instant
```

Puis redeployer.

## Version affichée

L'interface publique ne doit pas afficher de numéro technique comme V18, V20 ou V22. Elle doit afficher simplement :

```text
NimbrayAI Beta
```

Les numéros de version peuvent rester uniquement dans l'admin ou les diagnostics.
