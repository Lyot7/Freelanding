"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import { Rouleaux } from "@/components/motion/Rouleaux";
import { COURBE } from "@/components/motion/tempo";
import { TitreMasque } from "@/components/motion/TitreMasque";
import type { ConfianceContent } from "@/lib/content/types";

/** « chez moi » se barre, « chez vous » s'écrit, ligne après ligne, une seule fois. */
function Bascule({ objet, avant, apres, index }: { objet: string; avant: string; apres: string; index: number }) {
  const reduit = useReducedMotionAfterMount();
  const retard = 0.3 + index * 0.15;
  return (
    <li className="flex flex-wrap items-baseline gap-x-[12px] text-[28px] font-black uppercase leading-[1.04] tracking-[-0.045em] tablet:text-[26px] desktop:grid desktop:grid-cols-[1fr_auto_auto] desktop:text-[36px]">
      {objet}
      {reduit ? null : (
        <span className="relative text-white/40">
          {avant}
          <motion.span
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-[3px] origin-left bg-accent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.4, ease: COURBE.vive, delay: retard }}
          />
        </span>
      )}
      <motion.span
        className="text-accent"
        initial={{ opacity: reduit ? 1 : 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.28, delay: reduit ? 0 : retard + 0.32 }}
      >
        {apres}
      </motion.span>
    </li>
  );
}

/**
 * CE QUE LE VISITEUR RISQUE, ET CE QU'IL PEUT VÉRIFIER SEUL. Le titre d'Eliott est
 * le seul changement d'échelle de la page ; dessous, une grille asymétrique et des
 * liens vers des preuves vérifiables, pas des chiffres déclarés.
 */
export function ConfianceSection({ confiance }: { confiance: ConfianceContent }) {
  return (
    <section
      data-section="confiance"
      className="surface-light relative flex w-full flex-col items-center bg-muted px-[20px] py-[60px] text-background tablet:px-[24px] tablet:py-[120px] desktop:px-[30px]"
    >
      <div className="flex w-full max-w-[1440px] flex-col gap-[36px] tablet:gap-[60px]">
        <div className="flex flex-col gap-[20px]">
          <p className="micro m-0 text-background/60">{confiance.eyebrow}</p>
          <TitreMasque
            lignes={confiance.titleLines}
            className="font-black uppercase leading-[0.94] tracking-[-0.045em] text-[calc(13.2vw/var(--zoom-ecran,1))] desktop:text-[calc(12.6vw/var(--zoom-ecran,1))]"
          />
        </div>

        <div className="grid gap-[12px] tablet:grid-cols-12">
          <div className="flex flex-col justify-between gap-[28px] bg-background p-[20px] text-foreground tablet:col-span-7 tablet:row-span-3 tablet:p-[30px]">
            <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
              {confiance.otage.lignes.map((objet, index) => (
                <Bascule key={objet} objet={objet} avant={confiance.otage.avant} apres={confiance.otage.apres} index={index} />
              ))}
            </ul>
            <p className="m-0 max-w-[44ch] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60 tablet:text-[18px]">
              {confiance.otage.conclusion}
            </p>
          </div>
          <div className="flex flex-col gap-[10px] border border-black/[0.14] p-[20px] tablet:col-span-5 tablet:p-[30px]">
            <span className="text-[44px] font-black leading-none tracking-[-0.045em] tablet:text-[58px]">
              <Rouleaux valeur={confiance.tuiles[0].chiffre} />
              <span className="ml-[10px] text-[22px] tracking-[-0.03em]">{confiance.tuiles[0].titre}</span>
            </span>
            <span className="max-w-[38ch] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70">
              {confiance.tuiles[0].corps}
            </span>
          </div>
          {confiance.tuiles.slice(1).map((tuile) => (
            <div key={tuile.titre} className="flex flex-col gap-[8px] border border-black/[0.14] p-[20px] tablet:col-span-5 desktop:p-[24px]">
              <span className="text-[30px] font-black leading-none tracking-[-0.045em]">
                <Rouleaux valeur={tuile.chiffre} /> <span className="text-[18px] tracking-[-0.03em]">{tuile.titre}</span>
              </span>
              <span className="text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70">{tuile.corps}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[16px] border-t border-black/[0.14] pt-[24px] tablet:flex-row tablet:items-center tablet:justify-between">
          <div className="flex flex-col gap-[10px] tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-x-[28px]">
            <p className="micro m-0 text-background/60">{confiance.verifier.titre}</p>
            {confiance.verifier.liens.map((lien) => (
              <Link key={lien.href} href={lien.href} className="cta-lien w-fit text-background">
                {lien.label}
              </Link>
            ))}
          </div>
          <Link href={confiance.cta.href} className="cta-primaire surface-light w-fit bg-background text-foreground">
            {confiance.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
