import createMDX from "@next/mdx";
import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /**
   * `.mdx` reconnu comme extension de page.
   *
   * Les ARTICLES ne vivent pas dans `src/app/` mais dans `content/blog/` : ils
   * ne créent donc aucune route par eux-mêmes. C'est `(site)/blog/[slug]` qui
   * les importe par slug. Cette liste sert uniquement à faire passer les `.mdx`
   * par le compilateur ; sans elle, l'import d'un article échoue.
   */
  pageExtensions: ["ts", "tsx", "mdx"],

  experimental: {
    /**
     * `src/app/` n'a pas de `layout.tsx` à la racine — le layout du site vit
     * dans le groupe `(site)` —, donc pas de layout dans lequel composer un 404
     * global. (Le second layout racine, celui de l'admin Payload, a disparu
     * avec Payload ; le drapeau reste néanmoins nécessaire.)
     * MESURÉ : sans ce drapeau, toute URL inconnue renvoyait le 404 nu de Next
     * (« 404: This page could not be found. ») au lieu de la page du site. Il
     * active `src/app/global-not-found.tsx`, la sortie prévue pour ce cas.
     */
    globalNotFound: true,
  },

  /**
   * REDIRECTIONS PERMANENTES — les adresses DÉJÀ EN LIGNE ne meurent pas.
   *
   * Le site publié sur https://www.eliottbouquerel.fr a porté d'autres chemins
   * que ceux de cette reconstruction. Les supprimer sans filet coûte deux
   * choses à la fois : le visiteur qui suit un lien enregistré tombe sur un 404,
   * et le moteur de recherche perd l'antériorité de l'adresse au lieu de la
   * transférer. Une redirection permanente fait exactement l'inverse des deux.
   *
   * 301 ET NON 308, alors que `permanent: true` produirait un 308. Les deux
   * codes disent « c'est définitif » et Google les traite à l'identique, mais le
   * 301 est celui que lisent sans hésiter les vieux clients, les vérificateurs
   * de liens et les outils d'audit SEO — et ces adresses-là n'existent que pour
   * eux. Le 308 n'achèterait ici que la conservation de la méthode HTTP, dont
   * aucune de ces pages n'a l'usage.
   *
   * DEUX FAMILLES, à ne pas confondre :
   *   1. l'ancien site en ligne (`/cgv`, `/rendez-vous`, `/projets/…`) ;
   *   2. les slugs légaux anglais de cette reconstruction
   *      (`/legal/privacy-policy`, `/legal/terms-of-service`), francisés le
   *      2026-08-28. Ils ont été servis, ils sont référencés par la bannière de
   *      consentement et par d'anciens formulaires : ils redirigent eux aussi.
   *
   * `/legal/[slug]` a `dynamicParams = false` : sans ces règles, les anciens
   * slugs répondraient 404 au lieu de conduire au document renommé.
   */
  async redirects() {
    return [
      /* Ancien site : les pages légales vivaient à la racine. */
      { source: "/mentions-legales", destination: "/legal/mentions-legales", statusCode: 301 },
      { source: "/cgv", destination: "/legal/conditions-generales-de-vente", statusCode: 301 },
      /* Ancien site : la prise de rendez-vous est devenue la page contact. */
      { source: "/rendez-vous", destination: "/contact", statusCode: 301 },
      /* Ancien site : les études de cas, dans les deux langues d'URL.
         Elles visent la destination FINALE, pas `/work/kpsull` : enchaîner
         deux 301 dilue le signal transféré et rallonge le trajet du visiteur. */
      { source: "/projets/kpsull", destination: "/realisations/kpsull", statusCode: 301 },
      { source: "/projects/kpsull", destination: "/realisations/kpsull", statusCode: 301 },
      /* Francisation des slugs légaux (2026-08-28). */
      {
        source: "/legal/privacy-policy",
        destination: "/legal/politique-de-confidentialite",
        statusCode: 301,
      },
      {
        source: "/legal/terms-of-service",
        destination: "/legal/conditions-generales-de-vente",
        statusCode: 301,
      },
      /*
       * Francisation des deux derniers segments anglais (2026-09-04).
       *
       * `/about` et `/work` étaient les seuls chemins du gabarit Framer restés
       * en anglais après la francisation des slugs légaux du 2026-08-28, sur un
       * site dont tout le reste est en français. Ils ont été servis en
       * production et annoncés au sitemap : ils redirigent au lieu de
       * disparaître.
       *
       * `/work/:slug` couvre les trois études de cas d'un coup, et continuera de
       * couvrir celles qui s'ajouteront.
       *
       * ATTENTION AUX MÉDIAS DE `public/work/`, qui gardent ce chemin : les
       * redirections passent AVANT le système de fichiers, donc une règle trop
       * large les intercepterait. `:slug` ne filant qu'UN segment,
       * `/work/kpsull/demo.mp4` n'est pas capté et continue d'être servi. Ne
       * jamais élargir cette règle en `/work/:chemin*` sans déplacer les médias.
       */
      { source: "/about", destination: "/a-propos", statusCode: 301 },
      { source: "/work", destination: "/realisations", statusCode: 301 },
      { source: "/work/:slug", destination: "/realisations/:slug", statusCode: 301 },
      /*
       * RESSERREMENT DU BLOG (2026-09-07) — dix articles retirés sur seize.
       *
       * CE QUI A DÉCIDÉ, et ce n'est pas la qualité d'écriture : l'offre que
       * l'article sert. Les six qui restent amènent quelqu'un qui compare avant
       * d'acheter un site ou un logiciel métier. Les dix autres amenaient un
       * lecteur qui voulait améliorer son marketing lui-même, et deux d'entre
       * eux se cannibalisaient (recouvrement de vocabulaire 0,240 entre la fiche
       * produit et la landing page, 0,206 entre les deux articles GEO).
       *
       * ILS ONT ÉTÉ SERVIS ET ANNONCÉS AU SITEMAP, donc ils redirigent. Chacun
       * vise le survivant le plus PROCHE par le sujet, jamais un renvoi de
       * confort : une redirection vers une page sans rapport est lue comme une
       * page introuvable déguisée, et perd ce qu'elle prétendait transférer.
       * Faute de voisin honnête, la destination est l'index du blog.
       */
      {
        source: "/blog/fiche-produit-qui-convertit",
        destination: "/blog/landing-page-ou-page-produit",
        statusCode: 301,
      },
      {
        source: "/blog/abandon-de-panier-causes-et-remedes",
        destination: "/blog/landing-page-ou-page-produit",
        statusCode: 301,
      },
      {
        source: "/blog/formulaire-inscription-erreurs-saisie",
        destination: "/blog/landing-page-ou-page-produit",
        statusCode: 301,
      },
      {
        source: "/blog/experience-utilisateur-boutique-en-ligne",
        destination: "/blog/site-e-commerce-lent-ce-que-ca-coute",
        statusCode: 301,
      },
      {
        source: "/blog/migrer-sa-boutique-sans-perdre-son-referencement",
        destination: "/blog/shopify-ou-site-sur-mesure",
        statusCode: 301,
      },
      {
        source: "/blog/accessibilite-boutique-en-ligne-obligation-et-levier",
        destination: "/blog/shopify-ou-site-sur-mesure",
        statusCode: 301,
      },
      /* Sans voisin honnête : l'index du blog plutôt qu'un rapprochement forcé. */
      { source: "/blog/etre-cite-par-chatgpt-et-perplexity", destination: "/blog", statusCode: 301 },
      { source: "/blog/seo-et-geo-quelles-differences", destination: "/blog", statusCode: 301 },
      { source: "/blog/ce-que-google-montre-de-vous", destination: "/blog", statusCode: 301 },
      { source: "/blog/dessiner-avant-de-coder", destination: "/a-propos", statusCode: 301 },
    ];
  },

  /**
   * Proxy d'ingestion PostHog, ACTIF EN PRODUCTION. Voir l'entête de
   * `POSTHOG_INGEST` pour ce qu'il achète.
   */
  /*
   * PLUS AUCUNE RÉÉCRITURE POUR POSTHOG, et c'est une correction, pas un choix
   * de style. Une réécriture vers un hôte externe transmet l'en-tête `Host` de
   * la requête d'origine : PostHog recevait `Host: eliottbouquerel.fr`,
   * répondait 403, et Next remontait un 500. Mesuré le 2026-09-08, la mesure
   * d'audience ne recevait donc RIEN depuis sa mise en service, sans une seule
   * erreur visible sur le site.
   *
   * Le relais vit maintenant dans `src/app/ingest/[...chemin]/route.ts`, où
   * l'en-tête est maîtrisé. Voir son en-tête pour le détail.
   */
};

