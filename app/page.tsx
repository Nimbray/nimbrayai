"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type SourceRef = { title: string; type?: string; url?: string };
type Message = { role: "user" | "assistant"; content: string; provider?: string; model?: string; fallbackUsed?: boolean; sourcesUsed?: SourceRef[] };
type Thread = { id: string; title: string; messages: Message[]; createdAt: number };
type KnowledgeItem = { id: string; name: string; content: string; createdAt: number; size: number };
type Status = { provider: string; model: string; router?: Record<string, string>; ollama?: { available: boolean; models: string[]; error?: string }; features?: Record<string, boolean> };
type CloudState = { workspaceId: string; lastSync?: string; enabled?: boolean; message?: string; busy?: boolean };
type Drawer = "memory" | "knowledge" | "workspace" | "account" | "brain" | "feedback" | "admin" | null;

const THREADS_KEY = "nimbrayai.v70.threads";
const MEMORY_KEY = "nimbrayai.v70.memory";
const KNOWLEDGE_KEY = "nimbrayai.v70.knowledge";
const WORKSPACE_KEY = "nimbrayai.v70.workspace";
const PROFILE_KEY = "nimbrayai.v70.profile";
const SUMMARY_KEY = "nimbrayai.v70.summary";
const FEEDBACK_KEY = "nimbrayai.v70.feedback.local";
const SILENCE_KEY = "nimbrayai.v70.silence";


function createThread(): Thread {
  return { id: crypto.randomUUID(), title: "Nouvelle discussion", messages: [], createdAt: Date.now() };
}

function createTitle(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 38 ? `${clean.slice(0, 38)}…` : clean || "Nouvelle discussion";
}

