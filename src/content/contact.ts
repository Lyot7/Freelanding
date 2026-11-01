import type { ContactContent } from "@/lib/content/types";
// FAQ = source unique dans faq.ts (identique à home / work, template partagé).
import { faqItems } from "@/content/faq";
import { siteConfig } from "@/content/site";

/**
 * Contenu de la page Contact — structure extraite de contact.html (archive
 * Framer), texte réécrit en français à la première personne du singulier.
 *
 * COORDONNÉES : e-mail et téléphone ne vivent PAS ici, ils sont lus depuis
 * `siteConfig.contact` (source unique, partagée avec le footer).
 */
export const contactContent: ContactContent = {
  hero: {
    title: "Montrez-moi ce qui vous bloque.",
    subtitle: "Si ce projet n’est pas pour moi, je vous le dis.",
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
      role: "Développeur à Caen",
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
  },
  faq: faqItems,
  seo: {
    // Marque alignée sur `siteConfig.meta.titleTemplate` (« %s · Eliott
    // Bouquerel ») : titre posé en `absolute`, le gabarit ne s'applique pas et
    // la marque est écrite ici. Le « ® » y avait survécu au retrait du
    // 2026-08-29, qui n'avait vidé que `brand.mark`.
    title: "Contact · Eliott Bouquerel",
    description:
      "Dites-moi ce que vous cherchez à régler. Je vous réponds sous 24 h ouvrées, même si c’est pour vous dire que ce n’est pas pour moi. Normandie, et France à distance.",
  },
};
