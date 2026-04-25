export type LocalBrainHit = {
  content: string;
  intent: string;
  confidence: "high" | "medium";
};

function norm(text: string) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(q: string, words: string[]) {
  return words.some((w) => q.includes(norm(w)));
}

function short(q: string) {
  return q.split(" ").filter(Boolean).length <= 5;
}

function sourceRequested(q: string) {
  return /\b(source|sources|avec source|avec sources|preuve|preuves|reference|references|d ou tu sors|citation|cite)\b/.test(q);
}

function pick(value: string | string[], seed: string) {
  if (typeof value === "string") return value;
  let n = 0;
  for (const ch of seed) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return value[n % value.length];
}

export function localBrainReply(text: string): LocalBrainHit | null {
  const q = norm(text);
  if (!q) return null;

  // 1. Micro-dialogues, réactions courtes, politesse, silence, insultes simples.
  const exact: Record<string, string | string[]> = {
    "ok": ["Parfait. On continue quand tu veux.", "Ok, je te suis.", "Ça marche. On avance tranquille."],
    "okay": ["Parfait. On continue quand tu veux.", "Ok, je te suis."],
    "oui": ["Top. Dis-moi la suite.", "Oui, je te suis.", "Parfait, on continue."],
    "non": ["D’accord. Dis-moi ce que tu veux changer, et je m’adapte.", "Ok, je prends le contre-pied. Tu veux qu’on parte sur quoi ?", "Compris. On ne part pas là-dessus."],
    "merci": ["Avec plaisir 😊", "Toujours là pour aider.", "Avec plaisir, vraiment."],
    "merci beaucoup": ["Avec plaisir 😊", "De rien, content d’aider."],
    "super": ["Excellent, on tient quelque chose !", "Trop bien. On continue dans cette vibe.", "Parfait, ça avance bien."],
    "top": ["Top, on continue dans ce sens.", "Nickel. On garde ce cap."],
    "nickel": ["Nickel 😄 On continue quand tu veux.", "Impeccable. On avance."],
    "parfait": ["Parfait. On avance.", "Parfait, je suis prêt pour la suite."],
    "pas mal": ["Merci ! On peut encore améliorer si tu veux : plus clair, plus naturel ou plus complet.", "Pas mal, c’est déjà une base. On peut le rendre encore plus propre.", "Merci ! On garde ce qui marche et on affine le reste."],
    "bof": ["Je vois. Qu’est-ce qui te semble moyen : le style, l’idée ou la réponse ? Je peux reprendre plus simplement.", "Ok, pas convaincu. Donne-moi le point qui coince et je reprends mieux.", "Je prends. On peut faire plus net, plus utile, ou plus humain."],
    "haha": ["😄 J’aime bien l’énergie. On continue ?", "Haha, parfait. On garde le sourire et on avance ?", "😄 Ça fait plaisir. Tu veux qu’on pousse l’idée ?"],
    "mdr": ["😄 Voilà, on garde un peu de légèreté. Tu veux qu’on continue ?", "Mdr, validé. On continue ?"],
    "lol": ["😄 On garde le sourire. Tu veux la suite ?", "Haha, je prends ça comme un bon signe."],
    "continue": ["Bien sûr, je continue.", "Oui, je continue. On garde le fil.", "Je poursuis."],
    "vas y": ["Vas-y, je te suis.", "Je t’écoute, envoie.", "Go, je suis prêt."],
    "go": ["Go, on y va.", "Allez, on lance ça.", "Feu vert, je suis avec toi."],
    "encore": ["D’accord, je développe un peu plus.", "Oui, je t’en donne davantage."],
    "plus simple": ["Bien sûr. Je vais faire plus simple.", "Ok, je simplifie sans blabla."],
    "plus court": ["Bien sûr. Version plus courte.", "Oui, je resserre."],
    "recommence": ["D’accord, je reprends proprement.", "Ok, on repart sur une meilleure version."],
    "j ai pas compris": ["Pas de souci. Je reprends plus simplement, étape par étape.", "Aucun problème. On va le refaire plus clair."],
    "pas compris": ["Pas de souci. Je reprends plus simplement, étape par étape.", "Je simplifie tout de suite."],
    "je comprends pas": ["Pas de souci. Je reprends plus simplement, étape par étape.", "T’inquiète, on va le rendre limpide."],
    "tu peux faire mieux": ["Oui, tu as raison. Je peux reprendre plus clairement : plus simple, plus précis ou plus humain ?", "Oui. Je vais faire mieux : plus net, plus utile, moins mécanique.", "Tu as raison, je peux monter le niveau. Je reprends."],
    "c est faux": ["Merci de me le dire. Je vais corriger : indique-moi ce qui te semble faux, ou je reformule plus prudemment.", "Bien vu. Je préfère corriger plutôt que forcer. Dis-moi le point exact et je rectifie."],
    "c est pas bon": ["D’accord, je reprends. Dis-moi ce qui ne va pas : le fond, le ton ou la structure ?", "Ok, on ne garde pas ça. Je peux refaire plus propre."],
    "nul": ["Je peux faire mieux. Donne-moi juste ce qui ne te convient pas, et je corrige.", "Je prends le retour. On va améliorer, pas tourner en rond."],
    "ta gueule": ["Je vais te laisser souffler. Si tu veux reprendre, je suis là.", "D’accord, je te laisse respirer. On reprendra quand tu veux.", "Je comprends que tu sois agacé. Je me mets en retrait."],
    "tg": ["D’accord, je te laisse respirer.", "Ok, je me fais discret."],
    "tais toi": ["D’accord.", "Compris, je reste discret."],
    "tais-toi": ["D’accord.", "Compris, je reste discret."],
    "ferme la": ["D’accord, je te laisse respirer.", "Je me mets en retrait."],
    "parle pas": ["D’accord.", "Compris. Je reste silencieux."],
    "parles pas": ["D’accord.", "Compris. Je reste silencieux."],
    "stop": ["D’accord, j’arrête là.", "Ok, pause."],
    "silence": ["D’accord, je reste discret.", "Compris. Silence radio."],
    "laisse tomber": ["D’accord. On peut reprendre plus tard si tu veux.", "Ok, on laisse ça de côté."],
    "je t aime": ["C’est gentil 😊 Moi, je suis là pour t’aider du mieux possible.", "Merci, c’est touchant. Je reste ton assistant, mais je prends l’intention avec douceur."],
    "je t aime bien": ["Moi aussi j’aime bien notre énergie. On construit un truc solide.", "Merci, ça fait plaisir. On continue à faire grandir NimbrayAI." ]
  };
  if (exact[q]) return { content: pick(exact[q], q), intent: "micro-dialogue-local", confidence: "high" };

  if (short(q) && has(q, ["bravo", "bien joue", "genial", "excellent"])) {
    return { content: "Merci ! Ça fait plaisir. On continue à améliorer NimbrayAI pas à pas.", intent: "micro-positive-local", confidence: "high" };
  }

  if (short(q) && has(q, ["tu es nul", "c est nul", "cest nul", "n importe quoi", "tu racontes n importe quoi"])) {
    return { content: "Je comprends, ça n’a pas répondu comme il fallait. Je peux reprendre proprement : dis-moi juste ce qui cloche, ou je reformule en version plus claire.", intent: "micro-critique-local", confidence: "high" };
  }

  // 2. Identité / limites / usage de NimbrayAI.
  if (/\b(qui es tu|tu es qui|presente toi|que peux tu faire|a quoi tu sers|tes limites|que ne sais tu pas faire)\b/.test(q)) {
    if (has(q, ["limites", "que ne sais", "ne sais tu pas"])) {
      return { content: `Je peux aider sur beaucoup de sujets, mais je ne suis pas parfait.

Ce que je ne dois pas faire : remplacer un médecin, un avocat, les urgences ou une source officielle quand la situation est grave ou récente. Je peux expliquer, guider, structurer, résumer, écrire, coder, donner des idées et aider à réfléchir, mais je dois rester prudent sur la santé, le droit, la finance, les dangers et l’actualité.

Le plus utile : pose-moi ta question normalement, et je m’adapte.`, intent: "nimbray-limits-local", confidence: "high" };
    }
    return { content: `Je suis NimbrayAI, un assistant conçu pour t’aider à comprendre, écrire, créer, organiser, coder, apprendre et réfléchir.

Je suis pensé pour être simple, humain, joyeux quand le contexte s’y prête, et sérieux quand le sujet l’exige. Tu peux me parler naturellement : je m’adapte à ta demande.`, intent: "nimbray-identity-local", confidence: "high" };
  }

  // 3. Sciences stables et explications simples.
  if (has(q, ["pourquoi le ciel est bleu", "ciel bleu"])) {
    const base = `Le ciel est bleu à cause de la diffusion de Rayleigh.

La lumière du Soleil paraît blanche, mais elle contient plusieurs couleurs. Quand elle traverse l’atmosphère, les petites molécules d’air diffusent davantage les courtes longueurs d’onde, comme le bleu, que les couleurs comme le rouge. Cette lumière bleue est dispersée dans toutes les directions : c’est pour ça que le ciel nous paraît bleu en journée.

Au coucher du soleil, la lumière traverse plus d’atmosphère. Le bleu est davantage dispersé avant d’arriver à nos yeux, et il reste plus de rouge, d’orange et de rose.`;
    return { content: sourceRequested(q) ? `${base}

Sources à vérifier si tu veux approfondir : explications classiques de physique optique sur la diffusion de Rayleigh, manuels de physique et ressources éducatives scientifiques.` : base, intent: "science-local", confidence: "high" };
  }
  if (has(q, ["pourquoi la mer est salee", "mer salee", "ocean sale"])) {
    return { content: `La mer est salée parce que l’eau des rivières dissout peu à peu des minéraux dans les roches, puis les transporte jusqu’aux océans. Avec le temps, certains sels, surtout le chlorure de sodium, s’accumulent.

L’eau s’évapore sous l’effet du soleil, mais le sel reste dans l’océan. C’est cette accumulation sur de très longues périodes qui rend l’eau de mer salée.`, intent: "science-local", confidence: "high" };
  }
  if (has(q, ["comment fonctionne l electricite", "electricite simplement", "c est quoi l electricite"])) {
    return { content: `L’électricité, c’est le déplacement de petites charges, surtout des électrons, dans un matériau conducteur comme un fil métallique.

Imagine un tuyau : l’eau qui circule représente le courant électrique. La tension, c’est un peu la pression qui pousse l’eau. Et la résistance, c’est ce qui freine le passage.

Dans une lampe, par exemple, le courant passe dans le circuit et permet de produire de la lumière.`, intent: "science-local", confidence: "high" };
  }
  if (has(q, ["qu est ce qu un atome", "c est quoi un atome", "atome simplement"])) {
    return { content: `Un atome est une minuscule brique de matière. Tout ce qui nous entoure — l’air, l’eau, les objets, notre corps — est composé d’atomes.

Un atome contient un noyau, avec des protons et des neutrons, et autour de lui des électrons. Selon le nombre de protons, on obtient différents éléments : hydrogène, carbone, oxygène, fer, etc.`, intent: "science-local", confidence: "high" };
  }
  if (has(q, ["pourquoi il pleut", "comment se forme la pluie", "formation de la pluie"])) {
    return { content: `La pluie se forme quand l’eau s’évapore depuis les mers, les rivières et les sols, puis monte dans l’air sous forme de vapeur. En altitude, l’air est plus froid : la vapeur se condense en petites gouttelettes qui forment les nuages.

Quand ces gouttes deviennent trop lourdes, elles tombent : c’est la pluie.`, intent: "science-local", confidence: "high" };
  }

  // 4. Cuisine simple.
  if (has(q, ["recette"]) && has(q, ["jambon"])) {
    return { content: `Bien sûr ! Voici une recette simple et efficace :

**Quiche jambon-fromage**

**Ingrédients**
- 1 pâte brisée
- 200 g de jambon en dés
- 150 g de fromage râpé
- 3 œufs
- 20 cl de crème ou de lait
- Sel, poivre

**Préparation**
1. Préchauffe le four à 180 °C.
2. Mets la pâte dans un moule.
3. Mélange les œufs, la crème, le jambon et le fromage.
4. Sale légèrement, poivre, puis verse sur la pâte.
5. Fais cuire 30 à 40 minutes, jusqu’à ce que ce soit bien doré.

Avec une salade verte, ça fait un repas simple, bon, et sans prise de tête.`, intent: "cuisine-local", confidence: "high" };
  }
  if (has(q, ["recette"]) && has(q, ["pates", "pate"])) {
    return { content: `Idée simple : **pâtes crème-fromage**.

Fais cuire les pâtes, garde un peu d’eau de cuisson, puis mélange avec crème, fromage râpé, poivre et une petite noix de beurre. Ajoute jambon, champignons ou légumes si tu veux. Simple, rapide, efficace.`, intent: "cuisine-local", confidence: "medium" };
  }

  // 5. Administration / justice / droit général stable.
  if (has(q, ["enterrer", "enterrement", "inhumation", "obseques", "deces", "grand mere", "grand pere", "funerailles"])) {
    return { content: `Je suis désolé pour ta grand-mère. Oui, tu peux participer à l’organisation de son enterrement, mais il faut passer par des démarches officielles.

En France, en général :
1. le décès doit être constaté par un médecin ;
2. le décès est déclaré à la mairie du lieu du décès ;
3. la famille choisit l’inhumation ou la crémation ;
4. une entreprise de pompes funèbres aide pour les autorisations, le cercueil, le transport, la cérémonie et le lien avec la mairie ou le cimetière.

Le plus simple maintenant : contacte une entreprise de pompes funèbres et la mairie concernée. Elles te diront exactement quels documents fournir et quels délais respecter.

Si tu n’es pas en France, les règles peuvent changer. Donne-moi le pays ou la commune, et je te fais une checklist plus adaptée.`, intent: "admin-deuil-local", confidence: "high" };
  }
  if (has(q, ["declarer un deces", "declaration de deces", "comment declarer un deces"])) {
    return { content: `En France, un décès doit être constaté par un médecin, puis déclaré à la mairie du lieu du décès. La mairie établit ensuite l’acte de décès.

Souvent, les pompes funèbres peuvent aider ou prendre en charge une partie des démarches. Prépare généralement : certificat de décès, pièce d’identité du défunt si disponible, livret de famille ou informations d’état civil.

Si tu veux, je peux te faire une checklist très simple des démarches à faire dans l’ordre.`, intent: "admin-deuil-local", confidence: "high" };
  }
  if (has(q, ["heritage", "succession", "heriter", "notaire"])) {
    return { content: `Un héritage se règle généralement en plusieurs étapes. En France, on identifie les héritiers, on vérifie s’il existe un testament, puis on contacte un notaire si la succession contient un bien immobilier, un testament, une donation entre époux ou une situation familiale complexe.

En pratique :
1. récupère l’acte de décès ;
2. rassemble livret de famille, pièces d’identité, documents bancaires et informations sur les biens ;
3. contacte un notaire si nécessaire ;
4. le notaire peut établir l’acte de notoriété ;
5. les héritiers décident ensuite d’accepter ou non la succession.

Je peux t’aider à faire une checklist selon ta situation, mais pour une décision juridique importante, un notaire reste la meilleure référence.`, intent: "legal-admin-local", confidence: "high" };
  }
  if (has(q, ["porter plainte", "plainte", "main courante", "menace", "menaces", "police", "gendarmerie"])) {
    return { content: `Si tu es menacé ou victime d’une infraction, tu peux contacter la police ou la gendarmerie. Si le danger est immédiat, appelle le **17** ou le **112**.

Pour préparer une plainte, garde les preuves : messages, captures d’écran, dates, témoins, photos, certificats médicaux si besoin. Explique les faits simplement, dans l’ordre chronologique.

Si tu veux, raconte-moi brièvement ce qui s’est passé, et je t’aide à rédiger un résumé clair à donner aux autorités.`, intent: "legal-admin-local", confidence: "high" };
  }
  if (has(q, ["filmer quelqu un", "filmer dans la rue", "droit a l image"])) {
    return { content: `En général, filmer dans un lieu public peut être autorisé, mais diffuser l’image d’une personne identifiable peut poser problème selon le contexte, surtout si cela porte atteinte à sa vie privée ou à sa dignité.

Règle simple : filmer n’est pas toujours pareil que publier. Pour une diffusion en ligne, mieux vaut être prudent, flouter les personnes identifiables ou obtenir leur accord. Pour un cas précis, vérifie les règles officielles ou demande conseil à un professionnel.`, intent: "legal-admin-local", confidence: "medium" };
  }

  // 6. Sport / langues / culture stable.
  if (has(q, ["hors jeu", "hors-jeu", "football"]) && has(q, ["regle", "explique", "c est quoi", "qu est ce"])) {
    return { content: `Au football, un joueur est en position de hors-jeu s’il est plus près du but adverse que le ballon et l’avant-dernier défenseur au moment où un coéquipier lui passe le ballon.

Mais il n’est sanctionné que s’il participe à l’action : s’il joue le ballon, gêne un adversaire ou tire avantage de sa position.

Image simple : tu ne peux pas rester “campé” derrière la défense en attendant une passe facile.`, intent: "sport-local", confidence: "high" };
  }
  if (has(q, ["familles de langues", "langues latines", "langues germaniques", "langues slaves"])) {
    return { content: `Les langues sont souvent regroupées en familles, parce qu’elles descendent d’anciennes langues communes.

Exemples :
- langues latines : français, espagnol, italien, portugais, roumain ;
- langues germaniques : anglais, allemand, néerlandais, suédois ;
- langues slaves : russe, polonais, ukrainien, tchèque ;
- langues sémitiques : arabe, hébreu, amharique.

Ces familles aident à comprendre pourquoi certaines langues ont des mots, sons ou structures proches.`, intent: "languages-local", confidence: "high" };
  }
  if (has(q, ["revolution francaise", "revolution française"])) {
    return { content: `La Révolution française commence en 1789. Elle marque la fin de l’Ancien Régime et transforme profondément la France : fin des privilèges, affirmation de la souveraineté du peuple, Déclaration des droits de l’homme et du citoyen, puis périodes de fortes tensions politiques.

Pour la comprendre simplement :
- crise financière ;
- inégalités entre ordres ;
- montée des idées des Lumières ;
- colère populaire ;
- affaiblissement du pouvoir royal.

Elle ouvre une nouvelle époque politique, mais aussi une période violente et instable.`, intent: "history-local", confidence: "high" };
  }

  // 7. Santé générale / urgence médicale prudente.
  if (has(q, ["mal a la poitrine", "douleur poitrine", "mal au coeur", "pris trop de medicaments", "overdose"])) {
    return { content: `Je ne peux pas diagnostiquer, mais ce que tu décris peut être sérieux.

Si tu as une douleur à la poitrine, un malaise, une difficulté à respirer, ou si tu as pris trop de médicaments, appelle rapidement les urgences : **15** ou **112** en France. Si tu es avec quelqu’un, demande-lui de rester près de toi.

Ne conduis pas toi-même si tu te sens mal.`, intent: "health-urgent-local", confidence: "high" };
  }
  if (has(q, ["crise d angoisse", "angoisse", "stress", "panique"])) {
    return { content: `Ça peut être très impressionnant, mais on peut commencer doucement.

Essaie ça pendant une minute : inspire 4 secondes, expire 6 secondes, plusieurs fois. Pose tes pieds au sol, regarde autour de toi et nomme 5 choses que tu vois. Ton corps est en alerte, mais tu n’es pas obligé de tout gérer d’un coup.

Si les symptômes sont forts, inhabituels ou physiques, contacte un professionnel de santé ou les urgences.`, intent: "wellbeing-local", confidence: "medium" };
  }

  // 8. Humour sûr.
  if (has(q, ["blague", "fais moi rire", "raconte une blague"])) {
    const jokes = [
`Pourquoi les plongeurs plongent-ils toujours en arrière ?

Parce que sinon, ils tombent dans le bateau. 😄`,
`Pourquoi les livres ont-ils toujours chaud ?

Parce qu’ils ont une couverture.`,
`Pourquoi le café va toujours au commissariat ?

Parce qu’il s’est fait serrer.`,
`Pourquoi les développeurs aiment le noir ?

Parce que la lumière attire les bugs. 😄`
    ];
    return { content: pick(jokes, q), intent: "humour-local", confidence: "high" };
  }

  // 9. Connaissances stables supplémentaires V32.
  if (has(q, ["regles du basket", "basketball", "basket"])) {
    return { content: `Au basket, deux équipes essaient de marquer en envoyant le ballon dans le panier adverse. Un panier vaut généralement 2 points, 3 points s’il est tiré derrière la ligne à trois points, et 1 point pour un lancer franc.

Les règles de base : on dribble pour se déplacer, on ne marche pas avec le ballon sans dribbler, et on défend sans contact excessif. Simple à comprendre, mais très riche tactiquement.`, intent: "sport-local", confidence: "high" };
  }
  if (has(q, ["regles du tennis", "tennis simplement", "comment fonctionne le tennis"])) {
    return { content: `Au tennis, le but est d’envoyer la balle dans le terrain adverse sans que l’autre joueur puisse la renvoyer correctement.

Le score est particulier : 15, 30, 40, puis jeu. Il faut gagner des jeux pour gagner un set, et plusieurs sets pour gagner le match. Ce qui rend le tennis intéressant, c’est le mélange entre technique, endurance et mental.`, intent: "sport-local", confidence: "high" };
  }
  if (has(q, ["langues les plus parlees", "langues du monde", "langue la plus parlee"])) {
    return { content: `Les langues les plus parlées au monde varient selon qu’on compte les locuteurs natifs ou tous les locuteurs.

En locuteurs natifs, le chinois mandarin, l’espagnol, l’anglais, l’hindi et l’arabe figurent parmi les plus importants. En nombre total de locuteurs, l’anglais est souvent très haut grâce à son usage international.

Le plus intéressant : une langue n’est pas seulement un outil, c’est aussi une culture, une façon de penser et une mémoire collective.`, intent: "languages-local", confidence: "high" };
  }
  if (has(q, ["culture japonaise", "japon culture", "traditions japonaises"])) {
    return { content: `La culture japonaise mélange traditions anciennes et modernité. On y retrouve l’importance du respect, de la politesse, de l’harmonie sociale, mais aussi une grande créativité dans la technologie, le design, les mangas, les jeux vidéo et la cuisine.

Quelques repères : cérémonie du thé, temples, calligraphie, arts martiaux, respect des saisons, sakura, mais aussi culture pop très influente.`, intent: "culture-local", confidence: "high" };
  }
  if (has(q, ["difference droit civil droit penal", "droit civil et droit penal", "civil penal"])) {
    return { content: `Le droit civil règle surtout les relations entre personnes : famille, contrats, logement, responsabilité, héritage.

Le droit pénal concerne les infractions : vols, violences, menaces, escroqueries, etc. Il sert à déterminer si une personne a commis une infraction et quelle sanction peut être appliquée.

Version simple : le civil règle un conflit ou un dommage entre personnes ; le pénal traite ce que la société considère comme une infraction.`, intent: "legal-admin-local", confidence: "high" };
  }
  if (has(q, ["budget", "gerer mon argent", "finance personnelle", "economiser argent"])) {
    return { content: `Pour gérer ton budget simplement, commence par trois blocs :

1. ce qui rentre : salaire, aides, revenus ;
2. ce qui sort obligatoirement : loyer, factures, transport, assurances ;
3. ce qui reste : courses, loisirs, épargne.

Une méthode simple : mets d’abord de côté une petite somme fixe, même modeste, puis organise le reste. L’objectif n’est pas d’être parfait, c’est d’avoir une vision claire.`, intent: "finance-local", confidence: "medium" };
  }
  if (has(q, ["cv", "lettre de motivation", "entretien d embauche", "trouver un travail"])) {
    return { content: `Pour une candidature solide, il faut être clair et concret.

CV : mets en avant ce que tu sais faire, tes expériences, tes résultats et tes compétences utiles pour le poste.

Lettre : explique pourquoi ce poste t’intéresse, ce que tu peux apporter, et donne un exemple précis.

Entretien : prépare trois choses : ton parcours en 1 minute, tes forces, et une situation où tu as résolu un problème.`, intent: "career-local", confidence: "medium" };
  }
  if (has(q, ["motivation", "je suis demotive", "j ai plus de motivation", "me remotiver"])) {
    return { content: `On va faire simple : la motivation revient souvent après une petite action, pas avant.

Choisis une tâche minuscule, presque trop facile : ouvrir le document, ranger 5 minutes, écrire 3 lignes, envoyer un message. L’objectif, c’est de relancer le mouvement.

Pas besoin d’être une machine. Juste un petit pas propre maintenant, et on reconstruit derrière.`, intent: "motivation-local", confidence: "high" };
  }
  if (has(q, ["confiance en moi", "je manque de confiance", "je suis nul", "je me sens nul"])) {
    return { content: `Je suis désolé que tu ressentes ça. Mais une chose importante : te sentir nul ne veut pas dire que tu l’es. Ça veut souvent dire que tu es fatigué, sous pression, ou que tu te compares trop durement.

On peut repartir petit : choisis une chose que tu peux faire dans les 10 prochaines minutes. Une seule. La confiance revient quand tu recommences à te prouver que tu peux agir, même doucement.`, intent: "confidence-local", confidence: "high" };
  }
  if (has(q, ["phishing", "hameconnage", "arnaque mail", "mail suspect", "cybersecurite"])) {
    return { content: `Pour repérer un mail suspect, regarde :

- l’adresse exacte de l’expéditeur ;
- les fautes ou formulations étranges ;
- l’urgence exagérée ;
- les liens raccourcis ou bizarres ;
- les demandes de mot de passe, carte bancaire ou code.

Règle d’or : ne clique pas dans le doute. Va directement sur le site officiel depuis ton navigateur.`, intent: "cybersecurity-local", confidence: "high" };
  }


  // 10. V38 — Action & Coaching Engine : transformer une demande en prochaine action.
  if (has(q, ["je ne sais pas quoi faire", "je sais pas quoi faire", "je suis bloque", "je suis bloquee", "je suis coince", "je suis coincee"])) {
    return { content: `On va éviter de tout porter d’un coup.

Faisons simple :
1. écris le problème en une phrase ;
2. dis ce que tu veux éviter ;
3. choisis une toute petite action possible maintenant.

Si tu veux, réponds juste avec : « mon problème, c’est… » et je t’aide à remettre de l’ordre.`, intent: "action-coach-local", confidence: "high" };
  }

  if (has(q, ["je procrastine", "je remets tout au lendemain", "j arrive pas a commencer", "j'arrive pas a commencer", "je n arrive pas a commencer", "pas motive pour travailler"])) {
    return { content: `Ok, on ne va pas chercher la motivation parfaite. Elle arrive souvent après le démarrage.

Méthode douce : lance un minuteur de 5 minutes et fais seulement le début. Pas toute la tâche. Juste ouvrir le fichier, écrire le titre, ranger une chose, envoyer le premier message.

La mission n’est pas de finir. C’est de remettre le moteur en route.`, intent: "productivity-coach-local", confidence: "high" };
  }

  if (has(q, ["aide moi a m organiser", "m organiser", "organiser ma journee", "organiser ma semaine", "planning", "to do list", "todo list"])) {
    return { content: `Oui. On va faire un plan simple, pas une usine à gaz.

**1 priorité** : la chose la plus importante.
**3 tâches maximum** : pas plus, sinon ça devient flou.
**1 petite action maintenant** : celle qui lance le mouvement.

Écris-moi ce que tu dois faire aujourd’hui, même en vrac, et je te le transforme en plan clair.`, intent: "organization-coach-local", confidence: "high" };
  }

  if (has(q, ["je veux lancer un projet", "lancer mon projet", "creer un projet", "mon projet", "j ai un projet"])) {
    return { content: `Très bien. Pour lancer un projet, on commence petit et concret.

Réponds à ces 4 questions :
1. C’est quoi l’idée en une phrase ?
2. Pour qui c’est utile ?
3. Quel problème ça résout ?
4. Quelle première version peut exister en 7 jours ?

La bonne première étape, ce n’est pas de tout construire. C’est de rendre l’idée testable.`, intent: "project-builder-local", confidence: "high" };
  }

  if (has(q, ["lancer un business", "idee de business", "business rentable", "creer une entreprise", "mon entreprise", "trouver des clients"])) {
    return { content: `On peut avancer proprement. Un business, au départ, ce n’est pas un logo : c’est une promesse utile pour une personne précise.

Structure simple :
- **Client** : qui veux-tu aider ?
- **Problème** : qu’est-ce qui lui fait perdre du temps, de l’argent ou de l’énergie ?
- **Solution** : qu’est-ce que tu proposes ?
- **Preuve** : comment tester ça vite ?

Donne-moi ton idée en une phrase, et je te fais une première stratégie simple.`, intent: "business-coach-local", confidence: "high" };
  }

  if (has(q, ["je veux apprendre", "apprendre l anglais", "apprendre une langue", "apprendre a coder", "reviser", "plan de revision", "etudier", "methode pour apprendre"])) {
    return { content: `Top. On va viser régulier plutôt que parfait.

Pour apprendre efficacement :
1. une notion courte ;
2. un exemple ;
3. un exercice ;
4. une répétition demain.

Dis-moi ce que tu veux apprendre et ton niveau actuel. Je te prépare un mini-plan simple pour commencer aujourd’hui.`, intent: "learning-coach-local", confidence: "high" };
  }

  if (has(q, ["je dois choisir", "je sais pas quoi choisir", "aide moi a choisir", "prendre une decision", "je suis indecis", "j hesite", "j'hésite"])) {
    return { content: `On va clarifier sans décider à ta place.

Écris les options, puis on regarde :
- ce que tu gagnes ;
- ce que tu risques ;
- ce que ça coûte en temps, argent ou énergie ;
- ce que tu regretterais le plus dans 6 mois.

La bonne décision n’est pas toujours parfaite. C’est souvent celle qui est la plus cohérente avec tes priorités.`, intent: "decision-coach-local", confidence: "high" };
  }

  if (has(q, ["je veux changer de vie", "changer ma vie", "repartir de zero", "nouveau depart", "je veux evoluer", "devenir meilleur"])) {
    return { content: `J’aime l’élan. Mais on va le rendre réaliste, sinon ça devient écrasant.

On ne change pas toute une vie en une soirée. On change une trajectoire avec une première décision répétée.

Commence par choisir un axe : santé, travail, argent, relations, confiance, apprentissage ou projet. Ensuite, on définit une action de 10 minutes pour aujourd’hui.`, intent: "life-reset-coach-local", confidence: "high" };
  }

  if (has(q, ["je suis deborde", "je suis debordee", "trop de choses a faire", "je suis submerge", "je suis submergee", "je ne sais plus par ou commencer"])) {
    return { content: `Ok, on baisse la pression. Quand tout semble urgent, le cerveau sature.

Faisons un tri rapide :
1. ce qui est vraiment urgent aujourd’hui ;
2. ce qui peut attendre ;
3. ce qui peut être simplifié ou supprimé.

Envoie-moi ta liste en vrac. Je la range pour toi.`, intent: "overwhelm-coach-local", confidence: "high" };
  }

  if (has(q, ["sport", "entrainement", "reprendre le sport", "me remettre au sport", "programme sportif", "courir", "musculation debutant"]) && has(q, ["commencer", "programme", "aide", "reprendre", "debutant", "motivation"])) {
    return { content: `Bonne idée. On vise durable, pas héroïque.

Pour reprendre :
- 5 à 10 minutes d’échauffement ;
- 20 minutes d’effort accessible ;
- 5 minutes de retour au calme ;
- 2 ou 3 séances par semaine au début.

Le meilleur programme, c’est celui que tu peux tenir. Dis-moi ton niveau et ton objectif, je te fais une version simple.`, intent: "sport-coach-local", confidence: "medium" };
  }

  if (has(q, ["je veux ecrire", "rediger", "ecrire un mail", "faire un message", "ecrire un texte"])) {
    return { content: `Oui. Donne-moi juste trois choses :

1. à qui tu t’adresses ;
2. le but du message ;
3. le ton souhaité : simple, pro, chaleureux ou ferme.

Ensuite je te rédige une version prête à envoyer.`, intent: "writing-coach-local", confidence: "medium" };
  }

  return null;
}
