import Link from "next/link";
import type { EntreeHub } from "@/content/metiers";

/**
 * LA LISTE DES MÉTIERS, sur le hub et sur l'accueil : une ligne par page publiée,
 * le nom en grand, ce que la page couvre à côté. Le visiteur se reconnaît au mot
 * de son métier ; des cartes le feraient lire trois fois plus de texte.
 */
export function ListeMetiers({
  entrees,
  ton = "sombre",
}: {
  entrees: readonly EntreeHub[];
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
            className="group grid items-baseline gap-[6px] py-[18px] no-underline transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-[1px] tablet:grid-cols-2 tablet:gap-0 tablet:py-[22px]"
          >
            <span className="flex items-baseline gap-[12px] text-[26px] font-semibold uppercase leading-[1] tracking-[-0.04em] tablet:pr-[30px] tablet:text-[34px] desktop:text-[44px]">
              <span
                aria-hidden
                className="text-[0.7em] opacity-0 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                →
              </span>
              <span className="-ml-[calc(0.7em+12px)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-[calc(0.7em+12px)] group-focus-visible:translate-x-[calc(0.7em+12px)]">
                {entree.libelle}
              </span>
            </span>
            <span
              className={`text-[15px] font-medium leading-[1.4] tracking-[-0.01em] tablet:pl-[30px] desktop:pl-[40px] ${attenue}`}
            >
              {entree.accroche}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
