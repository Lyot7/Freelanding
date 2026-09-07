import { Suspense } from "react";
import { Grain } from "@/components/effects/Grain";
import { ReservationAvecSujet } from "@/components/rendez-vous/ReservationAvecSujet";
import { ReservationRendezVous } from "@/components/rendez-vous/ReservationRendezVous";
import { rendezVousContent } from "@/content/rendez-vous";
import { resoudreConfiguration } from "@/lib/rendez-vous/config";
import type { IdRendezVous } from "@/content/rendez-vous";

/**
 * Section « prendre rendez-vous » — composant SERVEUR.
 *
 * IL DÉCIDE SI LA SECTION EXISTE, et c'est sa seule vraie responsabilité. La
 * lecture de `process.env` reste ici : le composant client ne doit connaître ni
 * le nom d'utilisateur Cal.com, ni les identifiants d'événement, ni même le
 * fait qu'il y en a. Il reçoit une liste de types déjà filtrée.
 *
 * AUCUNE VARIABLE = AUCUNE SECTION. Pas un bloc grisé, pas un message
 * d'attente, pas une iframe vide : rien du tout, et le reste de la page
 * fonctionne à l'identique. C'est l'état par défaut du dépôt (Eliott n'a pas
 * encore créé ses types d'événements) et c'est le comportement testé.
 *
 * CONSÉQUENCE À CONNAÎTRE : `process.env` est lu au RENDU. Sur une page
 * prérendue à la construction, la valeur y est figée. Poser les variables ne
 * suffit donc pas, il faut redéployer — c'est écrit dans `docs/CAL-COM.md`.
 *
 * LE SUJET PEUT ARRIVER PAR L'URL (`?sujet=site`), depuis les boutons de
 * l'accordéon des prestations. La lecture du paramètre est isolée dans un
 * composant client derrière `Suspense` : `useSearchParams` fait basculer toute
 * la page en rendu dynamique quand rien ne l'encadre, et `/contact` doit rester
 * prérendue pour les visites sans paramètre, qui sont la règle. Le repli de la
 * frontière rend le MÊME bloc sans présélection, jamais `null` : le HTML servi
 * porte donc la prise de rendez-vous entière dans tous les cas.
 *
 * Le fond sombre n'est pas décoratif non plus : sur `/contact`, il s'intercale
 * entre le corps clair et la FAQ claire, et redonne au bas de page l'alternance
 * sombre/clair du reste du site.
 */
/**
 * `typeImpose` : la page CONNAÎT déjà le sujet, il n'y a rien à lire dans l'URL.
 *
 * Sur `/contact`, le sujet vient du paramètre `?sujet=` et doit donc être lu
 * côté client, derrière une frontière `Suspense`. Sur une page de prestation, la
 * prestation EST le sujet : le passer en propriété évite la frontière, évite le
 * rendu dynamique, et surtout évite au visiteur de choisir une case qu'il vient
 * déjà de choisir en ouvrant la page.
 */
export function SectionRendezVous({
  emailContact,
  typeImpose,
}: {
  emailContact: string;
  typeImpose?: IdRendezVous;
}) {
  const { typesDisponibles } = resoudreConfiguration();
  if (typesDisponibles.length === 0) return null;

  // L'ORDRE vient du contenu, pas de l'environnement : `typesDisponibles` sert
  // de filtre, `rendezVousContent.types` de source de vérité pour la suite.
  const types = rendezVousContent.types.filter((type) =>
    typesDisponibles.includes(type.id),
  );

  return (
    <section
      id="rendez-vous"
      className="relative flex w-full justify-center bg-background px-[20px] py-[50px] text-foreground tablet:px-[24px] tablet:py-[80px] desktop:px-[30px]"
    >
      {/* Même opacité que les autres calques de `/contact` (relevé : 0,05). */}
      <Grain opacity={0.05} className="z-[1]" />
      {/* Filet central, signature de la grille du site. Il ne descend qu'à
          partir de 810, comme partout : sous ce seuil la page est en une seule
          colonne et le filet couperait le contenu. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 z-[2] hidden w-px bg-white/[0.08] tablet:block"
      />

      <div className="relative z-[3] grid w-full max-w-[1440px] grid-cols-1 gap-[30px] tablet:grid-cols-2 tablet:gap-0">
        <div className="flex flex-col gap-[16px] tablet:pr-[40px]">
          <p className="text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
            {rendezVousContent.eyebrow}
          </p>
          {/* DEUX ÉCARTS ASSUMÉS avec les autres titres de section du site, et
              ils ont la même cause : ce titre-ci s'écrit sur deux lignes ET
              porte deux capitales accentuées, une par ligne.

              1. INTERLIGNAGE À 0,88 et non 0,82. Mesuré dans Geist, l'encre
                 d'un « É » monte à 0,91em au-dessus de la ligne de base quand
                 la boîte de ligne n'en offre que 0,82 : l'accent de « CRÉNEAU »
                 se posait sur le pied de « RÉSERVER ». Les titres du site qui
                 tiennent 0,82 le peuvent parce qu'ils enveloppent chaque ligne
                 dans sa propre boîte (`accent-room`), ce que ce titre ne fait
                 pas : il se coupe tout seul, à un endroit qui dépend de la
                 largeur.
              2. AUCUN MASQUE DE COUPE. Sans `overflow` sur un seul ancêtre,
                 rien ne peut raser les accents par le haut — c'est le défaut
                 que `.accent-clip-titre` répare ailleurs, et il n'existe pas
                 ici. */}
          <h2 className="m-0 text-[44px] font-semibold uppercase leading-[0.88] tracking-[-0.05em] text-foreground tablet:text-[52px] desktop:text-[68px]">
            {rendezVousContent.titre}
          </h2>
          <p className="max-w-[380px] text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
            {rendezVousContent.chapeau}
          </p>
        </div>

        <div className="tablet:pl-[40px]">
          {typeImpose ? (
            <ReservationRendezVous
              types={types}
              emailContact={emailContact}
              typeInitial={
                typesDisponibles.includes(typeImpose) ? typeImpose : undefined
              }
            />
          ) : (
            <Suspense
              fallback={
                <ReservationRendezVous types={types} emailContact={emailContact} />
              }
            >
              <ReservationAvecSujet types={types} emailContact={emailContact} />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
}
