import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <div className="brand"><div className="brand-mark">N</div><div><div className="brand-name">NimbrayAI</div><div className="brand-sub">Assistant IA bêta, clair, open source-ready et cloud-ready</div></div></div>
        <Link className="landing-cta small" href="/">Ouvrir l’app</Link>
      </nav>
      <section className="hero">
        <div className="hero-badge">NimbrayAI Beta</div>
        <h1>NimbrayAI entre en bêta publique.</h1>
        <p>Une base produit plus sérieuse : interface premium, mémoire, sources, documents, Ollama, feedback bêta, workspace cloud-ready et préparation Supabase pour accueillir de vrais testeurs.</p>
        <div className="hero-actions">
          <Link className="landing-cta" href="/">Tester NimbrayAI</Link>
          <a className="landing-secondary" href="#features">Voir les fonctions</a>
        </div>
      </section>
      <section id="features" className="feature-grid">
        <div><h3>Interface propre</h3><p>Conversation simple : utilisateur à droite, NimbrayAI à gauche sans bulle.</p></div>
        <div><h3>IA adaptative</h3><p>NimbrayAI choisit seul le niveau de réponse : court, détaillé, technique ou sourcé quand c’est utile.</p></div>
        <div><h3>RAG local</h3><p>Ajoute des fichiers texte, Markdown, CSV, JSON ou code pour enrichir les réponses.</p></div>
        <div><h3>Sources gratuites</h3><p>Wikipédia, Wikidata, OpenLibrary, arXiv, Crossref, PubMed, StackOverflow et docs officielles.</p></div>
        <div><h3>Ollama</h3><p>Utilise des modèles open source locaux avec fallback automatique si un modèle manque.</p></div>
        <div><h3>Beta Public</h3><p>Feedback bêta, workspace cloud-ready, export/import et préparation comptes utilisateurs.</p></div>
      </section>
    </main>
  );
}
