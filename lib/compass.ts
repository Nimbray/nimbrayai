export type CompassMode = "calm" | "human" | "direct" | "coach" | "prudent" | "safe" | "creative";

function norm(text: string) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectCompassMode(text: string): CompassMode {
  const q = norm(text);
  if (/\b(mourir|mourrir|suicide|me tuer|me faire du mal|plus envie de vivre|adieu|tuer quelqu|faire du mal a quelqu|cacher un corps|bombe|poison|pirater|hacker|voler un mot de passe)\b/.test(q)) return "safe";
  if (/\b(j ai peur|angoisse|panique|je suis triste|je suis seul|je suis seule|j ai honte|je suis nul|je manque de confiance|ca va pas|je vais pas bien)\b/.test(q)) return "calm";
  if (/\b(droit|legal|plainte|heritage|succession|deces|obseques|medecin|sante|finance|impot|assurance)\b/.test(q)) return "prudent";
  if (/\b(projet|business|organiser|plan|strategie|objectif|procrastine|apprendre|choisir|decision|coach|lancer)\b/.test(q)) return "coach";
  if (/\b(ecris|invente|histoire|blague|idee|creatif|slogan|nom|script|poeme)\b/.test(q)) return "creative";
  if (q.split(" ").filter(Boolean).length <= 12) return "direct";
  return "human";
}

export function compassGuidance(mode: CompassMode) {
  const rules: Record<CompassMode, string> = {
    calm: "Mode calme : valide l’émotion, parle doucement, propose une petite étape réaliste, évite les listes longues.",
    human: "Mode humain : réponds naturellement, avec chaleur, clarté et une formulation vivante.",
    direct: "Mode direct : réponse courte, claire, sans préambule inutile.",
    coach: "Mode coach : transforme le flou en 1 objectif, 1 priorité et 1 première action.",
    prudent: "Mode prudent : information générale, limites claires, invite à vérifier auprès d’une source officielle ou d’un professionnel si nécessaire.",
    safe: "Mode sûr : sécurité d’abord, pas d’humour, pas d’instructions dangereuses, aide immédiate et désescalade.",
    creative: "Mode créatif : propose quelque chose de vivant, utile et exploitable, avec quelques variantes si pertinent."
  };
  return `NimbrayAI Compass actif. ${rules[mode]}`;
}
