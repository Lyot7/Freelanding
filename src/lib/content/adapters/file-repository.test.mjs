import { describe, expect, it } from "bun:test";

import { createFileContentRepository } from "./file-repository";

/**
 * Pages FIXES attendues, dans l'ordre du manifeste.
 *
 * Ce n'était au départ qu'un miroir du sitemap Framer d'origine. Le site étant
 * devenu celui d'Eliott, il s'en écarte volontairement : les mentions légales
 * s'y ajoutent, elles sont obligatoires en France et le template n'en avait
 * aucune.
 *
 * LES ARTICLES N'Y SONT PLUS, et c'est le correctif du 2026-08-27. Cette
 * liste figeait les huit slugs ANGLAIS du template, supprimés le 2026-08-26.
 * Le test passait au vert en vérifiant que le manifeste contenait bien huit
 * adresses qui répondaient 404 — et que les quatre articles réellement publiés
 * en étaient absents. Un test qui grave un bug le protège.
 *
 * LES PAGES DE PRESTATION N'Y SONT PAS NON PLUS, pour la même raison : elles
 * sont dérivées de `offre.ts` depuis le 2026-08-27. Publier une prestation doit
 * suffire à publier sa page, sans seconde liste à tenir ici.
 *
 * Ce qui est vérifié maintenant, c'est l'INVARIANT : les pages fixes d'un côté,
 * et de l'autre exactement un chemin par article publié et par prestation.
 */
const PAGES_FIXES = [
  "/",
  "/contact",
  "/a-propos",
  "/blog",
  "/realisations",
  "/realisations/kpsull",
  "/realisations/wurth-creation-de-compte",
  "/realisations/nslysium",
  "/legal/mentions-legales",
  "/legal/politique-de-confidentialite",
  "/legal/conditions-generales-de-vente",
];

