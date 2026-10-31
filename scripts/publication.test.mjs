import { describe, expect, it } from "bun:test";
import { entreesMetier } from "../src/content/metiers.ts";
import {
  CONTROLES,
  RELEVES_DEPLOIEMENT,
  choisir,
  choisirPage,
  clientCockpit,
  empreinte,
  enEchec,
  entreePage,
  estPage,
  estWeekEnd,
  extrait,
  inscrits,
  publierAuto,
  repondEnLigne,
  signalerIndexNow,
  urlPage,
} from "./publication.ts";

/** Jeudi 15 octobre 2026, 10 h à Paris. */
const JEUDI = new Date("2026-10-15T08:00:00Z");
const SAMEDI = new Date("2026-10-17T08:00:00Z");

const article = (slug, autre = {}) => ({
  id: `id-${slug}`,
  titre: `Titre ${slug}`,
  corps: `Corps de ${slug}.`,
  article: {
    slug,
    description: "Une description.",
    motCle: { requete: "requête" },
    pageServie: { url: "/services/logiciel-metier" },
    visuel: { svg: "<svg/>", alt: "Un visuel" },
  },
  ...autre,
});

/** Une page par métier validée : son corps est une entrée de `metiers.json`, sans date. */
const page = (slug, autre = {}) => ({
  id: `id-${slug}`,
  titre: `Page ${slug}`,
  corps: JSON.stringify({ ...entreesMetier[0], date: undefined, slug }),
  article: { kind: "metier", slug, visuel: { svg: "<svg/>", alt: "Un visuel" } },
  ...autre,
});

const entreeMetier = (slug, date, validationId) => ({ ...entreesMetier[0], slug, date, validationId });

const entree = (slug, date) => ({
  slug,
  title: slug,
  date,
  category: "Méthode",
  description: "d",
  readingTime: "1 min de lecture",
  alt: "a",
  validationId: `id-${slug}`,
});

/** Un monde simulé : ce que le cockpit rend, ce qui répond en ligne, ce qui échoue. */
function monde(o) {
  const traces = [];
  const registre = [...(o.registre ?? [])];
  const pages = [...(o.pages ?? [])];
  let releves = 0;
  let commits = 0;
  const outils = {
    cockpit: {
      articles: async () => {
        traces.push("lecture du cockpit");
        return o.articles ?? [];
      },
      publie: async (id, url) => {
        traces.push(`publie ${id} ${url}`);
        if (o.publieLeve) throw new Error("cockpit coupé");
        return true;
      },
      echec: async (id, motif) => {
        traces.push(`echec ${id} ${motif.split("\n")[0]}`);
        traces.push(`motif ${id} ${motif}`);
        if (o.echecLeve) throw new Error("cockpit coupé");
      },
    },
    registre: () => registre,
    pages: () => pages,
    existe: (slug) => slug === "fichier-deja-la",
    ecrire: async (a, date) => {
      if (o.ecrireLeve) throw o.ecrireLeve;
      traces.push(`ecrire ${a.article.slug} ${date}`);
      registre.unshift(entree(a.article.slug, date));
    },
    ecrirePage: async (a, e) => {
      traces.push(`ecrirePage ${a.article.slug} ${e.date} ${e.validationId}`);
      pages.push(e);
    },
    annuler: (tete) => {
      traces.push("annuler", `annuler vers ${tete}`);
    },
    executer: (commande, args) => {
      const ligne = `${commande} ${args.join(" ")}`;
      if (ligne === "git status --porcelain") return { ok: true, sortie: o.sale ? " M src/content/blog.ts\n" : "" };
      if (ligne === "git rev-parse HEAD") return { ok: true, sortie: `commit-${commits}\n` };
      traces.push(ligne);
      const ok = !o.echoue?.(ligne);
      if (ok && commande === "git" && args[0] === "commit") commits++;
      return { ok, sortie: `sortie de ${ligne}\nerreur détaillée` };
    },
    enLigne: async (url) => (o.enLigne ?? (() => false))(url, releves++),
    indexNow: async (url) => `IndexNow ${url}`,
    attendre: async () => undefined,
    maintenant: () => o.maintenant ?? JEUDI,
    journal: (m) => traces.push(`journal ${m}`),
  };
  return { outils, traces };
}