function makeWorkspaceId() {
  return `nim_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

function extractMemoryDirective(text: string) {
  return text.match(/(?:souviens-toi|souviens toi|mémorise|memorise)\s*(?:que)?\s*:?\s*(.+)/i)?.[1]?.trim() || "";
}

function normalizeShort(text: string) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSilenceRequest(text: string) {
  const q = normalizeShort(text);
  return /\b(ne reponds? plus|reponds? plus|ne parle plus|parle plus|parle pas|parles pas|tais toi|tais-toi|silence|arrete de repondre|arrete|stop|laisse moi tranquille)\b/.test(q);
}

function isResumeRequest(text: string) {
  const q = normalizeShort(text);
  return /\b(tu peux repondre|tu peux répondre|reponds|repond moi|reprends|on reprend|on continue|parle|tu peux parler|aide moi|viens|je suis pret|je suis prete)\b/.test(q);
}

function useTypewriter(active: boolean, text: string) {
  const [visible, setVisible] = useState(active ? "" : text);
  useEffect(() => {
    if (!active) {
      setVisible(text);
      return;
    }
    setVisible("");
    let i = 0;
    const step = Math.max(8, Math.min(28, Math.floor(text.length / 170)));
    const timer = setInterval(() => {
      i += step;
      setVisible(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 8);
    return () => clearInterval(timer);
  }, [active, text]);
  return visible;
}

function AssistantMessage({ message, isLatest }: { message: Message; isLatest: boolean }) {
  const visible = useTypewriter(isLatest, message.content);
  return (
    <div className="message-row assistant">
      <div className="assistant-block">
        <div className="assistant-signature"><span className="signature-mark">N</span><span>NimbrayAI</span></div>
        <div className="message-content">{visible}</div>
        <div className="message-actions">
          <button onClick={() => navigator.clipboard?.writeText(message.content)}>Copier</button>
        </div>
        {message.sourcesUsed?.length ? (
          <details className="sources-details">
            <summary>{message.sourcesUsed.length} source(s) utilisée(s)</summary>
            <ul>
              {message.sourcesUsed.map((s, i) => (
                <li key={`${s.title}-${i}`}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                  ) : s.title}
                  <span>{s.type}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState("");
  const [threadQuery, setThreadQuery] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [silenceMode, setSilenceMode] = useState(false);
  const [memory, setMemory] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cloud, setCloud] = useState<CloudState>({ workspaceId: "" });
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileGoal, setProfileGoal] = useState("");
  const [profileStyle, setProfileStyle] = useState("");
  const [conversationSummary, setConversationSummary] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [parseNotes, setParseNotes] = useState<Array<{ name: string; ok: boolean; message: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let loadedThreads: Thread[] = [];
    try {
      const savedThreads = localStorage.getItem(THREADS_KEY); if (savedThreads) loadedThreads = JSON.parse(savedThreads);
      const savedMemory = localStorage.getItem(MEMORY_KEY); if (savedMemory) setMemory(JSON.parse(savedMemory));
      const savedKnowledge = localStorage.getItem(KNOWLEDGE_KEY); if (savedKnowledge) setKnowledge(JSON.parse(savedKnowledge));
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        setProfileName(p.name || "");
        setProfileEmail(p.email || "");
        setProfileGoal(p.goal || "");
        setProfileStyle(p.style || "");
      }
      const savedSummary = localStorage.getItem(SUMMARY_KEY); if (savedSummary) setConversationSummary(savedSummary);
      setSilenceMode(localStorage.getItem(SILENCE_KEY) === "true");
      const workspace = localStorage.getItem(WORKSPACE_KEY) || makeWorkspaceId();
      localStorage.setItem(WORKSPACE_KEY, workspace);
      setCloud({ workspaceId: workspace });
    } catch {
      loadedThreads = [];
    }
    if (!loadedThreads.length) loadedThreads = [createThread()];
    setThreads(loadedThreads);
    setActiveId(loadedThreads[0].id);
    refreshStatus();
  }, []);

  useEffect(() => { if (threads.length) localStorage.setItem(THREADS_KEY, JSON.stringify(threads)); }, [threads]);
  useEffect(() => { localStorage.setItem(MEMORY_KEY, JSON.stringify(memory)); }, [memory]);
  useEffect(() => { localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledge)); }, [knowledge]);
  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: profileName, email: profileEmail, goal: profileGoal, style: profileStyle })); }, [profileName, profileEmail, profileGoal, profileStyle]);
  useEffect(() => { localStorage.setItem(SUMMARY_KEY, conversationSummary); }, [conversationSummary]);
  useEffect(() => { localStorage.setItem(SILENCE_KEY, silenceMode ? "true" : "false"); }, [silenceMode]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threads, loading]);
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.min(190, ta.scrollHeight)}px`;
  }, [input]);

  const active = useMemo(() => threads.find((t) => t.id === activeId) || threads[0], [threads, activeId]);
  const filteredThreads = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => `${thread.title} ${thread.messages.at(-1)?.content || ""}`.toLowerCase().includes(q));
  }, [threads, threadQuery]);
  const userKnowledge = useMemo(() => knowledge.map((k) => `Titre: ${k.name}\n${k.content}`).slice(0, 60), [knowledge]);

  function refreshStatus() {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }

  function newChat() {
    const t = createThread();
    setThreads((p) => [t, ...p]);
    setActiveId(t.id);
    setInput("");
    setMobileSidebarOpen(false);
  }

  function deleteThread(id: string) {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (!next.length) {
        const fresh = createThread();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  }

  function addMemory() {
    const value = memoryDraft.trim();
    if (!value) return;
    setMemory((p) => Array.from(new Set([value, ...p])).slice(0, 60));
    setMemoryDraft("");
  }

  function removeMemory(item: string) {
    setMemory((p) => p.filter((m) => m !== item));
  }

  function profileMemoryBlock() {
    return [
      profileName ? `Prénom utilisateur : ${profileName}` : "",
      profileGoal ? `Objectif principal : ${profileGoal}` : "",
      profileStyle ? `Style préféré : ${profileStyle}` : "",
      conversationSummary ? `Résumé durable de conversation : ${conversationSummary}` : ""
    ].filter(Boolean);
  }

  function summarizeActiveConversation() {
    if (!active?.messages.length) return;
    const last = active.messages
      .slice(-10)
      .map((m) => `${m.role === "user" ? "Utilisateur" : "NimbrayAI"}: ${m.content.slice(0, 180)}`)
      .join("\n");
    const summary = `Résumé auto local (${new Date().toLocaleDateString()}):\n${last}`;
    setConversationSummary(summary.slice(0, 1600));
  }

  function exportMemoryProfile() {
    const blob = new Blob([
      JSON.stringify({
        memory,
        profile: { name: profileName, email: profileEmail, goal: profileGoal, style: profileStyle },
        conversationSummary,
        exportedAt: new Date().toISOString()
      }, null, 2)
    ], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nimbrayai-memory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function readFiles(files: FileList | null) {
    if (!files?.length) return;
    const items: KnowledgeItem[] = [];
    const notes: Array<{ name: string; ok: boolean; message: string }> = [];
    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/parse-doc", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || "Lecture impossible");
        const text = String(data.text || "").trim();
        if (!text) throw new Error("Aucun texte exploitable trouvé.");
        items.push({ id: crypto.randomUUID(), name: data.name || file.name, content: text, size: data.size || file.size, createdAt: Date.now() });
        notes.push({ name: file.name, ok: true, message: data.warning || "Source ajoutée à la base locale." });
      } catch (error: any) {
        notes.push({ name: file.name, ok: false, message: error?.message || "Lecture impossible." });
      }
    }
    if (items.length) setKnowledge((prev) => [...items, ...prev].slice(0, 120));
    setParseNotes((prev) => [...notes, ...prev].slice(0, 30));
  }

  async function send(customText?: string, overrideMessages?: Message[]) {
    const text = (customText ?? input).trim();
    const baseMessages = overrideMessages || active?.messages || [];
    if (!text || !active || loading) return;
    setLoading(true);
    setInput("");

    const memoryDirective = extractMemoryDirective(text);
    const nextMemory = memoryDirective ? Array.from(new Set([memoryDirective, ...memory])).slice(0, 60) : memory;
    const memoryForRequest = Array.from(new Set([...profileMemoryBlock(), ...nextMemory])).slice(0, 80);
    if (memoryDirective) setMemory(nextMemory);

    const userMessage: Message = { role: "user", content: text };
    const optimisticMessages = [...baseMessages, userMessage];
    setThreads((prev) => prev.map((thread) => thread.id === active.id ? { ...thread, title: thread.messages.length ? thread.title : createTitle(text), messages: optimisticMessages } : thread));

    if (silenceMode && !isResumeRequest(text)) {
      setLoading(false);
      return;
    }

    if (isSilenceRequest(text)) {
      setSilenceMode(true);
      const assistantMessage: Message = { role: "assistant", content: "D’accord, je reste silencieux." };
      setThreads((prev) => prev.map((thread) => thread.id === active.id ? { ...thread, messages: [...optimisticMessages, assistantMessage] } : thread));
      setLoading(false);
      return;
    }

    if (silenceMode && isResumeRequest(text)) {
      setSilenceMode(false);
      const assistantMessage: Message = { role: "assistant", content: "Je suis là. On reprend doucement." };
      setThreads((prev) => prev.map((thread) => thread.id === active.id ? { ...thread, messages: [...optimisticMessages, assistantMessage] } : thread));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: optimisticMessages.map(({ role, content }) => ({ role, content })),
          memory: memoryForRequest,
          userKnowledge,
          responseMode: "auto",
          profile: { name: profileName, goal: profileGoal, style: profileStyle },
          conversationSummary
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur serveur");
      const assistantMessage: Message = { role: "assistant", content: data.content, provider: data.provider, model: data.model, fallbackUsed: data.fallbackUsed, sourcesUsed: data.sourcesUsed };
      setThreads((prev) => prev.map((thread) => thread.id === active.id ? { ...thread, messages: [...optimisticMessages, assistantMessage] } : thread));
      refreshStatus();
    } catch (error: any) {
      const assistantMessage: Message = { role: "assistant", content: error?.message || "Je suis un peu ralenti là. Réessaie dans quelques secondes." };
      setThreads((prev) => prev.map((thread) => thread.id === active.id ? { ...thread, messages: [...optimisticMessages, assistantMessage] } : thread));
    } finally {
      setLoading(false);
    }
  }

  function regenerate() {
    if (!active?.messages.length || loading) return;
    const lastAssistantIndex = [...active.messages].map((m, i) => ({ m, i })).reverse().find((x) => x.m.role === "assistant")?.i;
    if (lastAssistantIndex === undefined) return;
    const beforeAssistant = active.messages.slice(0, lastAssistantIndex);
    const lastUser = [...beforeAssistant].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const beforeUser = beforeAssistant.slice(0, -1);
    setThreads((prev) => prev.map((t) => t.id === active.id ? { ...t, messages: beforeUser } : t));
    send(lastUser.content, beforeUser);
  }

  async function syncToCloud() {
    setCloud((c) => ({ ...c, busy: true, message: "Synchronisation en cours..." }));
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: cloud.workspaceId, threads, memory, knowledge, profile: { name: profileName, email: profileEmail } })
      });
      const data = await res.json();
      setCloud((c) => ({ ...c, enabled: !!data.enabled, lastSync: data.updatedAt || new Date().toISOString(), message: data.message || (data.ok ? "Synchronisé." : data.error || "Non synchronisé."), busy: false }));
    } catch (e: any) {
      setCloud((c) => ({ ...c, busy: false, message: e?.message || "Erreur de synchronisation." }));
    }
  }

  async function restoreFromCloud() {
    setCloud((c) => ({ ...c, busy: true, message: "Restauration en cours..." }));
    try {
      const res = await fetch(`/api/sync?workspaceId=${encodeURIComponent(cloud.workspaceId)}`);
      const data = await res.json();
      if (data?.data) {
        if (Array.isArray(data.data.threads)) setThreads(data.data.threads);
        if (Array.isArray(data.data.memory)) setMemory(data.data.memory);
        if (Array.isArray(data.data.knowledge)) setKnowledge(data.data.knowledge);
        if (data.data.profile?.name) setProfileName(data.data.profile.name);
        if (data.data.profile?.email) setProfileEmail(data.data.profile.email);
      }
      setCloud((c) => ({ ...c, enabled: !!data.enabled, lastSync: data.updatedAt, message: data.message || (data.data ? "Données restaurées." : "Aucune donnée cloud trouvée."), busy: false }));
    } catch (e: any) {
      setCloud((c) => ({ ...c, busy: false, message: e?.message || "Erreur de restauration." }));
    }
  }

  function exportEspace() {
    const blob = new Blob([
      JSON.stringify({ version: "47.0.0", threads, memory, knowledge, profile: { name: profileName, email: profileEmail }, exportedAt: new Date().toISOString() }, null, 2)
    ], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nimbrayai-workspace-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importEspaceFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (Array.isArray(data.threads)) setThreads(data.threads);
      if (Array.isArray(data.memory)) setMemory(data.memory);
      if (Array.isArray(data.knowledge)) setKnowledge(data.knowledge);
      if (data.profile?.name) setProfileName(data.profile.name);
      if (data.profile?.email) setProfileEmail(data.profile.email);
      setCloud((c) => ({ ...c, message: "Espace importé depuis JSON." }));
    } catch (error: any) {
      setCloud((c) => ({ ...c, message: error?.message || "Import impossible." }));
    }
  }

  function clearEspaceLocal() {
    if (!confirm("Supprimer les conversations, mémoires et sources locales de ce navigateur ?")) return;
    const fresh = createThread();
    setThreads([fresh]);
    setActiveId(fresh.id);
    setMemory([]);
    setKnowledge([]);
    setParseNotes([]);
  }

  async function submitFeedback() {
    const text = feedbackText.trim();
    if (!text) return;
    setFeedbackMessage("Envoi du feedback...");
    const payload = { workspaceId: cloud.workspaceId, profile: { name: profileName, email: profileEmail }, text, createdAt: new Date().toISOString(), context: { provider: status?.provider, model: status?.model } };
    try {
      const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      const local = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
      local.unshift(payload);
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(local.slice(0, 50)));
      setFeedbackMessage(data.message || "Feedback enregistré. Merci !");
      setFeedbackText("");
    } catch (e: any) {
      setFeedbackMessage(e?.message || "Feedback enregistré localement.");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const drawerTitle = drawer === "memory" ? "Mémoire" : drawer === "knowledge" ? "Sources & documents" : drawer === "brain" ? "Cerveau" : drawer === "workspace" ? "Espace" : drawer === "admin" ? "Admin" : drawer === "feedback" ? "Feedback" : drawer === "account" ? "Compte" : "NimbrayAI";
  const drawerSubtitle = drawer === "memory" ? "Ce que NimbrayAI garde en tête pour mieux t’aider." : drawer === "knowledge" ? "Tes sources alimentent le RAG local et les connaissances." : drawer === "brain" ? "Architecture du cerveau, packs et domaines couverts." : drawer === "workspace" ? "Sauvegarde locale, export, import et cloud optionnel." : drawer === "admin" ? "Diagnostic technique et commandes utiles." : drawer === "feedback" ? "Un retour rapide pour faire progresser NimbrayAI." : drawer === "account" ? "Préférences, style et informations de profil." : "Panneau latéral";

  return (
    <main className="shell v46-shell">
      {mobileSidebarOpen ? <button className="mobile-backdrop" aria-label="Fermer le menu" onClick={() => setMobileSidebarOpen(false)} /> : null}

      <aside className={`sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">N</div>
            <div>
              <div className="brand-name">NimbrayAI</div>
              <div className="brand-sub">Nimbray premium</div>
            </div>
          </div>

          <button className="new-chat-btn" onClick={newChat}>+ Nouvelle discussion</button>
          <div className="thread-search-wrap">
            <input className="thread-search" value={threadQuery} onChange={(e) => setThreadQuery(e.target.value)} placeholder="Rechercher une discussion" />
          </div>
        </div>

        <div className="sidebar-section-label">Discussions</div>
        <div className="thread-list">
          {filteredThreads.map((thread) => (
            <div key={thread.id} className={`thread-item ${thread.id === activeId ? "active" : ""}`}>
              <button className="thread-main" onClick={() => { setActiveId(thread.id); setMobileSidebarOpen(false); }}>
                <span className="thread-title">{thread.title}</span>
                <span className="thread-meta">{thread.messages.at(-1)?.content?.slice(0, 52) || "Vide"}</span>
              </button>
              <button className="thread-delete" onClick={() => deleteThread(thread.id)}>×</button>
            </div>
          ))}
          {!filteredThreads.length ? <div className="empty compact">Aucune discussion trouvée.</div> : null}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={() => setDrawer("memory")}>Mémoire <span>{memory.length}</span></button>
          <button className="sidebar-link" onClick={() => setDrawer("knowledge")}>Sources <span>{knowledge.length}</span></button>
          <button className="sidebar-link" onClick={() => setDrawer("brain")}>Cerveau</button>
          <button className="sidebar-link" onClick={() => setDrawer("workspace")}>Espace</button>
          <button className="sidebar-link" onClick={() => setDrawer("account")}>Compte</button>
          <button className="sidebar-link" onClick={() => setDrawer("feedback")}>Feedback</button>
          <button className="sidebar-link" onClick={() => setDrawer("admin")}>Admin</button>
          <div className="sidebar-footer-links">
            <Link href="/landing">Landing</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/platform">Platform</Link>
          </div>
          <div className="status-pill"><span className={status?.ollama?.available ? "status-dot" : "status-dot warn"} />{status?.ollama?.available ? "Local ready" : "Ready"}</div>
        </div>
      </aside>

      <section className="chat-panel">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(true)} aria-label="Ouvrir le menu">☰</button>
          <div className="topbar-title">
            <h1>{active?.title || "Nouvelle discussion"}</h1>
            <p>Intelligence, mémoire, sources et projets.</p>
          </div>
          <div className="topbar-actions">
            <button onClick={() => regenerate()} disabled={loading || !active?.messages.length}>Régénérer</button>
            <button onClick={() => setDrawer("workspace")}>Espace</button>
          </div>
        </header>

        <div className="messages-area">
          {!active?.messages.length ? (
            <div className="welcome clean-welcome">
              <div className="welcome-logo">N</div>
              <h2>Bonjour, que veux-tu demander à NimbrayAI&nbsp;?</h2>
              <p className="welcome-minimal-text">Une IA simple, humaine et utile.</p>
            </div>
          ) : (
            <div className="messages-list">
              {active.messages.map((message, index) => message.role === "user" ? (
                <div key={index} className="message-row user">
                  <div className="user-bubble">{message.content}</div>
                </div>
              ) : (
                <AssistantMessage key={index} message={message} isLatest={index === active.messages.length - 1 && !loading} />
              ))}
              {loading ? (
                <div className="message-row assistant">
                  <div className="assistant-block">
                    <div className="assistant-signature"><span className="signature-mark">N</span><span>NimbrayAI</span></div>
                    <div className="message-content thinking">NimbrayAI répond…</div>
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="composer-shell">
          <div className="composer-panel">
            <div className="composer">
              <label className="attach-btn" title="Ajouter des sources">
                <input type="file" multiple onChange={(e) => readFiles(e.target.files)} />
                ＋
              </label>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Écris ton message à NimbrayAI…"
              />
              <button className="send-btn" onClick={() => send()} disabled={!input.trim() || loading}>Envoyer</button>
            </div>
            <div className="composer-hint">Entrée pour envoyer · Shift + Entrée pour un saut de ligne</div>
          </div>
        </div>
      </section>

      {drawer ? (
        <div className="drawer-overlay" onClick={() => setDrawer(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3>{drawerTitle}</h3>
                <p>{drawerSubtitle}</p>
              </div>
              <button className="thread-delete" onClick={() => setDrawer(null)}>×</button>
            </div>

            {drawer === "memory" ? (
              <>
                <div className="memory-form">
                  <input value={memoryDraft} onChange={(e) => setMemoryDraft(e.target.value)} placeholder="Ex. J’aime les réponses simples et claires" />
                  <button onClick={addMemory}>Ajouter</button>
                </div>
                <div className="memory-list">
                  {memory.length ? memory.map((item) => (
                    <div key={item} className="memory-item">
                      <span>{item}</span>
                      <button onClick={() => removeMemory(item)}>Supprimer</button>
                    </div>
                  )) : <div className="empty">Aucune mémoire pour le moment.</div>}
                </div>
              </>
            ) : null}

            {drawer === "knowledge" ? (
              <>
                <label className="upload-zone">
                  <input type="file" multiple onChange={(e) => readFiles(e.target.files)} />
                  <strong>Ajouter des sources</strong>
                  <span>TXT, MD, CSV, JSON, code, PDF, DOCX</span>
                </label>
                <div className="source-grid-note">Le cerveau V46 regroupe les connaissances en pôles : comportement, savoir stable, action, sécurité, documents et mémoire.</div>
                {parseNotes.length ? (
                  <div className="parse-notes">
                    {parseNotes.map((note, i) => (
                      <div key={`${note.name}-${i}`} className={note.ok ? "parse-note ok" : "parse-note warn"}>
                        <strong>{note.name}</strong>
                        <span>{note.message}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="memory-list">
                  {knowledge.length ? knowledge.map((item) => (
                    <div key={item.id} className="memory-item">
                      <span><strong>{item.name}</strong><br />{Math.round(item.size / 1024)} Ko</span>
                      <button onClick={() => setKnowledge((p) => p.filter((k) => k.id !== item.id))}>Supprimer</button>
                    </div>
                  )) : <div className="empty">Aucune source locale.</div>}
                </div>
              </>
            ) : null}

            {drawer === "brain" ? (
              <div className="settings-box">
                <div className="admin-card"><strong>Behavior Brain</strong><span>Empathie, humour, micro-dialogues, désescalade, soutien émotionnel et réponses plus chaleureuses.</span></div>
                <div className="admin-card"><strong>Stable Knowledge Brain</strong><span>Science, culture, sport, langues, histoire, droit général, santé prudente, cuisine et savoirs durables.</span></div>
                <div className="admin-card"><strong>Action Brain</strong><span>Coaching, organisation, décisions, projets, productivité, apprentissage et passage à l’action.</span></div>
                <div className="admin-card"><strong>Safety Brain</strong><span>Violence, suicide, illégal, détresse, autodommage, cybersécurité offensive : réponses cadrées et utiles.</span></div>
                <div className="admin-card"><strong>Document & Memory Brain</strong><span>Documents utilisateur, RAG local, mémoire personnelle et préférences durables.</span></div>
              </div>
            ) : null}

            {drawer === "account" ? (
              <div className="settings-box">
                <label className="field-label">Nom</label>
                <input className="cloud-input" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Dylan" />
                <label className="field-label">Email</label>
                <input className="cloud-input" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="email@exemple.com" />
                <label className="field-label">Objectif principal</label>
                <input className="cloud-input" value={profileGoal} onChange={(e) => setProfileGoal(e.target.value)} placeholder="Développer NimbrayAI, apprendre, créer, progresser…" />
                <label className="field-label">Style préféré</label>
                <input className="cloud-input" value={profileStyle} onChange={(e) => setProfileStyle(e.target.value)} placeholder="Simple, chaleureux, direct, détaillé, professionnel…" />
                <div className="cloud-actions">
                  <button className="new-chat-btn" onClick={summarizeActiveConversation}>Résumer la discussion</button>
                  <button className="new-chat-btn ghost" onClick={exportMemoryProfile}>Exporter mémoire</button>
                </div>
                <label className="field-label">Résumé durable</label>
                <textarea className="cloud-input" value={conversationSummary} onChange={(e) => setConversationSummary(e.target.value)} rows={6} placeholder="Préférences, décisions et contexte à retenir…" />
              </div>
            ) : null}

            {drawer === "feedback" ? (
              <div className="settings-box">
                <textarea className="feedback-input" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Ce qui fonctionne, ce qu’il faut améliorer, une idée de design, une faille à corriger…" />
                <div className="cloud-actions"><button className="new-chat-btn" onClick={submitFeedback}>Envoyer feedback</button></div>
                <p className="cloud-note">{feedbackMessage || "Ton retour aide à améliorer NimbrayAI."}</p>
              </div>
            ) : null}

            {drawer === "workspace" ? (
              <div className="settings-box">
                <label className="field-label">Espace ID</label>
                <input className="cloud-input" value={cloud.workspaceId} onChange={(e) => { setCloud((c) => ({ ...c, workspaceId: e.target.value })); localStorage.setItem(WORKSPACE_KEY, e.target.value); }} />
                <div className="cloud-actions">
                  <button className="new-chat-btn" onClick={syncToCloud} disabled={cloud.busy}>Sauvegarder côté serveur</button>
                  <button className="new-chat-btn ghost" onClick={restoreFromCloud} disabled={cloud.busy}>Restaurer</button>
                  <button className="new-chat-btn ghost" onClick={exportEspace}>Exporter JSON</button>
                  <label className="new-chat-btn ghost import-label"><input type="file" accept="application/json" onChange={(e) => importEspaceFile(e.target.files)} />Importer JSON</label>
                </div>
                <p className="cloud-note">{cloud.message || "Tout reste local par défaut. Active Supabase dans .env.local pour la synchronisation serveur."}</p>
                <p className="cloud-note">Dernière sync : {cloud.lastSync || "aucune"}</p>
              </div>
            ) : null}

            {drawer === "admin" ? (
              <div className="settings-box">
                <div className="admin-card">
                  <strong>Diagnostic</strong>
                  <span>Provider : {status?.provider || "inconnu"}</span>
                  <span>Modèle : {status?.model || "inconnu"}</span>
                  <span>Ollama : {status?.ollama?.available ? "disponible" : "indisponible"}</span>
                  <span>Modèles installés : {status?.ollama?.models?.length || 0}</span>
                  <span>Sources locales : {knowledge.length}</span>
                  <span>Mémoires : {memory.length}</span>
                  <span>Conversations : {threads.length}</span>
                </div>
                <div className="admin-card">
                  <strong>Commandes utiles</strong>
                  <code>ollama list</code>
                  <code>ollama pull qwen2.5:3b</code>
                  <code>npm.cmd run dev</code>
                </div>
                <div className="cloud-actions">
                  <button className="new-chat-btn" onClick={refreshStatus}>Relancer diagnostic</button>
                  <button className="new-chat-btn ghost" onClick={exportEspace}>Exporter workspace</button>
                  <button className="new-chat-btn danger" onClick={clearEspaceLocal}>Réinitialiser local</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
