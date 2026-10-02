import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { blogPosts, blogContent } from "./blog.ts";
import { IDS_RENDEZ_VOUS } from "./rendez-vous.ts";
import { prestation, prixPack } from "./offre.ts";

/**
 * AUDIT DES ARTICLES.
 *
 * Un test plutôt qu'un script à lancer à la main : les articles sont rédigés par
 * un agent, et ce qu'on ne vérifie pas automatiquement finit publié. Le contrôle
 * est statique (registre + fichiers), il n'a donc pas besoin d'un navigateur et
 * tourne à chaque `bun test`.
 *
 * Ce qu'il attrape, et qui ne se voit pas autrement :
 *  - un article listé sans corps, ou un corps orphelin jamais publié ;
 *  - une description absente, trop courte ou trop longue pour un résultat de
 *    recherche ;
 *  - une image de couverture qui pointe sur un fichier inexistant ;
 *  - un reste du template (`framerusercontent`) dans un visuel d'article ;
 *  - un `#` de titre 1 dans un corps, qui ferait un second h1 sur la page ;
 *  - une image markdown sans texte de remplacement.
 */

const DOSSIER = join(import.meta.dirname, "articles");
const PUBLIC = join(import.meta.dirname, "..", "..", "public");

/** Bornes usuelles d'un extrait de résultat de recherche, en caractères. */
const DESCRIPTION = { min: 70, max: 200 };

const fichiers = existsSync(DOSSIER)
  ? readdirSync(DOSSIER).filter((f) => f.endsWith(".mdx"))
  : [];

describe("registre du blog", () => {
  test("chaque article listé a son corps MDX", () => {
    for (const post of blogPosts) {
      expect(existsSync(join(DOSSIER, `${post.slug}.mdx`))).toBe(true);
    }
  });

  test("aucun corps MDX n'est orphelin", () => {
    const listés = new Set(blogPosts.map(({ slug }) => slug));
    for (const fichier of fichiers) {
      expect(listés.has(fichier.replace(/\.mdx$/, ""))).toBe(true);
    }
  });

  test("les catégories du filtre correspondent aux articles publiés", () => {
    const publiées = new Set(
      blogPosts.filter((p) => p.listedInIndex).map((p) => p.category),
    );
    // La première entrée est la sentinelle « tout afficher ».
    for (const catégorie of blogContent.categories.slice(1)) {
      expect(publiées.has(catégorie)).toBe(true);
    }
  });
});

describe("métadonnées d'article", () => {
  test("description présente et de longueur exploitable", () => {
    for (const post of blogPosts) {
      const description = post.seo?.description ?? post.excerpt;
      expect(description.length).toBeGreaterThanOrEqual(DESCRIPTION.min);
      expect(description.length).toBeLessThanOrEqual(DESCRIPTION.max);
    }
  });

  test("couverture et image de partage servies par le dépôt", () => {
    for (const post of blogPosts) {
      for (const image of [post.cover, post.seo?.ogImage]) {
        if (!image) continue;
        expect(image.alt.length).toBeGreaterThan(0);
        expect(existsSync(join(PUBLIC, image.src))).toBe(true);
      }
    }
  });

  test("aucun visuel hérité du template", () => {
    for (const post of blogPosts) {
      const sources = [post.cover.src, post.seo?.ogImage?.src, post.author.avatar?.src];
      for (const src of sources) {
        expect(src ?? "").not.toContain("framerusercontent");
      }
    }
  });

  test("date ISO et auteur nommé", () => {
    for (const post of blogPosts) {
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.author.name.length).toBeGreaterThan(0);
    }
  });
});

