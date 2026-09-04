import { SITE_URL } from "@/lib/site-url";
import { preferredSourceUrl } from "@/lib/preferred-source";
import Image from "next/image";
/* Le pied de page est sur les NEUF routes : ses liens préchargeaient toutes les
   routes du site dès qu'on descendait jusqu'à lui. Voir `HoverPrefetchLink`. */
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import { content } from "@/lib/content";
import { Reveal } from "@/components/motion/Reveal";
import { Grain } from "@/components/effects/Grain";
import { ParallaxCover } from "@/components/effects/ParallaxCover";
import { SwapText } from "@/components/ui";
import { BrandB } from "@/components/brand/BrandB";
import { SocialGlyph } from "@/components/layout/SocialGlyph";
import type { Link } from "@/lib/content/types";
import { uiLabels } from "@/content/ui";
import { Logo } from "./Logo";
// Le formulaire est un composant CLIENT ; le pied de page reste serveur.
import { FooterContactForm } from "./FooterContactForm";

/**
 * Footer — reconstruction fidèle (100 %) du footer Framer de la page d'accueil d'origine
 * (`footer.ts`, variantes SSR Desktop / Tablet / Phone fusionnées en UN composant
 * responsive, méthode du RECONSTRUCTION-GUIDE : Framer desktop-first → Tailwind
 * mobile-first inversé).
 *
 * Mapping des 3 variants Framer → breakpoints Tailwind :
 *   base    = mobile   (≤809.98)  = variant Phone   `framer-v-g803c6` (w 390)
 *   tablet: = 810-1199            = variant Tablet  `framer-v-1aqr92z` (w 810)
 *   desktop:= ≥1200               = variant Desktop `framer-1ta212j`  (w 1200)
 *
 * Périmètre reproduit (RÈGLE ABSOLUE : zéro invention, zéro élément retiré) :
 * carte témoignage (photo Jennifer + Darken + chevrons décoratifs + nom/avatar +
 * bloc blanc `Quote` note/rôle), bloc `Contact` (téléphone, email, response time),
 * `Logo` le gabarit d'origine, colonne CTA (h2 « Start a project. » + sous-texte + FORMULAIRE :
 * Name / email / select « What are you looking for? » + bouton « Send message » +
 * disclaimer + honeypots), `Legal Links`, **`Navigation Links` (la NAV)**, bloc
 * `Visit Us` (adresse + horaires + `Social` X/Instagram), `Copyright Text`,
 * crédits « Built in Framer » + « Created by Anatolii Dmitrienko », décors
 * `BG` / `Darken` / `Grain` / `Vector` / `Line` (filet vertical central).
 *
 * Données : `content.getSiteConfig()` (footerNav, contact, footerForm, socials,
 * legalLinks, copyrightLong, credits, footerCta) — aucun texte éditorial en dur.
 * Server Component async (aligné sur la façon dont la home consomme le port) qui
 * rend la primitive client `Reveal` (état de REPOS = footer visible).
 *
 * Données recalées sur la source : footerNav = 4 liens
 * (Accueil/Réalisations/Contact/Blog ; le « 404 » du template a été retiré le
 * 2026-09-01, voir `site.ts`) ; legalLinks = [Privacy Policy, Terms of
 * Service]. socials a 3 entrées ; le footer n'expose que X + Instagram
 * → `.slice(0, 2)`.
 */

/** Stack de police littérale Framer (identique au pilote StatsSection). */
const FONT = "[font-family:var(--font-sans)]";

/**
 * Repli des libellés de colonne. La valeur affichée vient de
 * `site.footerColumnLabels` : ces constantes ne servent que si elle manque.
 */
const LABELS = { contact: "Contact", navigation: "Navigation" } as const;

/**
 * Destination du crédit « Construit avec ».
 *
 * La source pointait vers Framer et vers l'auteur du thème. Ce site est une
 * reconstruction Next.js écrite par Eliott : le premier crédit va au framework,
 * le second est porté par la donnée (`credits.createdBy.href`, qui pointe vers
 * la page « à propos »).
 */
const BUILT_WITH_HREF = "https://nextjs.org";

/* Les onze champs pièges du template Framer ont disparu : aucun n'était lu,
   faute de route serveur. Un seul piège subsiste, dans `ChampsProtection`, et
   celui-là est VÉRIFIÉ par `POST /api/contact`. */

/* ------------------------------- SVG décoratifs ------------------------------ */

/**
 * Marque posée à cheval sur le coin haut-droit de la carte.
 *
 * C'ÉTAIT LE LOGO FRAMER : trois parallélogrammes inclinés, la marque de
 * l'outil qui a produit le template, en blanc et au-dessus du portrait
 * d'Eliott, sur les NEUF routes du site. Le site affichait donc la marque d'un
 * tiers à l'endroit le plus exposé de sa page, juste au-dessus de son nom.
 *
 * Remplacé par son monogramme. Le B et non le logotype complet : la zone est
 * un carré de 58 à 76 px de côté, où « BOUQUEREL » (rapport 10,9) ne tiendrait
 * qu'à 7 px de hauteur de capitale.
 */
