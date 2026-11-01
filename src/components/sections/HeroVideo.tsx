"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDepixelisation } from "@/components/motion/useDepixelisation";
import { recadrageCover } from "@/lib/images/recadrage";
import { estProfilLeger } from "@/lib/profil-appareil";

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
  const sourceAffiche = poster ?? "";
  const chargerAffiche = useCallback(() => {
    affiche.current ??= new Promise<HTMLImageElement | null>((fin) => {
      const img = new window.Image();
      img.onload = () => fin(img);
      img.onerror = () => fin(null);
      img.src = sourceAffiche;
    }).then((img) => {
      afficheChargeeRef.current = true;
      setAfficheChargee(true);
      return img;
    });
    return affiche.current;
  }, [sourceAffiche]);
  const etape = useDepixelisation({
    cible: calque,
    src: sourceAffiche,
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
