export type IntelligenceIntent =
  | "smalltalk"
  | "safety"
  | "emotion"
  | "knowledge"
  | "document"
  | "project"
  | "memory"
  | "code"
  | "business"
  | "creative"
  | "research"
  | "super_brain";

function normalize(text: string) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectIntelligenceIntent(text: string): IntelligenceIntent {
  const q = normalize(text);
  if (/\b(mourir|suicide|me faire du mal|tuer quelqu|cacher un corps|pirater|hacker|bombe|poison)\b/.test(q)) return "safety";
  if (/\b(je suis triste|je suis nul|je manque de confiance|je suis seul|j ai honte|ca va pas|j ai peur)\b/.test(q)) return "emotion";
  if (/\b(pdf|document|fichier|resume ce|analyse ce|source|sources|citation|citations)\b/.test(q)) return "document";
  if (/\b(projet|workspace|roadmap|objectif|tache|planning|organise)\b/.test(q)) return "project";
  if (/\b(souviens|memorise|memoire|retient|historique|ancienne conversation)\b/.test(q)) return "memory";
  if (/\b(code|bug|api|typescript|javascript|react|next|vercel|supabase|sql)\b/.test(q)) return "code";
  if (/\b(business|vente|marketing|client|offre|strategie|landing|pricing)\b/.test(q)) return "business";
  if (/\b(ecris|script|post|idee|storytelling|nom|slogan|creatif|visuel)\b/.test(q)) return "creative";
  if (/\b(actuel|recente|nouvelle|recherche web|verifie|compare les sources|aujourd hui)\b/.test(q)) return "research";
  if (/\b(super brain|mode profond|analyse complete|plan complet|strategie complete|grosse analyse)\b/.test(q)) return "super_brain";
  if (q.split(" ").filter(Boolean).length <= 5) return "smalltalk";
  return "knowledge";
}

export function intentLabel(intent: IntelligenceIntent) {
  const labels: Record<IntelligenceIntent, string> = {
    smalltalk: "Petite conversation",
    safety: "Sécurité",
    emotion: "Émotion",
    knowledge: "Connaissance",
    document: "Document & sources",
    project: "Projet",
    memory: "Mémoire",
    code: "Code",
    business: "Business",
    creative: "Création",
    research: "Recherche",
    super_brain: "Super Brain"
  };
  return labels[intent];
}

export function superBrainGuidance() {
  return [
    "clarifier l'objectif réel",
    "rassembler mémoire, sources et contexte projet",
    "analyser les options",
    "proposer une recommandation",
    "produire un plan d'action",
    "livrer un résultat directement utilisable",
    "vérifier les risques et limites"
  ];
}
