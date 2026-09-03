import {
  cubicBezierAsString,
  generateLinearEasing,
  optimizedAppearDataAttribute,
  spring,
  supportedWaapiEasing,
} from "motion-dom";
import type { Transition } from "motion/react";

/**
 * Apparitions démarrées AVANT l'hydratation, puis REPRISES par framer-motion.
 *
 * LE PROBLÈME. Nos entrées `"appear"` (hero, header, signature) partent au
 * MONTAGE des composants React, c'est-à-dire à l'hydratation. La source, elle,
 * démarre les siennes au premier `requestAnimationFrame`, bien avant tout
 * JavaScript applicatif : son HTML embarque le tableau
 * `<script type="framer/appear" id="__framer__appearAnimationsContent">` (22
 * entrées pour la home, exactement le header et le hero) et un script inline qui
 * les lance. Le décalage MESURÉ, à forme et durées par ailleurs identiques,
 * valait ~160 ms sur un build de production et ~330 ms en dev.
 *
 * LE MÉCANISME. framer-motion sait REPRENDRE une animation déjà commencée : un
 * élément `motion.*` portant `data-framer-appear-id` interroge, à son montage,
 * une poignée de fonctions posées sur `window` (`MotionHasOptimisedAnimation`,
 * `MotionHandoffAnimation`, …) ; si l'une d'elles lui rend l'instant de départ
 * de l'animation en cours, il démarre la SIENNE à ce même instant, donc déjà
 * avancée d'autant. Le raccord est invisible : l'animation WAAPI continue à
 * peindre jusqu'à sa fin (une animation WAAPI bat le style en ligne), et son
 * `onfinish` l'annule au profit de celle de framer-motion, arrivée au même point
 * au même moment. C'est la mécanique que Framer utilise lui-même — ces fonctions
 * `window.Motion*` sont son unique point de contact avec le démarreur inline.
 *
 * CE QUE FAIT CE MODULE. Il produit les DEUX moitiés de ce contrat :
 *  - {@link appearAttributes} — les attributs posés sur chaque élément animé :
 *    son identifiant de reprise et sa recette d'animation, entièrement résolue
 *    au rendu SERVEUR (images-clés CSS, durée, retard, courbe) ;
 *  - {@link APPEAR_BOOT_SCRIPT} — le script inline, autonome, qui lit ces
 *    attributs dans le HTML et lance les animations.
 *
 * POURQUOI RÉSOUDRE LA COURBE CÔTÉ SERVEUR. Un ressort n'est pas une courbe CSS.
 * Framer contourne le problème en inlinant tout son solveur (plusieurs kilo-
 * octets de JavaScript avant le premier octet de contenu utile). Ici le solveur
 * de framer-motion — celui-là même qui animera après l'hydratation, donc le seul
 * qui garantisse un raccord exact — est exécuté au RENDU, et seul son résultat,
 * un `linear(…)` de quelques centaines d'octets, part dans le HTML. Le script
 * inline n'a alors plus rien à calculer : il appelle `Element.animate` et pose
 * un instant de départ commun. Il ne dépend d'aucun module, ce qui est la
 * condition pour tourner avant le JavaScript applicatif.
 */

/** Sous-ensemble animé par les apparitions (identique à `MotionValues`). */
export type AppearValues = {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
};

/** Attribut lu par framer-motion pour retrouver l'animation à reprendre. */
export const APPEAR_ID_ATTRIBUTE = optimizedAppearDataAttribute;

/** Attribut portant la recette d'animation résolue (lu par le script inline). */
export const APPEAR_SPEC_ATTRIBUTE = "data-appear";

/**
 * Ordre de composition du `transform`, et unités, COPIÉS sur ceux de
 * framer-motion (`transformPropOrder` : x, y, scale, rotate). L'ordre n'est pas
 * cosmétique — `scale(1.5) rotate(2deg)` et `rotate(2deg) scale(1.5)` ne
 * peignent pas la même chose dès que l'origine n'est pas au centre exact. Le
 * reproduire ici est ce qui rend l'animation WAAPI et celle de framer-motion
 * superposables pendant tout le recouvrement.
 */
