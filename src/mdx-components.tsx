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
const ECART = "mt-[20px] first:mt-0";

/** Corps de texte d'article : 15 px, gris, sur le fond clair de la page. */
const CORPS =
  "text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-background/60";

/** Titres : sombres et pleins, l'échelle du h2 suit la largeur, le h3 non. */
const TITRE = "font-medium leading-[1.2] text-background";

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
      className={`${ECART} ${TITRE} scroll-mt-[100px] text-[18px] tracking-[-0.03em] tablet:text-[24px] desktop:text-[30px]`}
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
    <h3 className={`${ECART} ${TITRE} text-[22px] tracking-[-0.04em]`}>
      {children}
    </h3>
  ),
  p: ({ children }) => <p className={`${ECART} ${CORPS}`}>{children}</p>,
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
  li: ({ children }) => <li className="mt-[6px] first:mt-0">{children}</li>,
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
  hr: () => <hr className="mt-[30px] border-0 border-t border-background/15" />,
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
