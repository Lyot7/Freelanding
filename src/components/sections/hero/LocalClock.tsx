"use client";

import { useEffect, useState } from "react";

/**
 * LocalClock — horloge « HEURE LOCALE » du hero (code-component Framer live).
 * Format : « {jour} {mois}, HH:MM », mis à jour chaque seconde. Rendu seulement
 * après montage, pour éviter tout écart d'hydratation SSR/client.
 *
 * C'est l'heure locale D'ELIOTT, pas celle du visiteur : le fuseau vient de la
 * donnée (`siteConfig.contact.timezone`, « Europe/Paris »). Le template
 * affichait l'heure de son studio londonien avec un mois en anglais quelle que
 * soit la langue du navigateur (mesuré : 13:47 pour 12:47 UTC, soit UTC+1 en
 * heure d'été, `Europe/London`) ; ce relevé reste vrai POUR LA SOURCE, mais il
 * ne décrit plus le site d'Eliott. L'ordre jour-mois et le nom de mois suivent
 * désormais la locale française.
 */
const FALLBACK_TIME_ZONE = "Europe/Paris";

function makeFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function format(formatter: Intl.DateTimeFormat, now: Date): string {
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  return `${parts.day} ${parts.month}, ${parts.hour}:${parts.minute}`;
}

export function LocalClock({ timeZone }: { timeZone?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const formatter = makeFormatter(timeZone ?? FALLBACK_TIME_ZONE);
    const tick = () => setTime(format(formatter, new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return (
    <span className="w-max [font-feature-settings:'tnum'] [font-variant-numeric:tabular-nums]">
      {time ?? " "}
    </span>
  );
}