describe("corps des articles", () => {
  const corps = fichiers.map((f) => [f, readFileSync(join(DOSSIER, f), "utf8")]);

  test("aucun titre de niveau 1 : le h1 de la page est le titre de l'article", () => {
    for (const [fichier, texte] of corps) {
      expect([fichier, /^# /m.test(texte)]).toEqual([fichier, false]);
    }
  });

  test("chaque image markdown porte un texte de remplacement", () => {
    for (const [fichier, texte] of corps) {
      for (const [, alt] of texte.matchAll(/!\[([^\]]*)\]\(/g)) {
        expect([fichier, alt.trim().length > 0]).toEqual([fichier, true]);
      }
    }
  });

  test("aucun import : la palette de blocs est fermée", () => {
    for (const [fichier, texte] of corps) {
      expect([fichier, /^import\s/m.test(texte)]).toEqual([fichier, false]);
    }
  });

  test("le corps n'est pas vide", () => {
    for (const [fichier, texte] of corps) {
      expect([fichier, texte.trim().length > 400]).toEqual([fichier, true]);
    }
  });

  /*
   * CHAQUE ARTICLE MÈNE QUELQUE PART, et c'est vérifié plutôt qu'espéré.
   *
   * Les cinq premiers articles du blog se terminaient sur une conclusion et
   * rien d'autre : aucun ne pointait vers une page où l'on peut acheter, ni
   * vers le formulaire de contact. C'était le trou le plus coûteux du blog, et
   * il ne se voyait nulle part — les types étaient verts, les pages
   * s'affichaient, et seule une lecture de bout en bout le montrait.
   *
   * Le contrôle est volontairement grossier : il exige la PRÉSENCE d'un lien
   * vers une page de prestation et d'un lien vers `/contact`, pas leur
   * formulation. Le texte du lien reste un choix d'écriture ; son existence
   * n'en est plus un.
   *
   * DEPUIS LE 2026-09-24, LE LIEN VERS `/contact` MÈNE À LA PRISE DE
   * RENDEZ-VOUS, sujet compris : un `/contact` nu posait le lecteur devant un
   * formulaire et un agenda sans rien présélectionner. Un sujet inconnu est
   * ignoré en silence par la page, d'où la vérification contre la liste.
   */
  test("chaque article mène vers une prestation et vers le contact", () => {
    for (const [fichier, texte] of corps) {
      expect([fichier, /\]\(\/services\/[a-z-]+\)/.test(texte)]).toEqual([
        fichier,
        true,
      ]);
      const sujets = [
        ...texte.matchAll(/\]\(\/contact\?sujet=([a-z]+)#rendez-vous\)/g),
      ].map((m) => m[1]);
      expect([fichier, sujets.length > 0]).toEqual([fichier, true]);
      for (const sujet of sujets) {
        expect([fichier, IDS_RENDEZ_VOUS.includes(sujet)]).toEqual([fichier, true]);
      }
    }
  });

  /*
   * LES LIENS INTERNES POINTENT VERS DES ARTICLES QUI EXISTENT.
   *
   * Le maillage entre articles est écrit à la main dans le MDX : une faute de
   * frappe dans un slug produit une page 404 que rien ne signale au build.
   * `audit:liens` l'attraperait, mais il demande un serveur de dev démarré et
   * un navigateur ; ce test-ci tourne partout, à chaque `bun test`.
   */
  test("les liens entre articles pointent vers des slugs publiés", () => {
    const publiés = new Set(blogPosts.map(({ slug }) => slug));
    for (const [fichier, texte] of corps) {
      for (const [, slug] of texte.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
        expect([fichier, slug, publiés.has(slug)]).toEqual([fichier, slug, true]);
      }
    }
  });

  /*
   * AUCUN TIRET CADRATIN NI DEMI-CADRATIN dans la prose des articles.
   *
   * La règle existe déjà dans `typographie.test.mjs`, qui couvre tout
   * `src/content`. Elle est redoublée ici parce que c'est la faute que produit
   * le plus spontanément un agent rédacteur, et qu'un message d'erreur qui
   * nomme le fichier fautif fait gagner un aller-retour.
   */
  test("aucun tiret cadratin ni demi-cadratin", () => {
    for (const [fichier, texte] of corps) {
      expect([fichier, /[—–]/.test(texte)]).toEqual([fichier, false]);
    }
  });
});

/*
 * L'ÉTUDE CHIFFRÉE. Ses chiffres sont repris tels quels par la presse et par
 * les moteurs de réponse : l'extrait, la description et le corps doivent dire
 * la même chose, et le périmètre (des fiches Google Maps, aucune donnée
 * d'effectif) interdit le mot « PME » partout où un lecteur le verrait.
 */
describe("étude des sites des entreprises normandes", () => {
  const slug = "etat-des-sites-des-entreprises-normandes-2026";
  const etude = blogPosts.find((p) => p.slug === slug);
  const texte = readFileSync(join(DOSSIER, `${slug}.mdx`), "utf8");
  /** Les nombres d'un texte, espaces fines et insécables retirées. */
  const nombres = (t) =>
    [...t.matchAll(/\d{1,3}(?:[\s\u202f\u00a0]\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g)].map(
      ([n]) => n.replace(/[\s\u202f\u00a0]/g, ""),
    );
  const dansLeCorps = new Set(nombres(texte));

  test("déclare son jeu de données sous licence CC BY 4.0", () => {
    expect(etude?.dataset?.license).toBe(
      "https://creativecommons.org/licenses/by/4.0/deed.fr",
    );
    expect(etude?.dataset?.variableMeasured.length).toBeGreaterThan(0);
  });

  test("chaque chiffre de l'extrait et de la description figure dans le corps", () => {
    for (const champ of [etude?.excerpt ?? "", etude?.seo?.description ?? ""]) {
      for (const n of nombres(champ)) {
        expect([n, dansLeCorps.has(n)]).toEqual([n, true]);
      }
    }
  });

  test("le corps publie sa méthode et ses limites", () => {
    expect(texte).toMatch(/^## Méthodologie et limites$/m);
    expect(texte).toMatch(/^### Limites$/m);
  });

  test("jamais le mot PME : l'étude ne mesure pas la taille des entreprises", () => {
    const visibles = [
      texte,
      etude?.title,
      etude?.excerpt,
      etude?.seo?.title,
      etude?.seo?.description,
      etude?.dataset?.name,
      etude?.dataset?.description,
    ].join("\n");
    expect(/\bPME\b/.test(visibles)).toBe(false);
  });
});

/*
 * LES ARTICLES DE DÉCISION ET DE PRIX (lot 4 SEO, 2026-10-02).
 *
 * Ils visent une requête précise (« odoo ou logiciel sur mesure », « refonte
 * site internet prix »…) et leur forme est la même : réponse directe en tête,
 * tableau ou calcul à hypothèses affichées, FAQ, et un lien vers la prestation
 * ET vers sa page de prix. Les prix d'Eliott n'y sont jamais écrits à la main :
 * le bloc `<Prix>` les lit dans `offre.ts`.
 */
describe("articles de décision et de prix", () => {
  const ARTICLES = {
    "logiciel-sur-mesure-ou-odoo": "logiciel",
    "remplacer-excel-par-un-logiciel": "logiciel",
    "refonte-site-internet-pme": "vitrine",
    "site-sur-mesure-ou-wordpress": "vitrine",
  };
  const CHEMINS = {
    logiciel: ["/services/logiciel-metier", "/services/logiciel-metier/prix"],
    vitrine: ["/services/site-vitrine", "/services/site-vitrine/prix"],
  };
  const corps = (slug) => readFileSync(join(DOSSIER, `${slug}.mdx`), "utf8");
  const mots = (texte) =>
    texte
      .replace(/<Prix[^>]*\/>/g, "prix")
      .replace(/<Steps items=\{\[|\]\} \/>/g, " ")
      .replace(/\]\([^)]*\)/g, "]")
      .split(/\s+/u)
      .filter((m) => /[\p{L}\d]/u.test(m)).length;

  for (const [slug, offre] of Object.entries(ARTICLES)) {
    describe(slug, () => {
      const post = blogPosts.find((p) => p.slug === slug);
      const texte = corps(slug);

      test("est publié le 2026-10-02 et listé", () => {
        expect(post?.date).toBe("2026-10-02");
        expect(post?.listedInIndex).toBe(true);
      });

      test("titre de recherche de 60 caractères au plus", () => {
        expect(post.seo.title.length).toBeLessThanOrEqual(60);
      });

      test("description de 150 à 160 caractères, au vouvoiement", () => {
        const { description } = post.seo;
        expect(description.length).toBeGreaterThanOrEqual(150);
        expect(description.length).toBeLessThanOrEqual(160);
        expect(/\b(tu|ton|ta|tes|toi)\b/iu.test(description)).toBe(false);
      });

      test("1 200 à 1 800 mots", () => {
        const total = mots(texte);
        expect(total).toBeGreaterThanOrEqual(1200);
        expect(total).toBeLessThanOrEqual(1800);
      });

      test("tableau comparatif, FAQ et titres en questions", () => {
        expect(/^\| --- \|/m.test(texte)).toBe(true);
        expect(texte).toContain("## Questions fréquentes");
        const h2 = [...texte.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
        expect(h2.filter((t) => t.endsWith("?")).length).toBeGreaterThanOrEqual(3);
      });

      test("lie la prestation et sa page de prix", () => {
        for (const chemin of CHEMINS[offre]) {
          expect(texte).toContain(`](${chemin})`);
        }
      });

      test("aucun prix d'Eliott écrit à la main, forfaits cités existants", () => {
        const montants = prestation(offre).packs.map((p) => prixPack(p));
        for (const montant of montants) {
          expect(texte.replace(/ /gu, " ")).not.toContain(montant.replace(/ /gu, " "));
        }
        for (const [, id] of texte.matchAll(/<Prix offre="[a-z]+" forfait="([a-z]+)"/g)) {
          expect(prestation(offre).packs.map((p) => p.id)).toContain(id);
        }
      });

      test("rendez-vous en visio, jamais sur place", () => {
        expect(/sur place|en personne|présentiel|déplac/iu.test(texte)).toBe(false);
      });
    });
  }

  test("aucun paragraphe n'est partagé entre deux articles", () => {
    const vus = new Map();
    for (const slug of Object.keys(ARTICLES)) {
      for (const bloc of corps(slug).split(/\n\s*\n/)) {
        const cle = bloc.trim();
        if (cle.length < 80) continue;
        const autre = vus.get(cle);
        expect(autre === undefined || autre === slug, `paragraphe partagé : ${cle}`).toBe(true);
        vus.set(cle, slug);
      }
    }
  });
});
