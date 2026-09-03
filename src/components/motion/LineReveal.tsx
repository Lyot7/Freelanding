"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  EASE_FRAMER,
  REVEAL_VIEWPORT_MARGIN,
  useRevealWillChange,
} from "@/components/motion/Reveal";

/**
 * Révélation d'un texte LIGNE PAR LIGNE, en décalé, comme la source.
 *
 * La source découpe ses citations et ses grands titres en une boîte par ligne
 * VISUELLE, chacune montant derrière son masque avec 100 ms de retard sur la
 * précédente. Reproduire ce découpage en écrivant les lignes en dur est un
 * piège : les retours à la ligne dépendent de la largeur de la fenêtre, et un
 * découpage figé donne un rendu juste à 1440 et faux partout ailleurs.
 *
 * On mesure donc les lignes RÉELLES telles que le navigateur vient de les
 * calculer, avec l'API Range : pour chaque caractère, le rectangle qu'il occupe
 * donne son ordonnée, et un changement d'ordonnée marque un retour à la ligne.
 * Le découpage est donc, par construction, celui du navigateur lui-même.
 *
 * INVARIANT DE SÛRETÉ : tant que la mesure n'a pas abouti — rendu serveur, pas
 * de JS, police pas encore chargée — le texte est rendu TEL QUEL, d'un seul
 * tenant. Le retour à la ligne d'origine ne peut donc jamais être altéré, et le
 * découpage ne fait que remplacer un rendu déjà correct par le même rendu, en
 * plusieurs boîtes. C'est ce qui permet de toucher à des textes dont la
 * géométrie est déjà validée au pixel près.
 *
 * Les sous-chaînes sont conservées TELLES QUELLES, espace de fin comprise : la
 * source garde ces espaces (« What our » suivi d'une espace de 17px qui décale
 * l'encre vers la gauche en alignement à droite), et les couper déplacerait le
 * texte.
 */
// `useLayoutEffect` côté client, `useEffect` en SSR (no-op). Déclaré au niveau
// du MODULE : à l'intérieur du composant, l'analyseur y verrait une variable
// ordinaire et non un hook, et refuserait la lecture d'un ref dans son corps.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Balises acceptées pour la boîte englobante. */
const CONTAINER_TAGS = {
  span: motion.span,
  h2: motion.h2,
  p: motion.p,
} as const;

/** Balise non animée servant de sonde, appariée à celle du conteneur. */
const PROBE_TAGS = { span: "span", h2: "h2", p: "p" } as const;

