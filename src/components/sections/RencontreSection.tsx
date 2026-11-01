import Image from "next/image";
import Link from "next/link";
import { SignatureTracee } from "@/components/motion/SignatureTracee";
import { TitreMasque } from "@/components/motion/TitreMasque";
import type { RencontreContent } from "@/lib/content/types";

/**
 * LE POINT D'ORGUE : la seule face volt de la page, juste avant les dernières
 * questions. Le visiteur a maintenant une raison de lire qui parle.
 */
export function RencontreSection({ rencontre }: { rencontre: RencontreContent }) {
  return (
    <section
      data-section="rencontre"
      className="surface-light relative flex w-full flex-col items-center bg-accent px-[20px] py-[60px] text-accent-ink tablet:px-[24px] tablet:py-[120px] desktop:px-[30px]"
    >
      <div className="grid w-full max-w-[1440px] gap-[36px] tablet:grid-cols-12 tablet:gap-x-[20px]">
        <div className="flex flex-col gap-[24px] tablet:col-span-7">
          <TitreMasque lignes={rencontre.titleLines} className="titre-marque titre-section" />
          <p className="m-0 max-w-[24ch] text-[30px] font-black leading-[1.04] tracking-[-0.045em] tablet:text-[44px] desktop:text-[52px]">
            {rencontre.citation}
          </p>
          <div className="flex max-w-[58ch] flex-col gap-[14px] text-[16px] font-medium leading-[1.45] tracking-[-0.01em] tablet:text-[18px]">
            {rencontre.paragraphes.map((paragraphe) => (
              <p key={paragraphe} className="m-0">
                {paragraphe}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-[28px] gap-y-[14px]">
            <Link href={rencontre.cta.href} className="cta-primaire cta-encre">
              {rencontre.cta.label}
            </Link>
            <Link href={rencontre.parcours.href} className="cta-lien text-accent-ink">
              {rencontre.parcours.label}
            </Link>
          </div>
        </div>

        <div className="relative tablet:col-span-4 tablet:col-start-9 tablet:self-end">
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={rencontre.portrait.src}
              alt={rencontre.portrait.alt}
              fill
              sizes="(min-width: 810px) 30vw, 90vw"
              className="object-cover grayscale mix-blend-multiply"
            />
          </div>
          <div className="mt-[14px] flex flex-col gap-[6px]">
            <SignatureTracee className="w-[180px]" />
            <p className="micro m-0">{rencontre.signataire}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