describe("publierAuto : la validation d'Eliott vaut feu vert", () => {
  it("écrit, contrôle, pousse, attend la page puis la déclare publiée", async () => {
    const { outils, traces } = monde({
      articles: [article("le-plus-ancien"), article("le-suivant")],
      enLigne: (_url, appel) => appel >= 2,
    });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "publie", url: "https://eliottbouquerel.fr/blog/le-plus-ancien" });
    expect(traces).toContain("ecrire le-plus-ancien 2026-10-15");
    for (const args of CONTROLES) expect(traces).toContain(`bun ${args.join(" ")}`);
    expect(traces).toContain("git push origin HEAD:main");
    expect(traces).toContain("publie id-le-plus-ancien https://eliottbouquerel.fr/blog/le-plus-ancien");
    expect(traces).toContain("journal IndexNow https://eliottbouquerel.fr/blog/le-plus-ancien");
    expect(traces.some((t) => t.includes("le-suivant"))).toBe(false);
  });

  it("à blanc : rien de validé, rien d'écrit ni de poussé", async () => {
    const { outils, traces } = monde({});
    const issue = await publierAuto(outils);
    expect(issue).toEqual({ etat: "rien", confirmes: [], ignores: [] });
    expect(enEchec(issue)).toBe(false);
    expect(traces).toEqual(["lecture du cockpit"]);
  });

  it("un article par jour ouvré : rien le week-end, rien si un article est parti aujourd'hui", async () => {
    const weekEnd = monde({ articles: [article("a")], maintenant: SAMEDI });
    expect((await publierAuto(weekEnd.outils)).etat).toBe("repos");
    const dejaFait = monde({ articles: [article("a")], registre: [entree("ce-matin", "2026-10-15")] });
    expect((await publierAuto(dejaFait.outils)).etat).toBe("deja-publie");
    expect(dejaFait.traces.some((t) => t.startsWith("ecrire"))).toBe(false);
  });

  it("confirme d'abord un article de la veille qui répond enfin en ligne", async () => {
    const { outils, traces } = monde({
      registre: [entree("hier", "2026-10-14"), entree("il-y-a-un-mois", "2026-09-10")],
      enLigne: () => true,
    });
    const issue = await publierAuto(outils);
    expect(issue.confirmes).toEqual(["https://eliottbouquerel.fr/blog/hier"]);
    expect(traces.filter((t) => t.startsWith("publie"))).toHaveLength(1);
  });

  it("contrôle rouge : rien n'est poussé, le dossier est remis, la carte dit pourquoi", async () => {
    const { outils, traces } = monde({
      articles: [article("casse-les-tests")],
      echoue: (ligne) => ligne === "bun run test",
    });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "echec" });
    expect(issue.etat === "echec" && issue.motif).toContain("erreur détaillée");
    expect(traces).toContain("annuler");
    expect(traces).not.toContain("bun run build");
    expect(traces.some((t) => t.startsWith("git push"))).toBe(false);
    expect(traces).toContain("echec id-casse-les-tests Contrôle « bun run test » en échec, rien n'est parti :");
  });

  it("main a bougé : rebase une fois puis repousse", async () => {
    let poussees = 0;
    const { outils, traces } = monde({
      articles: [article("a")],
      echoue: (ligne) => ligne === "git push origin HEAD:main" && poussees++ === 0,
      enLigne: (_url, appel) => appel > 0,
    });
    expect((await publierAuto(outils)).etat).toBe("publie");
    expect(traces).toContain("git pull --rebase origin main");
  });

  it("poussée refusée deux fois, ou commit impossible : rien n'est parti, la carte le dit", async () => {
    const rebaseRate = monde({
      articles: [article("a")],
      echoue: (ligne) => ligne.startsWith("git push") || ligne.startsWith("git pull"),
    });
    expect(await publierAuto(rebaseRate.outils)).toMatchObject({ etat: "echec" });
    expect(rebaseRate.traces).toContain("echec id-a Poussée sur le site refusée, rien n'est parti :");
    const commitRate = monde({ articles: [article("a")], echoue: (ligne) => ligne.startsWith("git commit") });
    expect(await publierAuto(commitRate.outils)).toMatchObject({ etat: "echec" });
    expect(commitRate.traces).toContain("annuler");
  });

  it("déploiement qui ne répond pas : l'article reste validé avec le motif, après 20 minutes", async () => {
    const { outils, traces } = monde({ articles: [article("lent")] });
    const issue = await publierAuto(outils);
    expect(issue.etat === "echec" && issue.motif).toContain("déploiement Coolify");
    expect(traces.filter((t) => t.startsWith("publie"))).toEqual([]);
    expect(traces.some((t) => t.startsWith("echec id-lent Poussé sur le site"))).toBe(true);
    expect(RELEVES_DEPLOIEMENT * 10).toBe(1200);
  });
});

