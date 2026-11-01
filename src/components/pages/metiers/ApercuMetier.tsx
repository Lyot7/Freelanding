import { MaillageMetier } from "@/components/pages/metiers/MaillageMetier";
import { PageTheme } from "@/components/pages/services/PageTheme";
import { versPageTheme } from "@/content/metiers";
import { MESSAGES_METIER, type ApercuMetier as Apercu } from "@/lib/blog/apercu";
import type { SiteConfig } from "@/lib/content/types";

/**
 * LA PAGE PAR MÉTIER EN ATTENTE, telle que `/logiciel-metier/<slug>` l'affichera.
 *
 * Même gabarit (`PageTheme`) et même maillage ; seul le visuel change, le JPG
 * n'existant qu'après la publication. Ce qui bloquerait la publication s'affiche
 * au-dessus de la page : Eliott le voit avant de valider. Un corps qui ne se relit
 * pas donne un message, jamais une page cassée dans le cadre du cockpit.
 */
export function ApercuMetier({ apercu, site }: { apercu: Apercu; site: SiteConfig }) {
  if ("illisible" in apercu) {
    return (
      <main className="grid min-h-screen place-items-center bg-foreground p-[24px] text-center text-[16px] font-medium text-background/75">
        <div className="flex flex-col gap-[8px]">
          <p>{MESSAGES_METIER.illisible}</p>
          <p>{apercu.illisible}</p>
        </div>
      </main>
    );
  }
  const { page, visuel, motifs } = apercu;
  return (
    <>
      {motifs.length > 0 ? (
        <aside
          role="alert"
          className="relative z-[60] bg-foreground px-[20px] py-[20px] text-[16px] font-medium leading-[1.4] text-background tablet:px-[24px] desktop:px-[30px]"
        >
          <p className="font-semibold">{MESSAGES_METIER.refus}</p>
          <ul className="mt-[8px] list-disc pl-[20px]">
            {motifs.map((motif) => (
              <li key={motif}>{motif}</li>
            ))}
          </ul>
        </aside>
      ) : null}
      <PageTheme
        page={versPageTheme(page)}
        site={site}
        visuel={visuel}
        maillage={<MaillageMetier page={page} />}
      />
    </>
  );
}
