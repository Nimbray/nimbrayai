export type ModelIntent = "fast" | "general" | "code" | "creative" | "reasoning" | "document";

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectIntent(text: string): ModelIntent {
  const q = normalize(text);
  if (/\b(code|bug|erreur|typescript|javascript|react|next|python|api|npm|sql|css|html|debug|fonction|classe|composant|terminal|powershell)\b/.test(q)) return "code";
  if (/\b(pdf|document|resume|resumer|analyse|analyser|contrat|rapport|fichier|csv|texte long|source|connaissance|upload)\b/.test(q)) return "document";
  if (/\b(strategie|business plan|plan d action|decision|compare|comparer|architecture|roadmap|lancer|startup|rentable|investissement|produit|saas)\b/.test(q)) return "reasoning";
  if (/\b(cree|creer|ecris|redige|post|script|storytelling|idee|brainstorm|marque|slogan|landing page|contenu|email|mail|visuel)\b/.test(q)) return "creative";
  if (/^(salut|bonjour|hello|hey|coucou|merci|ok|oui|non|ca va|comment ca va)/.test(q) || q.length < 90) return "fast";
  return "general";
}

export function desiredModelForIntent(intent: ModelIntent) {
  const fallback = process.env.OLLAMA_MODEL || process.env.OLLAMA_MODEL_GENERAL || "qwen2.5:3b";
  const modelMap: Record<ModelIntent, string> = {
    fast: process.env.OLLAMA_MODEL_FAST || fallback,
    general: process.env.OLLAMA_MODEL_GENERAL || fallback,
    code: process.env.OLLAMA_MODEL_CODE || fallback,
    creative: process.env.OLLAMA_MODEL_CREATIVE || process.env.OLLAMA_MODEL_GENERAL || fallback,
    reasoning: process.env.OLLAMA_MODEL_REASONING || process.env.OLLAMA_MODEL_GENERAL || fallback,
    document: process.env.OLLAMA_MODEL_DOCUMENT || process.env.OLLAMA_MODEL_GENERAL || fallback,
  };
  return modelMap[intent] || fallback;
}

export function routingSummary() {
  return {
    fast: process.env.OLLAMA_MODEL_FAST || process.env.OLLAMA_MODEL || "qwen2.5:3b",
    general: process.env.OLLAMA_MODEL_GENERAL || process.env.OLLAMA_MODEL || "qwen2.5:3b",
    code: process.env.OLLAMA_MODEL_CODE || process.env.OLLAMA_MODEL || "qwen2.5:3b",
    creative: process.env.OLLAMA_MODEL_CREATIVE || process.env.OLLAMA_MODEL_GENERAL || process.env.OLLAMA_MODEL || "qwen2.5:3b",
    reasoning: process.env.OLLAMA_MODEL_REASONING || process.env.OLLAMA_MODEL_GENERAL || process.env.OLLAMA_MODEL || "qwen2.5:3b",
    document: process.env.OLLAMA_MODEL_DOCUMENT || process.env.OLLAMA_MODEL_GENERAL || process.env.OLLAMA_MODEL || "qwen2.5:3b",
  };
}