const TRANSFORM_PARTS = [
  ["x", "translateX", "px", 0],
  ["y", "translateY", "px", 0],
  ["scale", "scale", "", 1],
  ["rotate", "rotate", "deg", 0],
] as const;

/** Recette sérialisée dans {@link APPEAR_SPEC_ATTRIBUTE}. */
type AppearSpec = {
  /** Durée en millisecondes. */
  dur: number;
  /** Retard en millisecondes. */
  del: number;
  /** Courbe CSS (`cubic-bezier(…)` ou `linear(…)`). */
  ease: string;
  /** Images-clés d'opacité. */
  op?: [number, number];
  /** Images-clés de `transform`. */
  tr?: [string, string];
};

type AppearTiming = { dur: number; ease: string };

/**
 * Un ressort donné (raideur / amortissement / masse) résout toujours la même
 * durée et la même courbe : le solveur ne tourne donc qu'une fois par ressort du
 * site, pas une fois par élément ni par rendu. Le site en compte trois.
 */
const springTimings = new Map<string, AppearTiming | undefined>();

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Traduit un easing framer-motion en courbe CSS, ou rien si intraduisible. */
function cssEasing(ease: unknown, durationMs: number): string | undefined {
  if (
    Array.isArray(ease) &&
    ease.length === 4 &&
    ease.every((n) => typeof n === "number")
  ) {
    return cubicBezierAsString(ease as [number, number, number, number]);
  }
  if (typeof ease === "string" && ease in supportedWaapiEasing) {
    return supportedWaapiEasing[ease as keyof typeof supportedWaapiEasing];
  }
  if (typeof ease === "function") {
    return generateLinearEasing(ease as (p: number) => number, durationMs);
  }
  return undefined;
}

/**
 * Durée et courbe CSS d'une transition, ou `undefined` si elle n'est pas
 * traduisible telle quelle. Rendre `undefined` n'est PAS un échec : l'élément
 * garde alors le comportement d'avant (départ à l'hydratation), jamais une
 * courbe approchée — une apparition qui ment sur sa forme serait pire que le
 * décalage qu'on cherche à supprimer.
 */
function timingOf(transition: Transition): AppearTiming | undefined {
  const t = transition as Record<string, unknown>;

  if (t.type === "spring") {
    const key = `${String(t.stiffness)}/${String(t.damping)}/${String(t.mass)}/${String(t.velocity)}/${String(t.bounce)}/${String(t.visualDuration)}/${String(t.duration)}`;
    if (springTimings.has(key)) return springTimings.get(key);

    // `applyToOptions` MUTE l'objet reçu (il y écrit `duration` et `ease`) :
    // on lui en donne une COPIE. Le solveur ignore `delay` et `type`, il n'y a
    // donc rien à en retirer.
    const resolved = spring.applyToOptions({ ...transition }) as Record<
      string,
      unknown
    >;
    const dur = finiteNumber(resolved.duration);
    const ease = dur !== undefined ? cssEasing(resolved.ease, dur) : undefined;
    const timing = dur !== undefined && ease ? { dur, ease } : undefined;
    springTimings.set(key, timing);
    return timing;
  }

  const seconds = finiteNumber(t.duration);
  if (seconds === undefined) return undefined;
  const dur = seconds * 1000;
  const ease = cssEasing(t.ease, dur);
  return ease ? { dur, ease } : undefined;
}

/** Images-clés `transform`, ou rien si l'entrée ne bouge que l'opacité. */
function transformKeyframes(
  from: AppearValues,
  to: AppearValues,
): [string, string] | undefined {
  let start = "";
  let end = "";
  for (const [key, fn, unit, rest] of TRANSFORM_PARTS) {
    if (from[key] === undefined && to[key] === undefined) continue;
    start += `${fn}(${from[key] ?? rest}${unit}) `;
    end += `${fn}(${to[key] ?? rest}${unit}) `;
  }
  return start ? [start.trim(), end.trim()] : undefined;
}

