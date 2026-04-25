export type ResponseMode = "auto" | "short" | "detailed" | "expert" | "creative" | "technical" | "sources";
export type ConversationIntent =
  | "chat"
  | "practical"
  | "writing"
  | "code"
  | "business"
  | "research"
  | "document"
  | "learning"
  | "creative"
  | "health"
  | "legal"
  | "finance"
  | "travel"
  | "history"
  | "geography"
  | "culture"
  | "sport"
  | "psychology"
  | "environment"
  | "work"
  | "admin";

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectConversationIntent(text: string): ConversationIntent {
  const q = normalize(text);
  if (/^(salut|bonjour|hello|hey|coucou|merci|ok|oui|non|ca va|comment ca va|comment tu vas)\b/.test(q)) return "chat";
  if (/\b(code|bug|erreur|typescript|javascript|react|next|python|api|npm|sql|css|html|debug|terminal|powershell|fonction|composant|repository|git)\b/.test(q)) return "code";
  if (/\b(pdf|document|resume|resumer|analyse|analyser|contrat|rapport|fichier|csv|source|sources|connaissance|upload|docx|markdown)\b/.test(q)) return "document";
  if (/\b(recherche|source|sources|citation|cite|preuve|verifie|actualite|definition|qui est|qu est ce que|papier|article|science|pubmed|arxiv|wikidata|bibliographie|donnees|open data)\b/.test(q)) return "research";
  if (/\b(sante|medical|medecin|symptome|traitement|maladie|douleur|nutrition|sport|bien etre)\b/.test(q)) return "health";
  if (/\b(droit|legal|juridique|contrat|clause|rgpd|cgv|statut|loi|obligation)\b/.test(q)) return "legal";
  if (/\b(finance|budget|argent|investissement|rentabilite|prix|cout|marge|revenu|tresorerie|business model)\b/.test(q)) return "finance";
  if (/\b(voyage|itineraire|hotel|vol|destination|week end|vacances|planning voyage)\b/.test(q)) return "travel";
  if (/\b(histoire|guerre|revolution|empire|napoleon|moyen age|antiquite|roi|reine)\b/.test(q)) return "history";
  if (/\b(geographie|pays|capitale|continent|ville|fleuve|montagne|ocean|population|frontiere)\b/.test(q)) return "geography";
  if (/\b(culture|film|serie|livre|musique|art|philosophie|mythologie|cinema|media)\b/.test(q)) return "culture";
  if (/\b(sport|entrainement|musculation|course|football|basket|forme|recuperation)\b/.test(q)) return "sport";
  if (/\b(psychologie|motivation|confiance|emotion|relation|communication|anxiete|peur|stress)\b/.test(q)) return "psychology";
  if (/\b(climat|ecologie|environnement|pollution|energie|biodiversite|durable|rechauffement)\b/.test(q)) return "environment";
  if (/\b(cv|emploi|travail|entretien|recrutement|carriere|lettre de motivation|salaire)\b/.test(q)) return "work";
  if (/\b(administration|demarche|papier|caf|impot|prefecture|mairie|assurance|securite sociale)\b/.test(q)) return "admin";
  if (/\b(business|strategie|vente|client|marketing|offre|landing page|startup|entreprise|saas|monetisation|marque|prospection)\b/.test(q)) return "business";
  if (/\b(ecris|redige|mail|email|message|lettre|post|script|article|texte|reformule|copywriting)\b/.test(q)) return "writing";
  if (/\b(cree|creer|idee|brainstorm|slogan|nom|concept|design|visuel|storytelling|contenu|campagne|video)\b/.test(q)) return "creative";
  if (/\b(explique|apprends|cours|exercice|comprendre|resume moi|notion|definition|etudier|revision)\b/.test(q)) return "learning";
  if (/\b(recette|cuisine|plat|repas|jambon|ingredients|organise|liste|planning|routine|tableau|checklist|procedure|etapes|planning)\b/.test(q)) return "practical";
  return q.length < 80 ? "chat" : "practical";
}