export function LineReveal({
  text,
  lines: fixedLines,
  as = "span",
  className = "",
  lineClassName = "",
  initialY = 40,
  duration = 0.8,
  delay = 0.1,
  delayStep = 0.1,
}: {
  /** Texte d'un seul tenant, découpé par MESURE du rendu. */
  text?: string;
  /**
   * Découpage DÉJÀ connu, quand les lignes ne dépendent pas de la largeur.
   *
   * Les grands titres du site sont composés de deux fragments écrits en toutes
   * lettres dans la maquette (« What our » / « clients say. »), espace finale
   * comprise : cette espace décale l'encre en alignement à droite et un retour à
   * la ligne naturel la mangerait. Ces lignes-là ne se mesurent donc pas, elles
   * se donnent. Le reste du composant — masque, cascade, déclencheur — est
   * identique.
   */
  lines?: readonly string[];
  /** Balise de la boîte englobante (`h2` pour un titre de section). */
  as?: keyof typeof CONTAINER_TAGS;
  /** Classes de la boîte englobante (elle porte la typographie). */
  className?: string;
  /** Classes de chaque ligne — le masque `overflow-hidden` vit ici. */
  lineClassName?: string;
  initialY?: number;
  duration?: number;
  delay?: number;
  delayStep?: number;
}) {
  const probe = useRef<HTMLElement>(null);
  const [lines, setLines] = useState<readonly string[] | null>(
    fixedLines && fixedLines.length > 1 ? fixedLines : null,
  );
  const wc = useRevealWillChange();

  useIsoLayoutEffect(() => {
    if (fixedLines) return;
    const el = probe.current;
    if (!el) return;

    const measure = () => {
      // Une fois le découpage posé, la sonde est démontée. La mesurer encore
      // renverrait des rectangles vides, donc UNE seule ligne, ce qui annulerait
      // le découpage : un rappel tardif (polices) suffisait à tout défaire.
      if (!el.isConnected) return;
      const node = el.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const content = node.textContent ?? "";
      if (!content) return;

      const range = document.createRange();
      const cuts: number[] = [];
      let previousTop: number | null = null;
      for (let i = 0; i < content.length; i += 1) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        // Une espace en fin de ligne peut donner un rectangle vide : elle
        // appartient à la ligne courante, on ne s'en sert pas comme repère.
        if (rect.height === 0) continue;
        const top = Math.round(rect.top);
        if (previousTop !== null && top > previousTop) cuts.push(i);
        previousTop = top;
      }
      range.detach();

      const found: string[] = [];
      let start = 0;
      for (const cut of cuts) {
        found.push(content.slice(start, cut));
        start = cut;
      }
      found.push(content.slice(start));
      // Une seule ligne : rien à décaler, on garde le rendu d'un tenant.
      setLines(found.length > 1 ? found : null);
    };

    // Aucune mesure SYNCHRONE ici : elle tomberait avant que le conteneur ait
    // sa largeur définitive, le texte tiendrait sur une seule ligne et le
    // découpage serait abandonné. Tout passe par des rappels différés.
    // Deux reprises indispensables, chacune pour une raison mesurée :
    //   - une frame plus tard, parce que la première passe peut tomber avant que
    //     le conteneur ait sa largeur définitive, et le texte tient alors sur
    //     une seule ligne — le découpage était purement et simplement abandonné ;
    //   - au chargement des polices, parce qu'une substitution de fonte change
    //     les retours à la ligne et rendrait le découpage périmé.
    const frame = requestAnimationFrame(measure);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    // La largeur du conteneur commande les retours à la ligne : on remesure à
    // chaque changement de taille.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text]);

  if (!lines) {
    // Le texte est rendu d'un tenant, dans une boîte de MÊME balise que le
    // conteneur final : la géométrie mesurée est donc celle du rendu final.
    // Une sonde `span` sous un conteneur `p` donnerait une largeur de ligne
    // différente dès qu'une règle de la feuille cible la balise.
    const Probe = PROBE_TAGS[as];
    // Ref de RAPPEL et non ref objet : la balise étant choisie dans une union,
    // TypeScript exige un `Ref` de l'élément le plus spécifique de l'union, ce
    // qu'un `RefObject<HTMLElement>` ne satisfait pas. Un rappel qui accepte le
    // type le plus général les satisfait tous.
    const attach = (el: HTMLElement | null) => {
      probe.current = el;
    };
    return (
      <Probe ref={attach} className={className}>
        {text}
      </Probe>
    );
  }

  const Container = CONTAINER_TAGS[as];

  return (
    /*
     * Le déclencheur vit sur le CONTENEUR, jamais sur les lignes.
     *
     * `IntersectionObserver` tient compte du découpage imposé par les ancêtres :
     * une ligne translatée de 40px sous un masque haut de 35 est entièrement
     * clippée, donc rapportée comme NON visible, donc jamais révélée. Poser un
     * observateur par ligne créait ce blocage circulaire — la ligne restait
     * masquée à vie, précisément parce qu'elle attendait d'être vue.
     *
     * Le conteneur, lui, n'est pas clippé. Il porte l'observateur et propage
     * l'état à ses lignes par variantes, avec le décalage en cascade. C'est
     * d'ailleurs ainsi que la source procède : un seul déclencheur, des enfants
     * échelonnés.
     */
    <Container
      className={className}
      // L'état masqué est rendu DÈS LE HTML SERVEUR et ne bascule plus jamais :
      // ni `key`, ni état React qui changerait après l'hydratation. C'est ce qui
      // évite le rejeu visible de toute l'entrée une seconde après le
      // chargement (cf. l'entête de `@/components/motion/Reveal`).
      initial="hidden"
      whileInView="shown"
      // Marge de BASE, sans compensation de déplacement : le conteneur
      // ne bouge pas, seules ses lignes montent. C'est tout l'intérêt du
      // déclencheur porté par le conteneur — la boîte observée est déjà
      // celle de la mise en page. Le seuil de la source est le bord bas
      // de la fenêtre pour les lignes comme pour le reste (encadré
      // [895, 905) sur les 8 routes), et une chaîne d'options identique
      // fait partager le même `IntersectionObserver`.
      viewport={{ once: true, amount: "some", margin: REVEAL_VIEWPORT_MARGIN }}
      // Couche de composition réservée pour la durée de la cascade
      // seulement. Les deux rappels vivent sur le conteneur : avec des
      // variantes, framer-motion n'annonce la fin qu'une fois TOUS les
      // enfants arrivés, ce qui est exactement la fin de la cascade.
      onViewportEnter={wc.onViewportEnter}
      onAnimationComplete={wc.onAnimationComplete}
      variants={{
        hidden: {},
        shown: { transition: { delayChildren: delay, staggerChildren: delayStep } },
      }}
    >
      {/* `accent-room` sur chaque ligne : le masque coupe l'encre des capitales
          accentuées, qui monte plus haut que la boîte de ligne quand
          l'interlignage est serré. Posé ICI plutôt que chez chaque appelant,
          parce que tous les masques de ligne du site passent par cette
          primitive. Voir la règle dans `globals.css` et le relevé dans
          `scripts/accent-clip-audit.mjs`. */}
      {lines.map((line, i) => (
        <span key={line + i} className={"accent-room descender-room block " + lineClassName}>
          <motion.span
            className="inline-block whitespace-pre-wrap"
            // Cible du filet `<noscript>` du layout : la ligne est rendue
            // masquée par le serveur, il faut la rendre visible sans script.
            data-reveal=""
            style={wc.style}
            variants={{
              hidden: { opacity: 0.001, y: initialY },
              shown: {
                opacity: 1,
                y: 0,
                transition: { duration, ease: EASE_FRAMER },
              },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Container>
  );
}
