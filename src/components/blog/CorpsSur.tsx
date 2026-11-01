import { Fragment, type ReactNode } from "react";
import type { List, ListItem, PhrasingContent, RootContent, Table } from "mdast";
import { Callout, Figure, Prix, Quote, Stat, Steps, Video } from "@/components/blog/blocks";
import { prestations } from "@/content/offre";
import { adresseSure, decouper, lirePrix, mediaSur, type Bloc } from "@/lib/blog/mdx-sur";
import { habillage } from "@/mdx-components";

/**
 * LE CORPS D'UN ARTICLE EN ATTENTE, rendu par les composants de la page publiée.
 *
 * `@next/mdx` compile un article publié et le rend avec `mdx-components.tsx` ;
 * l'aperçu ne compile rien (`lib/blog/mdx-sur.ts`) mais rend les mêmes nœuds
 * avec les mêmes composants : l'habillage du markdown (`habillage`) et la
 * palette de `blocks.tsx`. Ce que le cockpit montre est donc ce que la page
 * affichera, au pixel, et non une copie de ses styles.
 *
 * Les règles de forme suivent `remark-rehype`, l'étape qui précède le rendu
 * MDX : une liste serrée n'enveloppe pas ses items dans un paragraphe, un
 * tableau sépare son en-tête de son corps, un bloc de code est un `pre`
 * contenant un `code`.
 */

const {
  h2: H2,
  h3: H3,
  p: P,
  strong: Strong,
  em: Em,
  a: A,
  ul: Ul,
  ol: Ol,
  li: Li,
  blockquote: Blockquote,
  code: Code,
  pre: Pre,
  hr: Hr,
  table: TableSite,
  thead: Thead,
  th: Th,
  td: Td,
  img: Img,
} = habillage;

const OFFRES = new Set<string>(prestations.map((p) => p.id));

/**
 * Le texte d'une phrase. Rendu en place et non par un composant intermédiaire :
 * `AncreH2` lit le texte de ses enfants pour calculer l'ancre du titre, et un
 * composant qui n'expose pas `children` la laisserait vide.
 */
function enLigne(noeuds: readonly PhrasingContent[]): ReactNode[] {
  return noeuds.map((n, i) => <Fragment key={`${n.type}-${i}`}>{rendreEnLigne(n)}</Fragment>);
}

/** Exporté pour les tests : un nœud que le site ne rend pas se lit en texte. */
export function rendreEnLigne(n: PhrasingContent): ReactNode {
  switch (n.type) {
    case "text":
      return n.value;
    case "strong":
      return <Strong>{enLigne(n.children)}</Strong>;
    case "emphasis":
      return <Em>{enLigne(n.children)}</Em>;
    case "delete":
      return <del>{enLigne(n.children)}</del>;
    case "inlineCode":
      return <Code>{n.value}</Code>;
    case "break":
      return <br />;
    case "link": {
      const href = adresseSure(n.url);
      return href ? <A href={href}>{enLigne(n.children)}</A> : enLigne(n.children);
    }
    case "image": {
      const src = mediaSur(n.url);
      return src ? <Img src={src} alt={n.alt ?? ""} /> : (n.alt ?? "");
    }
    case "html": {
      const prix = lirePrix(n.value);
      return prix && OFFRES.has(prix.offre) ? <Prix /> : n.value;
    }
    case "linkReference":
      return enLigne(n.children);
    case "imageReference":
      return n.alt ?? "";
    default:
      return null;
  }
}

/** Liste serrée : le texte de l'item sort sans paragraphe, comme `remark-rehype` le fait. */
function Item({ item, serree }: Readonly<{ item: ListItem; serree: boolean }>) {
  const case_ = typeof item.checked === "boolean" ? <input type="checkbox" checked={item.checked} disabled /> : null;
  return (
    <Li>
      {case_}
      {item.children.map((enfant, i) =>
        serree && enfant.type === "paragraph" ? (
          <Fragment key={`texte-${i}`}>{enLigne(enfant.children)}</Fragment>
        ) : (
          <BlocMarkdown key={`${enfant.type}-${i}`} n={enfant} />
        ),
      )}
    </Li>
  );
}

