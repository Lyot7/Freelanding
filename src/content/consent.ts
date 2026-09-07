/**
 * Textes de la bannière de consentement.
 *
 * Ils vivent ici, dans `src/content/`, comme tout ce que le visiteur lit :
 * `scripts/hardcoded-text-audit.mjs` refuse le texte écrit dans un composant, et
 * c'est justement ce texte-là qu'il ne faut pas laisser dériver — sa formulation
 * fait partie de la conformité, pas de la mise en page.
 *
 * RÈGLES DE RÉDACTION TENUES ICI :
 *   - on nomme les finalités, pas les technologies (« mesure d'audience », pas
 *     « cookies tiers ») ;
 *   - aucune formule de pression, aucune urgence, aucun « pour améliorer votre
 *     expérience » qui ne veut rien dire ;
 *   - les deux verbes de décision sont symétriques : « Tout refuser » /
 *     « Tout accepter », même longueur, même registre.
 */

export const consentCopy = {
  eyebrow: "Confidentialité",
  title: "Mesure d’audience",
  body: "Ce site ne dépose aucun traceur de mesure tant que vous ne l’avez pas accepté. J’utilise PostHog, hébergé dans l’Union européenne, pour comprendre ce qui vous a été utile. Détail des finalités et de leur durée dans la",
  policyLabel: "politique de confidentialité",
  policyHref: "/legal/politique-de-confidentialite",

  acceptAll: "Tout accepter",
  rejectAll: "Tout refuser",
  customise: "Personnaliser",
  savePreferences: "Enregistrer mes choix",
  back: "Retour",
  close: "Fermer",
  revoke: "Retirer mon consentement",
  alwaysOn: "Toujours actif",

  /** Libellé du lien permanent de pied de page qui rouvre ce panneau. */
  /* Forme courte, pour la rangée légale du pied de page, où elle voisine
     « Confidentialité ». Nomme la COMMANDE (rouvrir le choix) et non le
     document (la politique), sans quoi les deux se lisent comme un doublon. */
  footerShortLink: "Cookies",

  categories: {
    necessary: {
      title: "Strictement nécessaire",
      body: "Mémorise uniquement le choix que vous faites ici, pour six mois, afin de ne pas vous le redemander à chaque page. Aucun identifiant, aucune donnée personnelle.",
    },
    analytics: {
      title: "Mesure d’audience",
      body: "Pages consultées, provenance, clics et progression dans la page. Ces données ne portent pas votre nom, mais elles restent rattachées à un identifiant de visite : elles sont pseudonymes, pas anonymes. Hébergement dans l’Union européenne.",
    },
    replay: {
      title: "Enregistrement de session",
      body: "Rejeu de votre navigation, sans votre nom, pour repérer ce qui bloque. Tout ce que vous saisissez est masqué avant l’enregistrement. Nécessite la mesure d’audience.",
    },
  },
} as const;
