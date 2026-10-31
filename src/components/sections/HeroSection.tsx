"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { preload } from "react-dom";
import { estProfilLeger } from "@/lib/profil-appareil";
import { useDepixelisation } from "@/components/motion/useDepixelisation";
import { recadrageCover } from "@/lib/images/recadrage";
import type { HeroComparaison, HeroContent, HeroDoor, HeroProof, SiteConfig } from "@/lib/content/types";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import { Grain } from "@/components/effects/Grain";
import { ImageProgressive } from "@/components/ui/ImageProgressive";
import { AvailabilityMeter } from "@/components/ui";
import { lienRendezVous } from "@/content/rendez-vous";
import { uiLabels } from "@/content/ui";
import { DemanderAssistant } from "@/components/pages/agent/DemanderAssistant";

/**
 * Héros de l'accueil, refait le 2026-10-15.
 *
 * UNE PORTE DEPUIS LE 2026-10-31 (une seule offre). Le h1 est un lien vers
 * l'offre, avec son prix d'entrée. Au-dessus, ce qui est vendu ; en bas, la
 * comparaison de prix sourcée. `doors` reste une liste : le jour où il en
 * faudrait une seconde, le gabarit la rend.
 *
 * CE QUI EST PARTI, et pourquoi. Le logotype géant « Bouquerel » redisait le
 * logo de l'en-tête et prenait le premier rang de lecture au titre ; le cadre
 * à coins, son verre flouté, le paraphe et les trois mots de métier
 * empilaient six éléments avant l'action. Eliott le trouvait « gros et pas
 * spécialement beau ».
 *
 * MOUVEMENT. Une seule entrée orchestrée, en CSS (`globals.css`, bloc
 * `.hero-*`) : les filets se tracent de gauche à droite, chaque ligne du titre
 * monte depuis son masque, les preuves suivent. Le CSS tourne hors du fil
 * principal, donc l'entrée reste fluide pendant que la page s'hydrate. Au
 * survol (souris seulement), la porte visée s'allume et l'autre s'efface.
 * `prefers-reduced-motion` ramène tout à un fondu.
 */

/** Délai d'apparition, en millisecondes, porté par la variable `--d`. */
function delai(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

function Fleche() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}

function Porte({ porte, index }: { porte: HeroDoor; index: number }) {
  const base = 120 + index * 160;
  return (
    <a
      href={porte.href}
      data-part="hero-porte"
      className="hero-porte group relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-[16px] gap-y-[10px] py-[16px] text-foreground no-underline tablet:grid-cols-[minmax(0,1fr)_auto_auto] tablet:gap-y-0 tablet:py-[24px]"
      style={delai(base)}
    >
      <span className="hero-porte-titre col-start-1 row-start-1 min-w-0 text-[clamp(38px,calc(11vw/var(--zoom-ecran,1)),60px)] font-semibold leading-[0.95] tracking-[-0.045em] tablet:text-[clamp(56px,calc(7.4vw/var(--zoom-ecran,1)),108px)] tablet:leading-[0.92]">
        {porte.lines.map((ligne, i) => (
          <span key={ligne} className="hero-ligne">
            <span
              className={i === 0 ? "hero-ligne-amorce" : undefined}
              style={delai(base + i * 90)}
            >
              {ligne}
              {i < porte.lines.length - 1 ? " " : null}
            </span>
          </span>
        ))}
      </span>
      <span
        className="hero-fond col-start-1 row-start-2 whitespace-nowrap text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 transition-colors duration-200 group-hover:text-foreground tablet:col-start-2 tablet:row-start-1 tablet:self-end tablet:pb-[16px] tablet:text-[14px]"
        style={delai(base + 260)}
      >
        {porte.price}
      </span>
      <span
        className="hero-fond col-start-2 row-start-1 self-end tablet:col-start-3"
        style={delai(base + 300)}
      >
        <span className="hero-porte-fleche flex h-[44px] w-[44px] items-center justify-center rounded-full border border-white/20 text-foreground">
          <Fleche />
        </span>
      </span>
    </a>
  );
}

