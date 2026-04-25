import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="landing-page legal-page">
      <nav className="landing-nav"><div className="brand"><div className="brand-mark">N</div><div><div className="brand-name">NimbrayAI</div><div className="brand-sub">Confidentialité bêta</div></div></div><Link className="landing-cta small" href="/">Retour</Link></nav>
      <section className="legal-card">
        <h1>Confidentialité — version bêta</h1>
        <p>NimbrayAI Beta fonctionne d’abord en local. Les conversations, mémoires et sources restent dans le navigateur tant que la sauvegarde serveur n’est pas activée.</p>
        <h2>Mode local</h2><p>Les données sont stockées dans le navigateur de l’utilisateur via localStorage.</p>
        <h2>Mode cloud optionnel</h2><p>Si Supabase est configuré, certaines données peuvent être sauvegardées côté serveur : workspace, conversations, mémoire, sources et feedback.</p>
        <h2>IA</h2><p>En mode Ollama, les messages sont envoyés au serveur local Ollama configuré. En mode demo, aucune IA externe payante n’est utilisée.</p>
        <p className="legal-note">Ce texte est un modèle de bêta, à faire relire avant un lancement public commercial.</p>
      </section>
    </main>
  );
}
