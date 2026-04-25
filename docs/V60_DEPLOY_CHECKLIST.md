# V60 — Deploy Checklist

1. Remplacer le repo par V60.
2. Vérifier `package.json` au premier niveau.
3. Lancer localement :

```bash
npm install
npm run dev
```

4. Tester les phrases critiques.
5. Commit/push :

```bash
git add .
git commit -m "NimbrayAI V60 public beta 2 mega edition"
git push
```

6. Sur Vercel : vérifier les logs.
7. Tester le site public sur mobile.
8. Vérifier que les erreurs techniques ne s’affichent jamais.
9. Vérifier que Groq ne se déclenche pas pour les micro-dialogues.
