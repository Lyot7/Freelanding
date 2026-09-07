import type { ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import {
  Callout,
  Figure,
  Quote,
  Stat,
  Steps,
  Video,
} from "@/components/blog/blocks";
import { idDeTitre } from "@/lib/blog/sommaire";

/**
 * Composants MDX globaux — REQUIS par `@next/mdx` en App Router.
 *
 * Ce fichier fait deux choses, et rien d'autre.
 *
 * 1. IL HABILLE LE MARKDOWN. Un `##` ou un paragraphe rendrait sinon du HTML nu,
 *    sans aucun style : la feuille du site ne définit pas `h2` ni `p` en global,
 *    tout y passe par des classes. Les valeurs reprises ici viennent de
 *    `components/pages/RichText.tsx`, qui porte les mesures relevées sur la
 *    source — corps 15 px, interligne 1,3, écart uniforme de 20 px entre blocs.
 *    Un article écrit en markdown pur sort donc exactement comme les articles
 *    d'origine, sans qu'il ait à s'en occuper.
 *
 * 2. IL OUVRE LA PALETTE, et la ferme. Les blocs de `components/blog/blocks`
 *    sont utilisables sans `import` dans n'importe quel article ; rien d'autre
 *    ne l'est. Voir l'en-tête de ce fichier-là pour le pourquoi.
 *
 * L'IMAGE MARKDOWN EST DÉTOURNÉE vers `Figure`. `![texte](chemin)` produirait un
 * `<img>` nu : pas d'optimisation, pas de dimensions, donc un décalage de mise
 * en page au chargement. La syntaxe reste disponible pour une image simple, et
 * `<Figure>` sert dès qu'il faut une légende.
 */

/** Écart vertical uniforme entre blocs, relevé sur la source. */
const ECART = "mt-[22px] first:mt-0";

/**
 * RYTHME ÉDITORIAL, revu le 2026-09-07.
 *
 * CE QUI N'ALLAIT PAS. Un écart de 20px entre TOUS les blocs, titres compris,
 * un corps de 15px et un interligne de 1,3. Sur un fragment de page d'accueil
 * c'est juste ; sur mille deux cents mots, rien ne signale qu'une section
 * commence et l'œil descend sans trouver où se poser. C'est ce que décrivait le
 * lecteur en parlant de « gros pavés ».
 *
 * CE QUI CHANGE, et l'ordre compte : d'abord l'interligne (1,3 → 1,7), qui est
 * la fourchette de confort d'un texte suivi ; ensuite le CONTRASTE d'écart,
 * 22px entre deux paragraphes contre 72px avant un titre. C'est ce contraste,
 * bien plus que la taille des titres, qui rend une page longue parcourable.
 */
const CORPS =
  "text-[16px] font-medium leading-[1.7] tracking-[-0.005em] text-background/75";

/** Titres : sombres et pleins, l'échelle du h2 suit la largeur, le h3 non. */
const TITRE = "font-medium leading-[1.05] text-background";

/**
 * ÉCART AVANT UN TITRE, très supérieur à l'écart entre paragraphes.
 *
 * Un titre appartient à ce qui SUIT, pas à ce qui précède : le blanc au-dessus
 * doit donc être nettement plus grand que celui du dessous. Sans cette
 * asymétrie, un titre flotte au milieu de deux paragraphes et ne découpe rien.
 */
const ECART_TITRE = "mt-[64px] first:mt-0 tablet:mt-[88px]";

/**
 * Texte brut d'un titre, pour en déduire son ancre.
 *
 * Les enfants d'un titre markdown ne sont pas toujours une chaîne : `## Le
 * **résultat**` arrive en tableau, avec un élément React au milieu. On descend
 * donc l'arbre pour ne garder que le texte, sinon l'ancre serait vide dès qu'un
 * titre porte la moindre emphase.
 */
function texteDe(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(texteDe).join("");
  if (
    children !== null &&
    typeof children === "object" &&
    "props" in children &&
    children.props !== null &&
    typeof children.props === "object" &&
    "children" in children.props
  ) {
    return texteDe(children.props.children as ReactNode);
  }
  return "";
}

/**
 * ANCRE DE SECTION, posée sur chaque titre de niveau 2.
 *
 * C'est la cible des liens du sommaire (`components/blog/TableOfContents`), et
 * l'identifiant est calculé par la MÊME fonction des deux côtés : une
 * slugification approchante donnerait des liens morts sans la moindre erreur au
 * build ni au rendu.
 *
 * `scroll-mt` réserve la hauteur de l'en-tête : sans lui, un titre atteint par
 * une ancre se colle au bord haut de la fenêtre et passe sous le bandeau.
 */
function AncreH2({ children }: { children: ReactNode }) {
  return (
    <h2
      id={idDeTitre(texteDe(children))}
      className={`${ECART_TITRE} ${TITRE} scroll-mt-[100px] border-t border-background/12 pt-[26px] text-[26px] tracking-[-0.04em] tablet:text-[32px] desktop:text-[38px]`}
    >
      {children}
    </h2>
  );
}

const components: MDXComponents = {
  // Un article n'a qu'un seul h1, et c'est le titre rendu par le gabarit de
  // page. Un `#` dans le corps produirait donc un second h1 : il est rétrogradé
  // en h2 plutôt qu'ignoré, pour que l'article reste lisible et le plan valide.
  // L'audit d'articles refuse de toute façon un `#` dans un corps.
  h1: AncreH2,
  h2: AncreH2,
  h3: ({ children }) => (
    <h3
      className={`mt-[44px] ${TITRE} text-[19px] leading-[1.25] tracking-[-0.03em] tablet:text-[21px]`}
    >
      {children}
    </h3>
  ),
  /*
   * LE PREMIER PARAGRAPHE EST LE CHAPÔ, et il se distingue par le corps.
   *
   * Tous les articles ouvrent sur leur réponse — c'est la règle éditoriale du
   * blog, et c'est ce que les moteurs extraient. La rendre visible coûte une
   * pseudo-classe : `first:` cible le premier enfant du corps, qui est toujours
   * ce paragraphe-là. Aucune donnée à ajouter, rien à tenir à jour.
   */
  p: ({ children }) => (
    <p
      className={`${ECART} ${CORPS} first:text-[19px] first:leading-[1.55] first:tracking-[-0.015em] first:text-background tablet:first:text-[21px]`}
    >
      {children}
    </p>
  ),
  strong: ({ children }) => (
    // L'emphase passe par la COULEUR, pas par la graisse : le corps est déjà en
    // 500, et monter à 600 sur quelques mots donne un gris plus dense plutôt
    // qu'un accent lisible. Le texte plein sur fond de texte à 60 % ressort net.
    <strong className="font-medium text-background">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-background underline decoration-background/30 underline-offset-[3px] transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent-ink hover:decoration-accent-ink motion-reduce:transition-none"
      {...(href?.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    // Sans marqueur, indentation portée par le `li` : c'est la forme relevée sur
    // la source, où `list-style-type` vaut `none` et le retrait vit sur l'item.
    <ul className={`${ECART} list-none pl-0 ${CORPS}`}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className={`${ECART} list-decimal pl-[20px] ${CORPS}`}>{children}</ol>
  ),
  li: ({ children }) => <li className="mt-[12px] first:mt-0">{children}</li>,
  blockquote: ({ children }) => <Quote>{children}</Quote>,
  code: ({ children }) => (
    <code className="rounded-[3px] bg-background/[0.06] px-[5px] py-[2px] font-mono text-[13px] text-background">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    // `overflow-x-auto` sur le bloc lui-même : une ligne de code longue doit
    // défiler DANS son cadre, jamais faire défiler la page entière.
    <pre
      className={`${ECART} overflow-x-auto rounded-[4px] bg-background/[0.06] p-[16px] font-mono text-[13px] leading-[1.5] text-background`}
    >
      {children}
    </pre>
  ),
  hr: () => (
    <hr className="mt-[56px] border-0 border-t border-background/15" />
  ),
  /*
   * TABLEAUX. `remark-gfm` les produit depuis le 2026-09-07 ; sans habillage
   * ils sortaient en lignes nues, collées, sans lisibilité. Le conteneur
   * défile POUR LUI-MÊME : une grille tarifaire large ne doit jamais faire
   * défiler la page entière sur un téléphone.
   */
  table: ({ children }) => (
    <div className={`${ECART} -mx-[4px] overflow-x-auto`}>
      <table className="w-full min-w-[520px] border-collapse text-left text-[15px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-background/25">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-[4px] py-[12px] align-bottom text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-background/10 px-[4px] py-[14px] align-top font-medium leading-[1.45] tracking-[-0.005em] text-background/75">
      {children}
    </td>
  ),
  img: (props) => {
    const { src, alt } = props as { src?: string; alt?: string };
    return <Figure src={src ?? ""} alt={alt ?? ""} />;
  },

  // La palette, disponible sans import dans tous les articles.
  Figure,
  Video,
  Callout,
  Stat,
  Steps,
  Quote,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
