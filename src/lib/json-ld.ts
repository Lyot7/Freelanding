import type { FaqItem, HomeContent, SiteConfig, WorkItem } from "@/lib/content/types";
import { prixPackHT, type Prestation } from "@/content/offre";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Données structurées schema.org.
 *
 * POURQUOI : un moteur, classique ou génératif, lit une page comme du texte. Il
 * devine qui parle, ce qui est vendu et où. Le JSON-LD arrête de le faire
 * deviner : il déclare l'identité, l'offre, la zone d'intervention et les
 * questions-réponses dans un format que Google, Bing et les assistants
 * consomment directement. C'est ce qui rend un site CITABLE, là où le bouton
 * « source préférée » ne fait que servir ceux qui se sont déjà abonnés.
 *
 * RÈGLE TENUE ICI : tout vient de la donnée du site. Un balisage qui affirme
 * autre chose que la page est une déclaration trompeuse pour les moteurs, et
 * c'est sanctionné — recopier à la main des prix ou une zone d'intervention
 * garantissait qu'ils divergeraient au premier changement.
 */

/** Retire les clés vides : schema.org préfère un champ absent à un champ nul. */
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  ) as T;
}

const PERSON_ID = absoluteUrl("/#eliott");
const BUSINESS_ID = absoluteUrl("/#service");

/**
 * Le numéro au format international E.164, tel que schema.org l'attend.
 *
 * La donnée est saisie une seule fois dans `site.ts`, au format français
 * (« 06 32 21 37 11 »), parce que c'est ce format-là qui s'affiche sur le site.
 * Republier tel quel un numéro national dans le balisage laisserait un moteur
 * deviner le pays : sur un site en français hébergé n'importe où, ce n'est pas
 * une garantie, et c'est exactement le genre d'ambiguïté qui empêche de
 * rattacher l'entité à sa fiche d'établissement.
 *
 * Seul le `0` de tête d'un numéro français à dix chiffres est converti en
 * `+33`. Un numéro déjà international passe inchangé, et toute autre forme est
 * renvoyée telle quelle plutôt que transformée au hasard.
 */
function telephoneE164(phone: string): string | undefined {
  const chiffres = phone.replace(/[^\d+]/g, "");
  if (!chiffres) return undefined;
  if (chiffres.startsWith("+")) return chiffres;
  if (/^0\d{9}$/.test(chiffres)) return `+33${chiffres.slice(1)}`;
  return chiffres;
}

/** La personne. C'est elle que cite un assistant quand on demande « qui ». */
export function personSchema(site: SiteConfig) {
  return compact({
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.contact.person?.name ?? site.brand.name,
    jobTitle: site.contact.person?.role,
    url: absoluteUrl("/a-propos"),
    email: site.contact.email ? `mailto:${site.contact.email}` : undefined,
    image: site.credits?.createdByAvatar
      ? absoluteUrl(site.credits.createdByAvatar.src)
      : undefined,
    sameAs: site.socials?.filter((s) => s.external).map((s) => s.href),
    worksFor: { "@id": BUSINESS_ID },
  });
}

/**
 * Les deux bornes d'un prix affiché, telles que schema.org les attend.
 *
 * CE QUE ÇA RÉPARE. `fourchette()` rend « de 3 000 € à 7 200 € ». La version
 * précédente en retirait tout ce qui n'était pas un chiffre, ce qui collait les
 * deux montants l'un derrière l'autre : `minPrice: 30007200`. Le site vitrine
 * était donc balisé à trente millions d'euros, et les trois prestations
 * chiffrées annonçaient chacune un montant absurde aux moteurs — Google, Bing
 * et les assistants lisent ce champ, pas le texte à côté.
 *
 * POURQUOI DEUX BORNES ET NON UNE. Depuis le passage des en-têtes à la
 * fourchette entière (2026-09-02), la page affiche un bas ET un haut. Ne
 * baliser que `minPrice` redirait « dès X » quand la page dit « de X à Y » :
 * un balisage qui affirme autre chose que la page est une déclaration
 * trompeuse. Les deux bornes, ou aucune.
 *
 * LE DÉCOUPAGE EST FAIT SUR LES GROUPES DE CHIFFRES, pas sur le mot « à » :
 * `euros()` insère des insécables dans les milliers, et le séparateur lui-même
 * a déjà changé une fois. Ce qui ne change pas, c'est qu'un montant est une
 * suite de chiffres et d'espaces, et qu'il y en a un ou deux.
 *
 * `\s` AVEC LE DRAPEAU `u` COUVRE LES DEUX INSÉCABLES, l'ordinaire (U+00A0)
 * que produit `euros()` comme l'étroite (U+202F) des versions récentes d'ICU.
 * Les écrire en clair dans la classe de caractères rouvrait exactement le piège
 * que le commentaire d'`euros()` décrit : dans un diff comme à l'écran, une
 * insécable ne se distingue pas d'une espace ordinaire.
 */