describe("file content repository", () => {
  const repository = createFileContentRepository();

  it("expose chaque page fixe une fois, dans l'ordre du manifeste", async () => {
    const routes = await repository.getRoutes();
    const pathnames = routes.map(({ pathname }) => pathname);

    // Les routes DÉRIVÉES (articles, prestations) sont écartées ici : elles ont
    // chacune leur propre test d'invariant. Ce qui reste doit correspondre, dans
    // l'ordre, aux pages écrites à la main dans le manifeste.
    const derivees = new Set(["post", "service"]);
    const fixes = routes
      .filter(({ kind }) => !derivees.has(kind))
      .map(({ pathname }) => pathname);
    expect(fixes).toEqual(PAGES_FIXES);
    // Aucun doublon : une route servie deux fois produirait deux entrées de
    // sitemap pour une même page.
    expect(new Set(pathnames).size).toBe(pathnames.length);
  });

  it("annonce exactement un chemin par article publié, et aucun autre", async () => {
    const [routes, posts] = await Promise.all([
      repository.getRoutes(),
      repository.getPosts(),
    ]);

    const cheminsArticles = routes
      .filter(({ kind }) => kind === "post")
      .map(({ pathname }) => pathname)
      .sort();
    const attendus = posts.map(({ slug }) => `/blog/${slug}`).sort();

    // L'ÉGALITÉ DANS LES DEUX SENS est le cœur du test. Un manifeste plus
    // large annonce des 404 au moteur de recherche ; un manifeste plus étroit
    // publie des articles que personne ne trouvera.
    expect(cheminsArticles).toEqual(attendus);
    expect(attendus.length).toBeGreaterThan(0);
  });

  it("exposes complete blog and work index data", async () => {
    const [blog, allPosts, work] = await Promise.all([
      repository.getBlog(),
      repository.getPosts(),
      repository.getWorkPage(),
    ]);

    /*
     * AUCUN NOMBRE FIGÉ. Le test attendait huit articles, le compte du template
     * : il est tombé le jour où les articles de démonstration ont été remplacés
     * par les vrais. Figer un compte revient à faire échouer la suite à chaque
     * publication, ce qui apprend à la contourner. Ce qui doit tenir, c'est la
     * COHÉRENCE : l'index ne montre que des articles publiés, et il les montre
     * tous. Le contenu des articles, lui, est vérifié par `content/blog.test.mjs`.
     */
    expect(blog.posts).toEqual(allPosts.filter(({ listedInIndex }) => listedInIndex));
    expect(allPosts.length).toBeGreaterThan(0);
    expect(work.items).toHaveLength(3);
    expect(blog.posts.every(({ listedInIndex }) => listedInIndex)).toBe(true);
  });

  it("resolves canonical, alias, and URL-encoded slugs", async () => {
    /*
     * LA MÉCANIQUE, PAS UN ARTICLE PRÉCIS. Ce test citait quatre slugs du
     * template (tiret cadratin, encodage `%E2%80%94`, point final) et a disparu
     * avec eux. Ce qu'il vérifiait vaut pourtant pour toute entité du port : il
     * porte donc sur les études de cas, qui ont un contenu stable, et il
     * construit ses variantes depuis la donnée au lieu de les recopier.
     */
    const [premier] = await repository.getWorks();
    const canonique = await repository.getWork(premier.slug);
    const encodé = await repository.getWork(encodeURIComponent(premier.slug));
    const entouré = await repository.getWork(`/${premier.slug}/`);

    expect(canonique?.slug).toBe(premier.slug);
    expect(encodé).toEqual(canonique);
    expect(entouré).toEqual(canonique);

    // Un alias déclaré résout vers son entité canonique, quelle que soit
    // l'entité qui en porte un.
    const avecAlias = (await repository.getPosts()).find(
      ({ aliases }) => (aliases?.length ?? 0) > 0,
    );
    if (avecAlias) {
      expect(await repository.getPost(avecAlias.aliases[0])).toEqual(avecAlias);
    }
  });

  it("returns null for empty, malformed, and unknown detail slugs", async () => {
    const values = await Promise.all([
      repository.getPost(""),
      repository.getPost("%E0%A4%A"),
      repository.getPost("missing"),
      repository.getWork("missing"),
      repository.getLegalDocument("missing"),
    ]);

    expect(values).toEqual([null, null, null, null, null]);
  });

  // Trois documents désormais : les mentions légales ont été ajoutées, elles
  // sont obligatoires pour un site professionnel français (LCEN, art. 1-1
  // depuis la loi SREN du 21 mai 2024, l'article 6-III ne portant plus cette
  // obligation).
  it("exposes the three legal documents with structured bodies", async () => {
    const [documents, legalNotice, privacy, terms] = await Promise.all([
      repository.getLegalDocuments(),
      repository.getLegalDocument("mentions-legales"),
      repository.getLegalDocument("politique-de-confidentialite"),
      repository.getLegalDocument("/conditions-generales-de-vente/"),
    ]);

    expect(documents).toHaveLength(3);
    expect(legalNotice?.body.length).toBeGreaterThan(5);
    expect(privacy?.body.length).toBeGreaterThan(10);
    expect(terms?.body.length).toBeGreaterThan(10);
    // La date de révision est commune aux trois documents : ils ont été
    // réécrits ensemble. On vérifie le format plutôt qu'une date figée, qui
    // serait à corriger à chaque relecture juridique.
    for (const document of [legalNotice, privacy, terms]) {
      expect(document?.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("expose des études de cas complètes, sans reste du template", async () => {
    const works = await repository.getWorks();

    expect(works).toHaveLength(3);

    for (const work of works) {
      // Structure narrative : elle est imposée par le rendu (titre + corps pour
      // le problème et l'approche, une phrase de résultat).
      expect(work.overview.length).toBeGreaterThan(20);
      expect(work.problem).toHaveLength(2);
      expect(work.outcome).toHaveLength(1);
      expect(work.approach).toHaveLength(2);
      expect(work.body.length).toBeGreaterThanOrEqual(1);
      expect(work.nextProject).toBeTruthy();

      // GARDE-FOU DE CRÉDIBILITÉ. Le site a porté cinq études de cas inventées,
      // clients et résultats compris. Ces trois règles empêchent d'y revenir
      // sans s'en apercevoir.
      // 1. Aucun asset du template : tout visuel doit être produit par Eliott.
      const assets = [work.cover, ...work.gallery, work.videoPoster]
        .filter(Boolean)
        .map(({ src }) => src);
      for (const src of assets) {
        expect(src).not.toContain("framerusercontent");
      }
      // 2. Toute image porte un texte alternatif renseigné.
      for (const image of [work.cover, ...work.gallery]) {
        expect(typeof image.alt).toBe("string");
      }
      // 3. Un témoignage, s'il existe, est attribué à quelqu'un. Aucun des trois
      //    projets n'en porte aujourd'hui : personne n'en a écrit.
      if (work.testimonial) {
        expect(work.testimonial.quote.length).toBeGreaterThan(0);
        expect(work.testimonial.author.name.length).toBeGreaterThan(0);
      }
    }

    // Les projets se renvoient en boucle fermée : depuis n'importe lequel, on
    // parcourt les trois sans jamais tomber sur un slug mort.
    const slugs = works.map(({ slug }) => slug);
    for (const work of works) {
      expect(slugs).toContain(work.nextProject);
    }
    expect(new Set(works.map(({ nextProject }) => nextProject)).size).toBe(3);

    // Le projet mené en entreprise pointe le site du client, pas un sous-domaine
    // d'Eliott : le parcours refait en 2024 est toujours servi par Würth.
    const wurth = works.find(({ slug }) => slug === "wurth-creation-de-compte");
    expect(wurth.liveUrl).toMatch(/^https:\/\/eshop\.wurth\.fr\//);
    expect(wurth.results).toHaveLength(1);
    for (const personal of works.filter(({ slug }) => slug !== "wurth-creation-de-compte")) {
      expect(personal.liveUrl).toMatch(/^https:\/\/[a-z]+\.eliottbouquerel\.fr\//);
      expect(personal.results).toBeUndefined();
    }
  });
});
