"use client";

import { useEffect, useState } from "react";
import { moisDesCreneaux } from "@/lib/availability-month";

/**
 * Le mois de la jauge de créneaux, tenu à jour côté client.
 *
 * POURQUOI CE COMPOSANT EXISTE, ET POURQUOI IL PREND UNE VALEUR INITIALE.
 *
 * Les pages du site sont PRÉRENDUES : `new Date()` évalué dans un composant
 * serveur donne la date du BUILD, pas celle de la visite. Un mois calculé
 * uniquement côté serveur serait donc figé au déploiement — le défaut qu'on
 * cherche justement à corriger, avec un tour de passe-passe en plus.
 *
 * Le calculer uniquement côté client aurait un autre coût : le HTML servi
 * n'aurait pas de mois, et le libellé se compléterait après hydratation. C'est
 * ce que fait `LocalClock`, et c'est acceptable pour une horloge à la seconde ;
 * ça ne l'est pas au milieu d'une phrase (« CRÉNEAUX EN ␣ : 2/4 »).
 *
 * D'où la forme retenue : le serveur calcule le mois au build et le passe en
 * `initial`, le premier rendu client rend EXACTEMENT la même chose — donc aucun
 * écart d'hydratation — et un effet le recalcule après montage. Dans le cas
 * normal, les deux valeurs coïncident et rien ne bouge à l'écran. Quand le
 * build a vieilli, ou quand un onglet reste ouvert d'un mois sur l'autre, la
 * correction se voit une fois et le libellé redevient vrai.
 */
export function MoisCreneaux({
  initial,
  timeZone,
  className = "",
}: {
  /** Mois calculé au rendu serveur. Sert de premier rendu client à l'identique. */
  initial: string;
  timeZone?: string;
  className?: string;
}) {
  const [mois, setMois] = useState(initial);

  useEffect(() => {
    const recalculer = () => setMois(moisDesCreneaux(new Date(), timeZone));
    recalculer();
    // Un onglet laissé ouvert plusieurs jours doit finir par se corriger. Une
    // heure suffit très largement pour une valeur qui change douze fois par an,
    // et ne coûte rien : le calcul est une lecture de date, sans requête.
    const id = window.setInterval(recalculer, 60 * 60 * 1000);
    // Le retour d'onglet est le moment où un mois périmé se voit vraiment.
    const auRetour = () => {
      if (document.visibilityState === "visible") recalculer();
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [timeZone]);

  return <span className={className}>{mois}</span>;
}
