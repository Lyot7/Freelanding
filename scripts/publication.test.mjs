import { describe, expect, it } from "bun:test";
import {
  CONTROLES,
  RELEVES_DEPLOIEMENT,
  choisir,
  clientCockpit,
  empreinte,
  estWeekEnd,
  extrait,
  publierAuto,
  repondEnLigne,
  signalerIndexNow,
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
    pageServie: { url: "/services/site-vitrine" },
    visuel: { svg: "<svg/>", alt: "Un visuel" },
  },
  ...autre,
});

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
  let releves = 0;
  const outils = {
    cockpit: {
      articles: async () => o.articles ?? [],
      publie: async (id, url) => {
        traces.push(`publie ${id} ${url}`);
        return true;
      },
      echec: async (id, motif) => {
        traces.push(`echec ${id} ${motif.split("\n")[0]}`);
      },
    },
    registre: () => registre,
    existe: (slug) => slug === "fichier-deja-la",
    ecrire: async (a, date) => {
      traces.push(`ecrire ${a.article.slug} ${date}`);
      registre.unshift(entree(a.article.slug, date));
    },
    annuler: () => traces.push("annuler"),
    executer: (commande, args) => {
      const ligne = `${commande} ${args.join(" ")}`;
      if (ligne === "git status --porcelain") return { ok: true, sortie: o.sale ? " M src/content/blog.ts\n" : "" };
      traces.push(ligne);
      return { ok: !o.echoue?.(ligne), sortie: `sortie de ${ligne}\nerreur détaillée` };
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
    expect(await publierAuto(outils)).toEqual({ etat: "rien", confirmes: [], ignores: [] });
    expect(traces).toEqual([]);
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

describe("dossier modifié", () => {
  it("ne touche à rien sur un dossier déjà modifié", async () => {
    const { outils, traces } = monde({ articles: [article("a")], sale: true });
    expect(await publierAuto(outils)).toMatchObject({ etat: "echec" });
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
