import type { LegalDocument } from "@/lib/content/types";
// Adresse de contact = source unique (`siteConfig.contact.email`), partagée avec
// le footer et la page contact : une seule ligne à changer si elle bouge.
import { siteConfig } from "@/content/site";

/**
 * Pages légales — RÉÉCRITES, PAS TRADUITES, puis COMPLÉTÉES.
 *
 * Les textes d'origine étaient rédigés pour une société américaine (droit des
 * États-Unis, « Fabrica® Studio », mentions de fusion-acquisition) : ils
 * n'avaient aucune valeur en droit français. Ils ont été remplacés par trois
 * documents adaptés à une ENTREPRISE INDIVIDUELLE française qui vend en B2B :
 *   - mentions légales (LCEN, article 1-1) ;
 *   - politique de confidentialité (RGPD + loi Informatique et Libertés) ;
 *   - conditions générales de vente.
 *
 * BASE LÉGALE DES MENTIONS D'IDENTIFICATION : article 1-1 de la loi du 21 juin
 * 2004 (LCEN), et NON PLUS l'article 6-III. La loi SREN du 21 mai 2024 a
 * restructuré la LCEN : les obligations d'identification de l'éditeur et de
 * l'hébergeur sont passées à l'article 1-1, les sanctions pénales à l'article
 * 1-2 (un an d'emprisonnement et 75 000 € d'amende pour une personne physique).
 * L'article 6 ne traite plus que du régime des intermédiaires techniques.
 * Vérifié sur Légifrance le 2026-08-28 (LEGIARTI000049568614 et
 * LEGIARTI000049568616). Toute documentation citant « 6-III » est antérieure à
 * mai 2024.
 *
 * SLUGS FRANCISÉS le 2026-08-28 : `privacy-policy` est devenu
 * `politique-de-confidentialite`, `terms-of-service` est devenu
 * `conditions-generales-de-vente`. Les deux anciens chemins ont été servis :
 * ils sont redirigés en 301 par `redirects()` dans `next.config.ts`, sans quoi
 * `dynamicParams = false` les ferait répondre 404.
 *
 * ⚠️ RÉDIGÉ SANS JURISTE. Les identifiants et les coordonnées sont vérifiés,
 * les clauses sont raisonnées, mais une relecture d'avocat reste souhaitable
 * sur la cession de droits (art. L. 131-3 CPI) et sur la clause de délais.
 *
 * AUDIT DE CONFORMITÉ DU 2026-08-29 (`docs/AUDIT-LEGAL.md`), APPLIQUÉ ICI.
 * Cinq manquements étaient constitués, chacun corrigé dans ce fichier :
 *   - CGV, art. L. 441-1 I C. com. : ni barème de prix, ni méthode de calcul,
 *     ni mention d'escompte. Amende administrative jusqu'à 75 000 €. Le barème
 *     décrit la méthode RÉELLE du site (jours du pack x taux journalier, cf.
 *     `offre.ts`) plutôt qu'une grille figée qui se périmerait. Le taux
 *     lui-même n'est PAS publié, `offre.ts` en fait une règle : il est
 *     communicable sur demande, ce qui satisfait le III du même article.
 *   - Mentions légales, art. 1-1 I 5° LCEN, créé par la loi SREN : les tiers
 *     qui stockent des données traitées dans le cadre de l'édition du service
 *     doivent être nommés et adressés. Seul l'hébergeur l'était. Les cinq
 *     adresses ajoutées sont relevées sur les documents légaux de chaque
 *     prestataire (DPA, politique de confidentialité), pas sur l'audit, qui
 *     les donnait pour indicatives. Resend est exploité par PLUS FIVE FIVE,
 *     INC., et non par une « Resend, Inc. » qui n'existe pas.
 *   - Clause de délais (CGV, art. 4) : l'exclusion pure et simple de la
 *     résiliation privait de sa substance l'obligation de livrer (art. 1170
 *     C. civ.) et déséquilibrait les CGV (art. L. 442-1 I 2° C. com.). La
 *     réécriture oppose DÉLAI INDICATIF et DÉLAI DE RIGUEUR, sans citer aucun
 *     article : viser l'art. 1305 aurait signifié que l'obligation de livrer
 *     n'est jamais exigible, soit pire que le texte remplacé.
 *   - RGPD : moyen d'obtenir copie des garanties de transfert (art. 13.1.f),
 *     absence de décision automatisée (art. 13.2.f, due même en négatif),
 *     journaux du serveur annoncés en 2.2 mais absents des finalités de la
 *     section 3, et « rejeu anonyme » qui décrivait des données PSEUDONYMES.
 *   - Art. 19 LCEN, non abrogé par la loi SREN : indication claire et non
 *     ambiguë des prix, précisant si les taxes sont incluses. Ajoutée aux
 *     mentions légales. Aucun numéro de TVA intracommunautaire n'est inventé :
 *     le « le cas échéant » du 4° joue, la franchise en base n'en ouvre pas.
 *
 * NON TRANCHÉ, ET HORS DE CE FICHIER : le symbole ® de `siteConfig.brand.mark`
 * est une allégation sur les droits du professionnel tant qu'aucune marque
 * n'est déposée à l'INPI (art. L. 121-2 et L. 121-5 C. consom.). C'est une
 * décision d'identité de marque : elle appartient à Eliott, pas à un audit.
 *
 * ⚠️ RÈGLE MAINTENUE : aucun identifiant légal n'est inventé. Ce qui est écrit
 * ici a une source (extrait Sirene, registre des sociétés de Chypre, page
 * légale de l'hébergeur). Le test `legal.test.mjs` fige les valeurs publiées.
 */