/**
 * MDX, et ce que le frontmatter n'y fera jamais.
 *
 * Le frontmatter YAML n'est volontairement PAS activé : les métadonnées d'un
 * article (titre, date, description, image de partage) vivent dans le registre
 * TypeScript `src/content/blog.ts`, où le compilateur les vérifie. Un YAML dans
 * l'article échapperait à tout contrôle, et c'est précisément ce qu'il ne faut
 * pas quand les articles sont rédigés par un agent. Voir `docs/BLOG.md`.
 */
/*
 * `remark-gfm` POUR LES TABLEAUX, et pour rien d'autre qui compte ici.
 *
 * MDX seul ne connaît pas la syntaxe de tableau : `| a | b |` sortait en
 * paragraphe avec ses barres verticales visibles. Or un tableau est la forme
 * qu'un moteur, classique ou génératif, extrait le plus volontiers d'un
 * article — une grille tarifaire en prose se cite mal, la même en lignes se
 * cite telle quelle.
 *
 * L'extension apporte aussi les listes de tâches et le texte barré, dont le
 * contenu ne se sert pas.
 *
 * LE PLUGIN EST NOMMÉ PAR UNE CHAÎNE, JAMAIS IMPORTÉ, et ce détail a coûté un
 * déploiement. `next build` tourne sous Turbopack, qui sérialise les options de
 * loader pour les passer à ses processus de travail : une fonction importée n'y
 * survit pas et le build meurt sur « does not have serializable options ». Le
 * serveur de développement, lui, tourne sous webpack et acceptait l'import
 * sans broncher — le défaut n'existait donc QUE sur le chemin de production.
 * Toute évolution de cette liste se vérifie par un `bun run build`, jamais par
 * le seul serveur de développement.
 */
const withMDX = createMDX({
  options: { remarkPlugins: [["remark-gfm", { singleTilde: false }]] },
});

export default withMDX(nextConfig);