function Preuve({ preuve, ordre }: { preuve: HeroProof; ordre: number }) {
  const valeur = (
    <span className="whitespace-nowrap text-[24px] font-medium leading-none tracking-[-0.03em] text-foreground tablet:text-[28px]">
      {preuve.value}
    </span>
  );
  const libelle = (
    <span className="min-w-0 max-w-[34ch] text-[12px] font-medium uppercase leading-[1.25] tracking-[-0.01em] text-foreground-60 [text-wrap:balance]">
      {preuve.label}
      {preuve.source ? (
        <>
          <span className="mt-[4px] block normal-case">
            {uiLabels.hero.source}{" "}
            <a
              href={preuve.source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-60 underline decoration-white/30 underline-offset-[3px] transition-colors duration-200 hover:text-foreground"
            >
              {preuve.source.label}
            </a>
          </span>
        </>
      ) : null}
    </span>
  );
  const classe = "hero-fond flex min-w-0 items-center gap-[12px]";
  const style = delai(760 + ordre * 120);
  return preuve.href ? (
    <a
      href={preuve.href}
      data-part="preuve"
      className={`${classe} no-underline [&>span:last-child]:transition-colors [&>span:last-child]:duration-200 hover:[&>span:last-child]:text-foreground`}
      style={style}
    >
      {valeur}
      {libelle}
    </a>
  ) : (
    <p data-part="preuve" className={`${classe} m-0`} style={style}>
      {valeur}
      {libelle}
    </p>
  );
}

/**
 * LE PRIX D'UNE AGENCE ET LE MIEN, POUR LE MÊME SITE (2026-10-16). Une seule
 * ligne discrète depuis la même journée (Eliott : « allège l'affichage, garde
 * la source ») : le sujet nomme ce qui est comparé, puis les deux prix, puis
 * la source. Mon prix porte la seule couleur.
 */
function Comparaison({ comparaison }: { comparaison: HeroComparaison }) {
  return (
    <p
      data-part="comparaison"
      className="hero-fond m-0 flex flex-wrap items-baseline gap-x-[16px] gap-y-[6px] text-[12px] font-medium uppercase leading-[1.3] tracking-[-0.01em] text-foreground-60"
      style={delai(760)}
    >
      <span>{comparaison.sujet}</span>
      {comparaison.lignes.map((ligne) => (
        <span key={ligne.qui} className="flex items-baseline gap-[6px] whitespace-nowrap">
          {ligne.qui}
          <span
            className={`text-[15px] normal-case tracking-[-0.02em] ${
              ligne.fort ? "text-accent" : "text-foreground"
            }`}
          >
            {ligne.prix}
          </span>
        </span>
      ))}
      <span className="normal-case">
        {uiLabels.hero.source}{" "}
        <a
          href={comparaison.source.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground-60 underline decoration-white/30 underline-offset-[3px] transition-colors duration-200 hover:text-foreground"
        >
          {comparaison.source.label}
        </a>
      </span>
    </p>
  );
}

function Fondateur({ person }: { person: HeroContent["person"] }) {
  if (!person) return null;
  return (
    <div className="flex items-center gap-[10px]">
      {person.avatar ? (
        <ImageProgressive
          src={person.avatar.src}
          alt={person.avatar.alt}
          width={40}
          height={40}
          className="block h-[40px] w-[40px] flex-none rounded-full object-cover"
        />
      ) : null}
      <span className="flex flex-col gap-[2px]">
        <span className="text-[13px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
          {person.name}
        </span>
        <span className="text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
          {person.role}
        </span>
      </span>
    </div>
  );
}

/**
 * Fond du hero : l'AFFICHE d'abord, la vidéo après le chargement de la page.
 *
 * Quand la `<video>` est dans le HTML, c'est elle que le navigateur retient
 * comme élément LCP, et son fichier (234 Kio) passe en concurrence avec tout le
 * reste du premier chargement : LCP de 10,2 s relevé par PageSpeed sur mobile.
 * L'affiche (14 Kio, préchargée en priorité haute) est une vraie image, peinte
 * avec le HTML. La vidéo n'est montée qu'à l'événement `load`, posée au-dessus
 * en fondu dès qu'elle joue : même boîte, donc aucun nouveau candidat LCP, et
 * la première image de la boucle est celle de l'affiche.
 */
/** Exporté pour le test unitaire ciblé (`HeroSection.test.mjs`) : le seul appelant reste `HeroSection`. */
export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const [monter, setMonter] = useState(false);
  const [joue, setJoue] = useState(false);
  // Téléphone en profil complet : affiche dépixelisée puis vidéo. Décidé
  // après l'hydratation, le serveur ne connaît ni l'écran ni l'appareil.
  const [mobile, setMobile] = useState(false);
  const calque = useRef<HTMLCanvasElement>(null);
  const affiche = useRef<Promise<HTMLImageElement | null> | null>(null);
  const [afficheChargee, setAfficheChargee] = useState(false);
  const afficheChargeeRef = useRef(false);
  const chargerAffiche = useCallback(() => {
    affiche.current ??= new Promise<HTMLImageElement | null>((fin) => {
      const img = new window.Image();
      img.onload = () => fin(img);
      img.onerror = () => fin(null);
      img.src = poster ?? "";
    }).then((img) => {
      afficheChargeeRef.current = true;
      setAfficheChargee(true);
      return img;
    });
    return affiche.current;
  }, [poster]);
  const etape = useDepixelisation({
    cible: calque,
    src: poster ?? "",
    actif: mobile && Boolean(poster),
    estChargee: () => afficheChargeeRef.current,
    charger: chargerAffiche,
  });
  useEffect(() => {
    // Profil léger (appareil modeste, réseau lent, économie de données) : ni
    // vidéo ni effet, sur aucun écran. Voir `@/lib/profil-appareil`.
    if (estProfilLeger()) return;
    // SOUS 810 PX, RIEN DANS LE HTML. L'affiche y était l'élément LCP, peinte
    // près de 2 s après le texte par le processeur lent de PageSpeed, et la
    // vidéo dans le HTML menait à un LCP de 10,2 s. Ici tout arrive APRÈS le
    // premier rendu : l'affiche se dépixelise (miniatures de moins de 0,05 bit
    // par pixel, que Chrome ne retient pas comme LCP), puis la vidéo, montée
    // au `load` comme sur grand écran, prend le relais en fondu dès qu'elle
    // joue. Le texte du héros reste l'élément LCP.
    const petitEcran = !window.matchMedia("(min-width: 810px)").matches;
    const lancer = () => {
      if (petitEcran && poster) {
        setMobile(true);
        void chargerAffiche();
      }
      setMonter(true);
    };
    if (document.readyState === "complete") {
      const id = window.setTimeout(lancer, 0);
      return () => window.clearTimeout(id);
    }
    window.addEventListener("load", lancer, { once: true });
    return () => window.removeEventListener("load", lancer);
  }, [chargerAffiche, poster]);
  // SUR TÉLÉPHONE, LA VIDÉO EST PEINTE DANS UNE TOILE. Une `<video>` visible
  // de 375 × 710 devient l'élément LCP de la page (mesuré : le texte du héros
  // perdait sa place) et le LCP mobile tombait au moment où la boucle, montée
  // après le `load`, finissait de télécharger. Une `<canvas>` n'est pas
  // candidate au LCP : le texte le reste, la vidéo arrive quand elle arrive.
  // La balise vidéo reste dans la page, réduite à 1 px, pour être décodée.
  // Hors de l'écran, la lecture s'arrête : ni décodage ni batterie pour rien.
  const video = useRef<HTMLVideoElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const v = video.current;
    const c = toile.current;
    const ctx = c?.getContext("2d");
    if (!mobile || !monter || !v || !c || !ctx) return;
    let actif = true;
    const peindre = () => {
      if (!actif) return;
      const ratio = Math.min(window.devicePixelRatio, 2);
      const l = Math.round(c.clientWidth * ratio);
      const h = Math.round(c.clientHeight * ratio);
      if (c.width !== l) c.width = l;
      if (c.height !== h) c.height = h;
      const zone = recadrageCover(v.videoWidth, v.videoHeight, l, h);
      if (zone) ctx.drawImage(v, zone.x, zone.y, zone.l, zone.h, 0, 0, l, h);
      if (typeof v.requestVideoFrameCallback === "function") {
        v.requestVideoFrameCallback(peindre);
      } else {
        window.requestAnimationFrame(peindre);
      }
    };
    peindre();
    const visibilite = new IntersectionObserver((entrees) => {
      if (entrees.some((entree) => entree.isIntersecting)) void v.play().catch(() => undefined);
      else v.pause();
    });
    visibilite.observe(c);
    return () => {
      actif = false;
      visibilite.disconnect();
    };
  }, [mobile, monter]);
  const fondMobile = etape ?? (afficheChargee ? poster : null);
  // L'affiche et ses étapes sont PEINTES dans une toile, comme la vidéo : en
  // fond CSS, l'affiche nette devenait l'élément LCP (mesuré à 1,8 s sur un
  // Pixel 7 émulé) à la place du texte du héros. Les étapes sont agrandies
  // sans lissage, ce qui donne les gros pixels nets.
  useEffect(() => {
    const c = calque.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !fondMobile) return;
    let valide = true;
    const img = new window.Image();
    img.onload = () => {
      if (!valide) return;
      const ratio = Math.min(window.devicePixelRatio, 2);
      const l = Math.round(c.clientWidth * ratio);
      const h = Math.round(c.clientHeight * ratio);
      if (c.width !== l) c.width = l;
      if (c.height !== h) c.height = h;
      const zone = recadrageCover(img.naturalWidth, img.naturalHeight, l, h);
      ctx.imageSmoothingEnabled = !etape;
      if (zone) ctx.drawImage(img, zone.x, zone.y, zone.l, zone.h, 0, 0, l, h);
    };
    img.src = fondMobile;
    return () => {
      valide = false;
    };
  }, [fondMobile, etape]);
  return (
    <>
      {mobile ? (
        <canvas ref={calque} aria-hidden className="absolute inset-0 h-full w-full" />
      ) : null}
      {poster ? (
        /* AFFICHE À PARTIR DE 810 PX SEULEMENT. Sur mobile, elle était
           l'élément LCP, peinte avec près de 2 s de retard par le processeur
           lent de PageSpeed alors que le texte du héros était déjà affiché.
           Sous 810 px la source vide fait retomber `<img>` sur un GIF
           transparent de 1 px, que Chrome ne retient pas comme LCP : le texte
           du héros le devient. L'affiche est quasi noire (luminance 13/255),
           le fond sombre, le grain et le verre restent. */
        <picture>
          <source media="(min-width: 810px)" srcSet={poster} />
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      ) : null}
      {mobile && monter && src ? (
        <>
          <video
            ref={video}
            className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
            aria-hidden
            tabIndex={-1}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src={src}
            onPlaying={() => setJoue(true)}
          />
          <canvas
            ref={toile}
            aria-hidden
            className={
              "absolute inset-0 h-full w-full transition-opacity duration-500 " +
              (joue && !etape ? "opacity-100" : "opacity-0")
            }
          />
        </>
      ) : monter && src ? (
        <video
          className={
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 " +
            // Sur téléphone, la vidéo attend la fin de la dépixelisation.
            (joue && !etape ? "opacity-100" : "opacity-0")
          }
          /* Décor pur, sans piste audio : sorti de l'arbre d'accessibilité pour
             qu'un lecteur d'écran n'annonce pas un lecteur vidéo vide au milieu
             du titre, et du parcours clavier où il n'a rien à offrir. */
          aria-hidden
          tabIndex={-1}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={src}
          onPlaying={() => setJoue(true)}
        />
      ) : null}
    </>
  );
}


