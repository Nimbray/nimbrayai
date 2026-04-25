import fs from "fs";
import path from "path";

export type SourceType = "local" | "user" | "wikipedia" | "wikidata" | "openlibrary" | "arxiv" | "crossref" | "pubmed" | "stackexchange" | "mdn" | "docs" | "webhint";
export type SourceSnippet = { title: string; content: string; type?: SourceType; url?: string; score?: number; reliability?: number };

type CacheEntry = { expiresAt: number; value: SourceSnippet | null };
const PUBLIC_CACHE = new Map<string, CacheEntry>();

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string) {
  const stop = new Set(["avec", "dans", "pour", "plus", "moins", "quoi", "comment", "donne", "moi", "une", "des", "les", "que", "qui", "sur", "est", "sont", "vous", "nous", "aux", "par", "pas", "the", "this", "that", "what", "from", "into", "and", "your"]);
  return Array.from(new Set(normalize(text).split(" ").filter((w) => w.length > 2 && !stop.has(w))));
}

function isCommonRequest(query: string) {
  const q = normalize(query);
  return /^(bonjour|salut|hello|hey|merci|ok|oui|non)\b/.test(q) || /(comment ca va|recette|jambon|cuisine|repas|mail simple|message rapide)/.test(q);
}

function relevanceScore(query: string, content: string) {
  const terms = tokenize(query);
  const target = normalize(content);
  if (!terms.length) return 0;
  let score = 0;
  for (const term of terms) {
    const occurrences = target.split(term).length - 1;
    if (occurrences > 0) score += Math.min(6, occurrences) * (term.length >= 7 ? 2.5 : term.length >= 5 ? 1.5 : 1);
  }
  const phrase = normalize(query);
  if (phrase.length > 10 && target.includes(phrase)) score += 10;
  return score;
}

function reliability(type?: SourceType) {
  const scores: Record<string, number> = {
    local: 0.72,
    user: 0.82,
    wikipedia: 0.72,
    wikidata: 0.78,
    openlibrary: 0.70,
    arxiv: 0.84,
    crossref: 0.82,
    pubmed: 0.88,
    stackexchange: 0.66,
    mdn: 0.92,
    docs: 0.9,
    webhint: 0.62,
  };
  return scores[type || "webhint"] || 0.55;
}

function finalScore(query: string, source: SourceSnippet) {
  return relevanceScore(query, `${source.title}\n${source.content}`) * 1.0 + reliability(source.type) * 4 + (source.type === "user" ? 2 : 0);
}

function chunkText(content: string, chunkSize = Number(process.env.RAG_CHUNK_SIZE || 1500), overlap = Number(process.env.RAG_CHUNK_OVERLAP || 220)) {
  const clean = content.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [] as string[];
  if (clean.length <= chunkSize) return [clean];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length && chunks.length < Number(process.env.RAG_MAX_CHUNKS_PER_FILE || 100)) {
    let end = Math.min(clean.length, start + chunkSize);
    const boundary = clean.lastIndexOf("\n", end);
    if (boundary > start + chunkSize * 0.55) end = boundary;
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks.filter(Boolean);
}

function readMarkdownFiles(dir: string): Array<{ title: string; content: string }> {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const output: Array<{ title: string; content: string }> = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...readMarkdownFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".md")) {
      const relative = path.relative(path.join(process.cwd(), "knowledge"), fullPath).replace(/\\/g, "/");
      output.push({ title: relative.replace(/\.md$/, ""), content: fs.readFileSync(fullPath, "utf8") });
    }
  }
  return output;
}

