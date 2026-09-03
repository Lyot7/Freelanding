import { FloatingNav, Footer, Header } from "@/components/layout";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { Signature } from "@/components/sections/hero/Signature";
import { Grain } from "@/components/effects/Grain";
import { ParallaxCover } from "@/components/effects/ParallaxCover";
import { ParallaxBackdrop } from "@/components/motion/ParallaxBackdrop";
import { AvailabilityMeter, Highlighted } from "@/components/ui";
import { FaqSection } from "@/components/sections/FaqSection";
// Le formulaire est un composant CLIENT (soumission, état d'envoi, anti-robot).
// Cette page reste un composant serveur : voir l'en-tête de `ContactForm.tsx`.
import { ContactForm } from "@/components/pages/contact/ContactForm";
// Prise de rendez-vous Cal.com. Composant SERVEUR : il lit l'environnement et
// ne rend RIEN tant qu'aucun type d'événement n'est configuré.
import { SectionRendezVous } from "@/components/rendez-vous/SectionRendezVous";
import { content } from "@/lib/content";
import type { Availability, ContactContent } from "@/lib/content/types";

/**
 * Bloc de disponibilité du hero contact.
 *
 * DEUX LIGNES EN MOBILE, une seule à partir de 810. La source publie deux
 * variantes de ce bloc et nous n'en rendions qu'une : `[Desktop]` en RANGÉE
 * (185,9 × 14,4 à 810 comme à 1440) et `[Phone right aligned]` en COLONNE
 * alignée à droite, écart 6 (92,5 × 34,8 à 390) — le libellé sur la première
 * ligne, les jauges et le décompte sur la seconde. Nous rendions la rangée
 * partout, d'où un bloc de 14,4 px au lieu de 34,8 à 390, soit 20,4 px de moins
 * dans le héros.
 *
 * La jauge elle-même vient de `@/components/ui/AvailabilityMeter` : elle était
 * dupliquée ici avec un nombre de barres différent de celui du hero d'accueil.
 */
function Availability({
  availability,
  timeZone,
}: {
  availability: Availability;
  timeZone?: string;
}) {
  return (
    <div className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
      <AvailabilityMeter
        availability={availability}
        stacked
        // Fuseau d'Eliott, comme sur le hero d'accueil.
        timeZone={timeZone}
        className="justify-end"
      />
    </div>
  );
}