describe("la page par métier : son quota, sa chaîne, ses échecs à elle", () => {
  const COMMIT_ARTICLE = "git commit -m 📝 Publier l'article un-article";
  const COMMIT_PAGE = "git commit -m 📝 Publier la page métier garage-automobile";
  const URL_ARTICLE = "https://eliottbouquerel.fr/blog/un-article";
  const URL_PAGE = "https://eliottbouquerel.fr/logiciel-metier/garage-automobile";
  const LES_DEUX = [article("un-article"), page("garage-automobile")];

  it("une exécution publie l'article et la page, chacun son commit, datés du jour", async () => {
    const { outils, traces } = monde({ articles: LES_DEUX, enLigne: () => true });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({
      etat: "publie",
      url: URL_ARTICLE,
      page: { etat: "publie", url: URL_PAGE },
    });
    expect(traces).toContain("ecrire un-article 2026-10-15");
    expect(traces).toContain("ecrirePage garage-automobile 2026-10-15 id-garage-automobile");
    expect(traces).toContain(COMMIT_ARTICLE);
    expect(traces).toContain(COMMIT_PAGE);
    expect(traces.filter((t) => t === "bun run build")).toHaveLength(2);
    expect(traces.filter((t) => t === "git push origin HEAD:main")).toHaveLength(2);
    expect(traces).toContain(`publie id-un-article ${URL_ARTICLE}`);
    expect(traces).toContain(`publie id-garage-automobile ${URL_PAGE}`);
    expect(traces).toContain(`journal IndexNow ${URL_PAGE}`);
    expect(enEchec(issue)).toBe(false);
  });

  it("le corps d'une page n'est jamais écrit comme un article", async () => {
    const { outils, traces } = monde({ articles: [page("garage-automobile")], enLigne: () => true });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "rien", page: { etat: "publie", url: URL_PAGE } });
    expect(traces.some((t) => t.startsWith("ecrire "))).toBe(false);
  });

  it("un article sans kind suit sa chaîne seul, et l'issue ne parle pas de page", async () => {
    const { outils, traces } = monde({ articles: [article("un-article")], enLigne: () => true });
    const issue = await publierAuto(outils);
    expect(issue).toEqual({ etat: "publie", url: URL_ARTICLE, confirmes: [], ignores: [] });
    expect(traces.some((t) => t.startsWith("ecrirePage"))).toBe(false);
  });

  it("quotas indépendants : un article du jour n'arrête pas la page, une page du jour n'arrête pas l'article", async () => {
    const articleParti = monde({
      articles: LES_DEUX,
      registre: [entree("ce-matin", "2026-10-15")],
      enLigne: (url) => url === URL_PAGE,
    });
    expect(await publierAuto(articleParti.outils)).toMatchObject({ etat: "deja-publie", page: { etat: "publie" } });
    expect(articleParti.traces.some((t) => t.startsWith("ecrire "))).toBe(false);

    const pageDuJour = monde({
      articles: LES_DEUX,
      pages: [entreeMetier("ce-matin", "2026-10-15")],
      enLigne: (url) => url === URL_ARTICLE,
    });
    expect(await publierAuto(pageDuJour.outils)).toMatchObject({ etat: "publie", page: { etat: "deja-publie" } });
    expect(pageDuJour.traces.some((t) => t.startsWith("ecrirePage"))).toBe(false);
  });

  it("une page d'hier ne compte pas dans le quota du jour", async () => {
    const { outils } = monde({
      articles: [page("garage-automobile")],
      pages: [],
      enLigne: () => true,
    });
    outils.pages = () => [{ ...entreesMetier[1], date: "2026-10-14" }];
    expect((await publierAuto(outils)).page).toMatchObject({ etat: "publie" });
  });

  it("les deux quotas pris : le cockpit n'est même pas lu", async () => {
    const { outils, traces } = monde({
      articles: LES_DEUX,
      registre: [entree("ce-matin", "2026-10-15")],
      pages: [entreeMetier("ce-matin", "2026-10-15")],
    });
    expect(await publierAuto(outils)).toMatchObject({ etat: "deja-publie", page: { etat: "deja-publie" } });
    expect(traces).toEqual([]);
  });

  it("le week-end, rien pour personne", async () => {
    const { outils, traces } = monde({ articles: LES_DEUX, maintenant: SAMEDI });
    expect(await publierAuto(outils)).toEqual({ etat: "repos", confirmes: [], ignores: [] });
    expect(traces).toEqual([]);
  });

  it("l'échec de l'article n'empêche pas la page", async () => {
    let builds = 0;
    const { outils, traces } = monde({
      articles: LES_DEUX,
      echoue: (ligne) => ligne === "bun run build" && builds++ === 0,
      enLigne: () => true,
    });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "echec", page: { etat: "publie", url: URL_PAGE } });
    expect(traces).toContain("echec id-un-article Contrôle « bun run build » en échec, rien n'est parti :");
    expect(traces).not.toContain(COMMIT_ARTICLE);
    expect(traces).toContain(COMMIT_PAGE);
    expect(enEchec(issue)).toBe(true);
  });

  it("l'échec de la page n'empêche pas l'article et ne le défait pas", async () => {
    let builds = 0;
    const { outils, traces } = monde({
      articles: LES_DEUX,
      echoue: (ligne) => ligne === "bun run build" && builds++ === 1,
      enLigne: () => true,
    });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "publie", url: URL_ARTICLE, page: { etat: "echec" } });
    expect(traces).toContain(COMMIT_ARTICLE);
    expect(traces).not.toContain(COMMIT_PAGE);
    expect(traces).toContain("annuler vers commit-1");
    expect(traces).toContain(`publie id-un-article ${URL_ARTICLE}`);
    expect(traces).toContain("echec id-garage-automobile Contrôle « bun run build » en échec, rien n'est parti :");
    expect(enEchec(issue)).toBe(true);
  });

  it("corps illisible : motif sur la carte, rien d'écrit, rien de poussé, l'article part", async () => {
    const illisible = page("garage-automobile", { corps: "pas du JSON {" });
    const { outils, traces } = monde({ articles: [article("un-article"), illisible], enLigne: () => true });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "publie", page: { etat: "echec" } });
    expect(issue.page.motif).toContain("n’est pas un JSON lisible");
    expect(traces).toContain("echec id-garage-automobile Écriture refusée, rien n'est parti :");
    expect(traces.some((t) => t.startsWith("ecrirePage"))).toBe(false);
    expect(traces).not.toContain(COMMIT_PAGE);
    expect(traces.filter((t) => t === "git push origin HEAD:main")).toHaveLength(1);
  });

  it("entrée refusée par lirePage ou motifsDeRefus : le motif le dit, rien n'est poussé", async () => {
    const sansH1 = page("garage-automobile", {
      corps: JSON.stringify({ ...JSON.parse(page("garage-automobile").corps), h1: "" }),
    });
    const parLirePage = monde({ articles: [sansH1] });
    expect((await publierAuto(parLirePage.outils)).page.motif).toContain("h1 invalide");
    expect(parLirePage.traces.some((t) => t.startsWith("git push"))).toBe(false);

    const copie = page("garage-automobile");
    const parRefus = monde({ articles: [copie], pages: [entreeMetier("autre-metier", "2026-10-01")] });
    const { page: volet } = await publierAuto(parRefus.outils);
    expect(volet.motif).toContain("Page refusée");
    expect(volet.motif).toContain("trop proche de autre-metier");
    expect(parRefus.traces.some((t) => t.startsWith("git push"))).toBe(false);
  });

  it("une écriture qui lève ne casse pas la chaîne : la carte de l'article le dit, la page part", async () => {
    const { outils, traces } = monde({
      articles: LES_DEUX,
      ecrireLeve: new Error("Visuel refusé : élément interdit"),
      enLigne: () => true,
    });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "echec", page: { etat: "publie" } });
    expect(issue.motif).toContain("Visuel refusé");
    expect(traces).toContain("annuler");
    expect(traces).toContain("echec id-un-article Écriture refusée, rien n'est parti :");
  });

  it("une erreur qui n'en est pas une reste lisible", async () => {
    const { outils } = monde({ articles: [article("un-article")], ecrireLeve: "texte brut" });
    expect((await publierAuto(outils)).motif).toContain("texte brut");
  });

  it("un cockpit muet sur le motif n'arrête pas l'autre nature, le journal le garde", async () => {
    let builds = 0;
    const { outils, traces } = monde({
      articles: LES_DEUX,
      echecLeve: true,
      echoue: (ligne) => ligne === "bun run build" && builds++ === 0,
      enLigne: () => true,
    });
    expect(await publierAuto(outils)).toMatchObject({ etat: "echec", page: { etat: "publie" } });
    expect(traces).toContain("journal Motif non posé sur la carte de un-article : cockpit coupé");
  });

  it("un cockpit muet après la mise en ligne ne fait pas passer la page pour un échec", async () => {
    const { outils, traces } = monde({ articles: [page("garage-automobile")], publieLeve: true, enLigne: () => true });
    expect((await publierAuto(outils)).page).toMatchObject({ etat: "publie" });
    expect(traces).toContain("journal Publication de garage-automobile non confirmée au cockpit : cockpit coupé");
  });

  it("une seule des deux répond : chacune son issue, et 20 minutes d'attente au total", async () => {
    let attentes = 0;
    const { outils, traces } = monde({ articles: LES_DEUX, enLigne: (url) => url === URL_ARTICLE });
    outils.attendre = async () => {
      attentes++;
    };
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "publie", page: { etat: "echec" } });
    expect(issue.page.motif).toContain("déploiement Coolify");
    expect(attentes).toBe(RELEVES_DEPLOIEMENT);
    expect(traces.filter((t) => t.startsWith("publie"))).toEqual([`publie id-un-article ${URL_ARTICLE}`]);
    expect(traces.some((t) => t.startsWith("echec id-garage-automobile Poussé sur le site"))).toBe(true);
  });

  it("confirme une page récente qui répond enfin, jamais une page écrite à la main", async () => {
    const { outils, traces } = monde({
      pages: [
        entreeMetier("hier", "2026-10-14", "id-hier"),
        entreeMetier("ancienne", "2026-09-10", "id-ancienne"),
        entreeMetier("a-la-main", "2026-10-14"),
      ],
      enLigne: () => true,
    });
    const issue = await publierAuto(outils);
    expect(issue.confirmes).toEqual([urlPage("hier")]);
    expect(traces.filter((t) => t.startsWith("publie"))).toEqual([`publie id-hier ${urlPage("hier")}`]);
  });

  it("inscrits : articles et pages validés, avec leur adresse", () => {
    const liste = inscrits({
      registre: () => [entree("a", "2026-10-14")],
      pages: () => [entreeMetier("b", "2026-10-14", "id-b"), entreeMetier("c", "2026-10-14")],
    });
    expect(liste).toEqual([
      { slug: "a", date: "2026-10-14", id: "id-a", url: "https://eliottbouquerel.fr/blog/a" },
      { slug: "b", date: "2026-10-14", id: "id-b", url: "https://eliottbouquerel.fr/logiciel-metier/b" },
    ]);
  });
});

