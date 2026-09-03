import Image from "next/image";
import type { ReactNode } from "react";

/**
 * PALETTE FERMÉE des blocs d'article.
 *
 * Ces composants sont exposés globalement par `src/mdx-components.tsx` : un
 * article les emploie sans aucun `import`, et ne peut donc rien importer
 * d'autre. C'est volontaire, et c'est le cœur du dispositif.
 *
 * POURQUOI FERMÉE, alors que MDX permet tout. Les articles sont rédigés par un
 * agent. Avec une liberté totale, chaque article inventerait sa mise en page :
 * un blog dont les articles ne se ressemblent pas ne se lit pas comme un
 * studio, il se lit comme du bricolage. Et un article capable d'importer
 * n'importe quoi est un article capable de casser le build — publier ne doit
 * jamais pouvoir casser le site.
 *
 * La liberté utile porte sur QUELS blocs et dans quel ordre, pas sur l'allure
 * d'un titre. Ajouter un bloc ici est un acte délibéré, revu comme du code.
 *
 * TYPOGRAPHIE. Les valeurs viennent de `components/pages/RichText.tsx`, qui
 * porte les mesures relevées sur la source du template : corps 15 px, interligne
 * 1,3, interlettrage -0,01em, écart vertical uniforme de 20 px entre blocs. Le
 * texte d'article est sombre sur fond clair, d'où `text-background`.
 */

/** Écart vertical commun à TOUS les blocs. Uniforme sur la source. */
const ECART = "mt-[20px] first:mt-0";

/** Corps de texte d'article (15 px), en gris, comme les paragraphes. */
const CORPS =
  "text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-background/60";

/** Légende : plus petite, en capitales, comme les métadonnées de la page. */
const LEGENDE =
  "mt-[10px] text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60";

/**
 * Image légendée. LE bloc le plus utilisé, et le seul moyen de poser une image
 * dans un article : le markdown `![alt](src)` est redirigé ici par
 * `mdx-components.tsx`, pour qu'aucune image ne puisse échapper au format
 * optimisé ni se retrouver sans dimensions.
 *
 * `sizes` décrit la colonne de texte de l'article, relevée à 690 px au plus
 * large : sans lui, l'optimiseur sert une variante calibrée pour la fenêtre
 * entière, soit deux fois trop de pixels.
 */
export function Figure({
  src,
  alt,
  caption,
  width = 1600,
  height = 900,
  priority = false,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  return (
    <figure className={ECART}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 810px) 690px, 100vw"
        priority={priority}
        className="block h-auto w-full"
      />
      {caption ? <figcaption className={LEGENDE}>{caption}</figcaption> : null}
    </figure>
  );
}

/**
 * Vidéo de démonstration, muette et en boucle.
 *
 * `playsInline` et `muted` ne sont pas décoratifs : sans eux, iOS refuse la
 * lecture automatique et affiche un cadre noir. `poster` est demandé plutôt
 * qu'optionnel : sans affiche, la place de la vidéo reste vide jusqu'à la
 * première image décodée, ce qui décale la lecture de l'article.
 */
export function Video({
  src,
  poster,
  caption,
}: {
  src: string;
  poster: string;
  caption?: string;
}) {
  return (
    <figure className={ECART}>
      <video
        className="block h-auto w-full"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {caption ? <figcaption className={LEGENDE}>{caption}</figcaption> : null}
    </figure>
  );
}

/**
 * Encadré : une remarque qui sort du fil de lecture sans le rompre.
 *
 * Filet à gauche plutôt qu'aplat de couleur : l'article est composé sur un fond
 * clair uni, et un aplat y ferait une tache. Le filet suffit à détacher le bloc.
 */
export function Callout({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={`${ECART} border-l-2 border-accent pl-[16px] [&>p]:mt-0 [&>p+p]:mt-[10px]`}
    >
      {title ? (
        <p className="text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background">
          {title}
        </p>
      ) : null}
      <div className={`${CORPS} ${title ? "mt-[8px]" : ""}`}>{children}</div>
    </aside>
  );
}

