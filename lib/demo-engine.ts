import type { ConversationIntent, ResponseMode } from "./conversation-engine";
import { assessSafety } from "./safety-router";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type Mood = "neutral" | "happy" | "thanks" | "frustrated" | "doubt" | "laugh" | "approval" | "continue" | "disagree";

function lower(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function compact(text: string) {
  return lower(text).replace(/[^a-z0-9\s?!.]/g, " ").replace(/\s+/g, " ").trim();
}
function has(text: string, pattern: RegExp) { return pattern.test(lower(text)); }
function memoryNote(memory: string[]) { return memory.length ? `\n\nJe garde en tête : ${memory.slice(0, 2).join(" ; ")}.` : ""; }
function recentAssistant(messages: ChatMessage[]) { return [...messages].reverse().find((m) => m.role === "assistant")?.content || ""; }
function demoLimitNote() { return "\n\nNote : je suis en mode démo public. Je peux déjà répondre à beaucoup de demandes courantes, mais Groq sur Vercel ou Ollama en local me rendront beaucoup plus puissant."; }

function detectMood(text: string): Mood {
  const t = compact(text);
  if (/^(ok|okay|d accord|dac|parfait|go|on y va|vas y|allez|nickel|super|top|grave|bien vu|pas mal|cool|genial|excellent)[!.]*$/.test(t)) return "approval";
  if (/^(merci|merci beaucoup|thanks|thx|cimer)[!.]*$/.test(t)) return "thanks";
  if (/^(haha|mdr|lol|ptdr|ahah)/i.test(t)) return "laugh";
  if (/^(non|pas vraiment|pas d accord|c est faux|faux|non c est pas ca|tu te trompes)/i.test(t)) return "disagree";
  if (/(continue|vas y continue|poursuis|developpe|encore|suite|continue comme ca)/i.test(t)) return "continue";
  if (/(nul|bof|pas ouf|ca marche pas|bug|ennuyant|mauvais|pas compris|tu comprends rien|c est pas bon)/i.test(t)) return "frustrated";
  if (/(je sais pas|pas sur|peut etre|j hesite|j'hésite|je doute)/i.test(t)) return "doubt";
  if (/(super|genial|incroyable|j adore|bravo|parfait|top)/i.test(t)) return "happy";
  return "neutral";
}

const checks = {
  recipe: (x: string) => has(x, /(recette|cuisine|plat|repas|manger|ingredient|jambon|pates|omelette|gratin|poulet|riz|dessert|gateau|crepe|pizza|salade|sauce|four)/i),
  email: (x: string) => has(x, /(mail|email|e-mail|message professionnel|reponse client|courrier|lettre|relance|candidature|excuse)/i),
  business: (x: string) => has(x, /(business|marque|offre|client|vente|marketing|landing page|startup|entreprise|produit|saas|monetisation|strategie|lancement|prix|tarif)/i),
  code: (x: string) => has(x, /(code|bug|erreur|typescript|javascript|react|next|python|api|npm|terminal|powershell|fonction|html|css|git|vercel)/i),
  nimbray: (x: string) => has(x, /(nimbray|nimbrayai|assistant ia|mettre en ligne|open source|ollama|rag|source|vercel|supabase|groq)/i),
  science: (x: string) => has(x, /(science|pourquoi|explique|definition|comment).*(ciel|lumiere|soleil|lune|pluie|orage|arc en ciel|eau|air|terre|gravite|atome|electricite|mer|nuage|vent|feu|glace|sang|coeur|cerveau|volcan|espace|planete)/i),
  history: (x: string) => has(x, /(histoire|guerre|revolution|empire|roi|reine|napoleon|moyen age|antiquite|date historique)/i),
  geography: (x: string) => has(x, /(geographie|pays|capitale|continent|ville|fleuve|montagne|ocean|population|frontiere)/i),
  health: (x: string) => has(x, /(sante|medical|medecin|symptome|douleur|maladie|traitement|nutrition|sommeil|stress|sport|bien etre)/i),
  legal: (x: string) => has(x, /(droit|legal|juridique|contrat|loi|clause|rgpd|cgv|statut|obligation|plainte)/i),
  finance: (x: string) => has(x, /(finance|budget|argent|epargne|investissement|impot|revenu|marge|prix|cout|tresorerie|economies)/i),
  travel: (x: string) => has(x, /(voyage|vacances|itineraire|destination|hotel|vol|week end|restaurant|visiter|tourisme)/i),
  education: (x: string) => has(x, /(exercice|cours|apprendre|revision|devoir|etudier|methode|dissertation|fiche|examen)/i),
  work: (x: string) => has(x, /(cv|emploi|travail|entretien|recrutement|lettre de motivation|manager|carriere|salaire)/i),
  psychology: (x: string) => has(x, /(psychologie|motivation|confiance|peur|anxiete|anxiété|relation|communication|emotion|émotion)/i),
  environment: (x: string) => has(x, /(climat|ecologie|environnement|pollution|energie|rechauffement|biodiversite|durable)/i),
  media: (x: string) => has(x, /(film|serie|musique|livre|jeu video|media|youtube|tiktok|instagram|podcast)/i),
  admin: (x: string) => has(x, /(administration|papier|demarche|caf|impot|prefecture|mairie|securite sociale|assurance)/i),
  ideas: (x: string) => has(x, /(idee|idees|inspiration|concept|nom de marque|slogan|trouve moi|brainstorm)/i),
  plan: (x: string) => has(x, /(plan|planning|organise|organiser|etapes|roadmap|programme|calendrier|checklist)/i),
  joke: (x: string) => has(x, /(blague|fais moi rire|rire|humour|drole)/i),
  encouragement: (x: string) => has(x, /(je suis perdu|je galere|j y arrive pas|je bloque|dur|fatigue|decourage|stress)/i),
  opinion: (x: string) => has(x, /(tu en penses quoi|ton avis|qu en penses tu|c est bien|bonne idee|bonne idée)/i),
  identity: (x: string) => has(x, /(qui es tu|presente toi|c est quoi nimbray|qu est ce que nimbray|tu es qui|tu t appelles comment)/i),
  limits: (x: string) => has(x, /(que ne sais tu pas faire|que ne peux tu pas faire|tes limites|limites|tu peux faire quoi|que peux tu faire)/i),
  summary: (x: string) => has(x, /(resume|synthese|points cles|analyse ce texte|analyse|resumer)/i),
};

function answerReaction(mood: Mood, messages: ChatMessage[], memory: string[]) {
  const lastAssistant = recentAssistant(messages);
  const mem = memoryNote(memory);
  if (mood === "approval") return `Merci ! Content que ça te parle. On continue comme ça, ou je peux ajuster le style : plus simple, plus complet, plus direct ou un peu plus fun.${mem}`;
  if (mood === "thanks") return `Avec plaisir 😊`;
  if (mood === "laugh") return `Haha, parfait 😄 On garde cette énergie. Tu veux qu’on continue là-dessus ?`;
  if (mood === "continue") return lastAssistant.length > 20
    ? `Oui, je continue.\n\nLa suite logique, c’est de transformer l’idée en quelque chose de concret : un plan, un texte, une correction ou une décision claire. Je poursuis dans le même esprit.`
    : `Bien sûr, je continue. Donne-moi juste le sujet, et je prends la suite.`;
  if (mood === "frustrated") return `Tu as raison de le signaler. On reprend calmement : dis-moi ce qui ne va pas exactement, et je corrige sans blabla inutile.`;
  if (mood === "disagree") return `Bien vu, merci de me le dire. Je peux corriger : donne-moi le point faux ou ce que tu veux changer, et je reformule proprement.`;
  if (mood === "doubt") return `Pas grave. On peut partir d’une version simple, puis l’améliorer. Donne-moi juste ton hésitation principale, et on la démêle ensemble.`;
  if (mood === "happy") return `Yes ! Ça fait plaisir 😄 On continue et on rend ça encore meilleur.`;
  return "D’accord. Dis-moi ce que tu veux faire ensuite.";
}

function skyBlue() { return `Le ciel est bleu à cause de la **diffusion de Rayleigh**.\n\nLa lumière du Soleil contient plusieurs couleurs. Quand elle traverse l’atmosphère, les petites molécules d’air diffusent davantage les courtes longueurs d’onde, comme le bleu. Cette lumière bleue est envoyée dans toutes les directions, donc quand on regarde le ciel, on voit surtout du bleu.\n\nAu coucher du soleil, la lumière traverse plus d’atmosphère : le bleu est déjà beaucoup dispersé, et il reste davantage de rouge, d’orange et de rose. La nature sort son filtre “golden hour”, mais en version physique.`; }
function identity() { return `Je suis **NimbrayAI**, un assistant IA en bêta publique. Mon rôle : t’aider à comprendre, écrire, créer, organiser, coder, apprendre, décider et avancer.\n\nJe dois être clair, utile, joyeux et agréable à utiliser — plutôt copilote malin que robot coincé dans un tableur.`; }
function limits() { return `Je peux aider sur beaucoup de sujets : explications, écriture, idées, code, organisation, business, documents, cuisine, culture générale, productivité, etc.\n\nMes limites :\n- je peux me tromper, surtout sur les infos récentes ;\n- en mode démo public, je suis moins puissant qu’avec Groq ou Ollama ;\n- je ne remplace pas un médecin, avocat, expert financier ou professionnel qualifié ;\n- je ne dois pas inventer quand je ne sais pas.\n\nLa bonne méthode : pose ta question naturellement. Si je peux répondre, je réponds. Si je dois être prudent, je te le dis.`; }
function recipe(mode: ResponseMode) { return mode === "short" ? `Idée rapide : **croque-monsieur au jambon**. Pain de mie, jambon, fromage, un peu de crème ou beurre. Assemble, gratine 10 à 12 min à 180°C. Simple, efficace, validé par le frigo.` : `Voici une recette simple avec du jambon :\n\n**Gratin de pâtes au jambon**\n\n**Ingrédients**\n- 250 g de pâtes\n- 3 ou 4 tranches de jambon\n- 20 cl de crème fraîche\n- 100 g de fromage râpé\n- Sel, poivre\n- Un peu de beurre\n\n**Préparation**\n1. Fais cuire les pâtes.\n2. Coupe le jambon en morceaux.\n3. Mélange pâtes, crème, jambon, sel et poivre.\n4. Mets dans un plat beurré.\n5. Ajoute le fromage râpé.\n6. Enfourne 15 à 20 min à 180°C.\n\nOption sympa : ajoute une cuillère de moutarde ou quelques champignons. Ça transforme le plat “vite fait” en “pas mal du tout”.`; }
function email() { return `Voici un modèle simple :\n\n**Objet : Suite à votre demande**\n\nBonjour,\n\nMerci pour votre message.\n\nJe reviens vers vous concernant votre demande. Voici les éléments importants :\n\n- [point important 1]\n- [point important 2]\n- [prochaine étape]\n\nJe reste disponible si vous souhaitez plus de précisions.\n\nCordialement,\n[Votre nom]\n\nDonne-moi le contexte exact, et je te le rends plus naturel, plus ferme, plus commercial ou plus chaleureux.`; }
function business() { return `Approche simple :\n\n1. **Promesse** : quel problème tu résous, pour qui, avec quel résultat ?\n2. **Offre** : “J’aide [cible] à obtenir [résultat] grâce à [solution].”\n3. **Preuve** : exemple, démo, témoignage ou résultat mesurable.\n4. **Page test** : titre clair, bénéfice, bouton d’action.\n5. **Test terrain** : montre l’idée à 5-10 personnes.\n\nSi tu me donnes ton idée, je peux te créer une offre et une mini landing page. On évite le business plan de 90 pages qui finit dans “à relire un jour”.`; }
function code() { return `Oui. Colle-moi le code ou l’erreur exacte, et je te propose une correction claire.\n\nPour aller vite, envoie :\n- le message d’erreur complet ;\n- le fichier concerné ;\n- ce que tu voulais obtenir ;\n- ce que tu obtiens à la place.\n\nLes bugs “ça marchait hier”, on connaît. On va le remettre d’équerre.`; }
function nimbray() { return `NimbrayAI est une bêta d’assistant IA pensée pour être simple, mobile-first et évolutive.\n\nLa version publique peut fonctionner en mode démo, mais sa vraie puissance vient quand on branche **Groq** sur Vercel ou **Ollama** en local.\n\nPriorités :\n- dialogue naturel ;\n- mobile excellent ;\n- réponses utiles ;\n- sources propres ;\n- bêta publique stable.`; }
function joke() { return `Petite blague rapide :\n\nPourquoi les développeurs confondent Halloween et Noël ?\nParce que **Oct 31 = Dec 25**.\n\nOui, c’est très geek. Je plaide coupable.`; }
function encourage() { return `On respire. Tu n’as pas besoin de tout résoudre d’un coup.\n\nDonne-moi le problème en une phrase, même brouillon. Je vais t’aider à le découper, trouver la première étape, puis avancer proprement.\n\nUn gros problème, c’est souvent juste une pile de petits problèmes qui ont mis un trench-coat.`; }
function opinion() { return `Je peux te donner un avis honnête.\n\nJe regarde trois choses :\n- est-ce utile ?\n- est-ce simple à comprendre ?\n- est-ce faisable maintenant ?\n\nDonne-moi l’idée exacte, et je te réponds avec points forts, risques et amélioration possible.`; }
function simpleScience() { return `Je peux te l’expliquer simplement : en science, on cherche souvent la cause principale, puis on ajoute les nuances.\n\nDonne-moi le phénomène exact, et je te fais une explication claire, sans jargon inutile. La blouse blanche reste au vestiaire sauf urgence.`; }
function history() { return `Je peux t’aider en histoire avec une explication claire : contexte, dates importantes, acteurs, causes, conséquences.\n\nDonne-moi le sujet exact, et je te fais soit une version courte, soit une fiche structurée.`; }
function geography() { return `Je peux t’aider en géographie : pays, capitales, cartes mentales, climat, population, ressources, villes, itinéraires ou comparaison de lieux.\n\nDonne-moi le lieu ou le thème, et je te prépare une réponse claire.`; }
function health() { return `Je peux donner des informations générales de santé, mais je ne remplace pas un médecin.\n\nSi c’est un symptôme inquiétant, une douleur forte, un problème respiratoire, neurologique ou urgent, il faut contacter un professionnel.\n\nPour une question générale, donne-moi le contexte et je t’explique simplement, avec prudence.`; }
function legal() { return `Je peux t’aider à comprendre un sujet juridique de façon générale, mais ce n’est pas un avis d’avocat.\n\nJe peux expliquer une notion, relire une clause de manière prudente, ou t’aider à préparer des questions à poser à un professionnel.`; }
function finance() { return `Je peux t’aider à réfléchir budget, dépenses, épargne, prix, marge ou business model.\n\nJe reste prudent : ce n’est pas un conseil financier personnalisé. Mais pour organiser tes chiffres et comprendre les options, je peux être très utile.`; }
function travel() { return `Je peux t’aider à préparer un voyage : destination, itinéraire, budget, activités, planning, choses à éviter.\n\nDonne-moi la ville, la durée et ton budget approximatif, et je te fais un plan clair.`; }
function education() { return `Je peux t’aider à apprendre : explication simple, fiche de révision, exercice, correction, méthode ou résumé.\n\nDonne-moi le sujet, et je l’explique au bon niveau.`; }
function work() { return `Je peux t’aider pour le travail : CV, lettre de motivation, entretien, email professionnel, organisation ou évolution de carrière.\n\nDonne-moi le poste ou la situation, et je te prépare une version utile.`; }
function psychology() { return `Je peux t’aider à clarifier une situation, mieux formuler ce que tu ressens, préparer une conversation ou prendre du recul.\n\nJe reste un assistant, pas un thérapeute, mais je peux aider à mettre de l’ordre dans les idées.`; }
function environment() { return `Je peux expliquer les sujets environnementaux simplement : climat, énergie, pollution, biodiversité, gestes utiles, enjeux et limites.\n\nDonne-moi le thème, et je te fais une réponse claire sans catastrophisme inutile.`; }
function media() { return `Je peux t’aider sur les médias et contenus : idées YouTube/TikTok, résumé de film/livre si tu me donnes le contexte, script, critique, angle éditorial ou calendrier de publication.`; }
function admin() { return `Je peux t’aider à organiser une démarche administrative : liste des documents, étapes, message à envoyer, points à vérifier.\n\nJe ne remplace pas l’administration officielle, mais je peux rendre le parcours beaucoup moins brumeux.`; }

function supportResponse(text: string) {
  return `Je suis là avec toi. Ce que tu ressens mérite d'être pris au sérieux, même si c'est difficile à expliquer.

On peut faire simple : dis-moi juste ce qui pèse le plus en ce moment, en une phrase. Si tu n'as pas les mots, écris même seulement “ça va pas”.

Et si tu peux, parle aussi à quelqu'un de confiance aujourd'hui. S'ouvrir un peu, ce n'est pas déranger : c'est se donner une chance de ne pas porter ça seul.`;
}

export function demoReply(messages: ChatMessage[], memory: string[], hasUserKnowledge: boolean, responseMode: ResponseMode = "auto", intent: ConversationIntent = "practical") {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content?.trim() || "";
  const t = compact(lastUser);
  const mem = memoryNote(memory);
  const mood = detectMood(lastUser);

  if (!lastUser) return "Je suis prêt. Pose ta question, simplement.";
  const safety = assessSafety(lastUser);
  if (safety.shouldIntercept && safety.response) return safety.response;
  if (safety.level === "support") return supportResponse(lastUser);
  if (/^(salut|bonjour|hello|hey|coucou|yo)\b/i.test(lastUser)) return `Bonjour ! Ravi de te voir ici 😊 Que veux-tu explorer aujourd’hui ?${mem}`;
  if (/(comment ca va|comment tu vas|tu vas bien|ca va\s*\?)/i.test(t)) return `Je vais très bien, merci 😄 Et toi ? Prêt à faire avancer quelque chose ensemble ?${mem}`;
  if (mood !== "neutral") return answerReaction(mood, messages, memory);

  if (checks.joke(lastUser)) return joke();
  if (checks.encouragement(lastUser)) return encourage();
  if (checks.opinion(lastUser)) return opinion();
  if (checks.identity(lastUser)) return identity();
  if (checks.limits(lastUser)) return limits();
  if (/(pourquoi|explique).*ciel.*bleu|ciel.*bleu/i.test(lower(lastUser))) return skyBlue();
  if (checks.recipe(lastUser)) return recipe(responseMode);
  if (checks.email(lastUser)) return email();
  if (checks.code(lastUser)) return code();
  if (checks.business(lastUser)) return business();
  if (checks.nimbray(lastUser)) return nimbray();
  if (checks.history(lastUser)) return history();
  if (checks.geography(lastUser)) return geography();
  if (checks.health(lastUser)) return health();
  if (checks.legal(lastUser)) return legal();
  if (checks.finance(lastUser)) return finance();
  if (checks.travel(lastUser)) return travel();
  if (checks.education(lastUser)) return education();
  if (checks.work(lastUser)) return work();
  if (checks.psychology(lastUser)) return psychology();
  if (checks.environment(lastUser)) return environment();
  if (checks.media(lastUser)) return media();
  if (checks.admin(lastUser)) return admin();

  if (checks.ideas(lastUser)) return `Voici 5 idées rapides :\n\n1. Une version simple pour débutants.\n2. Une version premium pour professionnels.\n3. Un format court pour réseaux sociaux.\n4. Une offre “gain de temps” très claire.\n5. Un concept plus original autour de l’automatisation.\n\nDonne-moi le domaine exact, et je te fais une liste plus précise — avec les mauvaises idées filtrées avant qu’elles aient le temps de prendre confiance.`;
  if (checks.plan(lastUser)) return `Voici un plan simple :\n\n1. Définir l’objectif.\n2. Lister les contraintes.\n3. Découper en petites étapes.\n4. Faire une première version rapide.\n5. Tester, corriger, améliorer.\n\nSi tu me donnes le projet, je te fais un plan complet adapté.`;
  if (checks.summary(lastUser)) return `Colle le texte ou ajoute le document, et je peux te faire :\n- un résumé court ;\n- les points clés ;\n- les actions à retenir ;\n- une version plus claire et exploitable.`;
  if (checks.science(lastUser)) return simpleScience();

  if (/^(pourquoi|comment|quand|ou|où|qui|que|quoi|combien|est ce que|est-ce que)/i.test(t) || /\?$/.test(lastUser)) {
    return `Bonne question. En mode démo, je peux répondre aux demandes courantes, mais je reste moins complet qu’une vraie IA branchée à Groq ou Ollama.\n\nRéponse courte : donne-moi un peu plus de contexte si tu veux une réponse vraiment précise, sinon je peux déjà t’expliquer le principe simplement.${demoLimitNote()}`;
  }

  return `Je vois l’idée. On peut partir de là.\n\nJe peux t’aider à transformer ça en explication, texte, plan, idée, correction, analyse ou stratégie.${hasUserKnowledge ? "\n\nJe peux aussi m’appuyer sur tes sources locales si tu les ajoutes." : ""}${demoLimitNote()}`;
}