describe("dossier modifié", () => {
  it("ne touche à rien sur un dossier déjà modifié", async () => {
    const { outils, traces } = monde({ articles: [article("a"), page("b")], sale: true });
    const issue = await publierAuto(outils);
    expect(issue).toMatchObject({ etat: "echec" });
    expect(enEchec(issue)).toBe(true);
    expect(traces).toEqual([]);
  });
});

describe("choisir", () => {
  it("écarte sans visuel, déjà présent, ou en échec sur le même texte depuis moins d'un jour", () => {
    const enEchec = article("en-echec");
    enEchec.publication = { echec: "x", le: "2026-10-15T07:00:00Z", empreinte: empreinte(enEchec.corps) };
    const corrige = article("corrige", { publication: { echec: "x", le: "2026-10-15T07:00:00Z", empreinte: "autre" } });
    const sansVisuel = article("sans-visuel");
    sansVisuel.article.visuel = undefined;
    const { article: retenu, ignores } = choisir(
      [sansVisuel, article("deja-publie"), article("fichier-deja-la"), enEchec, corrige],
      { registre: () => [entree("deja-publie", "2026-10-01")], existe: (s) => s === "fichier-deja-la" },
      JEUDI,
    );
    expect(retenu?.article.slug).toBe("corrige");
    expect(ignores).toHaveLength(4);
  });

  it("retente le lendemain un échec sur le même texte", () => {
    const hier = article("hier", { publication: { echec: "x", le: "2026-10-14T07:00:00Z", empreinte: empreinte("Corps de hier.") } });
    expect(choisir([hier], { registre: () => [], existe: () => false }, JEUDI).article).toBe(hier);
  });
});

