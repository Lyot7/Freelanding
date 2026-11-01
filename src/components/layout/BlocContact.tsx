import { Suspense } from "react";
import { ReservationAvecSujet } from "@/components/rendez-vous/ReservationAvecSujet";
import { ReservationRendezVous } from "@/components/rendez-vous/ReservationRendezVous";
import { rendezVousContent } from "@/content/rendez-vous";
import type { IdRendezVous } from "@/content/rendez-vous";
import { content } from "@/lib/content";
import { resoudreConfiguration } from "@/lib/rendez-vous/config";
import { FooterContact } from "./FooterContact";
import { FooterContactAvecSujet } from "./FooterContactAvecSujet";
// Le formulaire est un composant CLIENT ; ce bloc reste serveur.
import { FooterContactForm } from "./FooterContactForm";

/** Liens de la mention légale : blanc, accent au survol. */
const LIEN_EN_LIGNE =
  "text-foreground no-underline transition-colors duration-200 hover:text-accent";

/**
 * LE SEUL FORMULAIRE DU SITE (message ou rendez-vous), monté par le pied de page
 * et, sur `/contact`, directement dans le héros. Les replis de `Suspense` rendent
 * le même bloc sans lecture de `?sujet` : le HTML servi porte les deux formulaires.
 */
export async function BlocContact({ sujetRendezVous }: { sujetRendezVous?: IdRendezVous }) {
  const { contact, footerForm } = await content.getSiteConfig();
  if (!footerForm) return null;

  // Mêmes types de rendez-vous partout : ceux dont l'événement Cal.com est
  // configuré. Aucun = pas d'onglet rendez-vous.
  const { typesDisponibles } = resoudreConfiguration();
  const types = rendezVousContent.types.filter((type) => typesDisponibles.includes(type.id));
  const message = (
    <FooterContactForm
      footerForm={footerForm}
      emailContact={contact.email}
      inlineLinkCls={LIEN_EN_LIGNE}
    />
  );

  if (sujetRendezVous) {
    return (
      <FooterContact
        modes={footerForm.modes}
        message={message}
        rendezVous={
          types.length > 0 ? (
            <ReservationRendezVous
              types={types}
              emailContact={contact.email}
              typeInitial={types.some((type) => type.id === sujetRendezVous) ? sujetRendezVous : undefined}
            />
          ) : undefined
        }
      />
    );
  }

  return (
    <Suspense
      fallback={
        <FooterContact
          modes={footerForm.modes}
          message={message}
          rendezVous={
            types.length > 0 ? (
              <ReservationRendezVous types={types} emailContact={contact.email} />
            ) : undefined
          }
        />
      }
    >
      <FooterContactAvecSujet
        modes={footerForm.modes}
        message={message}
        rendezVous={
          types.length > 0 ? (
            <ReservationAvecSujet types={types} emailContact={contact.email} />
          ) : undefined
        }
      />
    </Suspense>
  );
}
