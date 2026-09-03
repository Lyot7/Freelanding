/**
 * Coût des animations pendant un défilement complet, chiffré par le protocole
 * Chrome DevTools.
 *
 * Ce que le script relève, et pourquoi chaque chiffre est là :
 *   - IMAGES PAR SECONDE : compteur `requestAnimationFrame` en page pendant que
 *     le défilement est poussé à la molette (et non par `scrollTo`), seule façon
 *     de traverser le lisseur de défilement comme le ferait un vrai visiteur.
 *   - TEMPS DE SCRIPT, de style et de mise en page : `Performance.getMetrics`
 *     du protocole, relevé avant et après le parcours. `ScriptDuration` répond à
 *     « combien coûte le JS », `RecalcStyleDuration` et `LayoutDuration`
 *     répondent à « anime-t-on autre chose que `transform` et `opacity` ».
 *   - OBSERVATEURS : `IntersectionObserver` et `ResizeObserver` sont interceptés
 *     avant le premier script de la page. On compte les instances CRÉÉES et les
 *     éléments encore OBSERVÉS, ce qui répond d'un coup à la mutualisation et
 *     aux fuites au démontage.
 *   - `will-change` : nombre d'éléments qui le portent encore une fois le
 *     parcours terminé. Un `will-change` laissé en place réserve une couche de
 *     composition à vie ; il doit retomber à zéro.
 *
 * Usage :
 *   bun run scripts/motion-perf.mjs                 # / et /about
 *   bun run scripts/motion-perf.mjs /work /contact
 */

import { chromium } from "playwright";

const LOCAL = "http://localhost:3000";
const ROUTES = process.argv.slice(2).filter((a) => a.startsWith("/"));
const PAGES = ROUTES.length ? ROUTES : ["/", "/about"];

/**
 * Instrumentation posée AVANT tout script de la page. Les compteurs vivent sur
 * `window.__perf` : les prototypes ne sont pas remplacés, seules les méthodes
 * sont enveloppées, pour que le comportement observé reste celui du site.
 */
const INSTRUMENT = () => {
  const perf = {
    io: 0,
    ro: 0,
    ioCibles: new Set(),
    roCibles: new Set(),
    /** Une entrée par jeu d'options d'`IntersectionObserver` : la mutualisation
     *  se lit là, framer-motion indexant ses observateurs par ces options. */
    ioOptions: [],
    listeners: 0,
  };
  window.__perf = perf;
  /** Bilan sérialisable : total observé, et part encore observée hors document. */
  window.__perfBilan = () => ({
    io: perf.io,
    ro: perf.ro,
    ioOptions: [...new Set(perf.ioOptions)],
    listeners: perf.listeners,
    ioObserves: perf.ioCibles.size,
    roObserves: perf.roCibles.size,
    ioDetaches: [...perf.ioCibles].filter((el) => !el.isConnected).length,
    roDetaches: [...perf.roCibles].filter((el) => !el.isConnected).length,
  });

  /*
   * Les cibles sont suivies par ENSEMBLE, et non par compteur. Un compteur
   * `observe` moins `unobserve` part à la dérive dès qu'une bibliothèque
   * désobserve un élément qu'elle n'observait pas — ce que fait le chargement
   * différé des images — et donnait ici des totaux négatifs dénués de sens.
   * L'ensemble, lui, répond à la seule question qui compte : reste-t-il des
   * éléments observés une fois DÉTACHÉS du document ?
   */
  const wrap = (Cls, keyCount, prefix, note) => {
    if (!Cls) return Cls;
    const observe = Cls.prototype.observe;
    const unobserve = Cls.prototype.unobserve;
    const disconnect = Cls.prototype.disconnect;
    Cls.prototype.observe = function (el, ...a) {
      (this.__cibles ??= new Set()).add(el);
      perf[prefix + "Cibles"].add(el);
      return observe.call(this, el, ...a);
    };
    Cls.prototype.unobserve = function (el, ...a) {
      this.__cibles?.delete(el);
      perf[prefix + "Cibles"].delete(el);
      return unobserve.call(this, el, ...a);
    };
    Cls.prototype.disconnect = function (...a) {
      for (const el of this.__cibles ?? []) perf[prefix + "Cibles"].delete(el);
      this.__cibles?.clear();
      return disconnect.apply(this, a);
    };
    return new Proxy(Cls, {
      construct(target, args) {
        perf[keyCount] += 1;
        if (note) {
          const o = args[1] ?? {};
          perf.ioOptions.push(
            `${o.rootMargin ?? "0px"} | seuil ${JSON.stringify(o.threshold ?? 0)}`,
          );
        }
        return Reflect.construct(target, args);
      },
    });
  };

  window.IntersectionObserver = wrap(window.IntersectionObserver, "io", "io", true);
  window.ResizeObserver = wrap(window.ResizeObserver, "ro", "ro", false);

  const add = EventTarget.prototype.addEventListener;
  const rm = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (...a) {
    if (this === window || this === document) perf.listeners += 1;
    return add.apply(this, a);
  };
  EventTarget.prototype.removeEventListener = function (...a) {
    if (this === window || this === document) perf.listeners -= 1;
    return rm.apply(this, a);
  };
};