describe("choisirPage", () => {
  it("écarte sans visuel, déjà présente, ou en échec sur le même texte, et ignore les articles", () => {
    const enEchecMemeTexte = page("en-echec");
    enEchecMemeTexte.publication = {
      echec: "x",
      le: "2026-10-15T07:00:00Z",
      empreinte: empreinte(enEchecMemeTexte.corps),
    };
    const sansVisuel = page("sans-visuel");
    sansVisuel.article.visuel = undefined;
    const { page: retenue, ignores } = choisirPage(
      [article("un-article"), sansVisuel, page("deja-la"), enEchecMemeTexte, page("bonne")],
      { pages: () => [entreeMetier("deja-la", "2026-10-01")] },
      JEUDI,
    );
    expect(retenue?.article.slug).toBe("bonne");
    expect(ignores).toEqual([
      "sans-visuel : pas encore de visuel",
      "deja-la : déjà présent sur le site",
      "en-echec : en échec, retenté quand son texte change ou demain",
    ]);
  });

  it("une page écartée se dit dans l'issue, même sans rien publier", async () => {
    const sansVisuel = page("sans-visuel");
    sansVisuel.article.visuel = undefined;
    const { outils } = monde({ articles: [sansVisuel] });
    expect(await publierAuto(outils)).toEqual({
      etat: "rien",
      confirmes: [],
      ignores: [],
      page: { etat: "rien", ignores: ["sans-visuel : pas encore de visuel"] },
    });
  });

  it("choisir n'écrit jamais une page comme un article, un article sans kind reste un article", () => {
    const outils = { registre: () => [], existe: () => false };
    expect(choisir([page("p")], outils, JEUDI)).toEqual({ article: null, ignores: [] });
    const nul = article("a");
    nul.article.kind = null;
    expect(estPage(nul)).toBe(false);
    expect(choisir([page("p"), nul], outils, JEUDI).article).toBe(nul);
  });
});

