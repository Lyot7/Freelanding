/**
 * REGISTRE DES ÉVÉNEMENTS — la seule liste qui fait foi.
 *
 * POURQUOI UN REGISTRE PLUTÔT QUE DES CHAÎNES ÉCRITES SUR PLACE. Un entonnoir
 * PostHog est assemblé à la main dans l'interface, à partir de NOMS. Le jour où
 * un nom change dans le code, l'entonnoir ne casse pas : il tombe à zéro
 * conversion, silencieusement, et personne ne le voit avant des semaines. Les
 * noms sont donc figés ici, importés partout, et jamais recopiés.
 *
 * CONVENTION. `objet_verbe_au_passé`, en anglais (la langue des propriétés
 * PostHog, `$pageview` compris), sans espace ni majuscule. Les propriétés sont
 * en `snake_case`. Les événements natifs PostHog gardent leur `$`.
 *
 * RÈGLE DE DONNÉES. Aucune propriété ne porte de saisie utilisateur. On
 * enregistre le NOM d'un champ, jamais sa valeur ; le libellé d'un bouton,
 * jamais le message d'un prospect.
 */

export const ANALYTICS_EVENTS = {
  /* --- Cycle de vie de page (émis manuellement : l'App Router ne recharge pas) */
  pageView: "$pageview",
  pageLeave: "$pageleave",

  /* --- Vues nommées, pour bâtir des entonnoirs sans filtre d'URL ------------
     Un entonnoir monté sur `$pageview` oblige à filtrer sur `$current_url`, ce
     qui casse dès qu'un chemin change. Ces événements-là sont stables. */
  homeViewed: "home_viewed",
  servicePageViewed: "service_page_viewed",
  workIndexViewed: "work_index_viewed",
  workPageViewed: "work_page_viewed",
  blogIndexViewed: "blog_index_viewed",
  articleViewed: "article_viewed",
  aboutViewed: "about_viewed",
  contactPageViewed: "contact_page_viewed",
  legalPageViewed: "legal_page_viewed",

  /* --- Intentions commerciales ------------------------------------------- */
  ctaClicked: "cta_clicked",
  phoneClicked: "contact_phone_clicked",
  emailClicked: "contact_email_clicked",
  socialClicked: "social_link_clicked",
  externalLinkClicked: "external_link_clicked",
  serviceLinkClicked: "service_link_clicked",
  workLinkClicked: "work_link_clicked",
  articleLinkClicked: "article_link_clicked",
  legalLinkClicked: "legal_link_clicked",
  navLinkClicked: "nav_link_clicked",

  /* --- Prix --------------------------------------------------------------- */
  pricingViewed: "pricing_viewed",
  serviceExpanded: "service_expanded",
  serviceCollapsed: "service_collapsed",

  /* --- Formulaires (point d'accroche, cf. docs/ANALYTICS.md) --------------- */
  formStarted: "form_started",
  formFieldCompleted: "form_field_completed",
  formSubmitted: "form_submitted",
  formSucceeded: "form_succeeded",
  formFailed: "form_failed",

  /* --- Engagement --------------------------------------------------------- */
  sectionViewed: "section_viewed",
  scrollDepthReached: "scroll_depth_reached",
  articleReadProgress: "article_read_progress",
  articleCompleted: "article_completed",
  pageEngagement: "page_engagement",
  faqOpened: "faq_opened",
  accordionToggled: "accordion_toggled",
  menuOpened: "menu_opened",
  filterApplied: "filter_applied",

  /* --- Prise de rendez-vous ------------------------------------------------
     LE FORMULAIRE DE RDV NE SE MESURE PAS COMME LES AUTRES, et c'est la raison
     d'être de ces six noms. Les écouteurs délégués de `GlobalAnalytics` voient
     un `submit` et s'arrêtent là : ils ne peuvent pas savoir si Cal.com a
     confirmé, si le créneau avait été pris entre l'affichage et le clic, ni si
     la grille des créneaux s'est seulement chargée. Un entonnoir bâti sur
     `form_submitted` comptait donc en conversions des réservations qui
     échouaient.

     `rdv_slots_failed` EST LE PLUS IMPORTANT DES SIX. Quand Cal.com répond 502,
     comme le 2026-09-06 où les quatre types pointaient sur des identifiants
     inexistants, le prospect ne voit aucun créneau et repart. Sans cet
     événement, l'entonnoir montre une chute à l'étape 2 et rien ne dit qu'elle
     vient d'une panne plutôt que d'un désintérêt. */
  rdvTypeSelected: "rdv_type_selected",
  rdvSlotsLoaded: "rdv_slots_loaded",
  rdvSlotsFailed: "rdv_slots_failed",
  rdvSlotSelected: "rdv_slot_selected",
  rdvConfirmed: "rdv_confirmed",
  rdvFailed: "rdv_failed",

  /* --- Consentement (capturé APRÈS acceptation seulement) ------------------ */
  consentUpdated: "consent_updated",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Valeur de la propriété `page_type`, posée sur chaque `$pageview`. */
export type PageType =
  | "home"
  | "service"
  | "work_index"
  | "work_detail"
  | "blog_index"
  | "article"
  | "about"
  | "contact"
  | "legal"
  | "not_found";

/**
 * Type de page DÉDUIT DU CHEMIN, et non passé par chaque page.
 *
 * Le déduire ici évite d'avoir à toucher les 9 fichiers de route : le type
 * suit le manifeste `src/content/routes.ts` sans qu'aucun composant n'ait à
 * déclarer quoi que ce soit. Un chemin inconnu est un 404, ce qui est vrai
 * (toute URL sans route est servie par `global-not-found`).
 */
export function pageTypeFromPathname(pathname: string): PageType {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/a-propos") return "about";
  if (path === "/contact") return "contact";
  if (path === "/realisations") return "work_index";
  if (path === "/blog") return "blog_index";
  if (path.startsWith("/realisations/")) return "work_detail";
  if (path.startsWith("/blog/")) return "article";
  if (path.startsWith("/services/")) return "service";
  if (path.startsWith("/legal/")) return "legal";
  return "not_found";
}

/** Dernier segment du chemin, utilisé comme `content_slug`. */
export function slugFromPathname(pathname: string): string | undefined {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 1 ? segments[segments.length - 1] : undefined;
}

/** Événement de vue nommé correspondant à un type de page, s'il en existe un. */
export function viewEventForPageType(
  type: PageType,
): AnalyticsEventName | null {
  switch (type) {
    case "home":
      return ANALYTICS_EVENTS.homeViewed;
    case "service":
      return ANALYTICS_EVENTS.servicePageViewed;
    case "work_index":
      return ANALYTICS_EVENTS.workIndexViewed;
    case "work_detail":
      return ANALYTICS_EVENTS.workPageViewed;
    case "blog_index":
      return ANALYTICS_EVENTS.blogIndexViewed;
    case "article":
      return ANALYTICS_EVENTS.articleViewed;
    case "about":
      return ANALYTICS_EVENTS.aboutViewed;
    case "contact":
      return ANALYTICS_EVENTS.contactPageViewed;
    case "legal":
      return ANALYTICS_EVENTS.legalPageViewed;
    case "not_found":
      return null;
  }
}

/**
 * ENTONNOIRS RECOMMANDÉS — déclarés en code, pas seulement en prose.
 *
 * Ils ne font rien à l'exécution : ils existent pour que le compilateur refuse
 * un entonnoir bâti sur un événement qui n'est plus émis. `docs/ANALYTICS.md`
 * décrit comment les monter dans PostHog ; cette liste garantit que la
 * documentation parle d'événements qui existent réellement.
 */
export interface FunnelDefinition {
  readonly id: string;
  readonly label: string;
  readonly steps: readonly AnalyticsEventName[];
  readonly note: string;
}

export const RECOMMENDED_FUNNELS: readonly FunnelDefinition[] = [
  {
    id: "prise-de-contact",
    label: "Accueil → prestation → contact → envoi",
    steps: [
      ANALYTICS_EVENTS.homeViewed,
      ANALYTICS_EVENTS.servicePageViewed,
      ANALYTICS_EVENTS.contactPageViewed,
      ANALYTICS_EVENTS.formSubmitted,
    ],
    note: "L'entonnoir principal. Fenêtre de conversion conseillée : 7 jours.",
  },
  {
    id: "rendez-vous",
    label: "Section RDV vue → sujet → créneaux → créneau → envoi → confirmé",
    steps: [
      ANALYTICS_EVENTS.sectionViewed,
      ANALYTICS_EVENTS.rdvTypeSelected,
      ANALYTICS_EVENTS.rdvSlotsLoaded,
      ANALYTICS_EVENTS.rdvSlotSelected,
      ANALYTICS_EVENTS.formSubmitted,
      ANALYTICS_EVENTS.rdvConfirmed,
    ],
    note:
      "L'entonnoir qui compte : il finit sur une réservation CONFIRMÉE par " +
      "Cal.com, jamais sur un formulaire envoyé. Filtrer l'étape 1 sur " +
      "`section = rendez-vous`. Fenêtre : 1 jour, la prise de rendez-vous se " +
      "joue en une seule visite. Croiser la chute entre les étapes 2 et 3 avec " +
      "`rdv_slots_failed` avant de conclure à un désintérêt : une panne Cal.com " +
      "produit exactement la même courbe.",
  },
  {
    id: "appel-direct",
    label: "Arrivée → appel téléphonique",
    steps: [ANALYTICS_EVENTS.pageView, ANALYTICS_EVENTS.phoneClicked],
    note: "Le prospect appelé qui rappelle. Fenêtre : 1 jour.",
  },
  {
    id: "prix",
    label: "Accueil → ouverture d'une prestation → prix → CTA → envoi",
    steps: [
      ANALYTICS_EVENTS.homeViewed,
      ANALYTICS_EVENTS.serviceExpanded,
      ANALYTICS_EVENTS.pricingViewed,
      ANALYTICS_EVENTS.ctaClicked,
      ANALYTICS_EVENTS.formSubmitted,
    ],
    note: "Mesure l'effet du prix affiché : où l'on décroche après l'avoir vu.",
  },
  {
    id: "blog",
    label: "Article lu → CTA → contact → envoi",
    steps: [
      ANALYTICS_EVENTS.articleViewed,
      ANALYTICS_EVENTS.articleReadProgress,
      ANALYTICS_EVENTS.ctaClicked,
      ANALYTICS_EVENTS.formSubmitted,
    ],
    note: "Filtrer l'étape 2 sur `depth = 75` pour ne compter que les vraies lectures.",
  },
  {
    id: "preuve",
    label: "Réalisation consultée → contact → envoi",
    steps: [
      ANALYTICS_EVENTS.workPageViewed,
      ANALYTICS_EVENTS.contactPageViewed,
      ANALYTICS_EVENTS.formSubmitted,
    ],
    note: "La preuve convertit-elle ? À croiser avec `work_slug`.",
  },
  {
    id: "email",
    label: "Arrivée → clic e-mail",
    steps: [ANALYTICS_EVENTS.pageView, ANALYTICS_EVENTS.emailClicked],
    note: "Le canal que le formulaire ne mesure pas. Fenêtre : 1 jour.",
  },
];