function CardBrandMark() {
  return <BrandB cadrage="tight" className="block h-full w-full text-foreground" />;
}

/** Flèche « Built in Framer » (`#svg-1500971939_213`, 9×14, fill BLANC). */
/**
 * Bouton « source préférée » de Google.
 *
 * CE QUE ÇA FAIT, exactement : un visiteur connecté qui clique déclare à Google
 * qu'il veut voir ce site plus souvent. SES résultats mettent alors le site en
 * avant, avec un badge, y compris dans AI Mode et les AI Overviews. Ça ne
 * change rien pour les autres internautes : ce n'est pas un signal de
 * classement, c'est un abonnement.
 *
 * L'adresse est construite depuis le domaine du site plutôt que saisie à la
 * main. Google n'accepte que des domaines et sous-domaines, jamais un
 * sous-répertoire, et le paramètre attend le domaine NU (ni protocole, ni www).
 *
 * Rien n'est rendu tant que le site tourne en local : `SITE_URL` retombe alors
 * sur localhost, et un bouton pointant vers `?q=localhost` n'aurait aucun sens.
 */
function PreferredSourceLink({ label }: { label: string }) {
  const href = preferredSourceUrl(SITE_URL);
  if (!href) {
    return null;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex w-min flex-row items-center gap-[8px] whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 no-underline transition-colors duration-200 hover:text-foreground"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="block h-[12px] w-[12px] flex-none">
        <path
          d="M12 3.5 14.2 9h5.8l-4.7 3.4 1.8 5.6-5.1-3.5-5.1 3.5 1.8-5.6L4 9h5.8L12 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </a>
  );
}

/**
 * Marque de la technologie employée, à gauche de « construit avec Next.js ».
 *
 * C'était le logo FRAMER : trois parallélogrammes, la marque de l'outil qui a
 * produit le template. Il annonçait donc une technologie que ce site n'utilise
 * pas, juste à côté d'un texte qui en nomme une autre. Remplacé par la marque
 * de Next.js, citée nominativement pour dire avec quoi le site est construit.
 */
function BuiltWithMark() {
  return (
    <span aria-hidden className="relative block h-[14px] w-[14px] flex-none">
      <svg viewBox="0 0 24 24" className="block h-full w-full">
        <circle cx="12" cy="12" r="11" fill="none" stroke="white" strokeWidth="1.6" />
        <path d="M8.4 16.4V7.6h1.5l6.1 8.2" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="square" />
        <path d="M15.1 7.6v6.1" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="square" />
      </svg>
    </span>
  );
}

/**
 * Pastille montrée au survol à la place du portrait, dans les crédits.
 *
 * C'était l'ÉCLAIR DE FRAMER, la marque de l'outil du template, affichée sous
 * la mention « par Eliott Bouquerel ». Remplacée par son propre B, qui est
 * aussi la lettre d'attaque du logotype d'en-tête. Le tracé n'est plus recopié
 * ici : il vient de `BrandB`, sa source unique.
 */
function CreatedByLogo() {
  return <BrandB className="block h-[13px] w-[13px] text-accent-ink" />;
}

/*
 * Le grain du footer était une COPIE LOCALE du calque, sans `grain-drift` : les
 * deux calques du footer étaient donc les seuls du site à ne pas dériver du
 * tout. Relevé sur `/contact` : au même instant, quatre calques à
 * (-1,00 % / +29,67 %) et les deux du footer à (0 / 0). On utilise désormais le
 * composant partagé.
 */

/* ------------------------------- Sous-blocs ---------------------------------- */

type FooterPerson = { name: string; role?: string; note?: string };

/**
 * Carte du pied de page : portrait + surcouches + bloc blanc (mot + rôle).
 *
 * ASSETS REMPLACÉS LE 2026-08-10. Les trois visuels de ce composant venaient du
 * template et étaient les plus exposés du site : ils sont rendus sur les NEUF
 * routes. Deux d'entre eux montraient la photo d'une inconnue immédiatement à
 * côté du nom d'Eliott, tiré de `siteConfig.contact.person` — le même défaut que
 * l'avatar du hero. Ils portent désormais son vrai portrait, et le fond reprend
 * le mécanisme d'horlogerie du hero, ce qui raccorde le haut et le bas de page.
 */
