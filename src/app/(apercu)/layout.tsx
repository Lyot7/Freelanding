/**
 * Layout racine de l'APERÇU DES ARTICLES, montré dans le cockpit.
 *
 * Un second groupe plutôt qu'une page de `(site)` : le document est le même
 * (`SiteDocument`, mêmes feuilles, mêmes polices, même défilement), sans la
 * bannière de consentement ni la mesure d'audience, qui n'ont rien à faire
 * dans un cadre que seul Eliott regarde.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import "../focus.css";
import { SiteDocument } from "../(site)/SiteDocument";

export const metadata: Metadata = {
  title: "Aperçu d’article",
  robots: { index: false, follow: false },
};

export default function ApercuLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteDocument sansMesure>{children}</SiteDocument>;
}
