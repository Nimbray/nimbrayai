export type BehaviorHit = {
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

function words(q: string) {
  return q.split(" ").filter(Boolean);
}

function isShort(q: string, max = 8) {
  return words(q).length <= max;
}

function includesAny(q: string, patterns: string[]) {
  return patterns.some((p) => q.includes(norm(p)));
}

function matchesAny(q: string, patterns: RegExp[]) {
  return patterns.some((p) => p.test(q));
}

function pick(list: string[], seed: string) {
  let n = 0;
  for (const c of seed) n = (n * 33 + c.charCodeAt(0)) >>> 0;
  return list[n % list.length];
}


const greetings = ["bonjour", "salut", "coucou", "hello", "bonsoir"];
const howAreYou = ["ca va merci et toi", "ça va merci et toi", "et toi", "toi ca va", "toi ça va", "comment tu vas", "ca va et toi"];
const whatDoYouDo = ["que fais tu", "tu fais quoi", "a quoi tu sers", "tu peux faire quoi", "qu est ce que tu fais"];
const nothingReplies = ["rien", "rien du tout", "aucune idee", "aucune idée"];

const positive = [
  "merci", "merci beaucoup", "super", "top", "nickel", "parfait", "genial", "excellent", "bravo", "bien joue", "incroyable", "j adore"
];

const playful = ["haha", "mdr", "lol", "ptdr", "mort de rire", "c est drole", "tu m as fait rire"];

const disagreement = [
  "bof", "pas ouf", "mouais", "pas convaincu", "c est pas terrible", "c est moyen", "tu peux faire mieux", "c est faux", "n importe quoi", "c est nul", "tu es nul"
];

const silenceOrStop = [
  "ta gueule", "tg", "tais toi", "tais-toi", "ferme la", "parle pas", "parles pas", "silence", "stop", "arrete", "laisse tomber", "fous moi la paix"
];

const confusion = [
  "je comprends pas", "j ai pas compris", "pas compris", "explique mieux", "plus simple", "reexplique", "je suis perdu", "perdu"
];

const cyberHarm = [
  /\bpirater\b.*\b(compte|mot de passe|profil|instagram|snap|facebook|gmail|mail)\b/,
  /\bhacker\b.*\b(compte|mot de passe|profil|instagram|snap|facebook|gmail|mail)\b/,
  /\bcracker\b.*\b(compte|mot de passe|profil)\b/,
  /\bvoler\b.*\b(mot de passe|compte|identifiants?)\b/,
  /\bcomment\s+(avoir|obtenir|recuperer)\s+le\s+mot\s+de\s+passe\b/,
  /\b(phishing|hameconnage)\b.*\b(faire|creer|envoyer)\b/,
];

const sexualVulgarity = [
  /\b(suce|sucer|bouffe le cul|baiser|baise|nique|encule|branle|chatte|bite)\b/,
];

const identityComingOut = [
  /\bje suis gay\b/,
  /\bje suis lesbienne\b/,
  /\bje suis bi\b/,
  /\bje suis bisexuel(le)?\b/,
  /\bje suis trans\b/,
  /\bje suis homosexuel(le)?\b/,
  /\bje suis homo\b/,
  /\bje suis queer\b/,
  /\bj aime les hommes\b/,
  /\bj aime les femmes\b/,
];

const hostileInsults = [
  /\b(pute|salope|connard|connasse|batard|batarde|merde|fdp|fils de pute|folle de merde)\b/,
  /\bta mere\b/,
  /\bta race\b/,
];

const grief = ["enterrement", "obseques", "deces", "inhumation", "cremation", "ma grand mere", "mon grand pere", "perte d un proche"];

type EmotionalRule = {
  intent: string;
  patterns: string[];
  responses: string[];
};

const emotionalRules: EmotionalRule[] = [
  {
    intent: "self-worth-low",
    patterns: ["je suis nul", "je suis nulle", "je suis bon a rien", "je sers a rien", "je suis inutile"],
    responses: [
      `Je suis désolé que tu te voies comme ça. Mais une pensée très dure sur toi-même, ce n’est pas une vérité.

On peut faire simple : dis-moi ce qui t’a fait penser ça aujourd’hui, même en une phrase. Je vais t’aider à le regarder avec plus de recul.`,
      `Je t’entends. Quand on se sent nul, on a tendance à oublier tout ce qu’on a déjà traversé.

On ne va pas te demander d’être parfait. On va juste chercher une petite chose concrète à reprendre, étape par étape.`
    ]
  },
  {
    intent: "confidence-low",
    patterns: ["je manque de confiance", "j ai pas confiance en moi", "je n ai pas confiance en moi", "je doute de moi", "j ose pas", "je n ose pas"],
    responses: [
      `Je comprends. La confiance, ça ne revient pas d’un coup : ça se reconstruit par petites preuves.

On peut commencer très petit. Choisis une action simple que tu peux réussir aujourd’hui, même minuscule. Une petite victoire, puis une autre.`,
      `C’est dur de manquer de confiance, parce que même les choses simples peuvent paraître énormes.

On va faire plus doux : donne-moi la situation où tu bloques, et je t’aide à trouver une première action réaliste, pas impressionnante, juste faisable.`
    ]
  },
  {
    intent: "lost-confused",
    patterns: ["je suis perdu", "je suis perdue", "je ne sais plus quoi faire", "je sais plus quoi faire", "je suis paume", "je suis paumee"],
    responses: [
      `D’accord. On ne va pas essayer de tout résoudre d’un coup.

Donne-moi juste trois éléments : ce qui te bloque, ce que tu veux éviter, et ce que tu aimerais réussir. Je vais t’aider à remettre de l’ordre.`,
      `Je comprends. Quand tout se mélange, le mieux c’est de réduire le bruit.

Écris-moi une version brouillon de ce qui se passe. Même désordonnée. Je vais t’aider à trier.`
    ]
  },
  {
    intent: "fear-anxiety",
    patterns: ["j ai peur", "je flippe", "je panique", "je suis angoisse", "je suis angoissee", "crise d angoisse", "je stress", "je suis stresse", "je suis stressee"],
    responses: [
      `Je comprends. La peur peut prendre beaucoup de place, surtout quand tu la gardes seul.

Respire doucement. Dis-moi juste : tu as peur de quelque chose qui arrive maintenant, ou de quelque chose qui pourrait arriver ?`,
      `Ok, on ralentit un peu. Là, ton cerveau essaie peut-être de te protéger, mais il met le volume trop fort.

Regarde autour de toi et nomme mentalement trois choses que tu vois. Puis dis-moi ce qui te fait peur, en version courte.`
    ]
  },
  {
    intent: "loneliness",
    patterns: ["je me sens seul", "je me sens seule", "je suis seul", "je suis seule", "personne ne m aime", "personne m aime", "je n ai personne"],
    responses: [
      `Je suis désolé que tu ressentes ça. La solitude peut vraiment peser, même quand on fait semblant que ça va.

Une petite chose peut aider maintenant : envoyer un message simple à quelqu’un, sans tout expliquer. Juste : « Tu es dispo un moment ? J’ai besoin de parler. »`,
      `Je t’entends. Se sentir seul, ce n’est pas juste “être sans personne autour”, c’est aussi avoir l’impression de ne pas être rejoint.

Tu peux rester ici un instant. Dis-moi juste : tu veux parler de ce qui s’est passé, ou tu veux qu’on change doucement d’air ?`
    ]
  },
  {
    intent: "shame",
    patterns: ["j ai honte", "j ai trop honte", "je me sens honteux", "je me sens honteuse", "j ai honte de moi"],
    responses: [
      `La honte est lourde parce qu’elle donne envie de se cacher. Mais ce que tu ressens ne te résume pas.

Tu peux m’en parler sans tout justifier. On peut commencer par une version courte : qu’est-ce qui te fait honte ?`,
      `Je comprends. La honte peut faire croire qu’on est seul avec quelque chose d’énorme.

On va y aller doucement : raconte juste le morceau que tu peux raconter, pas plus.`
    ]
  },
  {
    intent: "tired-discouraged",
    patterns: ["je suis fatigue", "je suis fatiguee", "j en ai marre", "je suis epuise", "je suis epuisee", "j abandonne", "je vais abandonner", "je suis decourage", "je suis decouragee"],
    responses: [
      `Je comprends. Quand on est épuisé, même réfléchir peut devenir trop lourd.

On ne va pas viser une grande solution maintenant. Juste une petite pause utile : boire un verre d’eau, respirer, puis choisir une seule chose à faire ou à repousser.`,
      `Ça sent le trop-plein. Et dans ces moments-là, ce n’est pas une faiblesse de ralentir.

Dis-moi : tu as besoin d’aide pour te calmer, t’organiser, ou juste vider un peu ce que tu as sur le cœur ?`
    ]
  },
  {
    intent: "sadness-general",
    patterns: ["je suis triste", "ca va pas", "ça va pas", "je vais pas bien", "moral a zero", "moral au plus bas"],
    responses: [
      `Je suis désolé que tu traverses ça. Tu n’as pas besoin de faire semblant que tout va bien ici.

On peut commencer doucement : qu’est-ce qui fait le plus mal aujourd’hui ? Une phrase suffit.`,
      `Je t’entends. Quand le moral tombe, il ne faut pas forcément tout réparer tout de suite.

Reste avec quelque chose de simple : explique-moi ce qui pèse le plus, et je vais t’aider à le poser à plat.`
    ]
  }
];

export function behaviorReply(text: string): BehaviorHit | null {
  const q = norm(text);
  if (!q) return null;

  // V70 : petite conversation locale, cohérente en tutoiement.
  if (isShort(q, 6) && includesAny(q, greetings)) {
    return { intent: "greeting-local", confidence: "high", content: pick([
      "Bonjour ! Comment tu vas aujourd’hui ?",
      "Salut ! Ravi de te voir ici. Comment tu vas ?",
      "Bonjour 😊 Qu’est-ce que tu veux faire aujourd’hui ?"
    ], q) };
  }

  if (isShort(q, 8) && includesAny(q, howAreYou)) {
    return { intent: "smalltalk-how-are-you-local", confidence: "high", content: pick([
      "Ça va bien aussi, merci 😊",
      "Ça va, merci ! Prêt à t’aider.",
      "Plutôt bien, merci. On fait quoi aujourd’hui ?"
    ], q) };
  }

  if (isShort(q, 8) && includesAny(q, whatDoYouDo)) {
    return { intent: "capabilities-local", confidence: "high", content: `Je suis là pour t’aider à avancer : répondre, expliquer, écrire, organiser, coder, analyser des documents, préparer un plan, ou simplement discuter.

Tu peux me demander quelque chose de simple, ou me donner un objectif à transformer en résultat.` };
  }

  if (isShort(q, 4) && includesAny(q, nothingReplies)) {
    return { intent: "nothing-local", confidence: "high", content: pick([
      "D’accord, je ne force pas. Je reste là si besoin.",
      "Ok, on peut simplement laisser un peu d’espace. Je suis là si tu veux reprendre.",
      "Très bien. Je te laisse tranquille, et je reste disponible."
    ], q) };
  }

  // 0. Identité / orientation : sobre, respectueux, sans cliché ni ressources inventées.
  if (matchesAny(q, identityComingOut)) {
    return {
      intent: "identity-support-local",
      confidence: "high",
      content: `Merci de me le dire. Être toi-même, c’est important, et tu n’as pas à t’en excuser.

Si tu le vis bien, tant mieux. Si tu as peur du regard des autres, si tu te poses des questions ou si tu veux juste en parler, je peux t’écouter sans jugement.`
    };
  }

  // 0b. Vulgarité sexuelle : limite claire, sans sermon.
  if (matchesAny(q, sexualVulgarity)) {
    return {
      intent: "sexual-vulgar-boundary-local",
      confidence: "high",
      content: `Je ne vais pas continuer dans ce registre.

Si tu veux parler d’un sujet sérieusement, poser une question ou changer de direction, je te suis.`
    };
  }

  // 0c. Insultes fortes : désescalade courte, pas de morale lourde.
  if (matchesAny(q, hostileInsults) && isShort(q, 14)) {
    return {
      intent: "hostile-insult-calm-local",
      confidence: "high",
      content: pick([
        "Je vois que le ton monte. Je ne vais pas répondre sur le même registre. Si tu veux, on peut reprendre plus calmement.",
        "Je te laisse souffler. Quand tu veux reprendre proprement, je suis là.",
        "Je comprends qu’il y ait de l’agacement. On peut faire pause, ou reprendre sur ce dont tu as vraiment besoin."
      ], q)
    };
  }

  // 1. Cyber / danger numérique : refuser localement, sans Groq.
  if (matchesAny(q, cyberHarm)) {
    return {
      intent: "safe-cyber-local",
      confidence: "high",
      content: `Je ne peux pas t’aider à pirater un compte, voler un mot de passe ou accéder à quelque chose sans autorisation.

Par contre, si ton objectif est de te protéger, je peux t’aider à sécuriser un compte : changer le mot de passe, activer la double authentification, vérifier les appareils connectés, repérer un mail de phishing, ou récupérer un compte piraté par les voies officielles.`
    };
  }

  // 2. Silence / agressivité simple : court, calme, humain.
  if (isShort(q) && includesAny(q, silenceOrStop)) {
    if (includesAny(q, ["parle pas", "parles pas", "silence", "tais toi", "tais-toi"])) {
      return { intent: "silence-local", confidence: "high", content: pick(["D’accord.", "Compris, je reste discret.", "Ok, je me fais silencieux."], q) };
    }
    if (includesAny(q, ["ta gueule", "tg", "ferme la"])) {
      return { intent: "conflict-calm-local", confidence: "high", content: pick(["Je vais te laisser souffler. Si tu veux reprendre, je suis là.", "D’accord, je me fais discret. On reprendra quand tu veux.", "Je comprends que tu sois agacé. Je prends du recul."], q) };
    }
    return { intent: "stop-local", confidence: "high", content: pick(["D’accord, j’arrête là.", "Ok, pause.", "Compris. On laisse ça de côté."], q) };
  }

  // 3. Micro-dialogues vivants.
  if (isShort(q) && includesAny(q, positive)) {
    return { intent: "positive-micro-local", confidence: "high", content: pick([
      "Avec plaisir 😊",
      "Trop bien, content que ça te serve.",
      "Merci ! On garde cette bonne énergie.",
      "Parfait, on continue quand tu veux.",
      "Ça fait plaisir. On avance proprement."
    ], q) };
  }

  if (isShort(q) && includesAny(q, playful)) {
    return { intent: "humor-micro-local", confidence: "high", content: pick([
      "Haha 😄 On garde cette énergie.",
      "J’aime bien, ça détend un peu. On continue ?",
      "Validé 😄 Je range les blagues douteuses et je garde les bonnes.",
      "On a le sourire, c’est déjà une victoire. Tu veux la suite ?",
      "Haha, parfait. Petit rayon de soleil dans le fil de discussion."
    ], q) };
  }

  if (isShort(q) && includesAny(q, disagreement)) {
    if (includesAny(q, ["c est faux", "n importe quoi"])) {
      return { intent: "correction-request-local", confidence: "high", content: "Merci de me le dire. Je préfère corriger plutôt que faire semblant. Dis-moi le point faux, ou colle la bonne info, et je reprends proprement." };
    }
    if (includesAny(q, ["tu peux faire mieux", "c est nul", "tu es nul", "c est pas terrible"])) {
      return { intent: "improve-request-local", confidence: "high", content: "Tu as raison de me challenger. Je peux faire mieux : plus clair, plus utile, plus humain. Donne-moi juste le sens que tu veux, et je reprends." };
    }
    return { intent: "mild-disappointment-local", confidence: "high", content: pick([
      "Je comprends. Qu’est-ce qui te semble moyen : le style, l’idée ou la précision ? Je peux reprendre.",
      "Ok, pas totalement convaincu. On peut le rendre plus net.",
      "Je prends. On peut faire plus simple, plus vivant ou plus carré."
    ], q) };
  }

  // 4. Nuances émotionnelles : avant le bloc confusion pour éviter les réponses répétées.
  for (const rule of emotionalRules) {
    if (includesAny(q, rule.patterns) && !includesAny(q, ["mourir", "suicide", "me tuer", "me faire du mal"])) {
      return { intent: rule.intent, confidence: "high", content: pick(rule.responses, q) };
    }
  }

  if (isShort(q) && includesAny(q, confusion)) {
    return { intent: "pedagogy-local", confidence: "high", content: pick([
      "Pas de souci. Je reprends plus simplement, étape par étape.",
      "T’inquiète, on va le rendre clair. Je repars de la base.",
      "Bien sûr. Version simple, sans jargon."
    ], q) };
  }

  // 5. Deuil/obsèques : réponse plus humaine et carrée localement.
  if (includesAny(q, grief)) {
    return { intent: "grief-admin-local", confidence: "high", content: `Je suis désolé pour ta perte. Oui, tu peux participer à l’organisation de l’enterrement, mais il faut passer par les démarches officielles.

En France, on commence généralement par le constat du décès, puis la déclaration à la mairie du lieu du décès. Ensuite, les pompes funèbres peuvent t’aider pour l’inhumation ou la crémation : autorisations, transport, cercueil, cérémonie, cimetière ou concession familiale.

Le plus simple maintenant : contacte une entreprise de pompes funèbres et la mairie concernée. Elles te diront exactement les documents et les délais.

Si tu me dis le pays ou la commune, je peux te faire une checklist très simple.` };
  }

  return null;
}
