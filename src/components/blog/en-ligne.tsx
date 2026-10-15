import { fromMarkdown } from "mdast-util-from-markdown";
import type { ReactNode } from "react";

/**
 * Le markdown EN LIGNE d'un article : lien, gras, italique, code.
 *
 * Ces éléments servent deux entrées. Le corps de l'article, que `@next/mdx`
 * transforme et que `mdx-components` habille avec eux ; et les blocs qui
 * reçoivent leur texte en attribut, comme `<Steps items={[…]} />`. Une chaîne
 * passée en attribut n'est pas du markdown pour MDX : c'est une chaîne
 * JavaScript, rendue telle quelle, et un `[texte](lien)` s'y affichait en clair
 * (constaté le 2026-10-15 sur le lien « Search Central » de l'article sur les
 * sites lents). `MarkdownEnLigne` la relit avec le même analyseur que MDX et la
 * rend avec les mêmes éléments, donc le même style.
 */

export function Lien({ href, children }: { href?: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      className="text-background underline decoration-background/30 underline-offset-[3px] transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent-ink hover:decoration-accent-ink motion-reduce:transition-none"
      {...(href?.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  );
}

export function Gras({ children }: { children?: ReactNode }) {
  // L'emphase passe par la COULEUR, pas par la graisse : le corps est déjà en
  // 500, et monter à 600 sur quelques mots donne un gris plus dense plutôt
  // qu'un accent lisible. Le texte plein sur fond de texte à 60 % ressort net.
  return <strong className="font-medium text-background">{children}</strong>;
}

export function Italique({ children }: { children?: ReactNode }) {
  return <em className="italic">{children}</em>;
}

export function CodeEnLigne({ children }: { children?: ReactNode }) {
  return (
    <code className="rounded-[3px] bg-background/[0.06] px-[5px] py-[2px] font-mono text-[13px] text-background">
      {children}
    </code>
  );
}

type Noeud = ReturnType<typeof fromMarkdown>["children"][number];

function rendre(noeuds: readonly Noeud[], source: string): ReactNode[] {
  return noeuds.map((noeud, index) => {
    switch (noeud.type) {
      case "text":
        return noeud.value;
      case "strong":
        return <Gras key={index}>{rendre(noeud.children, source)}</Gras>;
      case "emphasis":
        return <Italique key={index}>{rendre(noeud.children, source)}</Italique>;
      case "link":
        return (
          <Lien key={index} href={noeud.url}>
            {rendre(noeud.children, source)}
          </Lien>
        );
      case "inlineCode":
        return <CodeEnLigne key={index}>{noeud.value}</CodeEnLigne>;
      case "break":
        return <br key={index} />;
      default: {
        // Une syntaxe que ce rendu ne porte pas (image, HTML brut) garde son
        // texte source : rien ne disparaît de la page. `fromMarkdown` pose
        // toujours une position sur les nœuds qu'il produit.
        const { start, end } = noeud.position as NonNullable<Noeud["position"]>;
        return source.slice(start.offset, end.offset);
      }
    }
  });
}

/**
 * Rend une chaîne de markdown en ligne. Une chaîne qui ne forme pas un seul
 * paragraphe (elle commence par `- `, `1. `, `#`…) n'est pas une phrase :
 * elle est rendue telle quelle plutôt que transformée en liste ou en titre au
 * milieu d'un bloc.
 */
export function MarkdownEnLigne({ texte }: { texte: string }) {
  const racine = fromMarkdown(texte);
  const [seul, ...reste] = racine.children;
  if (!seul || reste.length > 0 || seul.type !== "paragraph") return texte;
  return rendre(seul.children, texte);
}
