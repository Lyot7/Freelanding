import { ListeMetiers } from "@/components/pages/metiers/ListeMetiers";
import type { EntreeHub } from "@/content/metiers";
import Link from "next/link";
import type { HomeContent } from "@/lib/content/types";

/**
 * LE RENVOI VERS LES PAGES PAR MÉTIER, sur l'accueil (2026-10-31) : après la
 * démonstration, le visiteur cherche le mot de son métier. La liste vient de
 * `pagesHub`, une page publiée y entre seule.
 */
export function MetiersSection({
  metiers,
  entrees,
}: {
  metiers: HomeContent["metiers"];
  entrees: readonly EntreeHub[];
}) {
  return (
    <section
      data-section="metiers"
      className="relative bg-background px-[20px] py-[60px] text-foreground tablet:px-[24px] tablet:py-[90px] desktop:px-[30px]"
    >
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[30px]">
        <div className="grid gap-[16px] tablet:grid-cols-2 tablet:items-end">
          <h2 className="m-0 text-[44px] font-semibold uppercase leading-[0.9] tracking-[-0.05em] tablet:pr-[30px] desktop:text-[68px]">
            {metiers.titleLines.map((ligne) => (
              <span key={ligne} className="block">
                {ligne}
              </span>
            ))}
          </h2>
          <p className="m-0 max-w-[46ch] text-[17px] font-medium leading-[1.4] tracking-[-0.01em] text-white/70 tablet:pl-[30px] desktop:pl-[40px]">
            {metiers.intro}
          </p>
        </div>
        <ListeMetiers entrees={entrees} />
        <Link
          href={metiers.cta.href}
          className="w-fit text-[15px] font-semibold tracking-[-0.01em] text-foreground underline underline-offset-[3px]"
        >
          {metiers.cta.label}
        </Link>
      </div>
    </section>
  );
}
