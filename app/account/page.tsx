export default function AccountPage() {
  return (
    <main className="legal-page">
      <section className="legal-card">
        <h1>Compte bêta NimbrayAI</h1>
        <p>
          La V45 prépare le passage au compte utilisateur. En mode local, tu peux continuer sans compte.
          En mode cloud, Supabase Auth pourra sauvegarder conversations, mémoire, sources et projets.
        </p>
        <h2>Mode invité</h2>
        <p>Idéal pour tester gratuitement : stockage local, pas de configuration obligatoire, pas de paiement.</p>
        <h2>Mode connecté</h2>
        <p>À activer plus tard avec Supabase : compte personnel, mémoire cloud, conversations multi-appareils.</p>
        <p className="legal-note"><a href="/">Retour au chat</a> · <a href="/platform">Voir la plateforme</a></p>
      </section>
    </main>
  );
}
