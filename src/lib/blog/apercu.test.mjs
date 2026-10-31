import { describe, expect, it } from "bun:test";
import { blogPosts } from "../../content/blog.ts";
import { dureeLecture, entreeDuCockpit, rubriquePour } from "../../content/blog-cockpit.ts";
import { sommaireDeLArticle, sommaireDuTexte } from "./sommaire.ts";
import { entreesMetier } from "../../content/metiers.ts";
import {
  articleDApercu,
  chargerApercu,
  demandeApercu,
  estPageApercu,
  lireReponse,
  pageDApercu,
  uriSvg,
} from "./apercu.ts";

const ID = "51250e11-5b57-4399-b845-f62846b0484b";
const SIG = "a".repeat(43);
const article = {
  slug: "un-article",
  description: "Une description assez longue pour tenir entre soixante-dix et deux cents caractères, comme le site l’exige.",
  motCle: { requete: "prix site" },
  motsCles: [{ requete: "devis site" }, { autre: 1 }],
  pageServie: { url: "/services/site-vitrine" },
  visuel: { svg: "<svg xmlns='http://www.w3.org/2000/svg'/>", alt: "Un visuel de test assez long pour passer" },
};
const reponse = { titre: "Un titre", corps: "## Première partie\n\nTexte.", article };

describe("demandeApercu", () => {
  it("garde un id, une échéance et une signature de la bonne forme", () => {
    expect(demandeApercu(ID, "1760000000", SIG)).toEqual({ id: ID, exp: "1760000000", sig: SIG });
  });
  it("refuse tout le reste avant d'appeler le cockpit", () => {
    expect(demandeApercu("../admin", "1760000000", SIG)).toBeNull();
    expect(demandeApercu(ID, ["1760000000"], SIG)).toBeNull();
    expect(demandeApercu(ID, "1760000000", undefined)).toBeNull();
    expect(demandeApercu(ID, "17600", SIG)).toBeNull();
    expect(demandeApercu(ID, "1760000000", "a/b")).toBeNull();
  });
});

describe("lireReponse", () => {
  it("lit l'article du cockpit champ par champ", () => {
    const lu = lireReponse(ID, reponse);
    expect(lu?.article.motsCles).toEqual([{ requete: "devis site" }]);
    expect(lu?.article.visuel?.alt).toBe(article.visuel.alt);
    expect(lu?.article.categorie).toBeUndefined();
  });
  it("tient sans visuel ni mots-clés secondaires, et garde la rubrique donnée", () => {
    const lu = lireReponse(ID, { ...reponse, article: { ...article, visuel: { svg: "" }, motsCles: "x", categorie: "Méthode" } });
    expect(lu?.article.visuel).toBeUndefined();
    expect(lu?.article.motsCles).toBeUndefined();
    expect(lu?.article.categorie).toBe("Méthode");
  });
  it("refuse une réponse qui n'a pas la forme attendue", () => {
    expect(lireReponse(ID, null)).toBeNull();
    expect(lireReponse(ID, { ...reponse, titre: " " })).toBeNull();
    expect(lireReponse(ID, { ...reponse, corps: 3 })).toBeNull();
    expect(lireReponse(ID, { ...reponse, article: { ...article, slug: "" } })).toBeNull();
    expect(lireReponse(ID, { ...reponse, article: { ...article, motCle: {} } })).toBeNull();
    expect(lireReponse(ID, { ...reponse, article: { ...article, pageServie: { url: 1 } } })).toBeNull();
  });
});

describe("chargerApercu", () => {
  const demande = { id: ID, exp: "1760000000", sig: SIG };

  it("demande l'article au cockpit, signature transmise telle quelle", async () => {
    let appel = "";
    const lire = (async (url) => {
      appel = String(url);
      return Response.json(reponse);
    });
    expect((await chargerApercu(demande, lire))?.titre).toBe("Un titre");
    expect(appel).toBe(`https://admin.eliottbouquerel.fr/api/apercu/article/${ID}?exp=1760000000&sig=${SIG}`);
  });
  it("rend null sur un refus du cockpit ou une panne réseau", async () => {
    const refus = (async () => new Response("", { status: 403 }));
    const panne = (async () => {
      throw new Error("réseau");
    });
    expect(await chargerApercu(demande, refus)).toBeNull();
    expect(await chargerApercu(demande, panne)).toBeNull();
  });
});

