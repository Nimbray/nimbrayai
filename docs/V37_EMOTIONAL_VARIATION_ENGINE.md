# NimbrayAI V37 — Emotional Variation Engine

V37 renforce le côté humain de NimbrayAI. L'objectif est d'éviter les réponses émotionnelles répétées et de mieux adapter la réponse à la nuance de la phrase utilisateur.

## Principes

- Répondre localement aux émotions simples avant d'appeler Groq.
- Ne pas utiliser la même réponse pour “je suis nul”, “je manque de confiance”, “j'ai honte”, “je suis perdu”, “j'ai peur”, etc.
- Donner des conseils doux et concrets, jamais froids.
- Ajouter une petite action possible quand c'est utile.
- Garder l'humour pour les sujets légers uniquement.
- Garder un ton humain, stable, joyeux et rassurant.

## Nouvelles intentions émotionnelles

- self-worth-low : “je suis nul”, “je sers à rien”
- confidence-low : “je manque de confiance”, “j'ose pas”
- lost-confused : “je suis perdu”, “je ne sais plus quoi faire”
- fear-anxiety : “j'ai peur”, “je panique”, “je suis angoissé”
- loneliness : “je me sens seul”, “personne ne m'aime”
- shame : “j'ai honte”
- tired-discouraged : “j'en ai marre”, “je suis épuisé”
- sadness-general : “ça va pas”, “je suis triste”

## Résultat attendu

NimbrayAI doit donner l'impression d'écouter la personne, pas seulement de répondre à une requête.