/* Identité légale — source unique du fichier. Une seule ligne à changer si un
   de ces éléments bouge (déménagement, sortie de franchise en base, radiation). */
const IDENTITE = {
  /** Nom commercial imposé par l'art. R. 526-27 C. com. : le nom, suivi de « EI ». */
  denomination: "Eliott Bouquerel EI",
  adresse: "52 chemin de la Ferme du Jardin, 14400 Subles",
  siren: "105762231",
  siret: "10576223100014",
  // Date d'immatriculation AU RNE, relevee sur la synthese definitive du Guichet
  // unique (formalite J00246759070) : « Date d'immatriculation au RNE : 02/06/2026 ».
  // A ne pas confondre avec le DEBUT D'ACTIVITE, qui est le 1er juin. C'est cette
  // seconde date qui figurait ici : les mentions legales publiaient donc une date
  // d'immatriculation fausse.
  immatriculation: "2 juin 2026",
  // Date de DEBUT D'ACTIVITE declaree au guichet unique, distincte de
  // l'immatriculation au RNE ci-dessus. Les deux sont publiees pour que la
  // confusion qui a produit la date fausse ne puisse pas revenir.
  debutActivite: "1er juin 2026",
  ape: "62.01Z (programmation informatique)",
} as const;

/** Bloc de coordonnées répété en fin de chaque document. */
const contactDetails = [
  IDENTITE.denomination,
  IDENTITE.adresse,
  siteConfig.contact.phone,
  siteConfig.contact.email,
] as const;

/**
 * Date de dernière révision des trois documents. À réactualiser à chaque
 * modification de fond : c'est elle qui s'affiche en tête de page, et une date
 * fausse sur une politique de confidentialité est un défaut de conformité à
 * elle seule (art. 12 RGPD, information « à jour »).
 */
const lastUpdated = "2026-08-29";

