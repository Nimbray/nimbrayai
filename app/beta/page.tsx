import Link from "next/link";

export default function BetaPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <div className="brand"><div className="brand-mark">N</div><div><div className="brand-name">NimbrayAI</div><div className="brand-sub">Accès bêta</div></div></div>
        <Link className="landing-cta small" href="/">Ouvrir l’app</Link>
      </nav>
      <section className="hero compact-hero">
        <div className="hero-badge">Beta Public Release</div>
        <h1>Rejoindre la bêta NimbrayAI</h1>
        <p>Cette version est pensée pour tester NimbrayAI avec de vrais utilisateurs, tout en gardant un mode local gratuit. Supabase et l’authentification sont préparés, mais restent optionnels.</p>
        <div className="feature-grid beta-grid">
          <div><h3>1. Tester en local</h3><p>Lance l’app sans payer, avec le mode demo ou Ollama.</p></div>
          <div><h3>2. Activer le cloud</h3><p>Connecte Supabase Free quand tu veux sauvegarder les données serveur.</p></div>
          <div><h3>3. Inviter des testeurs</h3><p>Distribue un code bêta ou demande un feedback via le panneau intégré.</p></div>
        </div>
        <div className="hero-actions"><Link className="landing-cta" href="/">Commencer</Link><Link className="landing-secondary" href="/privacy">Confidentialité</Link></div>
      </section>
    </main>
  );
}
