import Link from "next/link";
import type { LigneHub } from "@/content/metiers";

/**
 * LA LISTE DU HUB, reprise sous chaque page : une ligne par page publiée,
 * le nom en grand, ce que la page couvre à côté. Le visiteur se reconnaît au mot
 * de son métier ; des cartes le feraient lire trois fois plus de texte.
 */
/** LE HUB, EN PLAN : il sert à Google et à qui arrive d'une page, en petit quoi qu'il compte. */
export function PlanMetiers({ entrees }: { entrees: readonly LigneHub[] }) {
  return (
    <ul className="m-0 grid list-none gap-x-[30px] gap-y-[22px] p-0 tablet:grid-cols-2 desktop:grid-cols-3">
      {entrees.map((entree) => (
        <li key={entree.chemin}>
          <Link href={entree.chemin} className="group flex flex-col gap-[4px] no-underline">
            <span className="text-[16px] font-semibold leading-[1.2] tracking-[-0.01em] underline-offset-[3px] group-hover:underline">
              {entree.libelle}
            </span>
            <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-white/60">
              {entree.accroche}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ListeMetiers({
  entrees,
  ton = "sombre",
}: {
  entrees: readonly LigneHub[];
  ton?: "sombre" | "clair";
}) {
  const filet = ton === "clair" ? "border-black/[0.12]" : "border-white/10";
  const attenue = ton === "clair" ? "text-background/70" : "text-white/60";
  return (
    <ul className={`m-0 list-none border-b p-0 ${filet}`}>
      {entrees.map((entree) => (
        <li key={entree.chemin} className={`border-t ${filet}`}>
          <Link
            href={entree.chemin}
            className="group grid items-baseline gap-[6px] py-[18px] no-underline transition-transform duration-150 ease-[var(--courbe-vive)] active:translate-y-[1px] tablet:grid-cols-2 tablet:gap-0 tablet:py-[22px]"
          >
            <span className="flex items-baseline gap-[12px] text-[26px] font-semibold uppercase leading-[1] tracking-[-0.045em] tablet:pr-[30px] tablet:text-[34px] desktop:text-[44px]">
              <span
                aria-hidden
                className="text-[0.7em] opacity-0 transition-opacity duration-200 ease-[var(--courbe-vive)] group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                →
              </span>
              <span className="-ml-[calc(0.7em+12px)] transition-transform duration-200 ease-[var(--courbe-vive)] group-hover:translate-x-[calc(0.7em+12px)] group-focus-visible:translate-x-[calc(0.7em+12px)]">
                {entree.libelle}
              </span>
            </span>
            <span
              className={`text-[16px] font-medium leading-[1.4] tracking-[-0.01em] tablet:pl-[30px] desktop:pl-[40px] ${attenue}`}
            >
              {entree.accroche}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
