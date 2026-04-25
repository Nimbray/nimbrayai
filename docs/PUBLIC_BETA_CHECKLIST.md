# Checklist bêta publique NimbrayAI

## Avant de partager le lien

- [ ] L'application démarre localement.
- [ ] `/landing` fonctionne.
- [ ] `/beta` fonctionne.
- [ ] `/privacy` fonctionne.
- [ ] `/terms` fonctionne.
- [ ] Le mode demo répond correctement.
- [ ] Les sources internes ne s'affichent pas par défaut.
- [ ] Le feedback bêta fonctionne en local.
- [ ] Les messages d'erreur sont compréhensibles.

## Pour une bêta gratuite

- [ ] `AI_PROVIDER=demo`
- [ ] `ENABLE_SERVER_STORAGE=false`
- [ ] `ENABLE_AUTH=false`
- [ ] Limiter le nombre de testeurs manuellement.

## Pour une bêta cloud

- [ ] Créer Supabase.
- [ ] Exécuter le SQL.
- [ ] Ajouter les variables Vercel.
- [ ] Tester sauvegarde/restauration.
- [ ] Tester feedback serveur.

## Message à envoyer aux testeurs

```text
Salut, je lance une bêta privée de NimbrayAI.
C'est encore une version test, donc je cherche surtout des retours sur l'interface, la clarté des réponses et les bugs éventuels.
Lien : [URL]
Merci de m'envoyer ton feedback directement depuis l'app.
```