/** Attributs posés sur l'élément animé, ou objet vide si non traduisible. */
export type AppearAttributes = {
  "data-framer-appear-id"?: string;
  "data-appear"?: string;
};

/**
 * Attributs à étaler sur l'élément `motion.*` d'une apparition `"appear"` :
 * l'identifiant de reprise, et la recette lue par {@link APPEAR_BOOT_SCRIPT}.
 *
 * Ils sont calculés à l'IDENTIQUE au rendu serveur et au rendu client (fonction
 * pure des seules props), donc aucune bascule ni aucun remontage à
 * l'hydratation — l'invariant posé par `Reveal` reste entier.
 */
export function appearAttributes(
  appearId: string,
  from: AppearValues,
  to: AppearValues,
  transition: Transition,
): AppearAttributes {
  const timing = timingOf(transition);
  if (!timing) return {};

  const op: [number, number] | undefined =
    from.opacity !== undefined || to.opacity !== undefined
      ? [from.opacity ?? 1, to.opacity ?? 1]
      : undefined;
  const tr = transformKeyframes(from, to);
  if (!op && !tr) return {};

  const delaySeconds =
    finiteNumber((transition as Record<string, unknown>).delay) ?? 0;
  const spec: AppearSpec = {
    dur: timing.dur,
    del: delaySeconds * 1000,
    ease: timing.ease,
    ...(op ? { op } : {}),
    ...(tr ? { tr } : {}),
  };

  return {
    [APPEAR_ID_ATTRIBUTE]: appearId,
    [APPEAR_SPEC_ATTRIBUTE]: JSON.stringify(spec),
  };
}

/**
 * Script inline, posé en fin de `<body>` par `src/app/layout.tsx`.
 *
 * FIN DE BODY, ET PAS DANS `<head>` : il lit le DOM des éléments animés, qui
 * doivent donc être déjà analysés. Un script de `<head>` différé au premier
 * `requestAnimationFrame` ne le garantit pas — rien n'oblige la première image à
 * attendre la fin de l'analyse du document, et le hero pourrait n'être pas
 * encore là.
 *
 * PREFERS-REDUCED-MOTION : le script ne fait alors STRICTEMENT rien, ni
 * animation ni fonction posée sur `window`. framer-motion reprend la main à
 * l'hydratation avec son propre `reducedMotion="user"` (cf. `MotionSettings`),
 * exactement comme avant ce module. Moins de mouvement, jamais plus.
 *
 * LE PORTILLON DE PREMIÈRE PEINTURE. On ne démarre pas les animations tout de
 * suite : une première animation factice (mêmes images-clés de part et d'autre,
 * donc invisible) sert de sonde, et sa promesse `ready` ne se résout qu'une fois
 * le compositeur prêt à peindre. Sans elle, sur Chrome, l'animation part avant
 * la première peinture et ses premières images sont AVALÉES : l'entrée
 * apparaîtrait déjà à mi-course. C'est le même portillon que framer-motion pose
 * dans `startOptimizedAppearAnimation`, et la sonde est rangée dans le registre
 * avec un instant de départ nul pour que la reprise l'annule si l'hydratation
 * arrive avant la peinture.
 *
 * La sonde est posée DANS le `requestAnimationFrame`, et non avant : c'est
 * l'ordre exact du démarreur de la source. MESURÉ sur build de production,
 * home à 1440, repère = première peinture de chaque côté, écart de phase des
 * trois mots de la ligne services :
 *
 *     sonde posée à l'analyse du script   chargement normal −35 ms
 *                                          hydratation forcée à 1,2 s −60 ms
 *     sonde posée dans l'image (retenu)   chargement normal −35 ms
 *                                          hydratation forcée à 1,2 s −35 ms
 *
 * L'écart ne dépend donc plus des conditions de chargement. Le signe négatif
 * dit que notre entrée part un peu AVANT celle de la source rapportée à sa
 * propre première peinture : notre document est plus léger, son analyse est
 * finie plus tôt. Deux images, sous la tolérance de 50 ms.
 *
 * L'INSTANT DE DÉPART EST COMMUN à toutes les animations de la page (un seul
 * `performance.now()`), ce qui garantit que des retards de 0,2 s et 1,1 s
 * restent à 0,9 s l'un de l'autre quoi qu'il arrive au fil d'exécution.
 */
