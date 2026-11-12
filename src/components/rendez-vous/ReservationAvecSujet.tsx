"use client";

/**
 * Lecture de `?sujet`, et rien d'autre — composant CLIENT.
 *
 * POURQUOI IL EXISTE SÉPARÉMENT. `useSearchParams` impose sa frontière
 * `Suspense` : sans elle, Next bascule TOUTE la page `/contact` en rendu
 * dynamique, y compris pour les visites sans paramètre, c'est-à-dire la quasi-
 * totalité. Le motif est celui de `PageAnalytics` : un composant minuscule qui
 * ne fait que lire l'URL, isolé derrière sa propre frontière.
 *
 * LE REPLI N'EST PAS `null`, contrairement à `PageAnalytics`. Celui-ci ne rend
 * rien de visible ; ici le repli est ce que voit un visiteur avant hydratation,
 * et ce que lit un moteur. Un `null` retirerait la prise de rendez-vous entière
 * du HTML servi — exactement le défaut qu'on est en train de corriger. Le repli
 * est donc le même bloc, sans présélection : le pire cas est un sujet à cocher
 * à la main, jamais un bloc absent.
 *
 * UN ANCIEN SUJET EST TRADUIT : `?sujet=outil`, fusionné dans « logiciel » le
 * 2026-09-23, présélectionne « logiciel » (`resoudreSujet`).
 *
 * UN SUJET INCONNU EST IGNORÉ EN SILENCE. `?sujet=nimportequoi`, ou un sujet
 * réel quand le cockpit n'est pas configuré, retombent sur
 * l'absence de sélection. Pas de message d'erreur : le visiteur n'a rien
 * demandé de faux, c'est un lien qui a vieilli.
 */

import { useSearchParams } from "next/navigation";
import { ReservationRendezVous } from "@/components/rendez-vous/ReservationRendezVous";
import { PARAM_SUJET } from "@/content/rendez-vous";
import type { TypeRendezVous } from "@/content/rendez-vous";
import { resoudreSujet, typesClient, typesVisibles } from "@/lib/rendez-vous/config";

export function ReservationAvecSujet({
  types,
  emailContact,
  client = false,
}: {
  types: readonly TypeRendezVous[];
  emailContact: string;
  /** Page `/rdv/client` : les sujets de clients au lieu de ceux du premier rendez-vous. */
  client?: boolean;
}) {
  const demande = resoudreSujet(useSearchParams().get(PARAM_SUJET));
  // Deux filtres, pas un : le sujet doit être connu du contenu ET réellement
  // configuré. `types` est déjà réduit aux seconds par le composant serveur.
  // Un sujet réservé aux clients ne se montre que s'il est demandé.
  const proposes = client ? typesClient(types) : typesVisibles(types, demande);
  const typeInitial =
    demande && proposes.some((type) => type.id === demande) ? demande : undefined;

  return (
    <ReservationRendezVous
      types={proposes}
      emailContact={emailContact}
      typeInitial={typeInitial}
    />
  );
}
