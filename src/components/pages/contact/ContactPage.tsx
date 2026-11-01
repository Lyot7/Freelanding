import Image from "next/image";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { BlocContact } from "@/components/layout/BlocContact";
import { FaqSection } from "@/components/sections/FaqSection";
import { Grain } from "@/components/effects/Grain";
import { content } from "@/lib/content";
import type { ContactContent } from "@/lib/content/types";

/**
 * LE FORMULAIRE D'ABORD, depuis le 2026-11-01 : il commençait à 80 % de la hauteur
 * de la page. Le lien « Contact » y arrive sans défilement, à 1440 comme à 390.
 * À gauche la phrase, puis le visage et les coordonnées ; à droite le formulaire,
 * onglets compris. Sur téléphone, le formulaire passe avant le visage.
 */
function ContactHero({ contact }: { contact: ContactContent }) {
  const { person, email, phone } = contact.contactCard;

  return (
    <section className="surface-dark relative w-full overflow-clip bg-background px-[20px] pb-[40px] pt-[92px] text-foreground tablet:px-[24px] tablet:pb-[70px] tablet:pt-[120px] desktop:px-[30px]">
      <Grain className="z-[1]" />
      <div className="relative z-[2] mx-auto grid w-full max-w-[1440px] gap-[24px] tablet:grid-cols-2 tablet:grid-rows-[auto_1fr] tablet:gap-x-[40px] tablet:gap-y-[32px] desktop:gap-x-[60px]">
        <div className="flex flex-col gap-[12px] tablet:gap-[20px]">
          <h1 className="titre-marque m-0 text-[clamp(36px,calc(10.6vw/var(--zoom-ecran,1)),60px)] tablet:text-[clamp(44px,calc(5.8vw/var(--zoom-ecran,1)),88px)]">
            {contact.hero.title}
          </h1>
          <p className="m-0 text-[16px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground-60 tablet:text-[18px]">
            {contact.hero.subtitle}
          </p>
        </div>

        {/* Cible des liens `#rendez-vous` : sur cette page, ils arrivent ici. */}
        <div className="relative tablet:col-start-2 tablet:row-span-2 tablet:row-start-1">
          <div id="rendez-vous" aria-hidden className="absolute -top-[100px]" />
          <BlocContact />
        </div>

        <div className="flex items-end gap-[20px] tablet:self-end">
          {person.avatar ? (
            <div className="relative aspect-[136/167] w-[96px] flex-none overflow-hidden grayscale tablet:w-[136px]">
              <Image
                src={person.avatar.src}
                alt={person.avatar.alt}
                fill
                sizes="136px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col gap-[6px]">
            <p className="m-0 text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
              {person.name}
            </p>
            {person.role ? (
              <p className="m-0 text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
                {person.role}
              </p>
            ) : null}
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="w-fit text-[18px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground no-underline transition-colors duration-200 hover:text-accent tablet:text-[22px]"
            >
              {phone}
            </a>
            <a
              href={`mailto:${email}`}
              className="w-fit text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground no-underline transition-colors duration-200 hover:text-accent"
            >
              {email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export async function ContactPage() {
  const [site, contact] = await Promise.all([
    content.getSiteConfig(),
    content.getContact(),
  ]);

  return (
    <>
      <Header site={site} />
      <FloatingNav site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <ContactHero contact={contact} />
        <FaqSection faq={[...contact.faq]} />
      </main>
      <Footer sansFormulaire />
    </>
  );
}