function TestimonialCard({ person }: { person: FooterPerson }) {
  return (
    <div className="relative flex w-full flex-col overflow-visible">
      {/* framer-1tnsau9 "User Image" : photo au ratio 1.504 */}
      <div className="relative aspect-[1.504] w-full overflow-visible">
        {/* framer-salh3b : photo + grain (inset-0). La photo est sur-cadrée de
            7 % et DÉRIVE au scroll, comme sur la source ; elle était posée en
            `inset-0` sans sur-cadrage ni mouvement. Ce visuel est celui du bloc
            témoignage, présent sur /about, /blog, /contact et /work. */}
        <ParallaxCover
          /* PHOTO NATURELLE depuis le 2026-08-26. Ce cadre servait le portrait
             DÉTOURÉ sur aplat vert, sans filtre : c'était le plus grand aplat
             vert du site, rendu sur les NEUF routes, et il occupait la moitié de
             la carte. La photo d'origine est recadrée au rapport 1,504 du cadre,
             sujet légèrement à gauche pour que le nom et la vignette ancrés en
             bas à droite tombent sur l'étang et non sur le buste.
             `grayscale` : la carte, son bloc blanc et le pied de page entier
             sont monochromes, et l'accent du site est un vert citron. Servir ici
             une photo de fin de journée en couleur y introduirait une seconde
             famille chromatique (bleus du ciel, verts des arbres) à côté de
             l'accent. Le détourage vert reste employé sur la vignette ronde de
             cette même carte : lui EST l'accent. */
          src="/images/eliott-nature-paysage.jpg"
          imgClassName="grayscale"
          overshoot={0.07}
          /* APPARITION DU VISUEL, absente jusqu'ici sur les NEUF routes : le
             pied de page est le seul bloc commun à tout le site, et sa photo
             était le manque le plus répandu du projet. Il ne pouvait pas être
             vu par `motion-sweep`, qui apparie par contenu textuel : un cadre
             d'image n'a pas de texte.
             RELEVÉ sur `/live-proxy/legal/terms-of-service` à 1440 : le cadre
             `.framer-milu93` de 345 × 229 est en `overflow: clip` et contient
             UN SEUL calque masqué, `.framer-1ambeg8-container`, à `opacity: 0`
             et `scale(1.1)` ; son enfant est à `opacity: 1` sans transform, il
             n'y a donc pas ici le motif à deux calques imbriqués de l'accordéon
             d'`/about`. Le grain (`.framer-30jb7g-container`) est son FRÈRE et
             ne fond pas avec l'image.
             Course relevée image par image après franchissement du seuil :
             opacité 0,017 à 87 ms · 0,051 à 187 · 0,114 à 288 · 0,270 à 396 ·
             0,677 à 496 · 0,835 à 596 · 0,906 à 694 · 0,949 à 796 · 0,974 à 895
             · 0,989 à 995 · 0,997 à 1096 · 0,999 à 1146. L'échelle suit la même
             progression, (1,1 - échelle) / 0,1 valant l'opacité à chaque image.
             C'est exactement la loi commune de `mediaReveal` : 1,17 s sur
             `cubic-bezier(0.68, 0, 0, 1)`, aucun délai, aucun échelonnement. */
          reveal
        >
          {/* framer-30jb7g : grain sur la photo (opacity .07) */}
          <div className="pointer-events-none absolute inset-0 z-[3] select-none">
            <Grain opacity={0.07} />
          </div>
        </ParallaxCover>

        {/* framer-145m0vj "Darken" : dégradé bas (0 → rgba(0,0,0,.78)) */}
        <div className="absolute inset-x-0 bottom-0 z-0 h-[100px] overflow-hidden bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.78)_100%)]" />

        {/* framer-l5x7vw "Icons" : marque décorative (masquée en mobile).
            La HAUTEUR et le débord sont ceux du décor d'origine ; seule la
            largeur suit désormais le rapport du monogramme (660,6 / 642 =
            1,029), au lieu des 115 px d'un dessin deux fois plus large. */}
        <span className="absolute right-[-21px] top-[-30px] z-[3] hidden h-[58px] w-[60px] tablet:block desktop:right-[-29px] desktop:top-[-38px] desktop:h-[76px] desktop:w-[78px]">
          <CardBrandMark />
        </span>

        {/* framer-100sfvm "User Info" : nom + avatar, ancrés bas-droite */}
        <div className="absolute bottom-[15px] right-[15px] z-[3] flex w-min flex-row items-center gap-[12px]">
          {/* framer-1e9xkpe : nom (preset 2okhk1, 14px, blanc) */}
          <p className="relative h-auto w-auto whitespace-pre text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
            {person.name}
          </p>
          {/* framer-re4yws : avatar 36px (37 mobile), rounded 50px */}
          <div className="relative aspect-square h-[37px] w-[37px] flex-none overflow-hidden rounded-[50px] tablet:h-[36px] tablet:w-[36px]">
            {/* 37 px à l'écran, pas les 83 du fichier : `width`/`height` sont la
                boîte D'AFFICHAGE, c'est elle qui décide de la variante servie. */}
            <Image
              src="/images/eliott-bouquerel-avatar.jpg"
              alt=""
              width={37}
              height={37}
              className="block h-full w-full rounded-[inherit] object-cover object-center"
            />
          </div>
        </div>
      </div>

      {/* framer-1bz9lop "Quote" : bloc blanc au-dessus de la photo (relative, en flux) */}
      <div className="relative z-[3] flex w-full flex-col items-end gap-[10px] bg-foreground p-[14px]">
        {/* framer-zxx5xd : note (preset 2okhk1, 14px, #0b0b0b, aligné droite) */}
        <p className="h-auto w-full max-w-[260px] whitespace-pre-wrap break-words text-right text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-[#0b0b0b]">
          {person.note}
        </p>
        {/* framer-1pe9chb : rôle (preset 11kvajf, 11px, rgba(11,11,11,.6), aligné droite) */}
        {person.role ? (
          <p className="h-auto w-full whitespace-pre-wrap break-words text-right text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-[rgba(11,11,11,0.6)]">
            {person.role}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Icône sociale (14px, 22 mobile), opacité 0,5 → 0,8 au survol.
 *
 * LE GLYPHE EST INLINE ET HÉRITE DE `text-foreground`. Il était servi par une
 * balise `<img>` pointant sur un fichier SVG : un SVG chargé ainsi est un
 * document isolé, il n'hérite d'aucune couleur, et son `currentColor` retombait
 * sur le noir. Sur ce pied de page presque noir, le glyphe GitHub était donc
 * invisible. Servi en production.
 */
function SocialIcon({ social }: { social: Link }) {
  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${uiLabels.chrome.socialLinkPrefix}${social.label}`}
      className="group relative flex aspect-square h-[22px] w-[22px] flex-none items-center justify-center text-foreground"
    >
      {/* MESURÉ sur le live : l'opacité va de 0.5 à 0.80 (et non 1), de façon
          asymptotique et lente — 0.661 à 102 ms, 0.781 à 304 ms, 0.80 à ~700 ms.
          La version précédente montait à 1.0 en 200 ms, soit trop haut et 3× trop
          vite. */}
      <SocialGlyph
        social={social}
        className="block h-full w-full opacity-50 transition-opacity duration-700 ease-out group-hover:opacity-80 motion-reduce:transition-none"
      />
    </a>
  );
}

/* --------------------------------- Footer ------------------------------------ */

export async function Footer() {
  const {
    brand,
    footerNav = [],
    contact,
    footerForm,
    socials,
    legalLinks,
    copyrightLong,
    credits,
    footerCta,
    footerColumnLabels,
  } = await content.getSiteConfig();

  const person = contact.person;
  /*
   * TOUS LES RÉSEAUX, ET PLUS LES DEUX PREMIERS. La source Framer en exposait
   * deux (X et Instagram) et la coupe avait été recopiée telle quelle. Elle est
   * devenue un piège le jour où la liste en a compté trois : le troisième
   * disparaissait sans erreur, sans avertissement, et sans que rien ne le
   * signale à la relecture du contenu.
   */
  const exposedSocials = socials;

  // Sous-texte du CTA : la fin de phrase passe en blanc plein, le reste reste à
  // 60 %. Le fragment mis en avant vient de la donnée (`subtextEmphasis`) : il
  // était figé en anglais ici, donc traduire le sous-texte cassait l'emphase
  // sans aucune erreur visible.
  const subtext = footerCta?.subtext ?? "";
  const subtextEmphasis = footerCta?.subtextEmphasis?.[0] ?? "";
  const [subtextBefore] = subtextEmphasis
    ? subtext.split(subtextEmphasis)
    : [subtext];

  // Style de lien inline (preset gdp728 : blanc, hover accent).
  // 200ms : durée MESURÉE sur le live. `transition-colors` seul retombait sur
  // les 150ms par défaut de Tailwind, une bascule sensiblement plus sèche.
  const inlineLinkCls =
    "text-foreground no-underline transition-colors duration-200 hover:text-accent";
  // Nav du footer (preset 1r5vzwr 20/18px + lien gdp728 blanc) — LA NAV.
  const navLinkCls =
    "relative h-auto w-auto whitespace-pre text-[18px] font-medium leading-[1.2] tracking-[-0.01em] " +
    inlineLinkCls +
    " desktop:text-[20px]";
  // Petit label de section (preset 11kvajf 11px, blanc 60 %, uppercase).
  const sectionLabelCls =
    "relative h-auto w-auto whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60";

  return (
    <Reveal
      as="footer"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start gap-[10px] overflow-clip bg-muted " +
        "pt-[40px] pr-[20px] pb-[20px] pl-[20px] " +
        "tablet:pt-[110px] tablet:pr-[24px] tablet:pb-[70px] tablet:pl-[24px] " +
        "desktop:pr-[30px] desktop:pl-[30px]"
      }
      initialOpacity={0.001}
      initialY={40}
      duration={1}
    >
      {/* framer-4sozsi "BG" : APLAT, plus de photo.
          Le template posait ici une photo d'ambiance, la plus lourde du site
          après le hero et la seule chargée sur les NEUF routes. Elle a d'abord
          été remplacée par une image du mécanisme du hero, puis RETIRÉE le
          2026-08-10 : sous un formulaire de contact et une barre légale, une
          photo d'ambiance ajoute du bruit derrière du texte utile et coûte un
          téléchargement sur chaque page. Le grain et le filet suffisent à
          empêcher l'aplat de paraître vide. */}
      <div className="absolute inset-0 z-[1] bg-background" />

      {/* framer-f8amnx "Grain" : grain plein footer (z-2, opacity .08) */}
      <div className="pointer-events-none absolute inset-0 z-[2] select-none">
        <Grain opacity={0.08} />
      </div>

      {/* framer-50743m "Line" : filet vertical central (blanc 10 %, hidden mobile) */}
      <div className="absolute bottom-0 left-[calc(50%-0.5px)] top-0 z-[1] hidden w-px bg-foreground opacity-10 tablet:block" />

      {/* framer-1omt5a8 "Container" : contenu (z-3, max 1440) */}
      <div className="relative z-[3] flex w-full max-w-[1440px] flex-col items-start gap-[30px] tablet:gap-[60px]">
        {/* framer-3kfqth "1 row" : col gauche (carte/contact/logo) + col droite (CTA/form) */}
        <div className="relative flex w-full flex-col gap-[30px] tablet:grid tablet:auto-rows-[minmax(0,1fr)] tablet:grid-cols-[repeat(2,minmax(50px,1fr))] tablet:grid-rows-[repeat(1,minmax(0,1fr))] tablet:justify-center tablet:gap-0">
          {/* framer-8vf8h5 "Column" : carte + contact + logo (order 1 mobile) */}
          <div className="relative order-1 flex w-full flex-col items-start justify-center gap-[20px] overflow-visible tablet:order-none tablet:h-full tablet:justify-between tablet:gap-0 tablet:self-start">
            {/* framer-egln9i : carte témoignage (w 50 % dès tablet) */}
            <div className="relative flex w-full flex-col items-start overflow-visible tablet:w-[50%]">
              {person ? <TestimonialCard person={person} /> : null}
            </div>

            {/* framer-fa2dar "Contact Info" */}
            <div className="relative flex w-full flex-col items-start gap-[16px] overflow-visible tablet:gap-[18px]">
              {/* framer-491kk7 "Contact Details" */}
              <div className="relative flex w-full flex-col items-start gap-[10px] overflow-visible tablet:gap-[18px]">
                <p className={sectionLabelCls}>{footerColumnLabels?.contact ?? LABELS.contact}</p>
                {/* framer-165vce2 : téléphone + email */}
                <div className="relative flex w-full flex-col items-start gap-[8px] overflow-visible">
                  {/* framer-hy4ocy : téléphone (preset 1hcapze 22/24/26px).
                      CONDITIONNÉ : `siteConfig.contact.phone` est volontairement
                      vide tant qu'Eliott n'a pas décidé de publier un numéro.
                      Sans ce garde-fou, le pied de page des NEUF routes rendait
                      un `<a href="tel:">` au libellé vide, cliquable et
                      illisible au lecteur d'écran. L'écart de 8px vit sur le
                      conteneur `flex`, donc retirer le bloc entier ne laisse
                      aucun blanc résiduel. */}
                  {contact.phone ? (
                    <p className="relative h-auto w-auto whitespace-pre text-[22px] font-medium leading-[1.1] tracking-[-0.01em] tablet:text-[24px] desktop:text-[26px]">
                      <a
                        href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={inlineLinkCls}
                      >
                        {contact.phone}
                      </a>
                    </p>
                  ) : null}
                  {/* framer-1tn186i : email (preset htsnb8 16px) */}
                  <p className="relative h-auto w-auto whitespace-pre text-[16px] font-medium leading-[1.2] tracking-[-0.01em]">
                    <a href={`mailto:${contact.email}`} className={inlineLinkCls}>
                      {contact.email}
                    </a>
                  </p>
                </div>
              </div>
              {/* framer-10bgy7h : response time (preset wwtw0z 12px, blanc 60 %) */}
              {contact.responseTime ? (
                <p className="h-auto w-full max-w-[260px] whitespace-pre-wrap break-words text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
                  {contact.responseTime}
                </p>
              ) : null}
            </div>

            {/* framer-gveyot "Logo" : strictement le même nœud que le header sur
                la source (même symbole #svg409374339_341 en `<use>`, fill blanc,
                135×26, gap 14px) → on réutilise la primitive partagée. */}
            <Logo brand={brand} className="w-min" />
          </div>

          {/* framer-1offil1 "Column" : CTA + formulaire (order 0 mobile) */}
          <div className="accent-clip-titre relative order-0 flex w-full flex-col items-start gap-[10px] overflow-clip tablet:order-none tablet:gap-[40px]">
            {/* framer-1s1ifxt : titre + sous-texte */}
            <div className="accent-room relative flex w-full flex-col items-start gap-[16px] overflow-clip [--accent-room:22px] tablet:gap-[30px]">
              {/* framer-1ulxnp8 : h2 (preset 13oqqfm 52/62/92px, aligné gauche)
                  MESURÉ : à 810 px de fenêtre, « Démarrons » rend 408 px dans
                  une colonne qui n'en fait que 381. `break-words` le coupait
                  donc en « Démarron » + « s », SANS trait d'union et sur les
                  neuf routes, le pied de page étant commun à tout le site.
                  Deux corrections, pas une : la classe qui autorise la coupure
                  est retirée (couper un mot dans un titre est toujours un
                  défaut, jamais une mise en page), et le corps passe de 68 à
                  62 px au seul palier fautif — 408 x 62/68 = 372, sous les 381
                  disponibles. `scripts/word-break-audit.mjs` vérifie qu'aucun
                  mot ne se recoupe ailleurs. */}
              <h2 className="relative m-0 w-full max-w-full whitespace-pre-wrap p-0 text-left text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-foreground tablet:max-w-[390px] desktop:max-w-none tablet:text-[62px] desktop:text-[92px]">
                {footerCta?.heading}
              </h2>
              {/* framer-dak6ek : sous-texte (preset wwtw0z 12px, blanc 60 % + emphase blanche) */}
              <p className="h-auto w-full max-w-[330px] whitespace-pre-wrap break-words text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
                {subtextBefore}
                <span className="text-foreground">{subtextEmphasis}</span>
              </p>
            </div>

            {/* framer-24skgi : formulaire, branché sur `POST /api/contact`. */}
            {footerForm ? (
              <FooterContactForm
                footerForm={footerForm}
                emailContact={contact.email}
                inlineLinkCls={inlineLinkCls}
              />
            ) : null}
          </div>
        </div>

        {/* framer-lj3c70 "2 row" : legal (gauche) + nav/contact/copyright (droite) */}
        {/* Le filet du haut est un PSEUDO-ÉLÉMENT et non un `border-t`.
            MESURÉ : `.framer-lj3c70` n'a aucune bordure de boîte
            (`border-top-width: 0px`), la source dessine ses filets via
            `[data-border=true]::after`, un calque `position:absolute; inset:0;
            width:100%; height:100%` — donc HORS de la hauteur. Notre `border-t`
            entrait dans la boîte : barre légale à 323,19 px contre 321,20 sur la
            source, et le contenu poussé à 61 px du haut au lieu de 60. */}
        <div className="relative flex w-full flex-col gap-[22px] pt-[30px] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[rgba(255,255,255,0.1)] before:content-[''] tablet:grid tablet:grid-cols-[repeat(2,minmax(50px,1fr))] tablet:justify-center tablet:gap-0 tablet:pt-[60px]">
          {/* framer-114nzdq "Column" : legal links (order 1 mobile, collés en bas dès tablet) */}
          <div className="relative order-1 flex w-full flex-col items-start justify-end overflow-visible tablet:order-none tablet:h-full">
            {/* framer-mqix49 "Legal Links" (gap 32) */}
            <div className="relative flex w-min flex-row items-center gap-[32px] overflow-visible">
              {/* FORME COURTE ICI, et ici seulement. Les trois liens légaux
                  partagent une ligne : en toutes lettres, « Politique de
                  confidentialité » (168 px) et « Conditions générales » les
                  faisaient déborder de leur colonne, là où la source anglaise
                  (« Privacy Policy », 89 px) tenait. Les pages elles-mêmes, le
                  menu flottant et la mention du formulaire gardent les intitulés
                  complets : c'est une contrainte de gabarit, pas un changement
                  de dénomination. */}
              {legalLinks.map((l) => (
                <p
                  key={l.href}
                  className="relative h-auto w-auto whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em]"
                >
                  <HoverPrefetchLink
                    href={l.href}
                    // `transition-colors` ne couvre PAS `text-underline-offset` :
                    // le soulignement sautait d'un cran au lieu de glisser.
                    className="text-foreground-60 underline decoration-[rgba(255,255,255,0.13)] underline-offset-[3px] transition-[color,text-underline-offset] duration-200 hover:text-foreground hover:underline-offset-[4px]"
                  >
                    {l.shortLabel ?? l.label}
                  </HoverPrefetchLink>
                </p>
              ))}
            </div>
          </div>

          {/* framer-it19ga "Column" (order 0 mobile) */}
          <div className="relative order-0 flex w-full flex-col items-start gap-[30px] overflow-clip tablet:order-none tablet:gap-[60px]">
            {/* framer-v2vt3s : nav + Visit Us (côte à côte) */}
            <div className="relative flex w-full flex-row overflow-clip">
              {/* framer-jp2c96 : Navigation (37 %) */}
              <div className="relative flex w-[37%] flex-col items-start gap-[16px] overflow-visible tablet:gap-[20px]">
                <p className={sectionLabelCls}>{footerColumnLabels?.navigation ?? LABELS.navigation}</p>
                {/* framer-37vh84 "Navigation Links" : LA NAV (gap 6) */}
                <nav
                  aria-label={uiLabels.chrome.footerNavAriaLabel}
                  className="relative flex w-min flex-col items-start gap-[6px] overflow-visible"
                >
                  {footerNav.map((l) => (
                    /* La typo est portée AUSSI par le <p> : sa hauteur vient du
                       montant de ligne, pas du <a> en ligne. Sans elle, le <p>
                       hérite du corps du footer (17px × 1,5 = 25,5) et le pas de
                       la nav passe à 31,5 au lieu des 30 de la source. */
                    /* Largeur AJUSTÉE AU TEXTE, pas `w-full`. La nav est en
                       `w-min`, donc `w-full` donnait à CHAQUE ligne la largeur
                       du plus long libellé : relevé à 1440, nos cinq boîtes
                       faisaient 73px quand la source les pose à 54 / 58 / 73 /
                       42 / 38, exactement comme leurs liens. Le rendu visuel
                       était le même (texte calé à gauche) mais la boîte, elle,
                       débordait son propre lien de 19 à 35px, sur les 18 pages. */
                    <p
                      key={l.href}
                      className="relative h-auto whitespace-pre-wrap break-words text-[18px] leading-[1.2] desktop:text-[20px]"
                    >
                      <HoverPrefetchLink
                        href={l.href}
                        {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className={navLinkCls}
                      >
                        {l.label}
                      </HoverPrefetchLink>
                    </p>
                  ))}
                </nav>
              </div>

              {/* framer-18xdl4y "Contact Details" : Visit Us (flex 1) */}
              <div className="relative flex flex-1 flex-col items-start gap-[16px] overflow-visible tablet:gap-[20px]">
                {contact.addressLabel ? (
                  <p className={sectionLabelCls}>{contact.addressLabel}</p>
                ) : null}
                {/* framer-187xpvs "Contact Info" (gap 16) */}
                <div className="relative flex w-full flex-col items-start gap-[16px] overflow-visible">
                  {/* framer-i62a53 : adresse (preset 1r5vzwr 18/20px, blanc) */}
                  {contact.address ? (
                    <p className="relative h-auto w-full whitespace-pre-wrap break-words text-[18px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground desktop:text-[20px]">
                      {contact.address}
                    </p>
                  ) : null}
                  {/* framer-vgtjiq : horaires (gap 1) */}
                  {contact.hours && contact.hours.length > 0 ? (
                    <div className="relative flex w-full flex-col items-start gap-[1px] overflow-clip">
                      {contact.hours.map((h) => (
                        <p
                          key={h}
                          className="relative h-auto w-auto whitespace-pre text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60"
                        >
                          {h}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {/* framer-1kpyz9c "Social" : X + Instagram (pt 4) */}
                  <div className="relative flex w-min flex-row items-center gap-[14px] pt-[4px] tablet:gap-[12px]">
                    {/* Glyphes appariés au RÉSEAU et non à son rang dans la
                        liste, et rendus inline pour qu'ils héritent de la
                        couleur de leur hôte — voir `SocialGlyph`, qui sert
                        aussi le bloc newsletter du blog, sur fond clair. */}
                    {exposedSocials.map((s) => (
                      <SocialIcon key={s.href} social={s} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* framer-tl8ugv : copyright + crédits */}
            <div className="relative flex w-full flex-col items-start gap-[22px] overflow-clip tablet:flex-row tablet:items-end tablet:gap-0 desktop:items-center">
              {/* framer-1ja693d : copyright (preset 11kvajf 11px, blanc 60 %, w 37 %) */}
              <div className="relative flex w-full flex-row items-center overflow-clip tablet:w-[37%]">
                {/* `uppercase` : le live rend « © 2026 LA MARQUE D'ORIGINE. ALL RIGHTS
                    RESERVED. » en capitales (`text-transform: uppercase`). Sans
                    lui la casse de la donnée passait telle quelle. */}
                <p className="h-auto w-full max-w-[90%] whitespace-pre-wrap break-words text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
                  {copyrightLong}
                </p>
              </div>

              {/* framer-jzr464 : « Built in Framer » + « Created by … » */}
              <div className="relative flex w-full flex-col items-start gap-[8px] overflow-clip tablet:items-end tablet:gap-[6px] desktop:w-px desktop:flex-1 desktop:flex-row desktop:items-center desktop:justify-between">
                {/* framer-egZYB : Built in Framer (flèche + texte) */}
                {credits?.preferredSourceLabel ? (
                  <PreferredSourceLink label={credits.preferredSourceLabel} />
                ) : null}

                <a
                  href={BUILT_WITH_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex w-min flex-row items-center gap-[8px] overflow-hidden no-underline"
                >
                  <BuiltWithMark />
                  <span className="relative h-auto w-auto whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
                    {/* Motif `.framer-xh8ae` : 18 px vers le BAS et AUCUN
                        fondu. Relevé rAF sur `/live-proxy` : les deux copies
                        restent à `opacity: 1` sur toute la course, seul le cadre
                        décide de ce qui se voit. */}
                    <SwapText travel={18}>
                      {credits?.builtWithLabel}
                      {credits?.builtWith}
                    </SwapText>
                  </span>
                </a>

                {/* framer-1yN27 : Created by (texte + avatar/badge + nom) */}
                {/* PERMUTATION portrait → pastille au survol (framer-1yN27).
                    MESURÉ dans le CSS du miroir : au repos `framer-bp41xy`
                    (portrait 24×24) est en flux et `framer-1d0gb8f` (pastille
                    24×24) est en `position:absolute; top:28px; left:0`, donc
                    clippée par le `overflow:hidden` du lien ; au survol les deux
                    échangent (`.framer-v-5hsx70.hover .framer-bp41xy{position:
                    absolute; top:-28px; left:0}` et `.hover .framer-1d0gb8f{
                    position:relative; top:unset; left:unset}`). Capture live à
                    l'appui : portrait seul au repos, pastille verte à l'éclair
                    seule au survol.
                    Notre version affichait EN PERMANENCE une demi-pastille de
                    12×13 par-dessus le portrait, sans aucun survol — et sa
                    hauteur de 25 px poussait la rangée de crédits à 25 px contre
                    24 sur la source, second pixel de l'écart de la barre légale. */}
                <a
                  href={credits?.createdBy?.href ?? "/a-propos"}
                  {...(credits?.createdBy?.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group relative flex w-min flex-row items-center gap-[8px] overflow-hidden no-underline"
                >
                  <span className="relative h-auto w-auto whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
                    {credits?.createdByLabel}
                  </span>
                  {/* PERMUTATION ANIMÉE portrait → pastille, au survol du lien.
                        La version précédente basculait `position` de `absolute`
                        à `relative` : c'est ce que faisait la source Framer, et
                        ça ne s'anime PAS, une position ne s'interpole pas. Le
                        portrait disparaissait donc d'un coup.
                        Ici les deux calques restent superposés en `inset-0` et
                        c'est la TRANSLATION qui bouge : le portrait sort par le
                        haut pendant que la pastille entre par le bas, sur la
                        même course. Le cadre rond masque ce qui dépasse.
                        Durée et courbe reprises des autres permutations du site
                        (`SwapCopies`), pour que le pied de page bouge comme le
                        reste. */}
                  <span className="relative block h-[24px] w-[24px] flex-none overflow-hidden rounded-full">
                    {credits?.createdByAvatar ? (
                      <span className="absolute inset-0 transition-transform duration-[320ms] ease-[cubic-bezier(0.68,0,0,1)] group-hover:-translate-y-full motion-reduce:transition-none">
                          {/* 24 px à l'écran (voir la note de l'avatar plus haut). */}
                          <Image
                            src={credits.createdByAvatar.src}
                            alt={credits.createdByAvatar.alt}
                            width={24}
                            height={24}
                            className="block h-full w-full object-cover object-center"
                          />
                        </span>
                    ) : null}
                    <span
                      className={
                          "absolute inset-0 flex items-center justify-center rounded-full bg-accent " +
                          "transition-transform duration-[320ms] ease-[cubic-bezier(0.68,0,0,1)] motion-reduce:transition-none " +
                          (credits?.createdByAvatar
                            ? "translate-y-full group-hover:translate-y-0"
                            : "translate-y-0")
                        }
                      >
                      <CreatedByLogo />
                    </span>
                  </span>
                  <span className="relative h-auto w-auto whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
                    {credits?.createdBy?.label}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
