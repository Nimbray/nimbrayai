export default function PlatformPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <div className="nav-brand">NimbrayAI</div>
        <div className="nav-links">
          <a href="/">Chat</a>
          <a href="/admin">Admin</a>
          <a className="primary" href="/projects">Projets</a>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-badge">Intelligence, Sources, Memory & Projects</div>
        <h1>Une plateforme plus intelligente, plus personnelle et mieux organisée.</h1>
        <p>
          V70 rapproche NimbrayAI d’une vraie plateforme : routeur d’intelligence, mémoire, sources, projets, Super Brain et continuité conversationnelle.
        </p>
        <div className="hero-actions">
          <a className="primary" href="/">Ouvrir NimbrayAI</a>
          <a href="/account">Compte bêta</a>
        </div>
      </section>
      <section className="feature-grid">
        <article className="feature-card"><h3>Stable</h3><p>Moins d’erreurs visibles, moins d’appels Groq inutiles, meilleurs fallbacks.</p></article>
        <article className="feature-card"><h3>Humain</h3><p>Compass, sécurité, émotion, identité, insultes et vulgarité mieux traitées.</p></article>
        <article className="feature-card"><h3>Plateforme</h3><p>Comptes, documents, projets, feedback et admin prêts à évoluer.</p></article>
      </section>
    </main>
  );
}
