"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import { Rouleaux } from "@/components/motion/Rouleaux";
import { TitreMasque } from "@/components/motion/TitreMasque";
import type { PreuvesContent } from "@/lib/content/types";

type Media = PreuvesContent["projets"][number]["medias"][number];

function Vignette({ media, href, ratio }: { media: Media; href: string; ratio: string }) {
  return (
    <Link href={href} className={`group relative block overflow-hidden bg-surface-2 ${ratio}`}>
      {media.video ? (
        <video
          src={media.video}
          poster={media.src}
          muted
          loop
          autoPlay
          playsInline
          preload="none"
          aria-label={media.alt}
          className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes="(min-width: 810px) 30vw, 84vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
      )}
    </Link>
  );
}

/**
 * LES RÉALISATIONS, EN MUR À DEUX VITESSES : le discours reste fixe à gauche, deux
 * colonnes de vrais écrans défilent à droite à des vitesses différentes, et le
 * projet en cours passe en encre pleine. Sur téléphone, un rail qu'on fait glisser.
 */
export function PreuvesSection({ preuves }: { preuves: PreuvesContent }) {
  const section = useRef<HTMLElement>(null);
  const [actif, setActif] = useState(0);
  const reduit = useReducedMotionAfterMount();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const yLente = useTransform(scrollYProgress, [0, 1], reduit ? [0, 0] : [120, -120]);
  const { projets } = preuves;

  useMotionValueEvent(scrollYProgress, "change", (progression) => {
    setActif(Math.min(projets.length - 1, Math.floor(progression * projets.length)));
  });

  const colonnes = [0, 1].map((colonne) =>
    projets.flatMap((projet) =>
      projet.medias
        .filter((_, index) => index % 2 === colonne)
        .map((media) => ({ media, href: `/realisations/${projet.slug}` })),
    ),
  );

  return (
    <section
      ref={section}
      id="realisations"
      data-section="preuves"
      className="relative w-full overflow-clip bg-background px-[20px] py-[60px] text-foreground tablet:px-[24px] tablet:py-[120px] desktop:px-[30px]"
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-[36px] tablet:grid-cols-12 tablet:gap-x-[20px]">
        <div className="flex flex-col gap-[22px] tablet:sticky tablet:top-[100px] tablet:col-span-5 tablet:self-start">
          <p className="micro m-0 text-foreground-60">{preuves.eyebrow}</p>
          <TitreMasque lignes={preuves.titleLines} className="titre-marque titre-section" />
          <p className="m-0 max-w-[42ch] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60 tablet:text-[18px]">
            {preuves.statement}
          </p>
          <ol className="m-0 flex list-none flex-col p-0">
            {projets.map((projet, index) => (
              <li
                key={projet.slug}
                className={`border-t border-white/10 py-[16px] transition-opacity duration-300 ${
                  actif === index ? "tablet:opacity-100" : "tablet:opacity-40"
                }`}
              >
                <Link href={`/realisations/${projet.slug}`} className="group flex flex-col gap-[6px] no-underline">
                  <span className="flex items-baseline justify-between gap-[16px] text-[18px] font-semibold tracking-[-0.01em]">
                    {projet.titre}
                    {projet.chiffre ? (
                      <span className="text-[26px] font-black tracking-[-0.045em] text-accent tabular-nums"><Rouleaux valeur={projet.chiffre} /></span>
                    ) : null}
                  </span>
                  <span className="max-w-[46ch] text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60">
                    {projet.resume}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href={preuves.lien.href} className="cta-lien w-fit text-foreground">
            {preuves.lien.label}
          </Link>
        </div>

        <div className="hidden gap-[20px] tablet:col-span-7 tablet:grid tablet:grid-cols-7">
          <div className="col-span-4 flex flex-col gap-[20px]">
            {colonnes[0].map(({ media, href }, index) => (
              <Vignette key={media.src} media={media} href={href} ratio={index % 2 === 0 ? "aspect-[4/5]" : "aspect-[16/10]"} />
            ))}
          </div>
          <motion.div className="col-span-3 flex flex-col gap-[20px]" style={{ y: yLente }}>
            {colonnes[1].map(({ media, href }, index) => (
              <Vignette key={media.src} media={media} href={href} ratio={index % 2 === 0 ? "aspect-[16/10]" : "aspect-[4/5]"} />
            ))}
          </motion.div>
        </div>

        <div className="-mx-[20px] flex snap-x snap-mandatory gap-[12px] overflow-x-auto px-[20px] scroll-px-[20px] tablet:hidden">
          {projets.flatMap((projet) =>
            projet.medias.slice(0, 2).map((media) => (
              <div key={media.src} className="w-[84vw] max-w-[360px] flex-none snap-start">
                <Vignette media={media} href={`/realisations/${projet.slug}`} ratio="aspect-[4/5]" />
              </div>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