/** Éléments portant encore un `will-change`, et lesquels. */
const WILL_CHANGE = () => {
  const hits = [];
  for (const el of document.querySelectorAll("*")) {
    const wc = getComputedStyle(el).willChange;
    if (wc && wc !== "auto") {
      hits.push(
        el.tagName +
          "." +
          (el.className || "").toString().split(" ").slice(0, 2).join(".") +
          " → " +
          wc,
      );
    }
  }
  return hits;
};

async function mesure(browser, route) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await page.addInitScript(INSTRUMENT);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");

  await page.goto(LOCAL + route, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);

  const lire = async () =>
    Object.fromEntries(
      (await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]),
    );
  const avant = await lire();
  const wcAvant = (await page.evaluate(WILL_CHANGE)).length;

  // Compteur d'images, démarré juste avant le parcours.
  await page.evaluate(() => {
    window.__fps = { n: 0, t0: performance.now(), stop: false };
    const tick = () => {
      if (window.__fps.stop) return;
      window.__fps.n += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // Défilement à la MOLETTE, du haut jusqu'en bas : c'est le seul mode qui
  // traverse le lisseur de défilement comme un visiteur réel. Un `scrollTo`
  // court-circuiterait le lisseur et donnerait un coût artificiellement bas.
  const hauteur = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  await page.mouse.move(720, 450);
  const pas = 220;
  for (let y = 0; y < hauteur + pas; y += pas) {
    await page.mouse.wheel(0, pas);
    await page.waitForTimeout(16);
  }
  // Les dernières apparitions du bas de page durent jusqu'à 1,25 s, et le filet
  // de sécurité du `will-change` court jusqu'à 2,5 s : sans cette attente, elles
  // seraient encore EN COURS au relevé et leur `will-change` compté comme
  // « resté », alors qu'il n'a simplement pas encore été rendu.
  await page.waitForTimeout(3000);

  const fps = await page.evaluate(() => {
    window.__fps.stop = true;
    const dt = (performance.now() - window.__fps.t0) / 1000;
    return { images: window.__fps.n, secondes: Math.round(dt * 100) / 100 };
  });
  const apres = await lire();
  const wcApres = await page.evaluate(WILL_CHANGE);
  const compteurs = await page.evaluate(() => window.__perfBilan());

  await page.close();

  const d = (k) => Math.round((apres[k] - avant[k]) * 1000) / 1000;
  return {
    route,
    ips: Math.round((fps.images / fps.secondes) * 10) / 10,
    images: fps.images,
    secondes: fps.secondes,
    script: d("ScriptDuration"),
    style: d("RecalcStyleDuration"),
    layout: d("LayoutDuration"),
    nStyle: d("RecalcStyleCount"),
    nLayout: d("LayoutCount"),
    tache: d("TaskDuration"),
    noeuds: apres.Nodes,
    io: compteurs.io,
    ro: compteurs.ro,
    ioOptions: compteurs.ioOptions,
    wcAvant,
    wcApres: wcApres.length,
    wcListe: wcApres.slice(0, 6),
  };
}

/**
 * Fuites au DÉMONTAGE : on quitte la page par une navigation CLIENT (le routeur
 * de Next ne recharge pas le document), puis on compte ce qui reste observé. Un
 * `IntersectionObserver` ou un `ResizeObserver` encore branché sur un élément
 * démonté est une fuite ; un écouteur de `window` non retiré aussi.
 */
async function fuites(browser, route) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(INSTRUMENT);
  await page.goto(LOCAL + route, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const avant = await page.evaluate(() => window.__perfBilan());
  // Navigation CLIENT : le routeur démonte l'arbre sans recharger le document,
  // seul cas où une fuite de démontage est observable.
  await page.evaluate(() => {
    const a =
      document.querySelector('a[href="/contact"]') ??
      document.querySelector("a[href^='/']");
    a?.click();
  });
  await page.waitForTimeout(3000);
  const apres = await page.evaluate(() => window.__perfBilan());
  const url = page.url();
  await page.close();
  return {
    route,
    vers: url.replace(LOCAL, ""),
    avant,
    apres,
  };
}

/**
 * `prefers-reduced-motion` : rien ne doit être MASQUÉ, ni au chargement ni après
 * le parcours. C'est l'invariant de robustesse du site — l'état de repos est
 * l'état final visible — et c'est aussi le seul test qui vaille : un contenu
 * masqué en attente d'une animation qui ne jouera jamais est un contenu perdu.
 */
async function reduit(browser, route, mode = "reduce") {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: mode,
  });
  await page.addInitScript(INSTRUMENT);
  await page.goto(LOCAL + route, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2200);
  const masques = () =>
    page.evaluate(() => {
      let n = 0;
      for (const el of document.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 10) continue;
        if (parseFloat(getComputedStyle(el).opacity) <= 0.05) n += 1;
      }
      return n;
    });
  const auChargement = await masques();
  const h = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  await page.mouse.move(720, 450);
  for (let y = 0; y < h + 400; y += 400) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(1200);
  const apresParcours = await masques();
  const wc = await page.evaluate(WILL_CHANGE);
  await page.close();
  return { route, mode, auChargement, apresParcours, wc: wc.length, wcListe: wc };
}