function bornesPrix(prix: string | undefined) {
  if (!prix) return undefined;

  const montants = (prix.match(/\d[\d\s]*/gu) ?? [])
    .map((m) => Number.parseInt(m.replace(/\s/gu, ""), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!montants.length) return undefined;

  return compact({
    "@type": "PriceSpecification",
    priceCurrency: "EUR",
    minPrice: Math.min(...montants),
    // Absent quand la page n'annonce qu'un seul montant : déclarer un plafond
    // égal au plancher fermerait une offre que la page laisse ouverte.
    maxPrice: montants.length > 1 ? Math.max(...montants) : undefined,
  });
}

/**
 * L'activité, ses prestations et sa zone. `areaServed` est ce qui fait la
 * différence sur une recherche locale : sans lui, rien ne relie le site à la
 * Normandie autrement que par un mot dans un paragraphe.
 */
export function businessSchema(site: SiteConfig, home: HomeContent) {
  const offres = home.services.items.map((service) =>
    compact({
      "@type": "Offer",
      name: service.title,
      description: service.body[0],
      // Le prix affiché est un point d'entrée (« dès ») : `Offer` le dit
      // avec `priceSpecification`, pas avec `price`, qui annoncerait un tarif
      // ferme et deviendrait un prix trompeur.
      priceCurrency: "EUR",
      priceSpecification: bornesPrix(service.price),
    }),
  );

  return compact({
    "@type": "ProfessionalService",
    "@id": BUSINESS_ID,
    // LE NOM DE L'ENTITÉ, PAS CELUI DU LOGO. Alignement NAP du 2026-09-08 :
    // `brand.name` vaut « Bouquerel », qui est la marque affichée en en-tête,
    // quand la fiche Google et le registre disent « Eliott Bouquerel ». Le
    // premier des trois champs que les moteurs recoupent pour rattacher un site
    // à sa fiche est le nom : le faire diverger de la fiche, c'est demander à
    // Google de trancher entre deux entités possibles.
    //
    // `alternateName` garde la marque courte : elle reste ce qu'on lit sur le
    // site, et un moteur qui la rencontre ailleurs sait à qui la rattacher.
    name: site.contact.person?.name ?? `${site.brand.name}${site.brand.mark}`,
    alternateName: `${site.brand.name}${site.brand.mark}`,
    description: site.meta.description,
    url: absoluteUrl("/"),
    // Sans `logo` declare, Google choisit seul la vignette de l'entite et
    // s'appuie sur ce qu'il a garde en cache : sur un domaine qui a deja servi
    // un autre site, c'est l'ancienne marque qui ressort. `apple-icon.png` fait
    // 180x180, au-dessus du minimum de 112x112 exige pour un logo.
    logo: absoluteUrl("/apple-icon.png"),
    image: absoluteUrl("/apple-icon.png"),
    email: site.contact.email ? `mailto:${site.contact.email}` : undefined,
    telephone: telephoneE164(site.contact.phone),
    founder: { "@id": PERSON_ID },
    areaServed: site.contact.address
      ? site.contact.address.split(/,\s*(?:et\s+)?/).map((zone) => ({
          "@type": "AdministrativeArea",
          name: zone.trim(),
        }))
      : undefined,
    knowsLanguage: ["fr-FR"],
    hasOfferCatalog: offres.length
      ? { "@type": "OfferCatalog", name: "Prestations", itemListElement: offres }
      : undefined,
  });
}

/** Les questions-réponses. Format directement réutilisé par les moteurs. */
export function faqSchema(items: readonly FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/**
 * Le fil d'Ariane, sous la forme que Google consomme.
 *
 * UNE SEULE IMPLÉMENTATION POUR TOUT LE SITE. Elle était écrite en dur dans
 * `workSchema` ; la recopier pour les pages de prestation aurait donné deux
 * fils d'Ariane à faire évoluer ensemble, exactement la classe d'erreur que
 * `offre.ts` a fermée sur les prix.
 *
 * LA DERNIÈRE MARCHE N'A PAS D'ADRESSE, et ce n'est pas un oubli : c'est la
 * page courante. Lui donner un `item` la ferait se déclarer comme un lien vers
 * elle-même. Le type `item?` le rend impossible à oublier autrement.
 */
export function breadcrumbSchema(
  marches: readonly { name: string; item?: string }[],
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: marches.map((marche, index) =>
      compact({
        "@type": "ListItem",
        position: index + 1,
        name: marche.name,
        item: marche.item,
      }),
    ),
  };
}

/** Une étude de cas, et le fil d'Ariane qui la situe. */
export function workSchema(work: WorkItem) {
  return [
    compact({
      "@type": "CreativeWork",
      name: work.title,
      description: work.overview,
      url: absoluteUrl(`/realisations/${work.slug}`),
      image: absoluteUrl(work.cover.src),
      dateCreated: work.year,
      creator: { "@id": PERSON_ID },
      keywords: work.categories.join(", "),
    }),
    breadcrumbSchema([
      { name: "Accueil", item: absoluteUrl("/") },
      { name: "Réalisations", item: absoluteUrl("/realisations") },
      { name: work.title },
    ]),
  ];
}

/**
 * UNE PRESTATION CHIFFRÉE, ET SES TROIS PÉRIMÈTRES.
 *
 * POURQUOI CE NŒUD EXISTE. La page d'accueil déclare cinq types de données
 * structurées ; les trois pages qui portent réellement l'offre, ses périmètres
 * et ses prix n'en déclaraient AUCUN. Un moteur y voyait trois pages de texte
 * sans savoir qu'elles vendent quelque chose, ni à quel prix.
 *
 * `Service` PORTANT DES `Offer`, et non l'inverse : c'est le vocabulaire déjà
 * employé par `businessSchema`, où chaque prestation de l'accueil est une
 * `Offer` du catalogue de l'activité. Le `provider` pointe sur le même `@id`,
 * donc les trois pages se rattachent à l'entité de l'accueil au lieu de
 * décrire une quatrième activité anonyme.
 *
 * LES PRIX SONT CALCULÉS, JAMAIS ÉCRITS. `prixPackHT` descend du taux
 * journalier comme tout le reste du site ; un montant recopié ici aurait
 * divergé au premier changement de curseur, et cette fois SANS être visible à
 * l'écran, donc sans que personne le voie jamais.
 *
 * `priceSpecification` PLUTÔT QUE `price` : le montant est un prix HORS TAXES.
 * Le déclarer en `price` nu laisserait entendre un prix toutes taxes comprises,
 * ce qui serait un prix trompeur pour un lecteur qui n'est pas assujetti.
 */
export function serviceSchema(prestation: Prestation, description: string) {
  return compact({
    "@type": "Service",
    name: prestation.nom,
    description,
    url: absoluteUrl(`/services/${prestation.slug}`),
    serviceType: prestation.nom,
    provider: { "@id": BUSINESS_ID },
    areaServed: { "@type": "Country", name: "France" },
    offers: prestation.packs.map((pack) => ({
      "@type": "Offer",
      name: pack.nom,
      description: pack.promesse,
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "EUR",
        price: prixPackHT(pack),
        valueAddedTaxIncluded: false,
      },
    })),
  });
}