describe("articleDApercu", () => {
  it("construit le BlogPost de la publication, images remplacées par le SVG", () => {
    const lu = lireReponse(ID, reponse);
    if (!lu) throw new Error("réponse illisible");
    const post = articleDApercu(lu, blogPosts, "2026-10-16");
    const image = uriSvg(article.visuel.svg);
    expect(post.slug).toBe("un-article");
    expect(post.date).toBe("2026-10-16");
    expect(post.cover.src).toBe(image);
    expect(post.heroImage?.src).toBe(image);
    expect(post.heroImage?.og.src).toBe(image);
    expect(post.seo?.ogImage?.src).toBe(image);
    expect(post.category).toBe("Méthode");
  });
  it("garde la place du héros sans visuel, et un texte de remplacement", () => {
    const lu = lireReponse(ID, { ...reponse, article: { ...article, visuel: undefined } });
    if (!lu) throw new Error("réponse illisible");
    const post = articleDApercu(lu, blogPosts, "2026-10-16");
    expect(post.cover.src.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(post.cover.alt).toBe(article.description);
  });
});

describe("métadonnées partagées avec la publication", () => {
  it("durée, rubrique et entrée du registre", () => {
    expect(dureeLecture("")).toBe("1 min de lecture");
    expect(dureeLecture(`${Array.from({ length: 401 }, () => "mot").join(" ")} — |`)).toBe("3 min de lecture");
    expect(rubriquePour("/services/logiciel-metier")).toBe("Outils métier");
    expect(entreeDuCockpit({ id: ID, titre: "T", corps: "a b", article: { ...article, motsCles: undefined, visuel: undefined } }, "2026-10-16")).toMatchObject({
      alt: "",
      tags: ["prix site"],
      validationId: ID,
    });
  });
  it("le sommaire se lit sur le texte comme sur le fichier", () => {
    expect(sommaireDeLArticle("maintenance-site-internet-prix").length).toBeGreaterThan(2);
    expect(sommaireDeLArticle("n-existe-pas")).toEqual([]);
    expect(sommaireDuTexte("## Un **titre**\n```\n## pas un titre\n```\n## Deux")).toEqual([
      { id: "un-titre", titre: "Un **titre**" },
      { id: "deux", titre: "Deux" },
    ]);
  });
});

describe("la page par métier en aperçu", () => {
  const sansDate = { ...entreesMetier[0], date: undefined };
  const SVG = "<svg xmlns='http://www.w3.org/2000/svg'/>";
  const reponseMetier = {
    titre: "Échafaudage",
    corps: JSON.stringify(sansDate),
    article: { kind: "metier", slug: sansDate.slug, visuel: { svg: SVG, alt: "Un visuel" } },
  };
  const apercu = (autre = {}) => lireReponse(ID, { ...reponseMetier, ...autre });

  it("lireReponse garde kind, le slug et le visuel, sans exiger ce qui ne sert qu'aux articles", () => {
    const lu = apercu();
    expect(lu?.article).toEqual({ kind: "metier", slug: sansDate.slug, visuel: { svg: SVG, alt: "Un visuel" } });
    expect(estPageApercu(lu)).toBe(true);
  });

  it("sans kind, c'est un article, avec ses exigences", () => {
    expect(estPageApercu(lireReponse(ID, reponse))).toBe(false);
    expect(lireReponse(ID, { ...reponse, article: { slug: "a" } })).toBeNull();
    expect(lireReponse(ID, { ...reponse, article: { kind: "metier" } })).toBeNull();
  });

  it("une page propre se montre sans motif, avec son visuel en SVG", () => {
    const rendu = pageDApercu(apercu(), "2026-10-15", []);
    expect(rendu.motifs).toEqual([]);
    expect(rendu.page).toMatchObject({ slug: sansDate.slug, date: "2026-10-15", chemin: `/logiciel-metier/${sansDate.slug}` });
    expect(rendu.visuel).toEqual({ src: uriSvg(SVG), alt: sansDate.image.alt });
  });

  it("une page qui ne partirait pas se montre avec ses motifs", () => {
    const copie = JSON.stringify({ ...sansDate, slug: "copie" });
    const lu = apercu({ corps: copie, article: { kind: "metier", slug: "copie" } });
    const rendu = pageDApercu(lu, "2026-10-15");
    expect(rendu.motifs.join()).toContain(`trop proche de ${sansDate.slug}`);
    expect(rendu.visuel.src).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("par défaut elle se compare aux entrées du fichier, sans se compter elle-même", () => {
    expect(pageDApercu(apercu(), "2026-10-15").motifs).toEqual([]);
  });

  it("un corps invalide donne un message, jamais une exception", () => {
    expect(pageDApercu(apercu({ corps: "pas du JSON" }), "2026-10-15")).toEqual({
      illisible: "Le corps de la page n’est pas un JSON lisible",
    });
    const sansFaq = JSON.stringify({ ...sansDate, faq: null });
    expect(pageDApercu(apercu({ corps: sansFaq }), "2026-10-15").illisible).toContain("faq invalide");
    expect(pageDApercu(apercu({ article: { kind: "metier", slug: "autre" } }), "2026-10-15").illisible).toContain("différent");
    const panne = {
      get length() {
        throw "texte brut";
      },
    };
    expect(pageDApercu(apercu(), "2026-10-15", panne).illisible).toBe("texte brut");
  });
});
