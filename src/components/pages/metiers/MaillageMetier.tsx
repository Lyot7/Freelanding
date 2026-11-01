import Link from "next/link";
import { ListeMetiers } from "@/components/pages/metiers/ListeMetiers";
import {
  CHEMIN_HUB_METIERS,
  articlesDe,
  hubMetiers,
  voisinsDe,
  type PageMetierPubliee,
} from "@/content/metiers";

/**
 * LE MAILLAGE D'UNE PAGE PAR MÉTIER, GÉNÉRÉ DEPUIS LES DONNÉES : le hub, jusqu'à
 * trois métiers voisins, les articles liés. Rien ne s'écrit à la main : une page
 * publiée demain rejoint les voisins de celles d'aujourd'hui.
 */
export function MaillageMetier({ page }: { page: PageMetierPubliee }) {
  const voisins = voisinsDe(page);
  const articles = articlesDe(page);
  const { maillage } = hubMetiers;
  return (
    <section
      data-section="maillage"
      className="relative bg-muted px-[20px] py-[60px] text-background tablet:px-[24px] tablet:py-[90px] desktop:px-[30px]"
    >
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[36px]">
        <div className="flex flex-wrap items-baseline justify-between gap-[12px]">
          <h2 className="accent-room m-0 text-[26px] titre-marque tablet:text-[34px]">
            {maillage.voisins}
          </h2>
          <Link
            href={CHEMIN_HUB_METIERS}
            className="text-[16px] font-semibold tracking-[-0.01em] text-background underline underline-offset-[3px]"
          >
            {maillage.hub}
          </Link>
        </div>
        <ListeMetiers entrees={voisins} ton="clair" />
        {articles.length > 0 ? (
          <nav aria-label={maillage.articles} className="flex flex-col gap-[12px]">
            <p className="m-0 text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.02em] text-background/60">
              {maillage.articles}
            </p>
            <ul className="m-0 grid list-none gap-[16px] p-0 tablet:grid-cols-3">
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="text-[16px] font-semibold leading-[1.3] tracking-[-0.01em] text-background underline underline-offset-[3px]"
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
