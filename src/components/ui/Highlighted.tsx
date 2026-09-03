import { Fragment } from "react";

/**
 * Highlighted — rend un texte dont certaines expressions sont mises en emphase
 * (couleur pleine) sur un fond de couleur atténuée, comme le fait le template
 * Framer d'origine (copy « conversion-first » : quelques mots passent en blanc plein
 * au milieu d'un paragraphe en blanc 70 %).
 *
 * Modèle CMS-friendly : le contenu reste une string simple + une liste de phrases
 * à surligner (`highlights`). Aucun markup dans la donnée → un futur CMS peut
 * stocker `text` + `highlights[]` sans couplage au rendu.
 *
 * Découpe la string sur les phrases (non chevauchantes) et enveloppe chaque
 * occurrence dans un `<span>` porteur de `highlightClassName`. Le reste hérite de
 * la couleur du parent (l'état « atténué »).
 */
export function Highlighted({
  text,
  highlights = [],
  highlightClassName = "text-foreground",
}: {
  text: string;
  highlights?: string[];
  /** Classe appliquée aux segments en emphase (blanc plein par défaut). */
  highlightClassName?: string;
}) {
  if (highlights.length === 0) return <>{text}</>;

  // Ordonne les phrases par longueur décroissante (évite qu'un préfixe court
  // masque une phrase plus longue), puis échappe les métacaractères regex.
  const ordered = [...highlights].sort((a, b) => b.length - a.length);
  const escaped = ordered.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  const hit = new Set(highlights);

  return (
    <>
      {parts.map((part, i) =>
        hit.has(part) ? (
          <span key={i} className={highlightClassName}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