function Liste({ n }: Readonly<{ n: List }>) {
  const serree = !n.spread && n.children.every((item) => !item.spread);
  const items = n.children.map((item, i) => <Item key={`item-${i}`} item={item} serree={serree} />);
  if (!n.ordered) return <Ul>{items}</Ul>;
  return <Ol start={n.start ?? undefined}>{items}</Ol>;
}

function Tableau({ n }: Readonly<{ n: Table }>) {
  const [entete, ...lignes] = n.children;
  return (
    <TableSite>
      <Thead>
        <tr>
          {entete?.children.map((cellule, i) => (
            <Th key={`th-${i}`}>{enLigne(cellule.children)}</Th>
          ))}
        </tr>
      </Thead>
      {lignes.length > 0 && (
        <tbody>
          {lignes.map((ligne, i) => (
            <tr key={`tr-${i}`}>
              {ligne.children.map((cellule, j) => (
                <Td key={`td-${j}`}>{enLigne(cellule.children)}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      )}
    </TableSite>
  );
}

/** Un `#` sort en h2, comme sur le site : le seul h1 de la page est le titre de l'article. */
function Titre({ profondeur, children }: Readonly<{ profondeur: number; children: ReactNode }>) {
  if (profondeur <= 2) return <H2>{children}</H2>;
  if (profondeur === 3) return <H3>{children}</H3>;
  return <h4>{children}</h4>;
}

/** Exporté pour les tests : un nœud de bloc que le site ne rend pas ne rend rien. */
export function BlocMarkdown({ n }: Readonly<{ n: RootContent }>): ReactNode {
  switch (n.type) {
    case "heading":
      return <Titre profondeur={n.depth}>{enLigne(n.children)}</Titre>;
    case "paragraph":
      return <P>{enLigne(n.children)}</P>;
    case "list":
      return <Liste n={n} />;
    case "table":
      return <Tableau n={n} />;
    case "blockquote":
      return <Blockquote>{n.children.map((e, i) => <BlocMarkdown key={`${e.type}-${i}`} n={e} />)}</Blockquote>;
    case "code":
      return (
        <Pre>
          <Code>{n.value}</Code>
        </Pre>
      );
    case "thematicBreak":
      return <Hr />;
    case "html":
      // Balise inconnue, `<script>`, `<img onerror>` : du texte, que React échappe.
      return <P>{n.value}</P>;
    default:
      return null;
  }
}

function BlocArticle({ bloc }: Readonly<{ bloc: Bloc }>): ReactNode {
  switch (bloc.type) {
    case "markdown":
      return bloc.racine.children.map((n, i) => <BlocMarkdown key={`${n.type}-${i}`} n={n} />);
    case "Figure":
      return <Figure src={bloc.src} alt={bloc.alt} caption={bloc.caption} />;
    case "Video":
      return <Video src={bloc.src} poster={bloc.poster} caption={bloc.caption} />;
    case "Callout":
      return (
        <Callout title={bloc.title}>
          <Blocs blocs={bloc.enfants} />
        </Callout>
      );
    case "Quote":
      return (
        <Quote author={bloc.author}>
          <Blocs blocs={bloc.enfants} />
        </Quote>
      );
    case "Stat":
      return <Stat value={bloc.value} label={bloc.label} />;
    case "Steps":
      return <Steps items={bloc.items} />;
  }
}

function Blocs({ blocs }: Readonly<{ blocs: Bloc[] }>) {
  return blocs.map((bloc, i) => <BlocArticle key={`${bloc.type}-${i}`} bloc={bloc} />);
}

/** Le corps d'un article en attente, sans compilation ni évaluation. */
export function CorpsSur({ source }: Readonly<{ source: string }>) {
  return <Blocs blocs={decouper(source)} />;
}
