import { NextResponse } from "next/server";
import { routingSummary } from "../../../lib/model-router";

async function fetchOllamaModels() {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { cache: "no-store" });
    if (!res.ok) return { available: false, models: [] as string[], error: `Ollama ${res.status}` };
    const data = await res.json();
    const models = (data?.models || []).map((m: any) => m.name).filter(Boolean);
    return { available: true, models, error: "" };
  } catch (error: any) {
    return { available: false, models: [] as string[], error: error?.message || "Ollama indisponible" };
  }
}

export async function GET() {
  const provider = (process.env.AI_PROVIDER || "demo").toLowerCase();
  const ollama = await fetchOllamaModels();
  return NextResponse.json({
    ok: true,
    provider,
    model:
      provider === "ollama" ? process.env.OLLAMA_MODEL || process.env.OLLAMA_MODEL_GENERAL || "qwen2.5:3b" :
      provider === "groq" ? process.env.GROQ_MODEL || "llama-3.1-8b-instant" :
      provider === "openrouter" ? process.env.OPENROUTER_MODEL || "openrouter/auto" :
      "nimbray-demo-engine-v40",
    router: routingSummary(),
    ollama,
    features: {
      v40ReleaseCandidate: true,
      consolidatedLocalBrain: true,
      v23DialoguePersonality: true,
      v26SafeHumanBrain: true,
      publicBetaFoundation: true,
      v12RealProductFoundation: true,
      sourceCache: true,
      responseProfiles: true,
      freeSources: process.env.ENABLE_FREE_SOURCES !== "false",
      wikipedia: process.env.ENABLE_WIKIPEDIA !== "false",
      localKnowledge: process.env.ENABLE_LOCAL_KNOWLEDGE !== "false",
      userKnowledge: process.env.ENABLE_USER_KNOWLEDGE !== "false",
      memory: process.env.ENABLE_MEMORY !== "false",
      wikidata: process.env.ENABLE_WIKIDATA === "true",
      openLibrary: process.env.ENABLE_OPENLIBRARY === "true",
      arxiv: process.env.ENABLE_ARXIV === "true",
      crossref: process.env.ENABLE_CROSSREF === "true",
      pubmed: process.env.ENABLE_PUBMED === "true",
      stackexchange: process.env.ENABLE_STACKEXCHANGE === "true",
      officialDocs: process.env.ENABLE_OFFICIAL_DOCS !== "false",
      rag: process.env.ENABLE_FREE_SOURCES !== "false",
      documentParsing: process.env.ENABLE_DOCUMENT_PARSING !== "false",
      pdfParsing: process.env.ENABLE_PDF_PARSE !== "false",
      docxParsing: process.env.ENABLE_DOCX_PARSE !== "false",
      adminPanel: process.env.ENABLE_ADMIN_PANEL !== "false",
      betaFeedback: process.env.ENABLE_BETA_FEEDBACK !== "false",
      inviteMode: process.env.ENABLE_INVITE_MODE === "true"
    }
  });
}
