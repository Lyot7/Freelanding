import type { ReactNode } from "react";
import type { ContentBlock } from "@/lib/content/types";

/**
 * Adresses e-mail du corps de texte, rendues en LIEN comme sur la source.
 *
 * MESURÉ sur `/legal/privacy-policy` : les deux adresses du document
 * (deux adresses de contact fictives du gabarit d'origine, écrites
 * dans le bloc de contact) sont des `<a class="framer-styles-preset-cltove"
 * href="mailto:…" target="_blank" rel="noopener">`, et leur preset vaut
 * `--framer-link-text-color: #0b0b0b`, `--framer-link-hover-text-color: #ff4500`,
 * `transition: color .2s cubic-bezier(.44,0,.56,1)`. Relevé au survol sur le
 * live : `rgb(11,11,11)` → `rgb(255,69,0)`. Chez nous c'était du texte brut,
 * inerte, et à 60 % d'opacité comme le reste du paragraphe.
 *
 * Seules les ADRESSES sont liées : le numéro de téléphone qui les précède dans
 * le bloc de contact reste du texte sur la source. Aucun article de blog ne
 * contient d'adresse, la transformation y est donc sans effet.
 */
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+[\w]/g;

function linkifyEmails(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const m of text.matchAll(EMAIL)) {
    const at = m.index ?? 0;
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <a
        key={`${at}-${m[0]}`}
        href={`mailto:${m[0]}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-background no-underline transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none"
      >
        {m[0]}
      </a>,
    );
    cursor = at + m[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export function RichText({
  blocks,
  className,
  bodySize = 14,
}: {
  blocks: readonly ContentBlock[];
  className?: string;
  /**
   * Taille du corps de texte. Les deux surfaces qui rendent du texte riche ne
   * partagent PAS le même corps sur la source : 14px sur les pages légales,
   * 15px dans un article de blog. L'écart d'un seul pixel ne se voit pas à
   * l'œil, mais il change les retours à la ligne de tous les paragraphes : sur
   * l'article, il retirait 131px de page à 390 en faisant tenir chaque
   * paragraphe sur moins de lignes que la source.
   *
   * Les listes ne sont pas concernées — aucun article de blog n'en contient,
   * elles n'apparaissent que dans les pages légales, où le 14px est juste. Leur
   * imposer un 15px non mesuré serait une supposition, pas un port.
   */
  bodySize?: 14 | 15;
}) {
  // Interligne 1,3 et interlettrage -0,01em des deux côtés : seule la taille
  // change, les rapports sont identiques (19,5 / -0,15 à 15px, 18,2 / -0,14 à 14).
  /*
   * RYTHME DE LECTURE, révisé le 2026-09-07.
   *
   * CE QUI N'ALLAIT PAS. Le gabarit d'origine posait un écart UNIFORME de 20px
   * entre tous les blocs, titres compris, un corps de 14px et un interligne de
   * 1,3. Sur une page d'accueil, où le texte se lit par fragments, c'est juste.
   * Sur une politique de confidentialité de deux mille mots ou un article de
   * mille, ça produit un mur : rien ne signale qu'une section commence, et
   * l'œil descend sans jamais trouver où se poser.
   *
   * CE QUI CHANGE. L'interligne passe à 1,65, qui est la fourchette de confort
   * admise pour un texte suivi, et l'écart AVANT un titre devient nettement
   * plus grand que l'écart entre deux paragraphes. C'est ce contraste, et non
   * la taille des titres, qui rend une page longue parcourable.
   */
  const body = bodySize === 15 ? "text-[16px]" : "text-[15px]";
  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          /*
           * Les deux niveaux ne partagent PAS la même échelle sur la source :
           * le h2 se réduit avec la largeur (18 / 24 / 30) alors que le h3 reste
           * à 22px partout — il devient donc plus grand que son parent en mobile.
           * Les deux sont en interligne 1,2, le h2 en -0,03em et le h3 en -0,04em.
           */
          // Écart UNIFORME de 20px entre tous les blocs sur la source : titres et
          // paragraphes partagent la même marge, il n'y a pas de respiration
          // supplémentaire avant une section.
          const common =
            "mt-[52px] font-medium leading-[1.15] text-background first:mt-0 tablet:mt-[64px]";
          return block.level === 2 ? (
            <h2
              key={key}
              className={`${common} text-[18px] tracking-[-0.03em] tablet:text-[24px] desktop:text-[30px]`}
            >
              {block.text}
            </h2>
          ) : (
            <h3 key={key} className={`${common} text-[22px] tracking-[-0.04em]`}>
              {block.text}
            </h3>
          );
        }

        if (block.type === "list") {
          const List = block.style === "ordered" ? "ol" : "ul";
          const ordered = block.style === "ordered";
          return (
            // Listes à puces : la source ne rend AUCUN marqueur
            // (`list-style-type: none`) et porte l'indentation sur le `li`
            // (`padding-left: 18.9px`), pas sur la liste. Nous affichions des
            // puces `disc` avec un `padding-left` de 20 sur le `ul`, ce qui
            // ajoutait un marqueur absent de la source et décalait le texte.
            <List
              key={key}
              className={`mt-[22px] space-y-[10px] text-[15px] font-medium leading-[1.65] tracking-[-0.005em] text-background/75 ${
                ordered ? "list-decimal pl-[20px]" : "list-none pl-0"
              }`}
            >
              {block.items.map((item) => (
                <li key={item} className={ordered ? undefined : "pl-[19px]"}>
                  {linkifyEmails(item)}
                </li>
              ))}
            </List>
          );
        }

        return (
          <p
            key={key}
            // `pre-wrap` et non `pre-line` : la source sépare certains
            // paragraphes par un DOUBLE `<br>`, donc par une ligne vide.
            // `pre-line` replie toute suite d'espaces blancs en une seule
            // coupure et avalait donc la ligne vide. Les pages légales n'ont
            // que des retours simples (`contactDetails.join("\n")`) et rendent
            // identiquement sous les deux valeurs.
            className={`mt-[22px] whitespace-pre-wrap ${body} font-medium leading-[1.65] tracking-[-0.005em] text-background/75 first:mt-0`}
          >
            {linkifyEmails(block.text)}
          </p>
        );
      })}
    </div>
  );
}
