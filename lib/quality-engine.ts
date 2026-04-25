export type QualityHit = {
  intent: string;
  confidence: "low" | "medium" | "high";
  content: string;
};

function norm(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(q: string, list: string[]) {
  return list.some((item) => q.includes(norm(item)));
}

function isShort(q: string) {
  return q.split(" ").filter(Boolean).length <= 9;
}

function pick(items: string[], seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return items[hash % items.length];
}

const styleFeedback = [
  "trop long", "c est trop long", "c'est trop long", "fais plus court", "plus court",
  "trop court", "developpe", "développe", "plus detaille", "plus détaillé",
  "trop froid", "pas assez humain", "plus humain", "plus naturel", "trop robot", "robotique",
  "pas clair", "pas compris", "je comprends pas", "explique mieux", "plus simple",
  "mal formule", "reformule", "reprends", "ameliorer cette reponse", "améliorer cette réponse"
];

const factualCorrection = [
  "c est faux", "c'est faux", "c est pas vrai", "ce n est pas vrai", "n importe quoi", "tu te trompes", "erreur", "mauvaise reponse", "mauvaise réponse"
];

const answerQualityRequests = [
  "verifie ta reponse", "vérifie ta réponse", "sois plus precis", "sois plus précis", "source fiable", "tu inventes", "hallucine", "pas sur", "pas sûr"
];

const sensitiveLegalHealth = [
  "sante", "santé", "medecin", "médecin", "symptome", "symptôme", "douleur", "medicament", "médicament",
  "droit", "legal", "légal", "avocat", "justice", "plainte", "proces", "procès", "heritage", "héritage", "succession", "notaire",
  "impot", "impôt", "finance", "investir", "placement", "diagnostic"
];

export function qualityReply(text: string): QualityHit | null {
  const q = norm(text);
  if (!q) return null;

  // Corrections et critiques utilisateur : local, rapide, sans gaspiller Groq.
  if (isShort(q) && hasAny(q, factualCorrection)) {
    return {
      intent: "quality-factual-correction",
      confidence: "high",
      content: pick([
        "Merci de me le signaler. Je préfère corriger proprement plutôt que défendre une mauvaise réponse. Dis-moi le point faux, et je reprends avec plus de précision.",
        "Tu as raison de me reprendre. Donne-moi ce qui est faux ou incomplet, et je reformule clairement.",
        "Bien vu. Je peux corriger : colle la bonne info ou indique l’erreur, et je te fais une version plus fiable."
      ], q)
    };
  }

  if (isShort(q) && hasAny(q, styleFeedback)) {
    if (hasAny(q, ["trop long", "fais plus court", "plus court"])) {
      return { intent: "quality-shorter", confidence: "high", content: "Bien sûr. Je vais faire plus court, plus direct, sans perdre l’essentiel." };
    }
    if (hasAny(q, ["trop court", "developpe", "plus detaille", "plus détaillé"])) {
      return { intent: "quality-more-detail", confidence: "high", content: "D’accord. Je peux développer avec plus d’exemples et une structure plus claire." };
    }
    if (hasAny(q, ["trop froid", "pas assez humain", "plus humain", "plus naturel", "trop robot", "robotique"])) {
      return { intent: "quality-more-human", confidence: "high", content: "Tu as raison. Je vais rendre ça plus humain, plus chaleureux, et moins mécanique." };
    }
    return { intent: "quality-clarify", confidence: "high", content: "Pas de souci. Je reprends plus simplement, étape par étape, avec des mots plus clairs." };
  }

  // Demande de fiabilité : rappeler la prudence sans lourdeur.
  if (hasAny(q, answerQualityRequests)) {
    return {
      intent: "quality-check",
      confidence: "medium",
      content: `Tu as raison de demander de la fiabilité. Je vais être plus prudent : distinguer ce qui est certain, ce qui dépend du contexte, et ce qu’il vaut mieux vérifier auprès d’une source officielle ou d’un professionnel.

Si tu veux, renvoie-moi la question ou la réponse à vérifier, et je la reprends de façon plus carrée.`
    };
  }

  // Sujet sensible demandé de façon vague : répondre en mode prudent local.
  if (isShort(q) && hasAny(q, sensitiveLegalHealth)) {
    return {
      intent: "quality-sensitive-guard",
      confidence: "medium",
      content: `Je peux t’aider avec une explication générale, mais sur ce sujet il faut rester prudent.

Donne-moi le contexte en quelques lignes, et je te répondrai clairement, sans remplacer un professionnel. Pour les décisions importantes, il faudra vérifier auprès d’une source officielle, d’un médecin, d’un avocat, d’un notaire ou de l’administration selon le cas.`
    };
  }

  return null;
}

export function shouldUseCarefulMode(text: string) {
  const q = norm(text);
  return hasAny(q, sensitiveLegalHealth) || hasAny(q, ["deces", "décès", "suicide", "mourir", "tuer", "violence", "urgence", "danger"]);
}

export function qualityGuidance(text: string) {
  const q = norm(text);
  const careful = shouldUseCarefulMode(text);
  const sourceWanted = hasAny(q, ["source", "sources", "avec sources", "preuve", "citation", "reference", "référence"]);
  return `
V40 Quality Gate :
- Réponds directement à la demande réelle, sans phrase de remplissage.
- Si l'utilisateur critique la réponse, corrige avec humilité et propose une version meilleure.
- Si le sujet est sensible (santé, droit, finance, sécurité, décès, violence), sois prudent, humain, concret et invite à vérifier auprès d'une source officielle/professionnelle.
- N'affiche jamais d'erreur technique ou de JSON.
- Sources visibles seulement si l'utilisateur les demande explicitement.
- Mode prudent : ${careful ? "oui" : "non"}.
- Sources demandées : ${sourceWanted ? "oui" : "non"}.
`;
}