/**
 * Chiffre mis en avant : le résultat d'une mission, isolé de son paragraphe.
 *
 * Le libellé est obligatoire, et c'est délibéré : un chiffre sans ce qu'il
 * mesure ni d'où il vient n'est pas une preuve, c'est une décoration. Le site
 * entier tient sur la règle de ne rien afficher qui ne soit vérifiable.
 */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={ECART}>
      <p className="m-0 text-[52px] font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-background tablet:text-[68px]">
        {value}
      </p>
      <p className={`mt-[6px] max-w-[420px] ${CORPS}`}>{label}</p>
    </div>
  );
}

/**
 * Suite d'étapes numérotées.
 *
 * Les numéros sont posés par le composant, pas par une liste ordonnée du
 * markdown : ils reprennent la numérotation du site (deux chiffres, capitales,
 * couleur d'accent), la même que les prestations et la FAQ.
 */
export function Steps({ items }: { items: readonly string[] }) {
  return (
    <ol className={`${ECART} list-none p-0`}>
      {items.map((item, index) => (
        <li key={item} className="mt-[14px] flex gap-[14px] first:mt-0">
          <span className="mt-[2px] shrink-0 text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={CORPS}>{item}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Citation détachée : une phrase du client, ou une phrase clé de l'article.
 *
 * PAS DE `<p>` AUTOUR DES ENFANTS, et c'est une correction, pas un détail. Ce
 * composant sert deux entrées : l'écriture explicite `<Quote>texte</Quote>`, où
 * l'enfant est du texte nu, et le `>` du markdown, que `mdx-components` redirige
 * ici — et qui fournit DÉJÀ un paragraphe. Envelopper produisait `<p><p>`, que
 * le navigateur referme d'autorité : le HTML du serveur et celui du client ne
 * correspondaient plus, et l'hydratation de la page entière échouait.
 *
 * La typographie est donc posée sur le conteneur ET sur ses paragraphes
 * directs, ce qui couvre les deux entrées avec une seule règle.
 */
const CITATION =
  "text-[22px] font-medium leading-[1.2] tracking-[-0.02em] text-background tablet:text-[26px]";

/**
 * ELLE DÉBORDE DANS LA MARGE, et ce n'est pas une coquetterie.
 *
 * Rendue dans la colonne de texte avec l'écart commun de 20 px, la citation
 * arrivait au même poids visuel qu'un titre de niveau 2 : à la lecture, elle
 * découpait l'article en sections au lieu de le ponctuer. Le chapô de la page
 * emploie déjà ce débord (`-ml-[50%]`), sur la colonne gauche laissée vide par
 * le gabarit : la citation reprend le même geste, ce qui la sort du fil sans
 * inventer un ornement de plus. L'air autour (50 px contre 20) fait le reste.
 *
 * LE DÉBORD NE VAUT QU'À PARTIR DE 1200, et pas de 810 comme d'abord posé.
 * Sous 810 la colonne occupe toute la largeur, il n'y a aucune marge où
 * déborder. Entre 810 et 1199, la marge existe mais le SOMMAIRE l'occupe :
 * mesuré à 810, la citation partait de x = 279 pour un sommaire qui s'étend
 * jusqu'à 344, et les deux se recouvraient dès que le défilement les amenait à
 * la même hauteur. À 1200 la citation commence à 422, soit 72 px après le
 * sommaire, et les deux cohabitent.
 */
export function Quote({
  children,
  author,
}: {
  children: ReactNode;
  author?: string;
}) {
  return (
    <blockquote className="my-[50px] m-0 p-0 desktop:-ml-[35%] desktop:w-[135%]">
      <div
        className={`${CITATION} [&>p]:m-0 [&>p]:max-w-none [&>p]:text-[22px] [&>p]:leading-[1.2] tablet:[&>p]:text-[26px] [&>p]:tracking-[-0.02em] [&>p]:text-background`}
      >
        {children}
      </div>
      {author ? <p className={LEGENDE}>{author}</p> : null}
    </blockquote>
  );
}