/**
 * UN ARTICLE, ET LE FIL D'ARIANE QUI LE SITUE.
 *
 * POURQUOI CE NŒUD EXISTE. L'accueil déclarait cinq types de données
 * structurées, `/realisations/*` et `/services/*` le leur, et les SEIZE
 * articles du blog n'en déclaraient AUCUN. Mesuré le 2026-09-07 sur le HTML
 * servi en production : zéro bloc `application/ld+json` sur `/blog/*`. Un
 * moteur y lisait du texte sans savoir que c'était un article, qui l'avait
 * écrit, ni quand — c'est-à-dire sans aucun des signaux d'auteur et de
 * fraîcheur sur lesquels il classe une page éditoriale.
 *
 * `BlogPosting` ET NON `Article` : les deux sont acceptés, le premier est le
 * sous-type exact et n'exige rien de plus.
 *
 * L'AUTEUR POINTE SUR `@id` PLUTÔT QUE DE SE REDÉCRIRE. La personne est déjà
 * décrite par `personSchema` sur l'accueil ; répéter ici son nom et sa photo
 * créerait une seconde entité homonyme au lieu de renforcer la première.
 *
 * `dateModified` VAUT `datePublished` FAUTE DE MIEUX, et c'est volontaire : le
 * modèle ne porte pas de date de révision. En inventer une, ou pire y mettre la
 * date du jour à chaque construction, annoncerait une fraîcheur que le contenu
 * n'a pas. Le jour où une date de révision existera, elle se branchera ici.
 */
export function articleSchema(post: {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover: { src: string };
  seo?: { title?: string; description?: string };
}) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return [
    compact({
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: post.seo?.title ?? post.title,
      description: post.seo?.description ?? post.excerpt,
      url,
      mainEntityOfPage: url,
      image: absoluteUrl(post.cover.src),
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: "fr-FR",
      author: { "@id": PERSON_ID },
      publisher: { "@id": BUSINESS_ID },
    }),
    breadcrumbSchema([
      { name: "Accueil", item: absoluteUrl("/") },
      { name: "Blog", item: absoluteUrl("/blog") },
      { name: post.title },
    ]),
  ];
}

/**
 * Assemble un graphe unique. Un seul bloc par page plutôt qu'un script par
 * entité : les `@id` relient alors les nœuds entre eux (la personne travaille
 * pour l'activité) au lieu de laisser trois objets sans rapport.
 */
export function graph(...nodes: unknown[]) {
  return { "@context": "https://schema.org", "@graph": nodes.flat() };
}