export const APPEAR_BOOT_SCRIPT = `(function(){
var W=window,D=document;
if(W.__appearBoot)return;W.__appearBoot=1;
try{if(W.matchMedia&&W.matchMedia("(prefers-reduced-motion: reduce)").matches)return;}catch(e){return;}
if(!D.querySelectorAll||!Element.prototype.animate)return;
var nodes=D.querySelectorAll("[${APPEAR_ID_ATTRIBUTE}][${APPEAR_SPEC_ATTRIBUTE}]");
if(!nodes.length)return;
var jobs=[],live=new Map(),done=new Map(),held=new Set();
function kf(name,frames){var o={};o[name]=frames;return o;}
function id(elementId,valueName){return elementId+": "+(valueName==="opacity"?"opacity":"transform");}
function resume(){held.forEach(function(d){d.a.play();d.a.startTime=d.s;});held.clear();}
function cancel(elementId,valueName,frame,canResume){
var k=id(elementId,valueName),d=live.get(k);if(!d)return;
if(frame&&canResume===undefined){frame.postRender(function(){frame.postRender(function(){d.a.cancel();});});}
else{d.a.cancel();}
if(frame&&canResume){held.add(d);frame.render(resume);}
else{live.delete(k);if(!live.size)W.MotionCancelOptimisedAnimation=undefined;}
}
W.MotionHasOptimisedAnimation=function(elementId,valueName){
if(!elementId)return false;
return valueName?Boolean(live.get(id(elementId,valueName))):done.has(elementId);};
W.MotionHandoffIsComplete=function(elementId){return done.get(elementId)===true;};
W.MotionHandoffMarkAsComplete=function(elementId){if(done.has(elementId))done.set(elementId,true);};
W.MotionCancelOptimisedAnimation=cancel;
W.MotionHandoffAnimation=function(elementId,valueName,frame){
var d=live.get(id(elementId,valueName));if(!d)return null;
d.a.onfinish=function(){if(W.MotionCancelOptimisedAnimation)W.MotionCancelOptimisedAnimation(elementId,valueName,frame);};
if(d.s===null||W.MotionHandoffIsComplete(elementId)){cancel(elementId,valueName,frame);return null;}
return d.s;};
for(var i=0;i<nodes.length;i++){
var el=nodes[i],key=el.getAttribute("${APPEAR_ID_ATTRIBUTE}"),spec=null;
try{spec=JSON.parse(el.getAttribute("${APPEAR_SPEC_ATTRIBUTE}"));}catch(e){}
if(!spec)continue;
if(spec.op)jobs.push([el,key,"opacity",spec.op,spec]);
if(spec.tr)jobs.push([el,key,"transform",spec.tr,spec]);
done.set(key,false);}
if(!jobs.length)return;
var gate=null;
function start(){
try{if(gate)gate.cancel();}catch(e){}
if(W.MotionIsMounted){live.clear();return;}
var t0=performance.now();
for(var i=0;i<jobs.length;i++){
var j=jobs[i],spec=j[4];
var a=j[0].animate(kf(j[2],j[3]),{delay:spec.del,duration:spec.dur,easing:spec.ease,fill:"both"});
try{a.startTime=t0;}catch(e){}
live.set(id(j[1],j[2]),{a:a,s:t0});}}
requestAnimationFrame(function(){
if(W.MotionIsMounted)return;
var probe=jobs[0];
gate=probe[0].animate(kf(probe[2],[probe[3][0],probe[3][0]]),{duration:10000,easing:"linear",fill:"both"});
live.set(id(probe[1],probe[2]),{a:gate,s:null});
if(gate.ready&&gate.ready.then)gate.ready.then(start).catch(function(){});else start();});
})();`;
