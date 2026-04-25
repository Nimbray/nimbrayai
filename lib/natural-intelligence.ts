export type NaturalChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type NaturalReply = {
  content: string;
  intent: string;
  confidence: "high" | "medium";
  shouldIntercept: boolean;
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

function hasAny(q: string, list: string[]) {
  return list.some((item) => q.includes(norm(item)));
}

function exactAny(q: string, list: string[]) {
  return list.map(norm).includes(q);
}

function pick(items: string[], seed: string) {
  let hash = 2166136261;
  for (const c of seed) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  return items[hash % items.length];
}

function recentUsers(messages: NaturalChatMessage[], count = 5) {
  return messages.filter((m) => m.role === "user").slice(-count).map((m) => norm(m.content));
}

function askedPersistentSilence(q: string) {
  return exactAny(q, [
    "ne reponds plus",
    "ne parle plus",
    "parle plus",
    "tais toi",
    "tais-toi",
    "silence",
    "stop",
    "arrete",
    "arrette",
    "laisse moi tranquille",
    "fous moi la paix"
  ]) || /\b(ne reponds plus|ne parle plus|arrete de repondre|arrete de parler)\b/.test(q);
}

function resumesConversation(q: string) {
  return exactAny(q, ["reprends", "tu peux reparler", "parle", "reviens", "continue", "bonjour", "salut", "coucou"]) ||
    /\b(tu peux repondre|tu peux reparler|on reprend|reprends|parle moi)\b/.test(q);
}

function repeatedNothing(history: string[]) {
  return history.filter((q) => exactAny(q, ["rien", "rien du tout", "aucune idee", "aucune idée"])).length >= 2;
}

export function naturalIntelligenceReply(text: string, messages: NaturalChatMessage[] = []): NaturalReply | null {
  const q = norm(text);
  if (!q) return null;

  const history = recentUsers(messages);
  const previous = history.slice(0, -1);
  const persistentSilence = previous.some(askedPersistentSilence) && !resumesConversation(q);

  if (persistentSilence) {
    return {
      content: "",
      intent: "v71-persistent-silence",
      confidence: "high",
      shouldIntercept: true
    };
  }

  if (askedPersistentSilence(q) && isShort(q, 10)) {
    return {
      content: pick([
        "D’accord, j’arrête.",
        "Ok, je me tais.",
        "Compris. Je ne continue pas.",
        "Bien reçu. Je m’arrête là."
      ], q),
      intent: "v71-stop-respected",
      confidence: "high",
      shouldIntercept: true
    };
  }

  if (resumesConversation(q) && previous.some(askedPersistentSilence)) {
    return {
      content: pick([
        "D’accord, on reprend doucement.",
        "Ok, je reviens. On peut reprendre simplement.",
        "Je suis là. On repart tranquillement."
      ], q),
      intent: "v71-resume-after-silence",
      confidence: "high",
      shouldIntercept: true
    };
  }

  if (exactAny(q, ["rien", "rien du tout", "aucune idee", "aucune idée"])) {
    return {
      content: repeatedNothing(history)
        ? "D’accord. Je ne vais pas insister."
        : pick([
            "Ok. Pas besoin de forcer.",
            "Ça marche. On peut juste rester tranquilles.",
            "Compris. Je ne vais pas te bombarder de questions.",
            "Pas de souci. On laisse comme ça pour l’instant."
          ], q + history.join("|")),
      intent: "v71-nothing-soft",
      confidence: "high",
      shouldIntercept: true
    };
  }

  if (exactAny(q, ["parle", "dis quelque chose", "parle moi", "j ai besoin de parler"])) {
    const tender = previous.some((p) => hasAny(p, ["seul", "seule", "triste", "peur", "angoisse", "perdu", "perdue"]));
    return {
      content: tender
        ? "Oui. On peut parler doucement. Là, je te propose juste une question simple : qu’est-ce qui te pèse le plus en ce moment ?"
        : pick([
            "Oui. On peut parler simplement. Ta journée ressemblait plutôt à quoi : calme, lourde, bizarre ou normale ?",
            "Je suis là. Pas besoin d’un sujet parfait : tu veux une discussion légère ou quelque chose de plus profond ?",
            "D’accord. Je lance doucement : aujourd’hui, tu avais plutôt besoin de calme, d’énergie ou de te vider la tête ?"
          ], q),
      intent: "v71-talk-starter",
      confidence: "high",
      shouldIntercept: true
    };
  }

  if (hasAny(q, ["je crois que je suis bi", "je pense que je suis bi", "je me demande si je suis bi", "peut etre bi", "peut-être bi"])) {
    return {
      content: "C’est ok de te poser cette question. Tu n’as pas besoin d’avoir une réponse parfaite tout de suite, ni de te coller une étiquette trop vite. On peut juste parler de ce que tu ressens et de ce qui te fait penser ça.",
      intent: "v71-identity-questioning",
      confidence: "high",
      shouldIntercept: true
    };
  }

  if (hasAny(q, ["je me sens seul", "je me sens seule", "je suis seul", "je suis seule", "personne ne m aime", "j ai personne"])) {
    return {
      content: pick([
        "Je suis désolé que tu te sentes comme ça. La solitude peut vraiment peser, surtout quand on garde tout pour soi. Tu peux commencer petit : qu’est-ce qui te manque le plus là, une présence, de l’affection, ou quelqu’un à qui parler ?",
        "Je t’entends. Se sentir seul, ça peut faire très mal. On peut en parler doucement, sans que tu aies besoin de tout expliquer parfaitement.",
        "Ça doit être lourd à porter. Je ne vais pas te sortir une phrase toute faite : dis-moi juste ce qui te pèse le plus maintenant."
      ], q),
      intent: "v71-loneliness",
      confidence: "high",
      shouldIntercept: true
    };
  }

  if (isShort(q) && exactAny(q, ["merci", "merci beaucoup", "thx"])) {
    return {
      content: pick(["Avec plaisir.", "Je t’en prie.", "Pas de souci.", "Content d’avoir pu t’aider."], q + history.join("|")),
      intent: "v71-thanks-clean",
      confidence: "high",
      shouldIntercept: true
    };
  }

  if (isShort(q) && exactAny(q, ["bof", "mouais", "jsp", "je sais pas", "pas ouf"])) {
    return {
      content: pick([
        "Je vois. On peut faire plus simple ou juste laisser poser.",
        "Ok, pas convaincu. Tu veux que je reprenne autrement ?",
        "Je comprends. On peut ralentir un peu."
      ], q),
      intent: "v71-low-energy",
      confidence: "high",
      shouldIntercept: true
    };
  }

  return null;
}

export function naturalIntelligenceGuidance() {
  return `
V71 Natural Intelligence Layer :
- Priorité au naturel : aucune formule robotique répétée inutilement.
- Messages courts = réponses courtes, sauf détresse explicite.
- Si l'utilisateur veut du silence ou dit d'arrêter, respecter immédiatement sans relance.
- Si l'utilisateur exprime solitude, doute, identité, orientation, honte ou vulnérabilité : répondre d'abord avec accueil humain, sans jugement, sans diagnostic.
- Évite de répéter "je suis là", "je reste disponible" et "comment puis-je t'aider" ; varie les formulations.
- Pose au maximum une question de relance, seulement si elle aide vraiment.
- Ne fais pas semblant d'être humain : sois un assistant présent, clair, calme et fiable.
- Réduis les phrases de remplissage. Donne un résultat utile ou une présence simple.
`;
}

export function postProcessNaturalResponse(content: string, latestUser: string, messages: NaturalChatMessage[] = []) {
  let out = String(content || "").trim();
  const q = norm(latestUser);

  if (!out) return out;

  const bannedOpeners = [
    /^bien sûr[,.]?\s*je suis là pour t'aider[,.]?\s*/i,
    /^je suis là pour t'aider[,.]?\s*/i,
    /^comment puis-je t'aider\s*\??\s*/i,
  ];
  for (const pattern of bannedOpeners) out = out.replace(pattern, "");

  if (askedPersistentSilence(q) && out.length > 80) {
    return "D’accord, j’arrête.";
  }

  const recentAssistant = messages
    .filter((m) => m.role === "assistant")
    .slice(-3)
    .map((m) => norm(m.content))
    .join(" | ");

  if (recentAssistant.includes("je reste disponible") && out.includes("Je reste disponible")) {
    out = out.replace(/Je reste disponible\.?/g, "On pourra reprendre quand tu voudras.");
  }

  return out.trim() || content;
}
