"use client";

/**
 * Lecture de `?sujet` pour le double formulaire du pied de page — composant
 * CLIENT, derrière sa propre frontière `Suspense` (même motif et mêmes raisons
 * que `ReservationAvecSujet` : sans frontière, toute la page passerait en rendu
 * dynamique).
 *
 * DEPUIS LE 2026-10-16, le pied de page porte le SEUL formulaire du site
 * (message ou rendez-vous). Les liens `lienRendezVous` mènent à
 * `/contact?sujet=…#rendez-vous` : un sujet valide ouvre donc l'onglet
 * rendez-vous, où `ReservationAvecSujet` le présélectionne. La `key` remonte le
 * bloc quand le sujet change, pour une navigation entre deux liens.
 */
import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { PARAM_SUJET } from "@/content/rendez-vous";
import { resoudreSujet } from "@/lib/rendez-vous/config";
import { FooterContact } from "./FooterContact";

export function FooterContactAvecSujet(
  props: Omit<ComponentProps<typeof FooterContact>, "ongletInitial">,
) {
  const sujet = resoudreSujet(useSearchParams().get(PARAM_SUJET));
  return (
    <FooterContact
      key={sujet ?? ""}
      {...props}
      ongletInitial={sujet ? "rendezVous" : "message"}
    />
  );
}
