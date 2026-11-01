import type { Availability } from "@/lib/content/types";
import { Highlighted } from "./Highlighted";
import { MoisCreneaux } from "./MoisCreneaux";
import { MARQUE_MOIS, moisDesCreneaux } from "@/lib/availability-month";

/**
 * Jauge de créneaux disponibles.
 *
 * Source unique. Le hero en portait une version ÉCRITE EN DUR (six barres, dont
 * quatre pleines, une animée et une vide) pendant que la page contact en rendait
 * cinq depuis la donnée : changer `totalSlots` ne déplaçait donc qu'une des deux
 * jauges, et elles affichaient des états différents sur le même site.
 *
 * Lecture de la jauge, du plus ancien au plus récent :
 *
 *   [plein] [plein] … [en cours] [vide] [vide] …
 *
 * Les créneaux déjà pris sont pleins, le créneau EN COURS de remplissage pulse,
 * et les créneaux encore libres restent éteints. Le nombre de créneaux pris vaut
 * `totalSlots - slotsLeft` : la barre animée est donc toujours la dernière prise,
 * celle sur laquelle on est en train de s'engager.
 *
 * Exemple avec `{ totalSlots: 3, slotsLeft: 1 }` : une barre pleine, la deuxième
 * animée, la troisième éteinte, et le compteur affiche « 1/3 ».
 *
 * SANS `slotsLeft`, NI JAUGE NI DÉCOMPTE — seul le libellé est rendu, et le
 * deux-points qui l'annonçait disparaît avec ce qu'il annonçait. C'est l'état
 * du site depuis le 2026-09-01 : les barres affichaient « 2/4 », donc deux
 * projets en cours, sur un chiffre écrit à la main dans `site.ts` qu'aucun
 * client ne soutenait et que rien ne faisait bouger. Le composant, lui, n'a
 * rien perdu : il rend la jauge dès que la donnée porte de vrais créneaux.
 */
