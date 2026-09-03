/**
 * AUDIT DES LIENS : les externes s'ouvrent dans un nouvel onglet, les internes non.
 *
 * POURQUOI. Un lien externe qui remplace la page fait perdre le portfolio : le
 * visiteur part sur GitHub ou LinkedIn et ne revient pas, ou revient au prix
 * d'un retour arrière qui recharge tout. Un lien INTERNE en `_blank` fait
 * l'erreur inverse, il empile des onglets du même site et court-circuite la
 * navigation client de Next.
 *
 * CE QUE CE SCRIPT VÉRIFIE, sur le RENDU et non sur le code :
 *   1. tout lien vers un autre domaine porte `target="_blank"` ;
 *   2. il porte aussi `rel` contenant `noopener` — sans ça, la page ouverte
 *      garde une référence `window.opener` sur la nôtre et peut la rediriger
 *      (tabnabbing) ;
 *   3. aucun lien interne ne porte `target="_blank"`.
 *
 * POURQUOI AU RENDU. Une recherche dans le code passe à côté des liens produits
 * par la donnée, par le MDX ou par une conversion à la volée (les adresses
 * e-mail des mentions légales sont transformées en liens à l'exécution). Le DOM
 * est le seul endroit où l'on voit ce que le visiteur reçoit vraiment.
 *
 * Les panneaux repliés (accordéon des prestations, FAQ, menu flottant) sont dans
 * le DOM même fermés : leurs liens sont donc audités eux aussi.
 *
 * Usage : `bun run scripts/external-links-audit.mjs` (serveur de dev démarré).
 */
import { chromium } from "playwright";
import { blogPosts } from "../src/content/blog.ts";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";

/*
 * LES ARTICLES SONT DÉRIVÉS DU REGISTRE, plus écrits à la main.
 *
 * Cette liste portait les cinq slugs d'articles en dur. Publier un article ne
 * le faisait donc pas auditer, et en retirer un faisait échouer l'audit sur une
 * page 404 — ce qui est arrivé le 2026-08-28 avec le retrait d'un article.
 * `blog.ts` est la seule source qui décide de l'existence d'un article : c'est
 * elle qui décide aussi de ce qui est audité.
 */
const ROUTES = [
  "/",
  "/about",
  "/work",
  "/work/kpsull",
  "/work/nslysium",
  "/work/wurth-creation-de-compte",
  "/blog",
  ...blogPosts.map(({ slug }) => `/blog/${slug}`),
  "/services/site-vitrine",
  "/services/outil-metier",
  "/services/logiciel-metier",
  "/contact",
  "/legal/mentions-legales",
  "/legal/politique-de-confidentialite",
  "/legal/conditions-generales-de-vente",
  "/introuvable-page-de-test",
];

/**
 * Schémas qui ne sont NI internes NI externes au sens de la navigation.
 *
 * `mailto:` et `tel:` sont pris en charge par le système, pas par le navigateur :
 * ils n'ouvrent aucun onglet, quel que soit le `target`. Les auditer produirait
 * du bruit sans jamais désigner un vrai défaut.
 */
const HORS_NAVIGATION = /^(mailto|tel|sms):/i;

/**
 * Fichiers servis depuis notre origine mais qui ne sont PAS des pages.
 *
 * Une vidéo de démonstration, un PDF ou une archive ont le droit d'ouvrir un
 * onglet, et c'est même ce qu'il faut : les afficher à la place du site ferait
 * exactement ce qu'on cherche à éviter, remplacer le portfolio par un lecteur
 * vidéo nu. Le visiteur ferme l'onglet et retrouve la page où il l'avait
 * laissée. Ce sont donc des exceptions légitimes, pas des défauts tolérés.
 *
 * MESURÉ le 2026-08-27 : les deux boutons « Lire la vidéo » des pages projet
 * pointent sur `/work/<slug>/demo.mp4`, servis depuis `public/`.
 */
const FICHIERS = /\.(mp4|webm|mov|pdf|zip|csv|xlsx?|docx?|pptx?|svg|png|jpe?g|webp|avif|gif|ics|txt|xml|json)$/i;

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });

const coupables = [];
const injoignables = [];
let liensExternes = 0;
let liensInternes = 0;

for (const route of ROUTES) {
  try {
    const reponse = await page.goto(`${BASE}${route}`, {
      // `domcontentloaded` et non `networkidle` : la vidéo du héros boucle en
      // permanence, le réseau ne retombe jamais au calme et l'attente expire.
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    if (!reponse) throw new Error("aucune réponse");
  } catch (erreur) {
    injoignables.push({ route, raison: erreur.message });
    continue;
  }
  await page.waitForTimeout(600);

  const releve = await page.evaluate(([horsNav, fichiers]) => {
    const motif = new RegExp(horsNav.source, horsNav.flags);
    const motifFichier = new RegExp(fichiers.source, fichiers.flags);
    const resultat = { externes: 0, internes: 0, defauts: [] };
    for (const a of document.querySelectorAll("a[href]")) {
      const brut = a.getAttribute("href") ?? "";
      if (!brut || brut.startsWith("#") || motif.test(brut)) continue;

      let externe = false;
      try {
        externe = new URL(a.href, location.href).origin !== location.origin;
      } catch {
        continue;
      }

      const cible = a.getAttribute("target");
      const rel = a.getAttribute("rel") ?? "";
      const texte = (a.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 48);

      if (externe) {
        resultat.externes += 1;
        if (cible !== "_blank") {
          resultat.defauts.push({ type: "externe-sans-onglet", brut, texte });
        } else if (!/\bnoopener\b/.test(rel)) {
          resultat.defauts.push({ type: "externe-sans-noopener", brut, texte, rel });
        }
      } else {
        // Un fichier servi depuis notre origine (vidéo, PDF) a le droit
        // d'ouvrir un onglet : c'est même la bonne façon de ne pas remplacer le
        // site par un lecteur nu. Il n'est ni compté ni audité comme une page.
        let chemin = brut;
        try {
          chemin = new URL(a.href, location.href).pathname;
        } catch {
          /* href non analysable : traité comme un chemin brut. */
        }
        if (motifFichier.test(chemin)) continue;

        resultat.internes += 1;
        if (cible === "_blank") {
          resultat.defauts.push({ type: "interne-en-nouvel-onglet", brut, texte });
        }
      }
    }
    return resultat;
  }, [HORS_NAVIGATION, FICHIERS]);

  liensExternes += releve.externes;
  liensInternes += releve.internes;
  for (const defaut of releve.defauts) coupables.push({ route, ...defaut });
}

await navigateur.close();

const LIBELLES = {
  "externe-sans-onglet":
    "LIENS EXTERNES QUI REMPLACENT LA PAGE (il manque target=\"_blank\")",
  "externe-sans-noopener":
    "LIENS EXTERNES SANS `noopener` (la page ouverte peut rediriger la nôtre)",
  "interne-en-nouvel-onglet":
    "LIENS INTERNES QUI OUVRENT UN ONGLET (ils empilent des copies du site)",
};

if (injoignables.length > 0) {
  console.error("\n❌ Routes injoignables :");
  for (const { route, raison } of injoignables) {
    console.error(`  ${route} — ${raison}`);
  }
}

if (coupables.length > 0) {
  for (const [type, libelle] of Object.entries(LIBELLES)) {
    const lot = coupables.filter((c) => c.type === type);
    if (lot.length === 0) continue;
    console.error(`\n❌ ${libelle} — ${lot.length}`);
    for (const c of lot) {
      console.error(`  ${c.route}`);
      console.error(`     ${c.brut}${c.texte ? `  « ${c.texte} »` : ""}`);
      if (c.rel !== undefined) console.error(`     rel="${c.rel}"`);
    }
  }
}

const total = `${liensExternes} lien(s) externe(s) et ${liensInternes} interne(s) sur ${ROUTES.length} routes`;

if (coupables.length > 0 || injoignables.length > 0) {
  console.error(`\nTotal : ${coupables.length} défaut(s) — ${total}.`);
  process.exit(1);
}

console.log(`✅ Tous les liens s'ouvrent au bon endroit : ${total}.`);
