# Packs de connaissances V29.1

Les packs sont stockés dans le dossier `knowledge/`.

## Ajouter un nouveau pack

Crée un fichier Markdown dans un dossier thématique :

```text
knowledge/mon_theme/ma_fiche.md
```

Structure conseillée :

```markdown
# Titre de la fiche

Résumé : ...

Contenu : ...

Mots-clés : ...

Limites : ...
```

## Déployer après ajout

```powershell
git add .
git commit -m "Add knowledge pack"
git push
```

Vercel redéploiera automatiquement.