export function AvailabilityMeter({
  availability,
  className = "",
  /**
   * `hero` sépare le dernier mot du libellé pour le rendre en blanc plein, comme
   * la source le fait avec le mois (« CRÉNEAUX EN **AOÛT** »). `inline` rend le
   * libellé d'un seul bloc.
   */
  variant = "inline",
  /**
   * Fuseau dans lequel le mois est lu. C'est celui d'ELIOTT, pas celui du
   * visiteur — même choix que `LocalClock`. Sans lui, `Europe/Paris`.
   */
  timeZone,
  /**
   * `stacked` publie la variante MOBILE de la source : le libellé sur une
   * première ligne, la jauge et le décompte sur une seconde, écart 6, le tout
   * aligné à droite ; la rangée revient à partir de 810. La source publie bien
   * DEUX variantes de ce bloc (`[Desktop]` en rangée, 185,9 × 14,4 à 810 comme
   * à 1440 ; `[Phone right aligned]` en colonne, 92,5 × 34,8 à 390) et le hero
   * contact rendait la rangée partout — 20,4 px de moins dans le héros, qui se
   * répercutaient sur tout ce qui est au-dessus, portrait compris.
   *
   * Le hero d'accueil, lui, garde la rangée aux trois largeurs : ne pas rendre
   * `stacked` par défaut.
   */
  stacked = false,
}: {
  availability: Availability;
  className?: string;
  variant?: "inline" | "hero";
  timeZone?: string;
  stacked?: boolean;
}) {
  // AUCUN REPLI SUR UN CHIFFRE INVENTÉ. `slotsLeft` absent ne veut pas dire
  // « zéro créneau » ni « cinq créneaux » : il veut dire qu'aucun décompte n'est
  // publié, et la jauge ne se rend pas du tout.
  const avecJauge = availability.slotsLeft !== undefined;
  const total = Math.max(1, availability.totalSlots ?? 5);
  const left = Math.min(Math.max(0, availability.slotsLeft ?? 0), total);
  // Créneaux déjà pris. La barre EN COURS est la dernière d'entre eux, donc à
  // l'index `taken - 1` ; quand tout est libre il n'y en a aucune.
  const taken = total - left;
  const activeIndex = taken - 1;

  const label = availability.label;

  /* MOIS CALCULÉ, plus écrit à la main.
     Le libellé de la donnée porte la marque `{mois}` ; elle est remplacée par le
     mois réel, avec bascule sur le mois suivant à partir du 20 (voir
     `@/lib/availability-month`). Le fragment ainsi produit est rendu en blanc
     plein par `MoisCreneaux`, ce qui remplace l'emphase par `Highlighted` pour
     ce fragment-là : un composant ne peut pas être une sous-chaîne.
     `new Date()` est évalué ICI, donc au build sur une page prérendue : c'est la
     valeur du PREMIER rendu, que le client reprend à l'identique avant de la
     corriger après montage. Un libellé sans marque `{mois}` traverse le
     composant inchangé, avec l'emphase déclarée d'origine. */
  const moisInitial = label.includes(MARQUE_MOIS)
    ? moisDesCreneaux(new Date(), timeZone)
    : null;
  const [avantMois, apresMois] = moisInitial
    ? label.split(MARQUE_MOIS)
    : [label, ""];

  /* EMPHASE DU LIBELLÉ — donnée, et non plus déduction.
     Le rendu coupait au DERNIER ESPACE pour mettre le mois en blanc. Ça marchait
     pour « CRÉNEAUX EN AOÛT » par coïncidence ; « CRÉNEAUX AOÛT 2026 » aurait mis
     « 2026 » en blanc. Le choix se fait maintenant dans la donnée, avec le même
     mécanisme que partout ailleurs sur le site (`Highlighted`).
     Le repli garde l'ancien comportement pour un contenu qui ne déclare rien. */
  const declares = availability.labelHighlights ?? [];
  const highlights =
    declares.length > 0
      ? [...declares]
      : variant === "hero" && label.lastIndexOf(" ") >= 0
        ? [label.slice(label.lastIndexOf(" ") + 1)]
        : [];

  const libelle = (
    <span
      className={`whitespace-pre ${highlights.length > 0 || moisInitial ? "text-foreground-60" : ""}`}
    >
      {moisInitial ? (
        <>
          {avantMois}
          <MoisCreneaux
            initial={moisInitial}
            timeZone={timeZone}
            className="text-foreground"
          />
          {apresMois}
        </>
      ) : (
        <Highlighted
          text={label}
          highlights={highlights}
          highlightClassName="text-foreground"
        />
      )}
      {/* ESPACE FINE INSÉCABLE (U+202F) DEVANT LE DEUX-POINTS. Le glyphe est
          posé ici et non dans la donnée, il échappe donc à `typo-fr.mjs` qui ne
          lit que `src/content/**` : il s'est rendu « CRÉNEAUX EN SEPTEMBRE: »
          sur le hero et sur la page contact, c'est-à-dire à la faute, sur toutes
          les pages du site. Insécable, sinon le navigateur peut renvoyer les
          deux points seuls en début de ligne.
          IL N'APPARAÎT QUE S'IL ANNONCE QUELQUE CHOSE : sans jauge, un
          deux-points en fin de ligne resterait suspendu dans le vide. */}
      {avecJauge ? "\u202F:" : null}
    </span>
  );

  const jaugeEtCompteur = (
    <>
      {/* La jauge est décorative : le compteur qui la suit porte déjà
          l'information, la doubler ferait lire deux fois la même chose. */}
      <span className="flex h-[12px] items-end gap-[4px]" aria-hidden>
        {Array.from({ length: total }, (_, index) => {
          if (index === activeIndex) {
            return (
              <span
                key={index}
                className="relative h-[12px] w-[2px] overflow-hidden bg-white/25"
              >
                <span className="slot-fill-active absolute inset-0 block bg-accent" />
              </span>
            );
          }
          return (
            <span
              key={index}
              className={`h-[12px] w-[2px] ${
                index < activeIndex ? "bg-accent" : "bg-white/25"
              }`}
            />
          );
        })}
      </span>
      <span className="whitespace-pre text-foreground">
        {left}/{total}
      </span>
    </>
  );

  /* La césure se fait ICI, dans le composant, et non dans une enveloppe posée
     par l'appelant : une enveloppe en `flex-col` autour d'un enfant UNIQUE ne
     coupe rien, et c'est exactement ce qui se passait sur le hero contact. */
  if (!avecJauge) {
    return <span className={`flex items-center ${className}`}>{libelle}</span>;
  }

  if (stacked) {
    return (
      <span
        className={`flex flex-col items-end gap-[6px] tablet:flex-row tablet:items-center tablet:gap-[5px] ${className}`}
      >
        {libelle}
        <span className="flex items-center gap-[5px]">{jaugeEtCompteur}</span>
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-[5px] ${className}`}>
      {libelle}
      {jaugeEtCompteur}
    </span>
  );
}