export function HeroSection({
  hero,
  site,
  logos,
  metiers = [],
}: {
  hero: HeroContent;
  site: SiteConfig;
  logos?: ReactNode;
  /** Les pages par métier, nommées au premier écran. */
  metiers?: readonly { readonly libelle: string; readonly chemin: string }[];
}) {
  const media = hero.media;
  const hasVideo = media?.kind === "video" && Boolean(media.src);
  if (hasVideo && media?.poster) {
    preload(media.poster, {
      as: "image",
      fetchPriority: "high",
      media: "(min-width: 810px)",
    });
  }
  const portes = hero.doors ?? [];
  const preuves = hero.proofs ?? [];
  const sousTitre = hero.subtitleParagraphs?.[0]?.text ?? hero.subtitle;
  return (
    <section
      data-section="hero"
      className="relative isolate flex min-h-[calc(100dvh/var(--zoom-ecran,1))] w-full flex-col overflow-hidden bg-background pt-[88px] pb-[20px] [font-family:var(--font-sans)] tablet:min-h-[max(calc(100dvh/var(--zoom-ecran,1)),720px)] tablet:pt-[112px] tablet:pb-[30px]"
    >
      {hasVideo ? (
        <ScrollParallax
          factor={0.15}
          decorative
          className="pointer-events-none absolute inset-0 z-0 overflow-clip"
        >
          <HeroVideo src={media?.src ?? ""} poster={media?.poster} />
        </ScrollParallax>
      ) : null}
      {/* Voile : le texte vit sur la moitié gauche, presque noire ; le
          mécanisme reste visible à droite et sous les preuves. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(11,11,11,0.55)_0%,rgba(11,11,11,0.78)_55%,rgba(11,11,11,0.96)_100%)] tablet:bg-[linear-gradient(90deg,rgba(11,11,11,0.94)_0%,rgba(11,11,11,0.84)_48%,rgba(11,11,11,0.42)_100%)]"
      />
      {/* Filet central, signature de la grille du site. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] hidden w-px bg-white/[0.07] tablet:block"
      />
      <Grain opacity={0.1} className="z-[1]" />

      <div className="relative z-[2] mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-[20px] tablet:px-[24px] desktop:px-[30px]">
        <div className="flex flex-1 flex-col justify-center">
          {hero.eyebrow ? (
            <p
              className="hero-fond m-0 flex max-w-[30ch] tablet:max-w-none items-baseline gap-[12px] text-[16px] font-medium leading-[1.25] tracking-[-0.02em] text-foreground tablet:text-[20px] desktop:text-[22px]"
              style={delai(0)}
            >
              <span aria-hidden className="hero-pastille relative top-[-2px] h-[8px] w-[8px] flex-none bg-accent" />
              {hero.eyebrow}
            </p>
          ) : null}

          {/* LE SEUL h1 DE L'ACCUEIL : l'offre, depuis le 2026-10-31. `id="services"` : la
              marche « Prestations » des fils d'Ariane (`/#services`) y mène
              depuis que l'accordéon a quitté l'accueil (2026-10-16). */}
          <h1 id="services" data-part="hero-titre" className="hero-portes m-0 mt-[18px] tablet:mt-[34px]">
            {portes.map((porte, index) => (
              <Porte key={porte.href} porte={porte} index={index} />
            ))}
          </h1>

          <div className="mt-[22px] flex flex-col gap-[20px] tablet:mt-[30px] desktop:flex-row desktop:items-end desktop:justify-between desktop:gap-[48px]">
            {sousTitre ? (
              <p
                data-part="hero-pour-qui"
                className="hero-fond m-0 max-w-[46ch] text-[15px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60 tablet:text-[17px]"
                style={delai(520)}
              >
                {sousTitre}
              </p>
            ) : null}
            <div
              className="hero-fond flex flex-col items-start gap-[16px] tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-x-[28px]"
              style={delai(620)}
            >
              <a
                href={lienRendezVous("logiciel")}
                className="hero-cta flex h-[48px] flex-none items-center justify-center bg-accent px-[20px] text-[13px] font-semibold uppercase leading-none tracking-[-0.01em] text-accent-ink no-underline"
              >
                {uiLabels.services.rdvLabel}
              </a>
              {hero.offerLink ? (
                <a
                  href={hero.offerLink.href}
                  className="text-[13px] font-semibold tracking-[-0.01em] text-foreground underline underline-offset-[3px]"
                >
                  {hero.offerLink.label}
                </a>
              ) : null}
              <Fondateur person={hero.person} />
            </div>
          </div>

          {metiers.length > 0 ? (
            <nav
              aria-label={hero.avantMetiers}
              className="hero-fond mt-[16px] flex flex-wrap items-baseline gap-x-[14px] gap-y-[4px] text-[13px] font-medium leading-[1.3] tracking-[-0.01em]"
              style={delai(660)}
            >
              <span className="text-foreground-60">{hero.avantMetiers}</span>
              {metiers.map((metier) => (
                <a
                  key={metier.chemin}
                  href={metier.chemin}
                  className="text-foreground underline decoration-white/30 underline-offset-[3px] transition-[text-decoration-color] duration-150 hover:decoration-accent"
                >
                  {metier.libelle}
                </a>
              ))}
            </nav>
          ) : null}

          <div
            className="hero-fond mt-[16px] flex flex-col gap-[10px] tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-x-[28px]"
            style={delai(700)}
          >
            {site.availability ? (
              <div data-part="hero-delai">
                <AvailabilityMeter
                  availability={site.availability}
                  variant="hero"
                  timeZone={site.contact.timezone}
                  className="m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground"
                />
              </div>
            ) : null}
            <DemanderAssistant className="m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]" />
          </div>
        </div>

        {preuves.length > 0 || hero.comparison || logos ? (
          <div className="relative mt-[36px] flex flex-col gap-[18px] border-t border-white/10 pt-[18px] tablet:mt-[48px] desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-[40px]">
            <div className="flex flex-col gap-[16px] tablet:flex-row tablet:gap-[40px]">
              {hero.comparison ? <Comparaison comparaison={hero.comparison} /> : null}
              {preuves.map((preuve, ordre) => (
                <Preuve key={preuve.label} preuve={preuve} ordre={ordre} />
              ))}
            </div>
            {logos ? (
              <div className="hero-fond" style={delai(1000)}>
                {logos}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
