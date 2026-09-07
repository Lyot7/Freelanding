import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import type { NextConfig } from "next";

/**
 * PROXY D'INGESTION POSTHOG — la mesure part de l'origine du site.
 *
 * CE QU'IL ACHÈTE, et pourquoi ça compte ICI plus qu'ailleurs. Les listes de
 * filtrage (uBlock, Brave, résolveurs DNS filtrants) bloquent les requêtes vers
 * les domaines d'analytics connus. Sur un site à fort volume, c'est une perte
 * statistique ; sur celui-ci, où quelques dizaines de visites par mois sont
 * autant de prospects qu'Eliott a appelés un par un, perdre un tiers de la
 * mesure revient à perdre la trace de la personne qu'on cherchait. Servi depuis
 * `https://www.eliottbouquerel.fr/ingest`, le trafic n'est plus reconnaissable
 * à son domaine.
 *
 * CE QU'IL N'ACHÈTE PAS : rien ne part avant le consentement. Le proxy déplace
 * l'adresse, jamais la règle. Voir `src/lib/analytics/posthog.ts`.
 *
 * HÉBERGEMENT UE PAR DÉFAUT, et c'est un choix qui ne se discute pas ici : le
 * site est français et sa cible l'est aussi. `NEXT_PUBLIC_POSTHOG_HOST` permet
 * d'en changer, mais l'absence de valeur donne l'Europe, jamais les États-Unis.
 * Attention au piège des deux domaines PostHog : `eu.i.posthog.com` est
 * l'INGESTION, `eu.posthog.com` est l'interface — les intervertir donne un
 * proxy qui répond 200 en servant du HTML.
 */
const POSTHOG_INGEST = (
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? ""
).trim() || "https://eu.i.posthog.com";

const POSTHOG_ASSETS = POSTHOG_INGEST.includes("us.i.posthog.com")
  ? "https://us-assets.i.posthog.com"
  : "https://eu-assets.i.posthog.com";

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
  async rewrites() {
    /* Proxy d'ingestion PostHog, ACTIF EN PRODUCTION (contrairement au
       `/live-proxy` ci-dessus, qui lui doit rester en développement). Voir
       l'entête de `POSTHOG_INGEST` pour ce qu'il achète. */
    const posthog = [
      /* Le SDK va chercher ses modules optionnels (enregistreur de session,
         toolbar) sur l'hôte d'ASSETS, distinct de l'hôte d'ingestion. Cette
         règle vient EN PREMIER : `/ingest/:path*` capterait sinon aussi
         `/ingest/static/...` et enverrait la demande au mauvais domaine. */
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS}/static/:path*`,
      },
      { source: "/ingest/:path*", destination: `${POSTHOG_INGEST}/:path*` },
    ];

    return posthog;
  },
};

/**
 * MDX sans greffon remark/rehype pour l'instant.
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
 * contenu ne se sert pas. Les liens automatiques, eux, sont désactivés :
 * transformer chaque URL nue en lien produirait des ancres sans intitulé,
 * exactement ce que l'audit de liens interdit.
 */
const withMDX = createMDX({
  options: { remarkPlugins: [[remarkGfm, { singleTilde: false }]] },
});

export default withMDX(nextConfig);
