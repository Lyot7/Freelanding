import { CorpsSur } from "@/components/blog/CorpsSur";
import { ApercuMetier } from "@/components/pages/metiers/ApercuMetier";
import { BlogArticlePage } from "@/components/pages/blog/BlogArticlePage";
import {
  MESSAGE_INDISPONIBLE,
  articleDApercu,
  chargerApercu,
  demandeApercu,
  estPageApercu,
  pageDApercu,
} from "@/lib/blog/apercu";
import { sommaireDuTexte } from "@/lib/blog/sommaire";
import { content } from "@/lib/content";

/**
 * L'ARTICLE EN ATTENTE, tel que `/blog/<slug>` l'affichera une fois publié, ou la
 * page par métier en attente (`article.kind = "metier"`), telle que
 * `/logiciel-metier/<slug>` l'affichera.
 *
 * Même gabarit (`BlogArticlePage`), mêmes composants, même sommaire ; seul le
 * corps change de chemin : il n'est jamais compilé (`CorpsSur`), et celui d'une
 * page par métier se relit comme une donnée (`pageDApercu`). La page n'est ni
 * indexée (`robots`, `X-Robots-Tag`) ni affichable hors du cockpit
 * (`frame-ancestors`, voir `next.config.ts`).
 */
export const dynamic = "force-dynamic";

/** Jour de Paris, `AAAA-MM-JJ` : la date que l'article prendrait aujourd'hui. */
const aujourdhui = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

function Indisponible() {
  return (
    <main className="grid min-h-screen place-items-center bg-foreground p-[24px] text-center text-[16px] font-medium text-background/75">
      <p>{MESSAGE_INDISPONIBLE}</p>
    </main>
  );
}

export default async function ApercuArticle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const demande = demandeApercu(id, query.exp, query.sig);
  const article = demande ? await chargerApercu(demande) : null;
  if (!article) return <Indisponible />;

  if (estPageApercu(article)) {
    return <ApercuMetier apercu={pageDApercu(article, aujourdhui())} site={await content.getSiteConfig()} />;
  }

  const [posts, site] = await Promise.all([content.getPosts(), content.getSiteConfig()]);
  const post = articleDApercu(article, posts, aujourdhui());
  return (
    <BlogArticlePage
      post={post}
      related={posts.filter((p) => p.slug !== post.slug)}
      site={site}
      sommaire={sommaireDuTexte(article.corps)}
    >
      <CorpsSur source={article.corps} />
    </BlogArticlePage>
  );
}