function dedupeSources(items: SourceSnippet[]) {
  const seen = new Set<string>();
  const out: SourceSnippet[] = [];
  for (const item of items) {
    const key = normalize(`${item.type || ""}:${item.title}:${item.url || ""}:${item.content.slice(0, 160)}`);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function rankUserKnowledge(query: string, items: string[], topK = Number(process.env.USER_KNOWLEDGE_TOP_K || 10)): SourceSnippet[] {
  if (process.env.ENABLE_USER_KNOWLEDGE === "false") return [];
  const candidates: SourceSnippet[] = [];
  items.forEach((item, index) => {
    const title = item.match(/^Titre:\s*(.+)$/m)?.[1]?.trim() || `source_utilisateur_${index + 1}`;
    chunkText(item).forEach((chunk, chunkIndex) => {
      const score = relevanceScore(query, chunk);
      candidates.push({ title: `${title} · passage ${chunkIndex + 1}`, content: chunk, score, type: "user", reliability: reliability("user") });
    });
  });
  return candidates
    .filter((entry) => entry.score! > 0 || (!isCommonRequest(query) && normalize(query).length > 18))
    .sort((a, b) => finalScore(query, b) - finalScore(query, a))
    .slice(0, topK)
    .map((s) => ({ ...s, content: s.content.slice(0, 1700) }));
}

export function loadInternalKnowledge(query: string): SourceSnippet[] {
  if (process.env.ENABLE_LOCAL_KNOWLEDGE === "false") return [];
  if (isCommonRequest(query)) return [];
  const topK = Number(process.env.LOCAL_KNOWLEDGE_TOP_K || 10);
  const dir = path.join(process.cwd(), "knowledge");
  const candidates: SourceSnippet[] = [];
  for (const file of readMarkdownFiles(dir)) {
    chunkText(file.content).forEach((chunk, chunkIndex) => {
      const score = relevanceScore(query, chunk) + relevanceScore(query, file.title) * 2;
      if (score > 0) candidates.push({ title: `${file.title} · passage ${chunkIndex + 1}`, content: chunk, score, type: "local", reliability: reliability("local") });
    });
  }
  return candidates.sort((a, b) => finalScore(query, b) - finalScore(query, a)).slice(0, topK).map((s) => ({ ...s, content: s.content.slice(0, 1500) }));
}

async function fetchWithTimeout(url: string, timeoutMs = Number(process.env.SOURCE_TIMEOUT_MS || 5000)) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { signal: controller.signal, headers: { "User-Agent": "NimbrayAI/1.0" } }); }
  finally { clearTimeout(timer); }
}

async function cached(key: string, loader: () => Promise<SourceSnippet | null>) {
  const ttl = Number(process.env.SOURCE_CACHE_TTL_MS || 1000 * 60 * 20);
  const existing = PUBLIC_CACHE.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value;
  const value = await loader();
  PUBLIC_CACHE.set(key, { expiresAt: Date.now() + ttl, value });
  if (PUBLIC_CACHE.size > Number(process.env.SOURCE_CACHE_MAX_ITEMS || 120)) {
    const first = PUBLIC_CACHE.keys().next().value;
    if (first) PUBLIC_CACHE.delete(first);
  }
  return value;
}

function shouldUseExternalKnowledge(query: string) {
  if (isCommonRequest(query)) return false;
  const q = normalize(query);
  return /(qui est|qu est ce que|explique|definition|histoire|pays|ville|personne|concept|science|technologie|entreprise|date|origine|livre|auteur|recherche|papier|article|arxiv|open data|donnee|donnees|sante|medical|medecine|pubmed|code|javascript|python|react|next|node|html|css|api|web|bibliographie|source|sources|citation|verifie|stack|mdn)/.test(q);
}