const browser = await chromium.launch();
const lignes = [];
for (const route of PAGES) lignes.push(await mesure(browser, route));
const leaks = [];
for (const route of PAGES) leaks.push(await fuites(browser, route));
const reduits = [];
for (const route of PAGES) {
  // Le TÉMOIN est la même page en mouvement normal, une fois tout révélé : sur
  // ce site, des éléments sont transparents par construction (libellé de
  // permutation au survol, ligne de prix d'un accordéon fermé). Le seul chiffre
  // qui a du sens est donc l'ÉCART entre les deux modes.
  reduits.push(await reduit(browser, route, "no-preference"));
  reduits.push(await reduit(browser, route, "reduce"));
}
await browser.close();

console.log(
  "route".padEnd(10) +
    "  ips  script  style  layout  #style #layout   IO   RO  will-change",
);
for (const r of lignes) {
  console.log(
    r.route.padEnd(10) +
      String(r.ips).padStart(5) +
      String(r.script.toFixed(2)).padStart(8) +
      String(r.style.toFixed(2)).padStart(7) +
      String(r.layout.toFixed(2)).padStart(8) +
      String(r.nStyle).padStart(7) +
      String(r.nLayout).padStart(8) +
      String(r.io).padStart(5) +
      String(r.ro).padStart(5) +
      `  ${r.wcAvant} → ${r.wcApres}`,
  );
  if (r.wcApres) console.log("      reste : " + r.wcListe.join(" | "));
  console.log("      jeux d'options IO : " + r.ioOptions.join("  ·  "));
}
console.log(
  "\nips = images/s pendant le parcours complet à la molette ; script/style/layout en secondes cumulées (protocole DevTools).",
);

console.log("\n--- Fuites au démontage (navigation client) ---");
for (const f of leaks) {
  console.log(
    `${f.route.padEnd(10)} → ${f.vers.padEnd(10)}` +
      `  observés IO ${f.avant.ioObserves} → ${f.apres.ioObserves}` +
      `  RO ${f.avant.roObserves} → ${f.apres.roObserves}` +
      `  DÉTACHÉS encore observés : IO ${f.apres.ioDetaches}, RO ${f.apres.roDetaches}` +
      `  écouteurs window/document ${f.avant.listeners} → ${f.apres.listeners}`,
  );
}

console.log(
  "\n--- prefers-reduced-motion : aucun contenu ne doit rester masqué (témoin = mouvement normal) ---",
);
for (const r of reduits) {
  console.log(
    `${r.route.padEnd(10)} ${r.mode.padEnd(14)} masqués au chargement ${String(r.auChargement).padStart(3)}   après parcours ${String(r.apresParcours).padStart(3)}   will-change ${r.wc}`,
  );
  if (r.mode === "reduce" && r.wc) console.log("      " + r.wcListe.join(" | "));
}
