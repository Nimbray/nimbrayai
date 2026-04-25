import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="landing-page legal-page">
      <nav className="landing-nav"><div className="brand"><div className="brand-mark">N</div><div><div className="brand-name">NimbrayAI</div><div className="brand-sub">Conditions bêta</div></div></div><Link className="landing-cta small" href="/">Retour</Link></nav>
      <section className="legal-card">
        <h1>Conditions d’utilisation — bêta</h1>
        <p>NimbrayAI Beta est une version de test. Les réponses peuvent contenir des erreurs et doivent être vérifiées avant usage important.</p>
        <h2>Usage autorisé</h2><p>Utilise NimbrayAI pour tester, rédiger, apprendre, analyser et organiser ton travail.</p>
        <h2>Limites</h2><p>Ne l’utilise pas comme source unique pour des décisions médicales, juridiques, financières ou critiques.</p>
        <h2>Feedback</h2><p>Les retours envoyés via le panneau feedback peuvent être utilisés pour améliorer le produit.</p>
      </section>
    </main>
  );
}