describe("entreePage", () => {
  it("relit le corps, pose la date et la validation", () => {
    const e = entreePage(page("garage-automobile"), "2026-10-15", []);
    expect(e).toMatchObject({ slug: "garage-automobile", date: "2026-10-15", validationId: "id-garage-automobile" });
  });

  it("refuse un corps dont le slug n'est pas celui de la validation", () => {
    const a = page("garage-automobile", { article: { kind: "metier", slug: "autre" } });
    expect(() => entreePage(a, "2026-10-15", [])).toThrow("Slug du corps (garage-automobile) différent de la validation (autre)");
  });

  it("garde le rang de la future entrée dans son message", () => {
    const a = page("x", { corps: "[]" });
    expect(() => entreePage(a, "2026-10-15", [entreeMetier("y", "2026-10-01")])).toThrow("metiers.json, entrée 1 : entrée invalide");
  });
});

describe("outils réels, réseau simulé", () => {
  const reponses = [];
  const lire = (statut, corps = {}) =>
    (async (url, init) => {
      reponses.push({ url, init });
      return Response.json(corps, { status: statut });
    });

  it("le client du cockpit lit les articles et pose publication ou échec", async () => {
    const ok = clientCockpit("https://c", "jeton", lire(200, { articles: [article("a")] }));
    expect((await ok.articles())[0].article.slug).toBe("a");
    expect(await ok.publie("id", "https://u")).toBe(true);
    await ok.echec("id", "motif", "emp");
    const dernier = reponses.at(-1);
    expect(dernier?.url).toBe("https://c/api/agents/articles/id/publication");
    expect(JSON.parse(String(dernier?.init?.body))).toEqual({ resultat: "echec", motif: "motif", empreinte: "emp" });
    expect(new Headers(dernier?.init?.headers).get("authorization")).toBe("Bearer jeton");
  });

  it("409 vaut déjà fait ; une autre erreur se dit", async () => {
    const deja = clientCockpit("https://c", "j", lire(409));
    expect(await deja.publie("id", "https://u")).toBe(true);
    await deja.echec("id", "m", "e");
    const panne = clientCockpit("https://c", "j", lire(500));
    expect(await panne.publie("id", "https://u")).toBe(false);
    await expect(panne.articles()).rejects.toThrow("500");
    await expect(panne.echec("id", "m", "e")).rejects.toThrow("500");
  });

  it("en ligne seulement sur un 200, IndexNow ne fait jamais échouer", async () => {
    expect(await repondEnLigne("https://u", lire(200))).toBe(true);
    expect(await repondEnLigne("https://u", lire(404))).toBe(false);
    const coupe = (async () => {
      throw new Error("coupé");
    });
    expect(await repondEnLigne("https://u", coupe)).toBe(false);
    expect(await signalerIndexNow("https://eliottbouquerel.fr/blog/a", lire(202))).toBe("IndexNow : 202");
    expect(JSON.parse(String(reponses.at(-1)?.init?.body))).toMatchObject({ host: "eliottbouquerel.fr", urlList: ["https://eliottbouquerel.fr/blog/a"] });
    expect(await signalerIndexNow("https://u", coupe)).toBe("IndexNow injoignable : coupé");
    const bizarre = (async () => {
      throw "texte";
    });
    expect(await signalerIndexNow("https://u", bizarre)).toBe("IndexNow injoignable : texte");
  });

  it("dates de Paris et extraits de sortie", () => {
    expect(estWeekEnd(JEUDI)).toBe(false);
    expect(estWeekEnd(new Date("2026-10-18T08:00:00Z"))).toBe(true);
    expect(extrait("a\n\nb")).toBe("a\nb");
    expect(extrait("x".repeat(700))).toHaveLength(601);
  });
});
