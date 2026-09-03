import type { ContactContent } from "@/lib/content/types";
// FAQ = source unique dans faq.ts (identique à home / work, template partagé).
import { faqItems } from "@/content/faq";
import { siteConfig } from "@/content/site";

/**
 * Contenu de la page Contact — structure extraite de contact.html (archive
 * Framer), texte réécrit en français à la première personne du singulier.
 *
 * COORDONNÉES : e-mail, téléphone et adresse ne vivent PAS ici, ils sont lus
 * depuis `siteConfig.contact` (source unique, partagée avec le footer). Les
 * valeurs fictives du template (Londres, +1 555…, hello@le-studio-d-origine) ont
 * été remplacées dans `src/content/site.ts` : l'adresse e-mail réelle est
 * `contact@eliottbouquerel.fr` et le téléphone reste volontairement vide.
 */
export const contactContent: ContactContent = {
  hero: {
    title: "Contact.",
    subtitle:
      "Voyons si je suis la bonne personne pour ton projet. Une conversation sur ce dont tu as besoin, et sur ce que je peux faire.",
    subtitleParagraphs: [
      {
        text: "Voyons si je suis la bonne personne pour ton projet. Une conversation sur ce dont tu as besoin, et sur ce que je peux faire.",
        emphasis: ["conversation", "ce que je peux faire."],
      },
    ],
  },
  // Surtitre du bloc coordonnées et photo, écrits en dur jusqu'ici.
  detailsEyebrow: "Me contacter",
  cover: {
    // Le visuel du template montrait trois inconnus. Remplacé par le mécanisme
    // d'horlogerie du hero, extrait de ma propre boucle : le bandeau raccorde
    // la page contact au reste du site sans mettre en scène personne.
    src: "/images/mecanisme-bandeau.jpg",
    alt: "",
  },
  intro: [
    "Chaque projet commence par une conversation. Dis-moi ce que tu cherches à régler, et je te dirai honnêtement si je suis la bonne personne pour le faire.",
    "Je te réponds sous 24 heures ouvrées, franchement, même si c’est pour te dire « ce projet n’est pas pour moi ».",
    // « JE VOUS DONNE UNE DATE DE DÉMARRAGE ESTIMÉE » A ÉTÉ RETIRÉ le
    // 2026-08-31 : c'est un engagement de planning qu'aucun mot d'Eliott ne
    // porte, sur la page même où le visiteur écrit. À sa place, ce que le
    // corpus dit du process : tout ce qui se décide se décide AVANT la
    // signature, et la signature déclenche le développement.
    "Avant toute signature, on cale ensemble le périmètre et la direction visuelle : ce que tu veux obtenir, ce qui te plaît, les références que tu as déjà trouvées. Le jour où tu signes, je commence à développer.",
  ],
  form: {
    name: { label: "Nom", placeholder: "Jean Dupont" },
    email: { label: "Ton adresse e-mail", placeholder: "exemple@email.com" },
    projectType: {
      label: "Tu cherches quoi ?",
      placeholder: "Choisis un type de projet",
      options: siteConfig.footerForm?.selectOptions ?? [],
    },
    message: {
      label: "Autre chose ?",
      placeholder: "Ton message ici…",
    },
    submitLabel: siteConfig.footerForm?.submitLabel ?? "Envoyer le message",
    disclaimer: {
      text:
        siteConfig.footerForm?.disclaimer ??
        "En envoyant ce formulaire, tu acceptes mes conditions et ma politique de confidentialité.",
      links: siteConfig.footerForm?.disclaimerLinks ?? siteConfig.legalLinks,
    },
  },
  contactCard: {
    // Le template mettait en avant une commerciale fictive (Anna Schneider,
    // « Head of Sales »). Eliott est seul : c'est lui l'interlocuteur.
    //
    // PHOTO REMISE le 2026-08-26. Le champ `avatar` avait été vidé faute de
    // portrait réel, et personne n'était revenu le remplir : la page qui
    // demande au visiteur de se lancer ne montrait donc PERSONNE, là où la
    // source pose un visage de 136 × 167 juste au-dessus du nom. Le cadre était
    // resté conditionnel (`person.avatar ? … : null`), l'absence ne cassait
    // rien et ne se voyait pas dans le code — seulement à l'écran, et elle
    // décalait de 128 px tout le bloc, signature comprise.
    //
    // Cadrage serré tête-et-épaules, au rapport 136/167 du cadre : au format
    // d'une carte de visite, un plan large rend le visage illisible.
    person: {
      name: "Eliott Bouquerel",
      role: "Développeur freelance",
      avatar: {
        src: "/images/eliott-nature-carte.jpg",
        // Le nom est écrit en toutes lettres à trois centimètres de là : le
        // décrire une seconde fois ferait dire deux fois la même chose à un
        // lecteur d'écran. Le portrait est donc décoratif au sens WCAG.
        alt: "",
        width: 680,
        height: 835,
      },
    },
    email: siteConfig.contact.email,
    phone: siteConfig.contact.phone,
    address: siteConfig.contact.address,
    // La page contact intitule les blocs « Adresse » / « Téléphone », là où le
    // footer utilise « Où me trouver ». Les deux libellés coexistent.
    // « Localisation » plutôt qu'« Adresse » : pas de bureau public, la valeur
    // attendue est une zone d'intervention.
    addressLabel: "Localisation",
    phoneLabel: "Téléphone",
    availability: siteConfig.availability,
  },
  faq: faqItems,
  seo: {
    // Marque alignée sur `siteConfig.meta.titleTemplate` (« %s · Eliott
    // Bouquerel ») : titre posé en `absolute`, le gabarit ne s'applique pas et
    // la marque est écrite ici. Le « ® » y avait survécu au retrait du
    // 2026-08-29, qui n'avait vidé que `brand.mark`.
    title: "Contact · Eliott Bouquerel",
    description:
      "Dis-moi ce que tu cherches à régler. Je te réponds sous 24 heures ouvrées, même si c’est pour te dire que ce n’est pas pour moi. Normandie, et France à distance.",
  },
};