function ContactHero({
  contact,
  timeZone,
}: {
  contact: ContactContent;
  /** Fuseau d'Eliott, lu dans `siteConfig.contact.timezone` par la page. */
  timeZone?: string;
}) {
  const { person, availability } = contact.contactCard;
  // Sous-titre et fragments en emphase lus dans la DONNÉE : ils étaient
  // recopiés en dur, en anglais, donc l'emphase ne sortait plus.
  const subtitleParagraph = contact.hero.subtitleParagraphs?.[0];
  const subtitleText = subtitleParagraph?.text ?? contact.hero.subtitle ?? "";
  const subtitleEmphasis = subtitleParagraph?.emphasis
    ? [...subtitleParagraph.emphasis]
    : [];

  return (
    <section className="relative flex h-[90svh] min-h-[600px] w-full items-end justify-center overflow-hidden bg-background px-[20px] pb-[40px] tablet:px-[24px] tablet:pb-[30px] desktop:px-[30px]">
      <GradientWaveBackdrop seed={82} />
      {/* RELEVÉ sur `/contact` : hôte 1440 × 810, z-1, opacité 0,05. Nous
          étions à 0,07 PLUS le calque global de 0,05, soit un grain doublé. */}
      <Grain opacity={0.05} className="z-[1]" />
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 z-[2] hidden w-px bg-white/[0.08] tablet:block"
      />

      {/* Écart MESURÉ des deux côtés : 30 sous 810, 70 au-dessus. Le 38 posé ici
          compensait à l'aveugle les 20,4 px que la jauge de disponibilité
          perdait faute de se couper en deux lignes (voir `Availability`
          ci-dessus) et la remontée de 11 px de la rangée portrait. Les trois
          réglages se recouvraient : corrigés ensemble, ils rendent au portrait
          son ordonnée de source (562,8 à 390) et à la ligne de disponibilité la
          sienne (770). */}
      <div className="relative z-[3] flex w-full max-w-[1440px] flex-col items-end gap-[30px] tablet:gap-[70px]">
        <div className="flex w-full flex-col items-end gap-[20px] tablet:gap-[30px]">
          <Reveal
            className="grid w-full grid-cols-1 tablet:grid-cols-2"
            initialOpacity={0}
            initialY={48}
            duration={0.9}
            delay={0.12}
          >
            <h1 className="col-start-1 m-0 text-[63px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-foreground tablet:col-start-2 tablet:text-[78px] desktop:text-[98px]">
              {contact.hero.title}
            </h1>
          </Reveal>

          {/* Le chapô et le bloc « personne » sont DEUX RANGÉES distinctes sur la
              source (moitié gauche puis moitié droite, écart 30), pas deux
              colonnes côte à côte. Empilés, ils remontent le chapô de 73px. */}
          {subtitleText ? (
            <div className="flex w-full tablet:w-1/2 tablet:self-start tablet:justify-end">
              <Reveal
                as="p"
                // Largeur 280 px (mesurée, imposée par le parent sur le live) et
                // couleur de base à 60 % : le texte était entièrement en blanc
                // plein, ce qui supprimait tout contraste avec les emphases.
                // `self-start` : sur le live la boîte fait la hauteur du texte,
                // ici le grid l'étirait à 167 px.
                className="max-w-[280px] self-start text-left text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 tablet:text-right"
                initialOpacity={0}
                initialY={28}
                duration={0.8}
                delay={0.24}
              >
                {/* MESURÉ : texte à 60 %, avec les fragments d'emphase de la
                    donnée en blanc plein. */}
                <Highlighted text={subtitleText} highlights={subtitleEmphasis} />
              </Reveal>
            </div>
          ) : null}

          <Reveal
            // Rangée de droite : moitié de largeur, contenu calé à GAUCHE de
            // cette moitié (la source la démarre à x713, pas au bord droit).
            // En MOBILE, `self-start` : le parent est en `items-end`, donc
            // sans lui la carte partait au bord droit (photo à x64 au lieu de
            // x20 sur la source).
            // Le `-top-[11px]` retiré : la source n'applique AUCUN décalage ici,
            // son bloc personne suit simplement la colonne à écart 20. Les 11 px
            // compensaient à l'aveugle la jauge de disponibilité restée sur une
            // ligne — voir le commentaire de l'écart de colonne plus haut.
            className="relative flex w-fit items-end gap-[20px] self-start pt-[20px] tablet:w-1/2 tablet:gap-[30px] tablet:self-end tablet:pt-0"
            initialOpacity={0}
            initialY={32}
            duration={0.8}
            delay={0.32}
          >
            {person.avatar ? (
              <div
                // La source ne pose PAS de hauteur : elle fixe une largeur et un
                // RAPPORT, et laisse la hauteur en découler. Mesuré sur
                // `/live-proxy/contact` à 320, 360, 390, 430, 500, 600, 700 et
                // 809 : la boîte vaut 116x142,4 à TOUTES ces largeurs, et
                // 136x167 dès 810. La relation est exacte, 116 x 167/136 = 142,4.
                // Notre `h-[160px]` était donc faux de 18px sur toute la plage
                // mobile, et il l'était en dur là où la source dérive sa hauteur
                // d'une seule vérité. Un rapport unique reproduit les deux
                // paliers sans rien figer.
                // `grayscale` : le hero de contact est monochrome et l'accent
                // du site est un vert citron — c'est précisément la couleur du
                // paraphe posé PAR-DESSUS ce portrait. Une photo de fin de
                // journée en couleur y ferait cohabiter trois familles
                // chromatiques dans un cadre de 136 px. Même traitement que la
                // carte du pied de page, qui est le même motif « portrait +
                // nom ».
                className="relative z-[2] aspect-[136/167] w-[116px] flex-none overflow-hidden grayscale tablet:w-[136px]"
              >
                {/* Portrait sur-cadré de 6 % et DÉRIVANT : la source monte ici
                      son composant de parallaxe, il était posé à plat. */}
                <ParallaxBackdrop
                  src={person.avatar.src}
                  overshoot={0.06}
                  label={person.avatar.alt}
                >
                  {/* RELEVÉ sur `/contact` : hôte 136 × 167 à 1440, z-3,
                      opacité 0,06. */}
                  <Grain opacity={0.06} className="z-[3]" />
                </ParallaxBackdrop>
              </div>
            ) : null}

            <div className="relative z-[3] flex min-w-[170px] flex-col gap-[5px] pb-[2px]">
              <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
                {person.name}
              </p>
              {/* 70 % et non 60 : la source rend ce `<p>` en blanc PLEIN sous
                  une enveloppe à `opacity: .7`. Mesuré sur le fond du héros,
                  rgb(184,184,184) chez elle contre rgb(158,158,158) chez nous
                  tant que la ligne était à `text-foreground-60`. */}
              <p className="text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-white/70">
                {person.role}
                {person.company ? (
                  <>
                    <br />
                    <span className="font-semibold text-foreground">
                      {person.company}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <Signature variant="contact" />
          </Reveal>
        </div>

        <div className="grid w-full grid-cols-1 tablet:grid-cols-2">
          {availability ? (
            <div className="justify-self-end tablet:justify-self-start">
              <Availability availability={availability} timeZone={timeZone} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ContactDetails({ contact }: { contact: ContactContent }) {
  const card = contact.contactCard;

  return (
    <div className="grid w-full grid-cols-1 gap-[20px] tablet:grid-cols-2 tablet:gap-0">
      {/* La source n'affiche PAS ce libellé en dessous de 810 : il n'apparaît
          qu'à partir du moment où la carte passe en deux colonnes. */}
      <p className="hidden text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60 tablet:block">
        {contact.detailsEyebrow}
      </p>
      {/* Écart image → bloc e-mail/adresse MESURÉ sur la source : 30 sous 810
          (bas d'image 1820 → texte 1850 à 390), 50 à partir de 810 (1896 → 1946
          à 810, idem à 1199, 1440 et 1920). Il était figé à 30 partout. */}
      <div className="flex flex-col gap-[30px] tablet:gap-[50px]">
        {/* Rapport MESURÉ `aspect-ratio: 2.28 / 1` sur le conteneur de la source
            aux SEPT largeurs (350x154 à 390, 560x246 à 600, 769x337 à 809,
            381x167 à 810, 576x252 à 1199, 690x303 à 1440, 720x316 à 1920).
            Le 690/339 précédent venait de la boîte de SUR-CADRAGE (303 x 1,12 =
            339, 154 x 1,12 = 172), pas de la boîte de découpe : il rendait
            l'image trop haute de 18 à 41px selon la largeur. */}
        <div className="relative aspect-[2.28/1] w-full overflow-hidden">
          {/* Sur-cadrée de 6 % et DÉRIVANTE au scroll, comme la source
              (`top:-6%; height:calc(100% + 12%)`). Elle était posée en `fill`
              sans sur-cadrage ni mouvement : /contact était la dernière page
              sans aucun visuel dérivant. */}
          <ParallaxCover
            src={contact.cover?.src ?? ""}
            // L'ancien alt annonçait « l'équipe du studio d'origine » : image
            // d'illustration, aucune équipe réelle. La donnée décrit la photo.
            alt={contact.cover?.alt ?? "Trois personnes qui rient"}
            overshoot={0.06}
            /* UNE SEULE déclaration `filter`. `grayscale` et l'utilitaire
               arbitraire `[filter:…]` écrivent la même propriété, et le second
               gagne : le `grayscale` posé à côté ne s'appliquait pas. Sans
               conséquence visible ici — le bandeau est une image fixe extraite
               de notre boucle d'horlogerie, dont la saturation moyenne vaut
               10/255 — mais c'est le même piège qui, sur la couverture d'À
               propos, laissait sortir une photo en couleur. Les deux réglages
               sont fusionnés pour que le rendu dise ce que le code déclare. */
            imgClassName="[filter:grayscale(1)_contrast(.75)_brightness(1.8)]"
            /* Cadre large : 690 px à 1440, 381 à 810, 350 à 390 (relevé
               ci-dessous). Deux fois le gabarit par défaut du composant. */
            sizes="(min-width: 810px) 48vw, 100vw"
            /* La source fait ENTRER ce visuel, nous le posions à plat. Relevé
               d'état au chargement sur `/live-proxy/contact`, sans défilement :
               le cadre 690 × 303 à 1440 (381 × 167 à 810, 350 × 154 à 390)
               contient UN calque à `opacity: 0` et `scale(1.1)` — un seul, pas
               le motif à deux calques imbriqués. Loi commune de `mediaReveal`. */
            reveal
          >
            {/* RELEVÉ sur `/contact` : hôte 690 × 303 à 1440, z-3,
                opacité 0,09 (nous étions à 0,08). */}
            <Grain opacity={0.09} className="z-[3]" />
          </ParallaxCover>
        </div>
        {/* Écart e-mail → groupe adresse/téléphone : 16 en mobile, 28 au-dessus
            (mesuré ; 16 seulement à l'intérieur du groupe lui-même). */}
        <div className="flex flex-col gap-[18px] tablet:gap-[30px]">
          {/* Survol MESURÉ sur le live : `rgb(11,11,11)` → `rgb(255,69,0)`,
              `transition: color .2s cubic-bezier(.44,0,.56,1)` (presets
              `gdp728` / `cltove`, `--framer-link-hover-text-color:#ff4500`).
              L'adresse et le téléphone de la carte « Contact us » étaient
              inertes chez nous. */}
          <a
            href={`mailto:${card.email}`}
            // `w-fit` : la source borne la zone cliquable au TEXTE (boîte
            // mesurée 339,4 × 41). Enfant direct d'une colonne flex, notre lien
            // s'étirait sur les 690 px de la colonne, donc le survol s'allumait
            // en plein vide à droite de l'adresse.
            className="w-fit text-[22px] font-medium leading-[1.1] tracking-[-0.01em] text-background no-underline transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none tablet:text-[26px] desktop:text-[32px]"
          >
            {card.email}
          </a>
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[5px]">
              <span className="text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60">
                {card.addressLabel}
              </span>
              <span className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-background">
                {card.address}
              </span>
            </div>
            {/* Bloc téléphone MASQUÉ tant qu'aucun numéro n'est publié
                (`siteConfig.contact.phone` est volontairement vide). Il rendait
                sinon un libellé seul et un lien `tel:` vide. Le bloc entier
                disparaît : l'écart de 16px vit sur le conteneur flex, il ne
                laisse donc aucun espace résiduel. */}
            {card.phone ? (
              <div className="flex flex-col gap-[5px]">
                <span className="text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60">
                  {card.phoneLabel}
                </span>
                <a
                  // `replaceAll(" ", "")` laissait les parenthèses dans l'URI
                  // (`tel:+1(555)4000123`) ; on ne garde que `+` et les chiffres,
                  // comme le fait déjà le menu flottant.
                  href={`tel:${card.phone.replace(/[^+\d]/g, "")}`}
                  // Même survol et même zone bornée au texte que l'adresse
                  // ci-dessus (boîte source 132,8 × 21, la nôtre faisait 690).
                  className="w-fit text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-background no-underline transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none"
                >
                  {card.phone}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactBody({ contact }: { contact: ContactContent }) {
  const [lead, reply, capacity] = contact.intro;

  return (
    <section className="relative flex w-full justify-center bg-muted px-[20px] py-[20px] text-background tablet:px-[24px] tablet:py-[70px] desktop:px-[30px]">
      <span
        aria-hidden
        /* `z-[2]` : cette encoche de raccord est peinte APRÈS le hero dans le
          document, mais le calque de grain du hero est posé à `z-[1]` et la
          section, en `position: relative` sans `z-index`, ne crée AUCUN contexte
          d'empilement — ce grain remonte donc dans le contexte racine et se
          peignait par-dessus l'encoche. Résultat visible : la moitié qui se
          termine plus tôt sortait grenue là où le reste de la section est plat,
          ce qui se lit comme un voile flou au bas du hero.
          `FaqSection` porte déjà ce `z-[2]` et rend propre : c'est la même
          correction, sur les trois autres encoches du site. */
        className="absolute right-0 top-[-20px] z-[2] h-[20px] w-1/2 bg-muted tablet:top-[-30px] tablet:h-[32px]"
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 hidden w-px bg-black/[0.08] tablet:block"
      />

      <div className="relative flex w-full max-w-[1440px] flex-col">
        {lead ? (
          // Mêmes deux pièges que sur `/about` : le plafond de 900 doit vivre
          // dans une boîte SÉPARÉE de celle qui porte `ml-auto` (sinon +124px
          // vers la droite), et la gouttière ne doit pas rogner la colonne.
          <div className="w-full tablet:ml-auto tablet:w-3/4">
            <Reveal
              as="p"
              className="w-full max-w-[900px] pb-[16px] text-[22px] font-medium leading-[1.1] tracking-[-0.02em] tablet:pb-[40px] tablet:text-[26px] tablet:tracking-[-0.01em] desktop:text-[32px]"
              initialOpacity={0}
              initialY={30}
              duration={0.75}
            >
              {lead}
            </Reveal>
          </div>
        ) : null}

        <div className="grid w-full grid-cols-1 gap-[16px] pb-[20px] tablet:ml-auto tablet:w-1/2 tablet:grid-cols-2 tablet:gap-0 tablet:pb-[30px]">
          {/* Gouttière de 20px sur la CELLULE (cf. `/about`), et plafond de 300
              ici contre 320 là-bas : la source ne partage pas la largeur.
              Ce plafond ne vaut QU'À partir de 810 : sous ce seuil la source
              étale le texte sur toute la largeur utile (330 à 390 de fenêtre,
              540 à 600, 748 à 808). Plafonné à 300 partout, il gagnait une à
              deux lignes en bande mobile. */}
          {[reply, capacity].filter(Boolean).map((paragraph) => (
            <div key={paragraph} className="pr-[20px]">
              <p className="text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-background/60 tablet:max-w-[300px]">
                {paragraph}
              </p>
            </div>
          ))}
        </div>

        <ContactForm
          form={contact.form}
          emailContact={contact.contactCard.email}
        />
        <ContactDetails contact={contact} />
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
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <ContactHero contact={contact} timeZone={site.contact.timezone} />
        <ContactBody contact={contact} />
        {/* Entre le corps clair et la FAQ claire : l'alternance sombre/clair du
            reste du site est ainsi conservée, et le bloc tombe juste après le
            formulaire, pour qui préfère parler plutôt qu'écrire. */}
        <SectionRendezVous emailContact={contact.contactCard.email} />
        {/* Bloc FAQ standard, comme la home, `/work`, `/blog` et les pages
            légales. Une variante locale divergeait : questions en 18px casse
            normale au lieu de 11px capitales, ni numérotation 01-04, ni filets,
            aucun item ouvert par défaut et CTA absent — d'où 1050 px de section
            contre 735 px sur le live, soit ~315 px de vide en bas. */}
        <FaqSection faq={[...contact.faq]} />
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
