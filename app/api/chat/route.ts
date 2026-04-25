import { NextResponse } from "next/server";
import { buildSystemPrompt } from "../../../lib/brain";
import { demoReply } from "../../../lib/demo-engine";
import { buildContext } from "../../../lib/free-sources";
import { detectIntent, desiredModelForIntent } from "../../../lib/model-router";
import { detectConversationIntent, inferResponseMode, conversationGuidance, type ResponseMode } from "../../../lib/conversation-engine";
import { assessSafety, safetyGuidanceForPrompt } from "../../../lib/safety-router";
import { localBrainReply } from "../../../lib/local-brain";
import { behaviorReply } from "../../../lib/behavior-engine";
import { qualityReply, qualityGuidance } from "../../../lib/quality-engine";
import { detectCompassMode, compassGuidance } from "../../../lib/compass";
import { detectIntelligenceIntent, intentLabel, superBrainGuidance } from "../../../lib/intelligence-platform";
import { naturalIntelligenceReply, naturalIntelligenceGuidance, postProcessNaturalResponse } from "../../../lib/natural-intelligence";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

type ProviderResult = { content: string; model: string; intent?: string; fallbackUsed?: boolean; sources?: string[] };

function norm(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function wantsSources(text: string) {
  return /\b(avec sources?|source\??|sources\??|citation|cite|preuve|preuves|reference|references|référence|références|d ou tu sors|d’où tu sors)\b/i.test(text);
}

function isMicroDialogue(text: string) {
  const q = norm(text);
  return /^(ok|okay|oui|non|merci|merci beaucoup|super|top|nickel|parfait|pas mal|bof|haha|mdr|lol|continue|vas y|vas y continue|go|d accord|je comprends pas|pas compris|tu peux faire mieux|c est faux|c est pas bon|plus simple|plus court|encore)$/.test(q);
}

function localMicroReply(text: string) {
  const q = norm(text);
  if (/^(merci|merci beaucoup)$/.test(q)) return "Avec plaisir 😊";
  if (/^(ok|okay|d accord|oui|parfait|top|nickel|super)$/.test(q)) return "Parfait. On continue quand tu veux.";
  if (/^(non)$/.test(q)) return "D’accord. Dis-moi ce que tu veux changer, et je m’adapte.";
  if (/^(pas mal)$/.test(q)) return "Merci ! On peut encore améliorer si tu veux : plus clair, plus naturel, ou plus complet.";
  if (/^(bof)$/.test(q)) return "Je vois. Qu’est-ce qui te semble moyen : le style, le fond, ou le niveau de détail ? Je peux reprendre mieux.";
  if (/^(haha|mdr|lol)$/.test(q)) return "😄 Content de t’avoir fait réagir. On continue ?";
  if (/^(continue|vas y|vas y continue|go|encore)$/.test(q)) return "Bien sûr, je continue. Donne-moi juste le fil ou la dernière idée à développer.";
  if (/^(je comprends pas|pas compris|plus simple)$/.test(q)) return "Pas de souci. Je peux reprendre plus simplement, étape par étape, sans jargon.";
  if (/^(tu peux faire mieux|c est pas bon)$/.test(q)) return "Tu as raison de me le dire. Je peux faire mieux : je reprends plus clairement, plus utilement, et sans tourner autour du pot.";
  if (/^(c est faux)$/.test(q)) return "Merci de me le signaler. Je peux corriger : dis-moi ce qui est faux, ou colle la bonne info, et je reformule proprement.";
  return "Je te suis. Dis-moi la suite.";
}

function localPracticalReply(text: string) {
  const q = norm(text);
  if (/\b(enterrer|enterrement|inhumation|obseques|deces|grand mere|grand pere|funerailles)\b/.test(q)) {
    return `Je suis désolé pour ta grand-mère. Oui, tu peux participer à l’organisation de son enterrement, mais il faut passer par les démarches officielles.

En France, en général, il faut d’abord que le décès soit constaté, puis déclaré à la mairie du lieu du décès. Ensuite, l’inhumation ou la crémation s’organise avec une entreprise de pompes funèbres, qui peut t’aider pour les autorisations, le transport, le cercueil, la cérémonie et le lien avec la mairie ou le cimetière.

Le plus simple maintenant :
1. contacte une entreprise de pompes funèbres ;
2. contacte la mairie concernée ;
3. rassemble les documents demandés, notamment le certificat de décès et les pièces d’identité ;
4. demande les délais et les possibilités d’inhumation dans la commune ou la concession familiale.

Si tu n’es pas en France, les règles peuvent changer. Dis-moi le pays ou la commune, et je te fais une checklist plus adaptée.`;
  }
  if (/\b(heritage|succession|heriter|notaire)\b/.test(q)) {
    return `Un héritage se règle généralement en plusieurs étapes. En France, on commence par identifier les héritiers, vérifier s’il existe un testament, puis contacter un notaire si la succession contient un bien immobilier, un testament, une donation entre époux, ou si la situation familiale est complexe.

En pratique :
1. récupère l’acte de décès ;
2. rassemble livret de famille, pièces d’identité, documents bancaires et biens connus ;
3. contacte un notaire si nécessaire ;
4. attends l’établissement de l’acte de notoriété ;
5. les héritiers décident ensuite de l’acceptation ou non de la succession.

Je peux te faire une checklist simple si tu me dis le pays et la situation : conjoint, enfants, testament, maison, comptes bancaires, etc.`;
  }
  if (/\b(porter plainte|plainte|menace|menaces|police|gendarmerie)\b/.test(q)) {
    return `Si tu es menacé ou victime d’une infraction, tu peux contacter la police ou la gendarmerie. Si le danger est immédiat, appelle le 17 ou le 112.

Pour une plainte, garde les preuves : messages, captures d’écran, dates, témoins, photos, certificats médicaux si besoin. Tu peux ensuite te rendre au commissariat ou à la gendarmerie, ou te renseigner sur les démarches officielles en ligne selon ta situation.

Si tu veux, raconte-moi brièvement ce qui s’est passé, et je t’aide à préparer un résumé clair des faits.`;
  }
  return null;
}

function localLightKnowledgeReply(text: string) {
  const q = norm(text);
  if (/\b(blague|raconte moi une blague|fais moi rire)\b/.test(q)) {
    return `Pourquoi les plongeurs plongent-ils toujours en arrière ?

Parce que sinon, ils tombent dans le bateau. 😄`;
  }
  if (/\b(recette|jambon|pates|quiche|cuisine)\b/.test(q) && /\b(jambon|recette)\b/.test(q)) {
    return `Bien sûr ! Voici une recette simple :

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
5. Fais cuire 30 à 40 minutes, jusqu’à ce que la quiche soit bien dorée.

Astuce : avec une salade verte, ça fait un repas simple et efficace.`;
  }
  return null;
}

function compactHistory(messages: ChatMessage[]) {
  return messages.slice(-4).map((m) => ({ role: m.role, content: String(m.content || "").slice(0, 650) }));
}

function compactPrompt(prompt: string) {
  const max = Number(process.env.SYSTEM_PROMPT_MAX_CHARS || 2800);
  if (prompt.length <= max) return prompt;
  const head = prompt.slice(0, Math.floor(max * 0.55));
  const tail = prompt.slice(-Math.floor(max * 0.40));
  return `${head}

[Contexte intermédiaire réduit pour économiser les tokens]

${tail}`;
}

function groqFriendlyError(raw: string) {
  if (/rate_limit|Rate limit|Request too large|tokens per minute|TPM/i.test(raw)) {
    return "Je suis un peu ralenti là. Réessaie dans quelques secondes, ou envoie une question plus courte. Je reste disponible.";
  }
  if (/GROQ_API_KEY/i.test(raw)) return "Groq n’est pas encore configuré. Le site peut continuer en mode démo, mais la vraie IA publique demande une clé Groq dans Vercel.";
  return "Je n’ai pas pu répondre correctement cette fois. Réessaie dans quelques secondes.";
}


async function callJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erreur ${response.status}`);
  }
  return response.json();
}

async function ollamaTags(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { cache: "no-store" });
    if (!res.ok) return [] as string[];
    const data = await res.json();
    return (data?.models || []).map((m: any) => m.name).filter(Boolean) as string[];
  } catch {
    return [] as string[];
  }
}

function unique(list: string[]) {
  return Array.from(new Set(list.filter(Boolean)));
}

async function chooseInstalledModel(baseUrl: string, desired: string) {
  const installed = await ollamaTags(baseUrl);
  if (!installed.length) return { model: desired, installed, fallbackUsed: false };
  if (installed.includes(desired)) return { model: desired, installed, fallbackUsed: false };

  const fallbackCandidates = unique([
    process.env.OLLAMA_MODEL,
    process.env.OLLAMA_MODEL_GENERAL,
    process.env.OLLAMA_MODEL_FAST,
    "qwen2.5:3b",
    "llama3.2",
    "mistral",
    installed[0]
  ] as string[]);

  const found = fallbackCandidates.find((m) => installed.includes(m));
  return { model: found || desired, installed, fallbackUsed: !!found };
}

async function ollamaReply(messages: ChatMessage[], systemPrompt: string, latestUser: string): Promise<ProviderResult> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const intent = detectIntent(latestUser);
  const desired = process.env.OLLAMA_ENABLE_ROUTER === "false"
    ? process.env.OLLAMA_MODEL || process.env.OLLAMA_MODEL_GENERAL || "qwen2.5:3b"
    : desiredModelForIntent(intent);
  const selected = await chooseInstalledModel(baseUrl, desired);

  const data = await callJson(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: selected.model,
      stream: false,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      options: { temperature: intent === "creative" ? 0.82 : 0.68 }
    })
  });
  return { content: data?.message?.content || "Aucune réponse du modèle local.", model: selected.model, intent, fallbackUsed: selected.fallbackUsed };
}

async function groqReply(messages: ChatMessage[], systemPrompt: string): Promise<ProviderResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY manquante");
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const data = await callJson("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.62,
      max_tokens: Number(process.env.GROQ_MAX_TOKENS || 650),
      messages: [{ role: "system", content: compactPrompt(systemPrompt) }, ...compactHistory(messages)]
    })
  });
  return { content: data?.choices?.[0]?.message?.content || "Aucune réponse Groq.", model };
}

async function openRouterReply(messages: ChatMessage[], systemPrompt: string): Promise<ProviderResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY manquante");
  const model = process.env.OPENROUTER_MODEL || "openrouter/auto";
  const data = await callJson("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": "http://localhost:3000", "X-Title": "NimbrayAI" },
    body: JSON.stringify({ model, temperature: 0.7, messages: [{ role: "system", content: systemPrompt }, ...messages] })
  });
  return { content: data?.choices?.[0]?.message?.content || "Aucune réponse OpenRouter.", model };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = ((body?.messages || []) as ChatMessage[]).filter(Boolean);
    if (!messages.length) return NextResponse.json({ error: "Aucun message fourni." }, { status: 400 });

    const memory = process.env.ENABLE_MEMORY === "false" ? [] : (Array.isArray(body?.memory) ? body.memory.filter(Boolean).slice(0, 18) : []);
    const userKnowledge = Array.isArray(body?.userKnowledge) ? body.userKnowledge.filter(Boolean).slice(0, 18) : [];
    const latestUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const responseMode = inferResponseMode(latestUser, (body?.responseMode || "auto") as ResponseMode);
    const safety = assessSafety(latestUser);
    if (safety.shouldIntercept && safety.response) {
      return NextResponse.json({
        content: safety.response,
        provider: "safety",
        model: "safe-human-brain",
        intent: safety.category,
        responseMode: "auto",
        fallbackUsed: false,
        sourcesUsed: []
      });
    }

    // V71 Natural Intelligence Layer : micro-intentions, silence persistant,
    // solitude, identité/orientation et dialogue naturel avant les anciens moteurs.
    const natural = naturalIntelligenceReply(latestUser, messages);
    if (natural?.shouldIntercept) {
      return NextResponse.json({
        content: natural.content,
        provider: "nimbray-local",
        model: "v71-natural-intelligence-layer",
        intent: natural.intent,
        responseMode: "auto",
        fallbackUsed: false,
        sourcesUsed: []
      });
    }

    // V37 Emotional Variation Engine : les émotions simples, conflits, micro-dialogues,
    // humour, empathie et prudence sont traités localement avant Groq.
    const behavior = behaviorReply(latestUser);
    if (behavior) {
      return NextResponse.json({
        content: behavior.content,
        provider: "nimbray-local",
        model: "v71-natural-human-engine",
        intent: behavior.intent,
        responseMode: "auto",
        fallbackUsed: false,
        sourcesUsed: []
      });
    }

    // V40 Quality Gate : critiques, corrections, demandes de style et prudence.
    const quality = qualityReply(latestUser);
    if (quality) {
      return NextResponse.json({
        content: quality.content,
        provider: "nimbray-local",
        model: "v71-natural-quality-engine",
        intent: quality.intent,
        responseMode: "auto",
        fallbackUsed: false,
        sourcesUsed: []
      });
    }

    // V40 Consolidated Local Brain: tout ce qui est stable, répétitif, sensible ou conversationnel
    // est traité localement avant d'appeler Groq. Cela rend le site plus rapide,
    // évite les rate limits et donne une personnalité plus vivante à NimbrayAI.
    const localBrain = localBrainReply(latestUser);
    if (localBrain) {
      return NextResponse.json({
        content: localBrain.content,
        provider: "nimbray-local",
        model: "v71-natural-local-brain",
        intent: localBrain.intent,
        responseMode: "auto",
        fallbackUsed: false,
        sourcesUsed: []
      });
    }

    const localPractical = localPracticalReply(latestUser);
    const localKnowledge = localLightKnowledgeReply(latestUser);
    if (isMicroDialogue(latestUser) || localPractical || localKnowledge) {
      return NextResponse.json({
        content: localPractical || localKnowledge || localMicroReply(latestUser),
        provider: "nimbray-local",
        model: "v71-natural-local-router",
        intent: isMicroDialogue(latestUser) ? "micro-dialogue" : "local-practical",
        responseMode: "auto",
        fallbackUsed: false,
        sourcesUsed: []
      });
    }
    const conversationIntent = detectConversationIntent(latestUser);
    const compassMode = detectCompassMode(latestUser);
    const platformIntent = detectIntelligenceIntent(latestUser);
    const sourceRequested = wantsSources(latestUser);
    // V32: ne charge pas des sources pour tout et rien. Les connaissances stables
    // sont gérées localement ; le contexte externe est réservé aux demandes longues,
    // documentaires, de recherche ou explicitement sourcées.
    const contextUseful = sourceRequested || ["document", "research"].includes(conversationIntent) || ["document", "research", "super_brain", "project"].includes(platformIntent) || latestUser.length > 260;
    const { context, sources } = contextUseful ? await buildContext(latestUser, userKnowledge) : { context: "", sources: [] as any[] };
    const guidance = `${conversationGuidance(conversationIntent, responseMode)}
${naturalIntelligenceGuidance()}
${safetyGuidanceForPrompt()}
Sécurité détectée : ${safety.category}. ${safety.guidance}
V71 Natural Intelligence Layer, Sources, Memory & Projects Platform : réponse directe, naturelle, fiable et humaine. Priorité aux moteurs locaux consolidés avant Groq. Groq seulement si nécessaire. Sources invisibles sauf demande explicite. Pas de JSON technique. Intent platform détecté : ${intentLabel(platformIntent)}. ${platformIntent === "super_brain" ? `Super Brain : ${superBrainGuidance().join(" ; ")}.` : ""} ${compassGuidance(compassMode)} ${qualityGuidance(latestUser)}`;
    const systemPrompt = buildSystemPrompt(memory.slice(0, 5), context, guidance);
    const provider = (process.env.AI_PROVIDER || "demo").toLowerCase();

    let result: ProviderResult;
    if (provider === "ollama") result = await ollamaReply(messages, systemPrompt, latestUser);
    else if (provider === "groq") result = await groqReply(messages, systemPrompt);
    else if (provider === "openrouter") result = await openRouterReply(messages, systemPrompt);
    else result = { content: demoReply(messages, memory, userKnowledge.length > 0, responseMode, conversationIntent), model: "nimbray-demo-engine-v71", intent: conversationIntent };

    const showSources = wantsSources(latestUser);
    const cleanSources = showSources
      ? sources
          .filter((s) => s.score === undefined || s.score > 1 || s.type !== "local")
          .map((s) => ({ title: s.title, type: s.type, url: (s as any).url }))
          .slice(0, 8)
      : [];

    return NextResponse.json({
      content: postProcessNaturalResponse(result.content, latestUser, messages),
      provider,
      model: result.model,
      intent: result.intent || platformIntent || conversationIntent || null,
      responseMode,
      fallbackUsed: !!result.fallbackUsed,
      sourcesUsed: cleanSources
    });
  } catch (error: any) {
    const raw = error?.message || "Erreur inconnue";
    const provider = (process.env.AI_PROVIDER || "demo").toLowerCase();
    const friendly = provider === "groq"
      ? groqFriendlyError(raw)
      : raw.includes("model") && raw.includes("not found")
      ? "Le modèle demandé n’est pas disponible. Je peux continuer avec un autre modèle installé ou en mode démo."
      : raw.includes("fetch failed")
      ? "Je n’arrive pas à contacter le moteur IA local. Vérifie qu’Ollama est lancé, ou utilise le mode démo en attendant."
      : "Je n’ai pas pu répondre correctement cette fois. Réessaie dans quelques secondes.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