export function inferResponseMode(text: string, explicit?: ResponseMode): ResponseMode {
  if (explicit && explicit !== "auto") return explicit;
  const q = normalize(text);
  if (/\b(source|sources|citation|cite|preuves|reference|references|verifie|fiable|bibliographie)\b/.test(q)) return "sources";
  if (/\b(expert|avance|avancee|rigoureux|pro|professionnel|niveau expert|analyse profonde)\b/.test(q)) return "expert";
  if (/\b(technique|implementation|architecture|code detaille|debug detaille)\b/.test(q)) return "technical";
  if (/\b(creatif|creative|original|viral|storytelling|accrocheur|idee originale)\b/.test(q)) return "creative";
  if (/\b(detaille|detaillé|complet|approfondi|long|explique en detail)\b/.test(q)) return "detailed";
  if (/\b(court|rapide|bref|resume|en une phrase|simplement|synthetique)\b/.test(q)) return "short";
  return "auto";
}

export function conversationGuidance(intent: ConversationIntent, mode: ResponseMode) {
  const base = [
    "Réponds directement à la demande, sans annoncer que tu as compris.",
    "Adapte automatiquement la longueur : court pour une question simple, détaillé pour une tâche complexe.",
    "N’affiche jamais le contexte interne brut.",
    "Évite les phrases génériques si tu peux produire un résultat utile.",
    "Ne demande pas de précision si tu peux produire une première version raisonnable.",
    "Utilise les sources seulement pour améliorer la réponse finale.",
    "Si les sources sont faibles ou absentes, indique-le simplement sans bloquer.",
  ];

  if (mode === "short") base.push("Réponse courte, claire, directement exploitable. Maximum quelques paragraphes.");
  if (mode === "detailed") base.push("Réponse complète, structurée, avec étapes, exemples et prochaines actions si utile.");
  if (mode === "expert") base.push("Réponse de niveau expert : précise, rigoureuse, avec nuances, risques, hypothèses et recommandation.");
  if (mode === "creative") base.push("Réponse créative : propose plusieurs angles, formulations, idées ou variations exploitables.");
  if (mode === "technical") base.push("Réponse technique : sois précis, opérationnel, avec commandes, fichiers ou étapes quand pertinent.");
  if (mode === "sources") base.push("Appuie-toi sur les sources disponibles et termine par une section concise 'Sources utilisées' si des sources sont fournies.");

  const byIntent: Record<ConversationIntent, string> = {
    chat: "Conversation naturelle, chaleureuse, brève.",
    practical: "Réponse pratique immédiate avec étapes simples, recette, liste ou plan utile.",
    writing: "Produis directement une version rédigée prête à utiliser.",
    code: "Sois précis, technique, avec correctif ou étapes de debug.",
    business: "Réponse orientée action, décision, offre, stratégie ou plan concret.",
    research: "Réponse factuelle, prudente, sourcée quand possible, sans surcharger.",
    document: "Réponse d’analyse : points clés, résumé, actions, limites.",
    learning: "Explique simplement, puis approfondis seulement si utile.",
    creative: "Propose des idées concrètes, originales, faciles à exploiter.",
    health: "Information générale uniquement, prudente, avec recommandation de consulter un professionnel pour les décisions importantes.",
    legal: "Information générale uniquement, prudente, sans se présenter comme avis juridique définitif.",
    finance: "Information générale et prudente, distingue conseils éducatifs et décision financière.",
    travel: "Réponse organisée, pratique, avec options, budget approximatif et limites si données absentes.",
    history: "Réponse historique claire : contexte, acteurs, causes, conséquences, dates seulement si fiables.",
    geography: "Réponse géographique pratique : localisation, caractéristiques, comparaison ou itinéraire si utile.",
    culture: "Réponse culturelle vivante : explique clairement sans pédanterie.",
    sport: "Réponse sport générale et prudente : conseils pratiques, sécurité, progression.",
    psychology: "Réponse rassurante et non jugeante, sans se substituer à un professionnel.",
    environment: "Réponse factuelle et équilibrée, avec actions réalistes si utile.",
    work: "Réponse orientée carrière : modèle prêt à adapter, conseils simples et professionnels.",
    admin: "Réponse administrative pratique : checklist, étapes, prudence avec sites officiels.",
  };

  return [...base, byIntent[intent]].join("\n- ");
}