export const legalDocuments: readonly LegalDocument[] = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    summary:
      "Qui édite ce site, qui l’héberge, et comment me joindre. Rien de plus, rien de moins.",
    lastUpdated,
    body: [
      { type: "heading", level: 2, text: "1. Éditeur du site" },
      {
        type: "paragraph",
        text: "Ce site est édité par Eliott Bouquerel, entrepreneur individuel. Je suis développeur, je travaille seul, et c’est moi que vous avez au téléphone.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          `Dénomination : ${IDENTITE.denomination}`,
          `Adresse du siège : ${IDENTITE.adresse}`,
          `Téléphone : ${siteConfig.contact.phone}`,
          `Adresse e-mail : ${siteConfig.contact.email}`,
          `SIREN : ${IDENTITE.siren}`,
          `SIRET du siège : ${IDENTITE.siret}`,
          `Immatriculation au registre national des entreprises (RNE) : ${IDENTITE.immatriculation}`,
          `Début d’activité : ${IDENTITE.debutActivite}`,
          `Code APE : ${IDENTITE.ape}`,
          "TVA non applicable, article 293 B du code général des impôts (franchise en base). Aucune TVA n’est facturée, aucune n’est récupérable.",
        ],
      },
      {
        type: "paragraph",
        text: "Prix affichés sur ce site : les montants indiqués s’entendent en euros et hors taxes. Aucune taxe ne s’y ajoute, la franchise en base de l’article 293 B du code général des impôts s’appliquant, et aucun frais de livraison n’est dû, la prestation étant immatérielle. Ces montants ne couvrent pas les services tiers souscrits à votre nom (nom de domaine, hébergement, licences), chiffrés à part. Le prix définitif d’une mission figure au devis.",
      },
      { type: "heading", level: 2, text: "2. Directeur de la publication" },
      {
        type: "paragraph",
        text: "Eliott Bouquerel, en sa qualité d’éditeur du site.",
      },
      { type: "heading", level: 2, text: "3. Hébergeur" },
      {
        type: "paragraph",
        text: "Le site est hébergé sur un serveur privé virtuel (VPS KVM2) situé dans un centre de données en France, opéré par :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Hostinger International Ltd, société de droit chypriote",
          "Registre des sociétés de Chypre, numéro HE 301365",
          "61 Lordou Vironos str., Lumiel Building, 4e étage, 6023 Larnaca, Chypre",
          "Téléphone : +370 645 03378",
          "Page de contact : https://www.hostinger.fr/contact",
        ],
      },
      { type: "heading", level: 2, text: "3 bis. Prestataires de stockage" },
      {
        type: "paragraph",
        text: "Outre l’hébergeur, les prestataires suivants stockent des données traitées dans le cadre de l’édition de ce site, au sens du 5° du I de l’article 1-1 de la LCEN :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "PostHog, Inc., 2261 Market St. #4008, San Francisco, CA 94114, États-Unis : mesure d’audience et enregistrement de session, après consentement, sur son instance européenne.",
          "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande : messagerie professionnelle, où arrivent et sont archivés les messages qui me sont adressés.",
          "Cal.com, Inc., 2261 Market Street #4382, San Francisco, CA 94114, États-Unis : prise de rendez-vous en ligne.",
          "Plus Five Five, Inc., qui exploite le service Resend, 2261 Market Street #5039, San Francisco, CA 94114, États-Unis : acheminement des e-mails déclenchés par le formulaire.",
          "Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis : protection anti-robot du formulaire (Turnstile).",
        ],
      },
      {
        type: "paragraph",
        text: "La liste complète des traitements, de leurs finalités et de leurs durées figure dans la politique de confidentialité, à l’adresse /legal/politique-de-confidentialite.",
      },
      { type: "heading", level: 2, text: "4. Propriété intellectuelle" },
      {
        type: "paragraph",
        text: "Les textes, visuels, graphismes, logo et code source de ce site sont protégés par le droit d’auteur. Vous pouvez les citer avec un lien vers la page d’origine. Les reproduire, les adapter ou les republier, en tout ou partie, demande mon accord écrit.",
      },
      {
        type: "paragraph",
        text: "Les livrables réalisés pour un client suivent un régime différent : ils lui sont cédés au paiement complet, dans les conditions prévues aux conditions générales de vente.",
      },
      { type: "heading", level: 2, text: "5. Ce que vaut le contenu du site" },
      {
        type: "paragraph",
        text: "Les informations publiées ici sont données à titre indicatif et tenues à jour du mieux que je peux. Elles ne valent ni engagement contractuel, ni conseil adapté à votre situation : seul un devis signé engage. Je fais le nécessaire pour que le site reste accessible, sans pouvoir garantir qu’il le sera en permanence.",
      },
      { type: "heading", level: 2, text: "6. Liens vers d’autres sites" },
      {
        type: "paragraph",
        text: "Certains liens mènent hors de ce site. Je n’ai la main ni sur leur contenu, ni sur ce qu’ils font de vos données. Les suivre relève de votre choix.",
      },
      { type: "heading", level: 2, text: "7. Données personnelles" },
      {
        type: "paragraph",
        text: "Ce que je collecte, pourquoi, pour combien de temps et comment reprendre la main : tout est détaillé dans la politique de confidentialité, à l’adresse /legal/politique-de-confidentialite.",
      },
      { type: "heading", level: 2, text: "8. Signaler un contenu" },
      {
        type: "paragraph",
        text: "Un contenu de ce site vous paraît illicite ou porte atteinte à vos droits ? Écrivez-moi en décrivant la page concernée et le motif. Je réponds et je corrige si c’est fondé, sans attendre une procédure.",
      },
      { type: "heading", level: 2, text: "9. Me joindre" },
      { type: "paragraph", text: contactDetails.join("\n") },
    ],
    seo: {
      title: "Mentions légales · Eliott Bouquerel",
      description:
        "Éditeur, directeur de la publication et hébergeur du site d’Eliott Bouquerel, développeur freelance en Normandie.",
    },
  },
  {
    slug: "politique-de-confidentialite",
    title: "Politique de confidentialité",
    summary:
      "Ce que je collecte, pourquoi, combien de temps, et comment reprendre la main. Sans brouillard.",
    lastUpdated,
    body: [
      { type: "heading", level: 2, text: "1. Qui traite vos données" },
      {
        type: "paragraph",
        text: "Eliott Bouquerel, entrepreneur individuel, dont les coordonnées figurent dans les mentions légales. Je suis seul à décider de ce qui est collecté et de ce qu’on en fait : je suis donc le responsable du traitement, au sens du RGPD.",
      },
      {
        type: "paragraph",
        text: "Aucun délégué à la protection des données n’est désigné : ni la taille de l’activité, ni la nature des traitements ne l’imposent. Vos demandes arrivent directement chez moi.",
      },
      { type: "heading", level: 2, text: "2. Ce que je collecte" },
      { type: "heading", level: 3, text: "2.1 Ce que vous me donnez" },
      {
        type: "paragraph",
        text: "Quand vous remplissez le formulaire, que vous réservez un créneau ou que vous m’écrivez :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Nom et prénom",
          "Adresse e-mail",
          "Numéro de téléphone, si vous le laissez",
          "Nom de votre entreprise, si vous le laissez",
          "Le contenu de votre message et des échanges qui suivent",
        ],
      },
      { type: "heading", level: 3, text: "2.2 Ce que la visite produit" },
      {
        type: "paragraph",
        text: "Le serveur et, si vous l’avez accepté, l’outil de mesure d’audience enregistrent des données techniques : adresse IP, navigateur et sa version, type d’appareil, page d’où vous venez, pages consultées et temps passé, clics et progression dans la page. La mesure d’audience ne démarre pas tant que vous ne l’avez pas acceptée.",
      },
      {
        type: "heading",
        level: 2,
        text: "3. Pourquoi, sur quelle base, pendant combien de temps",
      },
      {
        type: "paragraph",
        text: "Chaque ligne ci-dessous décrit une finalité, la base légale qui l’autorise, les données concernées et la durée de conservation.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Répondre à votre demande et préparer un devis. Base légale : mesures précontractuelles prises à votre demande (art. 6.1.b RGPD). Données : identité, coordonnées, entreprise, contenu du message. Durée : 3 ans à compter du dernier échange, si rien n’aboutit.",
          "Réaliser la prestation et en assurer le suivi. Base légale : exécution du contrat (art. 6.1.b RGPD). Données : identité, coordonnées, échanges, accès techniques confiés. Durée : 5 ans à compter de la fin de la mission, durée de la prescription commerciale.",
          "Tenir la comptabilité et répondre à l’administration fiscale. Base légale : obligation légale (art. 6.1.c RGPD). Données : identité, coordonnées de facturation, montants. Durée : 10 ans, article L. 123-22 du code de commerce.",
          "Bloquer les envois automatisés sur le formulaire. Base légale : intérêt légitime à protéger le service (art. 6.1.f RGPD). Données : signaux techniques du navigateur et adresse IP, traités par Cloudflare Turnstile. Durée : le temps de la vérification, aucune conservation de mon côté.",
          "Assurer le fonctionnement et la sécurité du serveur. Base légale : intérêt légitime à maintenir le service disponible et à détecter les abus (art. 6.1.f RGPD). Données : adresse IP, date et heure, page demandée, navigateur, code de réponse. Durée : 12 mois au maximum.",
          "Mesurer l’audience du site et comprendre ce qui vous a été utile. Base légale : votre consentement (art. 6.1.a RGPD), donné dans la bannière et retirable à tout moment. Données : pages vues, provenance, clics, progression, appareil, adresse IP. Cette adresse sert à situer la visite par pays, elle n’est jamais rapprochée de votre identité. Durée : 13 mois au maximum, conformément aux recommandations de la CNIL.",
          "Rejouer une navigation, sans identification nominative, pour repérer ce qui bloque. Base légale : votre consentement (art. 6.1.a RGPD), distinct du précédent. Données : parcours et interactions rattachés à un identifiant technique et non à votre nom, toute saisie étant masquée avant enregistrement. Durée : 1 mois.",
        ],
      },
      {
        type: "paragraph",
        text: "Vous n’êtes obligé de rien remplir. Sans nom ni adresse e-mail, en revanche, je n’ai pas de quoi vous répondre.",
      },
      { type: "heading", level: 2, text: "4. Qui d’autre y a accès" },
      {
        type: "paragraph",
        text: "Je ne vends aucune donnée et je n’en cède aucune à des fins publicitaires. Pour faire tourner le site et l’activité, je m’appuie sur les prestataires suivants, qui n’agissent que sur mes instructions et dans le cadre d’un contrat conforme à l’article 28 du RGPD :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Hostinger International Ltd (Chypre) : hébergement du site, sur un serveur situé en France.",
          "Cal.com, Inc. (États-Unis) : prise de rendez-vous en ligne, quand vous réservez un créneau.",
          "PostHog, Inc. (instance européenne) : mesure d’audience et enregistrement de session, uniquement après votre consentement. Les données restent hébergées dans l’Union européenne.",
          "Cloudflare, Inc. (États-Unis) : vérification anti-robot du formulaire (Turnstile).",
          "Plus Five Five, Inc., qui exploite Resend (États-Unis) : acheminement des e-mails déclenchés par le formulaire.",
          "Google Ireland Limited (Irlande) : messagerie professionnelle, où arrivent et sont archivés les messages que vous m’adressez.",
          "Indy (France) : devis, factures et signature électronique, une fois la relation engagée.",
        ],
      },
      {
        type: "paragraph",
        text: "S’y ajoutent mon comptable et l’administration fiscale, au titre de mes obligations comptables, ainsi que toute autorité qui en ferait la demande dans les formes prévues par la loi.",
      },
      {
        type: "heading",
        level: 2,
        text: "5. Transferts hors de l’Union européenne",
      },
      {
        type: "paragraph",
        text: "L’hébergement du site, la mesure d’audience et la facturation restent dans l’Union européenne. Quatre prestataires sont établis aux États-Unis, et les données qui leur sont confiées y transitent :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Cloudflare, Inc., Google LLC et Plus Five Five, Inc. (Resend) sont certifiés au titre du cadre de protection des données UE-États-Unis (Data Privacy Framework), qui bénéficie de la décision d’adéquation de la Commission européenne du 10 juillet 2023. Google Ireland Limited reste mon interlocuteur en Europe.",
          "Cal.com, Inc. : clauses contractuelles types de la Commission européenne (décision d’exécution (UE) 2021/914), assorties des mesures techniques prévues par ces clauses.",
        ],
      },
      {
        type: "paragraph",
        text: "Une copie des clauses contractuelles types applicables, ainsi que la référence de la certification de chaque prestataire, vous est communiquée sur simple demande à l’adresse indiquée en fin de page.",
      },
      {
        type: "paragraph",
        text: "Aucun autre transfert n’a lieu hors de l’Union européenne. Si un prestataire changeait, cette liste serait mise à jour avant que le changement prenne effet.",
      },
      { type: "heading", level: 2, text: "6. Cookies et traceurs" },
      {
        type: "paragraph",
        text: "Deux familles, et elles ne suivent pas les mêmes règles.",
      },
      {
        type: "heading",
        level: 3,
        text: "6.1 Sans consentement, parce qu’ils sont exemptés",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Le cookie qui mémorise votre choix de consentement, six mois, pour ne pas vous reposer la question à chaque page. Sans lui, refuser ne servirait à rien.",
          "Cloudflare Turnstile, déposé au moment où vous commencez à remplir le formulaire, pour distinguer un humain d’un robot. La CNIL range cette finalité de sécurité parmi les traceurs exemptés de consentement : il ne sert ni à vous reconnaître d’un site à l’autre, ni à mesurer quoi que ce soit.",
        ],
      },
      {
        type: "heading",
        level: 3,
        text: "6.2 Uniquement si vous l’acceptez",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "PostHog, pour la mesure d’audience : rien n’est déposé ni envoyé tant que vous n’avez pas accepté.",
          "PostHog, pour l’enregistrement de session : accepté séparément, et il dépend du précédent.",
        ],
      },
      {
        type: "paragraph",
        text: "Votre choix se modifie à tout moment par le lien « Gérer mes préférences de confidentialité » en pied de page. Refuser ne dégrade rien : le site fonctionne à l’identique. Votre navigateur permet aussi de bloquer les cookies, au risque de gêner d’autres sites que celui-ci.",
      },
      { type: "heading", level: 2, text: "7. Sécurité" },
      {
        type: "paragraph",
        text: "Les échanges avec le site sont chiffrés, les accès d’administration sont restreints et protégés, les sauvegardes sont régulières. Aucune transmission sur Internet n’est totalement sûre : je ne promets donc pas une sécurité absolue, je m’engage sur des mesures sérieuses et sur une information rapide en cas d’incident.",
      },
      { type: "heading", level: 2, text: "8. Vos droits" },
      {
        type: "paragraph",
        text: "Le RGPD et la loi Informatique et Libertés vous donnent les droits suivants sur vos données :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Y accéder et en obtenir une copie",
          "Les faire rectifier si elles sont inexactes ou incomplètes",
          "Les faire effacer",
          "En limiter le traitement",
          "Vous opposer à leur traitement, en particulier à toute prospection",
          "Les récupérer dans un format lisible par une machine, ou me demander de les transmettre ailleurs",
          "Retirer votre consentement quand vous voulez, sans que cela remette en cause ce qui a été fait avant",
          "Définir des directives sur ce qu’il advient de vos données après votre décès",
        ],
      },
      {
        type: "paragraph",
        text: "Une demande à l’adresse indiquée en fin de page suffit. Je réponds sous un mois. Un justificatif d’identité peut être demandé, mais seulement si un doute raisonnable existe sur qui écrit.",
      },
      {
        type: "paragraph",
        text: "Aucune décision produisant des effets juridiques à votre égard, ou vous affectant de manière significative, n’est prise de façon automatisée, et aucun profilage n’est réalisé.",
      },
      { type: "heading", level: 2, text: "9. Réclamation auprès de la CNIL" },
      {
        type: "paragraph",
        text: "Si ma réponse ne vous satisfait pas, ou si vous préférez ne pas passer par moi, vous avez le droit d’introduire une réclamation auprès de la Commission nationale de l’informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, ou en ligne sur www.cnil.fr.",
      },
      { type: "heading", level: 2, text: "10. Liens vers d’autres sites" },
      {
        type: "paragraph",
        text: "Certains liens mènent hors de ce site. Ce qui s’y passe échappe à cette politique : lisez la leur avant de leur confier quoi que ce soit.",
      },
      { type: "heading", level: 2, text: "11. Mises à jour" },
      {
        type: "paragraph",
        text: "Cette politique change quand le site, mes outils ou la réglementation changent. La date de dernière mise à jour figure en tête de page. Si une modification touche à ce que vous avez consenti, la question vous est reposée.",
      },
      { type: "heading", level: 2, text: "12. Me joindre" },
      {
        type: "paragraph",
        text: "Pour une question sur cette politique ou pour exercer un droit :",
      },
      { type: "paragraph", text: contactDetails.join("\n") },
    ],
    seo: {
      title: "Politique de confidentialité · Eliott Bouquerel",
      description:
        "Finalités, bases légales, durées de conservation, sous-traitants, transferts hors UE et droits RGPD sur les données collectées via ce site.",
    },
  },
  {
    slug: "conditions-generales-de-vente",
    title: "Conditions générales de vente",
    summary:
      "Comment on travaille ensemble : devis, paiement, délais, droits sur le livrable. Écrites pour être lues.",
    lastUpdated,
    body: [
      { type: "heading", level: 2, text: "1. Objet et champ d’application" },
      {
        type: "paragraph",
        text: "Ces conditions encadrent les prestations de conception, de développement et de suivi de sites et d’outils métier que je réalise sous le nom Eliott Bouquerel EI, entrepreneur individuel. Elles complètent le devis, qui prime sur elles en cas de contradiction.",
      },
      {
        type: "paragraph",
        text: "Je vends à des professionnels : entreprises, indépendants, associations, collectivités, agissant pour les besoins de leur activité. Je ne vends pas aux particuliers.",
      },
      {
        type: "paragraph",
        text: "Signer le devis vaut acceptation de ces conditions dans leur version en vigueur à cette date.",
      },
      { type: "heading", level: 2, text: "2. Devis et commande" },
      {
        type: "paragraph",
        text: "Toute prestation commence par un devis écrit et gratuit, qui décrit le périmètre, les livrables, le prix et l’échéancier. Il reste valable trente jours.",
      },
      {
        type: "paragraph",
        text: "La commande est ferme à la signature du devis, électronique ou manuscrite, et je ne commence pas avant. Un accord par téléphone ou par e-mail ne remplace pas cette signature : il nous exposerait tous les deux à un désaccord sur le périmètre.",
      },
      { type: "heading", level: 2, text: "3. Prix, échéancier et paiement" },
      {
        type: "paragraph",
        text: "Les prix de départ de chaque prestation sont publiés sur ce site et constituent le barème applicable. Aucun n’y est écrit à la main : tout montant affiché est le produit du nombre de jours ouvrés estimé pour le pack concerné par mon taux journalier en vigueur. Lorsqu’une prestation ne peut pas être chiffrée à l’avance, son prix est établi par la même méthode, estimation de la charge en jours multipliée par ce taux journalier, puis récapitulée dans un devis détaillé. Le taux journalier en vigueur, le détail du calcul et le devis correspondant sont communiqués sur simple demande à tout client professionnel, sur support durable.",
      },
      {
        type: "paragraph",
        text: "Les prix sont en euros et hors taxes. TVA non applicable, article 293 B du code général des impôts : aucune TVA n’est facturée, et vous n’en récupérez donc aucune.",
      },
      {
        type: "paragraph",
        text: "Aucun escompte n’est accordé en cas de paiement anticipé.",
      },
      {
        type: "paragraph",
        text: "Sauf mention contraire au devis, le prix se règle en trois fois :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "30 % à la signature du devis, avant le démarrage des travaux ;",
          "40 % à la remise de la première version fonctionnelle en recette ;",
          "30 % à la livraison.",
        ],
      },
      {
        type: "paragraph",
        text: "Chaque échéance donne lieu à une facture payable à trente jours date de facture, par virement.",
      },
      {
        type: "heading",
        level: 3,
        text: "3.1 Retard de paiement",
      },
      {
        type: "paragraph",
        text: "Toute facture impayée à l’échéance porte de plein droit, sans mise en demeure préalable, des pénalités de retard au taux de refinancement de la Banque centrale européenne majoré de dix points. Elles se calculent ainsi : montant TTC impayé × taux × nombre de jours de retard / 365.",
      },
      {
        type: "paragraph",
        text: "S’y ajoute une indemnité forfaitaire de recouvrement de 40 € par facture, prévue aux articles L. 441-10 et D. 441-5 du code de commerce. Si les frais de recouvrement réellement engagés dépassent ce montant, je peux en demander le complément sur justificatifs.",
      },
      {
        type: "paragraph",
        text: "Quinze jours après une mise en demeure restée sans effet, je peux suspendre les prestations en cours et les accès jusqu’au règlement complet. La suspension ne décale aucune de vos obligations et ne réduit aucune somme due.",
      },
      { type: "heading", level: 2, text: "4. Délais" },
      {
        type: "paragraph",
        text: "Les durées annoncées au devis sont des estimations. Elles valent délais indicatifs et non délais de rigueur, sauf mention expresse d’une date ferme au devis, qui vaut alors engagement.",
      },
      {
        type: "paragraph",
        text: "C’est un choix, et je l’assume : je préfère livrer un travail juste plutôt que tenir une date au prix de la qualité. Un dépassement raisonnable de ces estimations n’ouvre droit ni à pénalité, ni à réduction de prix.",
      },
      {
        type: "paragraph",
        text: "En contrepartie, je vous préviens dès qu’une date bouge, avec une nouvelle estimation et la raison. Si le retard devient significatif, vous pouvez me mettre en demeure d’exécuter dans un délai raisonnable ; passé ce délai sans exécution, vous conservez l’intégralité des droits que vous tenez des articles 1217 et suivants du code civil, y compris la résolution du contrat. Les sommes correspondant aux travaux effectivement réalisés restent alors dues.",
      },
      {
        type: "paragraph",
        text: "Si un jalon doit être ferme parce qu’il dépend d’un événement extérieur (ouverture, salon, campagne), dites-le avant la signature : cela se prévoit au devis, avec ce que cela implique, jamais après coup.",
      },
      {
        type: "paragraph",
        text: "Les délais sont suspendus de plein droit tant qu’un contenu, un accès, une validation ou une réponse attendus de votre part manquent. La reprise court à compter de la réception de l’élément manquant.",
      },
      { type: "heading", level: 2, text: "5. Ce que j’attends de vous" },
      {
        type: "paragraph",
        text: "La prestation suppose une collaboration réelle. Concrètement :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Vous fournissez les contenus, visuels, accès et informations nécessaires, dans un format exploitable.",
          "Vous désignez un interlocuteur unique, habilité à valider.",
          "Vous garantissez détenir les droits sur ce que vous me transmettez, et vous répondez des réclamations d’un tiers à ce sujet.",
          "Toute demande qui sort du périmètre du devis fait l’objet d’un devis complémentaire, accepté avant que j’y touche.",
        ],
      },
      { type: "heading", level: 2, text: "6. Recette et acceptation" },
      {
        type: "paragraph",
        text: "Chaque livraison ouvre une période de recette. Vous disposez de sept jours ouvrés pour me transmettre vos réserves par écrit, décrites de façon à être reproduites. Sans retour écrit dans ce délai, le livrable est réputé accepté.",
      },
      {
        type: "paragraph",
        text: "Mettre le livrable en ligne ou l’exploiter vaut également acceptation, même avant la fin des sept jours.",
      },
      { type: "heading", level: 2, text: "7. Retours et ajustements" },
      {
        type: "paragraph",
        text: "Le prix comprend une série de retours groupés par livrable : vous rassemblez vos remarques, je les traite en une passe d’ajustement. C’est la méthode qui donne le meilleur résultat, parce qu’elle permet d’arbitrer l’ensemble d’un coup au lieu d’empiler des correctifs qui se contredisent.",
      },
      {
        type: "paragraph",
        text: "Les demandes qui arrivent après cette passe, ou par vagues successives, sont facturées au temps passé sur devis complémentaire.",
      },
      {
        type: "paragraph",
        text: "Un défaut de conformité au devis n’est pas un retour : il est corrigé sans supplément, quel que soit le moment où il apparaît.",
      },
      { type: "heading", level: 2, text: "8. Droits sur les livrables" },
      {
        type: "paragraph",
        text: "Tant que le prix n’est pas intégralement encaissé, aucun droit ne vous est cédé : les livrables restent ma propriété et leur exploitation n’est pas autorisée.",
      },
      {
        type: "paragraph",
        text: "À compter de l’encaissement du solde, je vous cède à titre exclusif les droits patrimoniaux d’auteur sur les développements spécifiques réalisés pour vous, dans les termes suivants :",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Droits cédés, distinctement : le droit de reproduction, soit reproduire, enregistrer, stocker et dupliquer le code source, le code exécutable, les gabarits et la documentation sur tout support connu ; le droit de représentation, soit diffuser, communiquer au public et exécuter les livrables sur tout réseau ; le droit d’adaptation, soit modifier, corriger, faire évoluer, traduire, refondre et décompiler les livrables ; le droit de les intégrer à un ensemble plus large et de les associer à d’autres éléments.",
          "Étendue : cession exclusive, avec faculté de sous-licencier et de céder les droits à un tiers, notamment en cas de cession de votre fonds de commerce, de votre activité ou de votre société.",
          "Destination : tout usage lié à votre activité professionnelle, à titre commercial ou non, sur tout support numérique ou imprimé, en ligne comme hors ligne.",
          "Lieu : le monde entier.",
          "Durée : la durée légale de protection du droit d’auteur, prorogations comprises.",
        ],
      },
      {
        type: "paragraph",
        text: "Le prix de cette cession est compris dans le prix de la prestation figurant au devis. Le dépôt de code, son historique et la documentation de déploiement vous sont transmis au moment où la cession prend effet.",
      },
      {
        type: "paragraph",
        text: "Deux réserves, et elles sont classiques. D’abord, mon droit moral d’auteur reste attaché à ma personne : il est incessible, et je ne l’exercerai pas d’une manière qui gênerait votre exploitation. Ensuite, la cession ne porte que sur ce que j’ai écrit pour vous.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Les composants tiers (bibliothèques ouvertes, polices, visuels sous licence, services par abonnement) restent régis par leur propre licence, dont je vous remets la liste et dont vous faites votre affaire.",
          "Mes briques réutilisables et mes outils internes, antérieurs à la mission ou non spécifiques à votre projet, restent ma propriété. Je vous en concède un droit d’usage non exclusif, gratuit, mondial et pour la durée de protection, dans la seule mesure nécessaire à l’exploitation des livrables.",
        ],
      },
      { type: "heading", level: 2, text: "9. Hébergement et mise en ligne" },
      {
        type: "paragraph",
        text: "La prestation livre le code et sa documentation de déploiement. Elle ne comprend ni l’hébergement, ni la supervision, ni les mises à jour dans la durée : c’est une formule distincte, avec son prix et sa durée propres.",
      },
      {
        type: "paragraph",
        text: "Un déploiement sur votre infrastructure ou sur celle d’un prestataire que vous avez choisi est possible : il se chiffre séparément, parce que le travail dépend entièrement de l’environnement rencontré.",
      },
      { type: "heading", level: 2, text: "10. Références" },
      {
        type: "paragraph",
        text: "Sauf refus écrit de votre part, je peux citer votre nom et montrer les livrables dans mon portfolio et mes supports de présentation. Rien de confidentiel n’y figure.",
      },
      { type: "heading", level: 2, text: "11. Confidentialité" },
      {
        type: "paragraph",
        text: "Ce que vous me confiez pour les besoins de la mission reste entre nous, pendant la mission et trois ans après. Cela ne vaut évidemment pas pour les informations déjà publiques ni pour celles qu’une autorité m’obligerait à communiquer.",
      },
      { type: "heading", level: 2, text: "12. Responsabilité" },
      {
        type: "paragraph",
        text: "Je suis tenu d’une obligation de moyens, pas de résultat. Je mets en œuvre mon savoir-faire et l’état de l’art, sans pouvoir garantir un chiffre d’affaires, un classement dans un moteur de recherche, un volume de visites ou l’absence totale de défaut : ces résultats dépendent de facteurs qui ne sont pas entre mes mains.",
      },
      {
        type: "paragraph",
        text: "Ma responsabilité est limitée aux dommages directs et prévisibles, et plafonnée au montant hors taxes que j’ai effectivement perçu au titre de la prestation en cause. Sont exclus les dommages indirects, notamment la perte de chiffre d’affaires, de clientèle, de données, d’image ou d’opportunité commerciale.",
      },
      {
        type: "paragraph",
        text: "Je ne réponds pas non plus des faits qui m’échappent : défaillance d’un hébergeur ou d’un service tiers, intervention d’un autre prestataire sur le livrable, modification que vous y apportez, ou usage non conforme à la documentation remise.",
      },
      { type: "heading", level: 2, text: "13. Résiliation" },
      {
        type: "paragraph",
        text: "Chacun peut mettre fin au contrat en cas de manquement grave de l’autre, resté sans correction trente jours après une mise en demeure écrite. Les prestations déjà réalisées restent dues au prorata, et les sommes déjà versées restent acquises à hauteur du travail accompli.",
      },
      { type: "heading", level: 2, text: "14. Droit de rétractation" },
      {
        type: "paragraph",
        text: "Vous êtes un professionnel : le droit de rétractation ne s’applique pas, en principe. Il existe pourtant un cas où il joue, et je préfère vous le signaler plutôt que le passer sous silence.",
      },
      {
        type: "paragraph",
        text: "L’article L. 221-3 du code de la consommation étend la protection au professionnel qui conclut un contrat hors établissement, sans rapport direct avec son activité principale, à condition d’employer au plus cinq salariés. La Cour de cassation l’a reconnu à une architecte pour un contrat de création de site internet (1re chambre civile, 12 septembre 2018, n° 17-17.319). Cette disposition est d’ordre public : aucune clause ne peut l’écarter.",
      },
      {
        type: "paragraph",
        text: "En pratique, je ne fais jamais signer hors établissement : les devis se signent électroniquement, à distance. Si ce cas se présentait malgré tout, vous disposeriez de quatorze jours à compter de la conclusion du contrat pour vous rétracter, sans motif ni pénalité, en me l’écrivant ou en utilisant le formulaire figurant en annexe. Si vous m’avez expressément demandé de commencer avant la fin de ce délai, vous me devez le prix des prestations déjà réalisées.",
      },
      { type: "heading", level: 2, text: "15. Données personnelles" },
      {
        type: "paragraph",
        text: "Les données échangées dans le cadre de la mission sont traitées selon la politique de confidentialité, à l’adresse /legal/politique-de-confidentialite. Lorsque la prestation m’amène à traiter des données pour votre compte, un contrat de sous-traitance au sens de l’article 28 du RGPD est signé en complément.",
      },
      { type: "heading", level: 2, text: "16. Utilisation de ce site" },
      {
        type: "paragraph",
        text: "Le site s’utilise à des fins licites. En sont exclus l’aspiration automatisée du contenu, toute tentative de perturber son fonctionnement et l’usurpation de l’identité d’un tiers dans le formulaire.",
      },
      { type: "heading", level: 2, text: "17. Droit applicable et litiges" },
      {
        type: "paragraph",
        text: "Ces conditions sont soumises au droit français. En cas de différend, nous cherchons d’abord une solution amiable : un appel règle la plupart des désaccords, et je réponds.",
      },
      {
        type: "paragraph",
        text: "Aucune clause n’attribue compétence à un tribunal en particulier. À défaut d’accord, la juridiction compétente se détermine selon les règles du droit commun.",
      },
      { type: "heading", level: 2, text: "18. Modification" },
      {
        type: "paragraph",
        text: "Ces conditions peuvent évoluer. La version qui s’applique à une mission est celle en vigueur à la date de signature du devis, et elle ne change pas en cours de route.",
      },
      { type: "heading", level: 2, text: "19. Me joindre" },
      { type: "paragraph", text: contactDetails.join("\n") },
      {
        type: "heading",
        level: 2,
        text: "Annexe : formulaire type de rétractation",
      },
      {
        type: "paragraph",
        text: "À compléter et à renvoyer uniquement si vous relevez du cas décrit à l’article 14.",
      },
      {
        type: "paragraph",
        text: `À l’attention de ${IDENTITE.denomination}, ${IDENTITE.adresse}, ${siteConfig.contact.email} :\n\nJe vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous :\n\nDésignation de la prestation :\nCommandée le :\nNom du client :\nAdresse du client :\n\nDate :\nSignature (uniquement en cas de notification sur papier) :`,
      },
    ],
    seo: {
      title: "Conditions générales de vente · Eliott Bouquerel",
      description:
        "Devis, échéancier de paiement, délais, recette, cession des droits d’auteur et responsabilité : les conditions applicables à mes prestations.",
    },
  },
];