function extractSearchQuery(text: string) {
  return text.replace(/^(qui est|qu est ce que|qu'est-ce que|explique moi|explique|definition de|définition de|avec sources\s*:?)\s+/i, "").replace(/[?.!]+$/g, "").trim().slice(0, 100);
}

export async function loadWikipediaSnippet(query: string): Promise<SourceSnippet | null> {
  if (process.env.ENABLE_WIKIPEDIA === "false" || !shouldUseExternalKnowledge(query)) return null;
  const lang = process.env.WIKIPEDIA_LANGUAGE || "fr";
  const term = extractSearchQuery(query);
  if (!term) return null;
  return cached(`wikipedia:${lang}:${term}`, async () => {
    try {
      const searchRes = await fetchWithTimeout(`https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=1&namespace=0&format=json`);
      if (!searchRes.ok) return null;
      const searchData = (await searchRes.json()) as any[];
      const title = searchData?.[1]?.[0];
      if (!title) return null;
      const summaryRes = await fetchWithTimeout(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (!summaryRes.ok) return null;
      const summary = (await summaryRes.json()) as any;
      if (!summary?.extract) return null;
      return { title: `Wikipedia: ${title}`, content: summary.extract.slice(0, 1300), type: "wikipedia", url: summary.content_urls?.desktop?.page, reliability: reliability("wikipedia") };
    } catch { return null; }
  });
}

export async function loadWikidataSnippet(query: string): Promise<SourceSnippet | null> {
  if (process.env.ENABLE_WIKIDATA !== "true" || !shouldUseExternalKnowledge(query)) return null;
  const term = extractSearchQuery(query);
  return cached(`wikidata:${term}`, async () => {
    try {
      const res = await fetchWithTimeout(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(term)}&language=fr&format=json&limit=1`);
      if (!res.ok) return null;
      const item = ((await res.json()) as any)?.search?.[0];
      if (!item) return null;
      return { title: `Wikidata: ${item.label || term}`, content: `${item.label || term}${item.description ? ` — ${item.description}` : ""}`.slice(0, 800), type: "wikidata", url: item.concepturi, reliability: reliability("wikidata") };
    } catch { return null; }
  });
}

export async function loadOpenLibrarySnippet(query: string): Promise<SourceSnippet | null> {
  if (process.env.ENABLE_OPENLIBRARY !== "true") return null;
  const q = normalize(query);
  if (!/(livre|auteur|roman|bibliographie|lecture|open library)/.test(q)) return null;
  const term = extractSearchQuery(query);
  return cached(`openlibrary:${term}`, async () => {
    try {
      const res = await fetchWithTimeout(`https://openlibrary.org/search.json?q=${encodeURIComponent(term)}&limit=1`);
      if (!res.ok) return null;
      const doc = ((await res.json()) as any)?.docs?.[0];
      if (!doc) return null;
      const title = doc.title || term;
      const author = Array.isArray(doc.author_name) ? doc.author_name.slice(0, 3).join(", ") : "auteur inconnu";
      const year = doc.first_publish_year ? `, première publication ${doc.first_publish_year}` : "";
      return { title: `OpenLibrary: ${title}`, content: `${title} — ${author}${year}.`.slice(0, 800), type: "openlibrary", url: doc.key ? `https://openlibrary.org${doc.key}` : undefined, reliability: reliability("openlibrary") };
    } catch { return null; }
  });
}

export async function loadArxivSnippet(query: string): Promise<SourceSnippet | null> {
  if (process.env.ENABLE_ARXIV !== "true") return null;
  const q = normalize(query);
  if (!/(arxiv|papier|paper|recherche|scientifique|machine learning|ia|llm|modele|algorithme)/.test(q)) return null;
  const term = extractSearchQuery(query);
  return cached(`arxiv:${term}`, async () => {
    try {
      const res = await fetchWithTimeout(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(term)}&start=0&max_results=1`);
      if (!res.ok) return null;
      const xml = await res.text();
      const title = (xml.match(/<title>([^<]+)<\/title>/g) || [])[1]?.replace(/<\/?title>/g, "").trim();
      const summary = xml.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, " ").trim();
      const id = xml.match(/<id>(https:\/\/arxiv\.org\/abs\/[^<]+)<\/id>/)?.[1];
      if (!title || !summary) return null;
      return { title: `arXiv: ${title}`, content: summary.slice(0, 1200), type: "arxiv", url: id, reliability: reliability("arxiv") };
    } catch { return null; }
  });
}

export async function loadCrossrefSnippet(query: string): Promise<SourceSnippet | null> {
  if (process.env.ENABLE_CROSSREF !== "true") return null;
  const q = normalize(query);
  if (!/(article|papier|paper|doi|recherche|etude|étude|scientifique|bibliographie|source)/.test(q)) return null;
  const term = extractSearchQuery(query);
  return cached(`crossref:${term}`, async () => {
    try {
      const res = await fetchWithTimeout(`https://api.crossref.org/works?query=${encodeURIComponent(term)}&rows=1`);
      if (!res.ok) return null;
      const item = ((await res.json()) as any)?.message?.items?.[0];
      const title = Array.isArray(item?.title) ? item.title[0] : null;
      if (!title) return null;
      const year = item?.published?.["date-parts"]?.[0]?.[0];
      return { title: `Crossref: ${title}`, content: `${title}${year ? ` (${year})` : ""}${item?.DOI ? `. DOI: ${item.DOI}` : ""}`.slice(0, 1000), type: "crossref", url: item?.URL, reliability: reliability("crossref") };
    } catch { return null; }
  });
}

export async function loadPubMedSnippet(query: string): Promise<SourceSnippet | null> {
  if (process.env.ENABLE_PUBMED !== "true") return null;
  const q = normalize(query);
  if (!/(sante|medical|medecine|pubmed|clinique|traitement|maladie|nutrition|symptome|etude)/.test(q)) return null;
  const term = extractSearchQuery(query);
  return cached(`pubmed:${term}`, async () => {
    try {
      const searchRes = await fetchWithTimeout(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=1&term=${encodeURIComponent(term)}`);
      if (!searchRes.ok) return null;
      const id = ((await searchRes.json()) as any)?.esearchresult?.idlist?.[0];
      if (!id) return null;
      const sumRes = await fetchWithTimeout(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${id}`);
      if (!sumRes.ok) return null;
      const item = ((await sumRes.json()) as any)?.result?.[id];
      if (!item?.title) return null;
      return { title: `PubMed: ${item.title}`, content: `${item.title}${item.fulljournalname ? ` — ${item.fulljournalname}` : ""}${item.pubdate ? `, ${item.pubdate}` : ""}.`.slice(0, 1000), type: "pubmed", url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, reliability: reliability("pubmed") };
    } catch { return null; }
  });
}

export async function loadStackExchangeSnippet(query: string): Promise<SourceSnippet | null> {
  if (process.env.ENABLE_STACKEXCHANGE !== "true") return null;
  const q = normalize(query);
  if (!/(stackoverflow|stack overflow|code|javascript|typescript|python|react|node|next|sql|css|html|bug|erreur)/.test(q)) return null;
  const term = extractSearchQuery(query);
  return cached(`stackexchange:${term}`, async () => {
    try {
      const res = await fetchWithTimeout(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&site=stackoverflow&pagesize=1&q=${encodeURIComponent(term)}&filter=default`);
      if (!res.ok) return null;
      const item = ((await res.json()) as any)?.items?.[0];
      if (!item?.title) return null;
      return { title: `StackOverflow: ${item.title}`, content: `${item.title}. Score: ${item.score ?? 0}. Réponses: ${item.answer_count ?? 0}.`.slice(0, 900), type: "stackexchange", url: item.link, reliability: reliability("stackexchange") };
    } catch { return null; }
  });
}

export function loadOfficialDocsHint(query: string): SourceSnippet | null {
  if (process.env.ENABLE_OFFICIAL_DOCS === "false") return null;
  const q = normalize(query);
  if (!/(mdn|javascript|html|css|web api|react|next|node|python|typescript|npm|nextjs)/.test(q)) return null;
  if (/\b(mdn|javascript|html|css|web api)\b/.test(q)) return { title: "Documentation: MDN Web Docs", content: "Source recommandée pour JavaScript, HTML, CSS et Web APIs : MDN Web Docs.", type: "mdn", url: "https://developer.mozilla.org/", reliability: reliability("mdn") };
  if (/\b(next|nextjs|next js)\b/.test(q)) return { title: "Documentation: Next.js", content: "Source recommandée pour Next.js : documentation officielle Next.js.", type: "docs", url: "https://nextjs.org/docs", reliability: reliability("docs") };
  if (/\b(node|nodejs|node js|npm)\b/.test(q)) return { title: "Documentation: Node.js", content: "Source recommandée pour Node.js : documentation officielle Node.js.", type: "docs", url: "https://nodejs.org/docs", reliability: reliability("docs") };
  if (/\b(python)\b/.test(q)) return { title: "Documentation: Python", content: "Source recommandée pour Python : documentation officielle Python.", type: "docs", url: "https://docs.python.org/3/", reliability: reliability("docs") };
  return null;
}

export async function buildContext(query: string, userKnowledge: string[]) {
  if (process.env.ENABLE_FREE_SOURCES === "false") return { context: "", sources: [] as SourceSnippet[] };

  const userTopK = Number(process.env.USER_KNOWLEDGE_TOP_K || process.env.RAG_TOP_K || 3);
  const sources: SourceSnippet[] = [
    ...rankUserKnowledge(query, userKnowledge, userTopK),
    ...loadInternalKnowledge(query),
  ];

  const maxPublic = Number(process.env.SOURCE_MAX_PUBLIC_RESULTS || 2);
  const [wiki, wikidata, openLibrary, arxiv, crossref, pubmed, stackexchange] = await Promise.all([
    loadWikipediaSnippet(query),
    loadWikidataSnippet(query),
    loadOpenLibrarySnippet(query),
    loadArxivSnippet(query),
    loadCrossrefSnippet(query),
    loadPubMedSnippet(query),
    loadStackExchangeSnippet(query),
  ]);
  const docsHint = loadOfficialDocsHint(query);
  for (const source of [wiki, wikidata, openLibrary, arxiv, crossref, pubmed, stackexchange, docsHint].slice(0, maxPublic + 1)) if (source) sources.push(source);

  const minScore = Number(process.env.SOURCE_MIN_SCORE || 0);
  const ranked = dedupeSources(sources)
    .map((s) => ({ ...s, score: s.score ?? finalScore(query, s), reliability: s.reliability ?? reliability(s.type) }))
    .filter((s) => (s.score || 0) >= minScore || s.type === "user")
    .sort((a, b) => finalScore(query, b) - finalScore(query, a))
    .slice(0, Number(process.env.CONTEXT_TOP_K || 3));

  const maxChars = Number(process.env.CONTEXT_MAX_CHARS || 2200);
  let used = 0;
  const contextBlocks: string[] = [];
  for (const s of ranked) {
    const block = `[${s.title}]\nType: ${s.type || "source"}\nFiabilité indicative: ${Math.round((s.reliability || reliability(s.type)) * 100)}%\n${s.content}`;
    if (used + block.length > maxChars) break;
    used += block.length;
    contextBlocks.push(block);
  }
  return { context: contextBlocks.join("\n\n"), sources: ranked };
}
