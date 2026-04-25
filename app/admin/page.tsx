export default async function AdminPage() {
  return (
    <main className="legal-page">
      <section className="legal-card">
        <h1>Admin bêta V70</h1>
        <p>
          Ce tableau de bord léger sert à vérifier la base Intelligence Platform : IA, cloud,
          feedback, projets, sources, sécurité et état général.
        </p>
        <div className="feature-grid" style={{padding: 0, margin: "24px 0", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))"}}>
          <article className="feature-card"><h3>IA</h3><p>Vérifie le provider actif : Groq public, Ollama local, OpenRouter ou démo de secours.</p></article>
          <article className="feature-card"><h3>Cloud</h3><p>Active Supabase progressivement quand les variables d’environnement sont prêtes.</p></article>
          <article className="feature-card"><h3>Feedback</h3><p>Centralise les retours bêta pour préparer les prochains correctifs publics.</p></article>
        </div>
        <p className="legal-note"><a href="/api/platform/status">Voir le diagnostic JSON</a> · <a href="/">Retour au chat</a></p>
      </section>
    </main>
  );
}
