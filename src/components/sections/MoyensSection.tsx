import Link from "next/link";
import type { MoyensContent } from "@/lib/content/types";

/**
 * LES TROIS MOYENS DE RENDRE DU TEMPS (2026-11-01).
 *
 * La section noire montre le gain, celle-ci dit comment on l'obtient. Des lignes
 * plutôt que trois cartes : le nom se lit d'abord, le détail à côté, comme une
 * ordonnance. La troisième est une option, décision d'Eliott : son déroulé vit sur
 * `/services/automatisation`, pas sur l'accueil.
 */
export function MoyensSection({ moyens }: { moyens: MoyensContent }) {
  return (
    <section
      id="moyens"
      data-section="moyens"
      className="relative flex w-full flex-col items-center bg-muted px-[20px] py-[60px] text-background tablet:px-[24px] tablet:py-[90px] desktop:px-[30px]"
    >
      <div className="flex w-full max-w-[1440px] flex-col gap-[48px] tablet:gap-[70px]">
        <div className="grid gap-[20px] tablet:grid-cols-2 tablet:items-end">
          <div className="flex flex-col gap-[20px] tablet:pr-[30px]">
            <p className="m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60">
              {moyens.eyebrow}
            </p>
            <h2 className="m-0 flex flex-col text-[44px] font-semibold uppercase leading-[0.86] tracking-[-0.05em] tablet:text-[60px] desktop:text-[80px]">
              {moyens.titleLines.map((ligne) => (
                <span key={ligne} className="accent-room block">
                  {ligne}
                </span>
              ))}
            </h2>
          </div>
          <p className="m-0 max-w-[46ch] text-[17px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70 tablet:pl-[30px] desktop:pl-[40px]">
            {moyens.intro}
          </p>
        </div>

        <ul className="m-0 list-none border-b border-black/[0.12] p-0">
          {moyens.lignes.map((ligne) => (
            <li key={ligne.titre} className="border-t border-black/[0.12]">
              <Link
                href={ligne.lien.href}
                className="group grid gap-[8px] py-[22px] no-underline transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-[1px] tablet:grid-cols-2 tablet:gap-0 tablet:py-[30px]"
              >
                <span className="text-[26px] font-semibold uppercase leading-[1] tracking-[-0.04em] tablet:pr-[30px] tablet:text-[32px] desktop:text-[40px]">
                  {ligne.titre}
                </span>
                <span className="flex flex-col gap-[8px] tablet:pl-[30px] desktop:pl-[40px]">
                  <span className="max-w-[52ch] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70">
                    {ligne.corps}
                  </span>
                  <span className="text-[14px] font-semibold tracking-[-0.01em] underline underline-offset-[3px]">
                    {ligne.lien.label}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
