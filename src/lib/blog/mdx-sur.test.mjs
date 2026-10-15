import { describe, expect, it } from "bun:test";
import { adresseSure, decouper, lireAttributs, lirePrix, lireTableau, mediaSur } from "./mdx-sur.ts";

const types = (blocs) => blocs.map((b) => b.type);

describe("decouper : les six blocs de la palette, lus comme des données", () => {
  it("sépare le markdown des blocs autofermants, attributs lus", () => {
    const blocs = decouper(
      [
        "Ouverture.",
        "",
        '<Figure src="/images/a.png" alt="Un schéma" caption="Légende" width={1200} priority />',
        "",
        '<Video src="https://cdn.exemple.fr/v.mp4" poster="/images/p.jpg" caption="Démo" />',
        "<Stat",
        '  value="11 334"',
        '  label="failles > recensées"',
        "/>",
        "<Steps items={[",
        '  "Un, avec \\"guillemets\\"",',
        "  'Deux',",
        "  `Trois`,",
        "]} />",
        "Fin.",
      ].join("\n"),
    );
    expect(types(blocs)).toEqual(["markdown", "Figure", "Video", "Stat", "Steps", "markdown"]);
    expect(blocs[1]).toEqual({ type: "Figure", src: "/images/a.png", alt: "Un schéma", caption: "Légende" });
    expect(decouper('<Figure src="/a.png" />')).toEqual([{ type: "Figure", src: "/a.png", alt: "", caption: undefined }]);
    expect(blocs[2]).toEqual({
      type: "Video",
      src: "https://cdn.exemple.fr/v.mp4",
      poster: "/images/p.jpg",
      caption: "Démo",
    });
    expect(blocs[3]).toEqual({ type: "Stat", value: "11 334", label: "failles > recensées" });
    expect(blocs[4]).toEqual({ type: "Steps", items: ['Un, avec "guillemets"', "Deux", "Trois"] });
  });

  it("lit les enfants d’un encadré et d’une citation comme du markdown, blocs imbriqués compris", () => {
    const [callout, quote] = decouper(
      '<Callout title="Le seuil">\nUn **paragraphe**.\n\n<Stat value="2,5 s" label="LCP" />\n</Callout>\n<Quote author="Un client">\nPhrase.\n</Quote>',
    );
    expect(callout).toMatchObject({ type: "Callout", title: "Le seuil" });
    expect(callout.type === "Callout" && types(callout.enfants)).toEqual(["markdown", "Stat"]);
    expect(quote).toMatchObject({ type: "Quote", author: "Un client" });
    expect(decouper("<Callout>\nSans titre.\n</Callout>")[0]).toMatchObject({ type: "Callout", title: undefined });
  });

  it("un bloc mal formé, incomplet ou à attribut exécutable reste du texte", () => {
    const brut = [
      "<Steps items={[maFonction()]} />",
      "<Steps items={[]} />",
      '<Stat value="1" />',
      '<Figure src="javascript:alert(1)" alt="x" />',
      '<Figure src={"data:image/png;base64,AAAA"} alt="x" />',
      '<Figure src="#ancre" alt="x" />',
      '<Video src="//ailleurs.fr/v.mp4" poster="/p.jpg" />',
      '<Video src="/v.mp4" />',
      '<Callout title="jamais fermé">',
      '<Stat value="1" label={x} />',
      '<Stat 9="1" />',
      '<Stat value=1 />',
      '<Stat value="ouvert />',
      '<Stat value={"ouvert} />',
      '<Steps items={["ouvert]} />',
      "<Figure",
      '<Figure alt="sans source" />',
    ];
    for (const ligne of brut) {
      expect(types(decouper(ligne))).toEqual(["markdown"]);
    }
  });

  it("un attribut qui n’est pas une valeur est ignoré, jamais exécuté", () => {
    expect(decouper('<Quote author="x" onClick={() => alert(1)}>t</Quote>')).toMatchObject([
      { type: "Quote", author: "x" },
    ]);
  });

  it("ignore une balise de la palette dans un bloc de code, ou au-delà de trois niveaux", () => {
    expect(types(decouper('```\n<Stat value="1" label="x" />\n```'))).toEqual(["markdown"]);
    const imbrique = "<Quote>\n<Quote>\n<Quote>\n<Quote>\nfond\n</Quote>\n</Quote>\n</Quote>\n</Quote>";
    let niveau = decouper(imbrique);
    for (let i = 0; i < 3; i++) {
      expect(niveau[0].type).toBe("Quote");
      niveau = niveau[0].type === "Quote" ? niveau[0].enfants : [];
    }
    expect(niveau[0].type).toBe("markdown");
  });

  it("lit le markdown comme MDX : tableaux GFM, pas de code indenté", () => {
    const [bloc] = decouper("| a | b |\n|---|---|\n| 1 | 2 |\n\n    en retrait");
    expect(bloc.type === "markdown" && bloc.racine.children.map((n) => n.type)).toEqual(["table", "paragraph"]);
  });

  it("un texte vide ne donne rien, une fin de ligne Windows ne gêne pas", () => {
    expect(decouper("  \n")).toEqual([]);
    expect(types(decouper('A\r\n<Stat value="1" label="x" />\r\nB'))).toEqual(["markdown", "Stat", "markdown"]);
  });
});

describe("lireAttributs", () => {
  it("lit chaînes, nombres, booléens et expressions littérales ; écarte le reste", () => {
    expect(
      lireAttributs(` a="1" b='2' c={3} d={-1.5} e={true} f={false} g={'x'} h={"y\\"z"} i={"\\u"} j={\`k\`} drapeau`),
    ).toEqual({ a: "1", b: "2", c: 3, d: -1.5, e: true, f: false, g: "x", h: 'y"z', i: "\\u", j: "k", drapeau: true });
    expect(lireAttributs('x={appel()} y={"a" + "b"}')).toEqual({});
    expect(lireAttributs("x=")).toBeNull();
    expect(lireAttributs('x="ouvert')).toBeNull();
    expect(lireAttributs("x={ouvert")).toBeNull();
  });

  it("un tableau ne porte que des chaînes fermées", () => {
    expect(lireTableau("[\"a\", 'b']")).toEqual(["a", "b"]);
    expect(lireTableau('["a]')).toBeNull();
    expect(lireTableau("[1]")).toBeNull();
  });
});

describe("adresses", () => {
  it("garde le web, le courriel, le téléphone, les ancres et les chemins du site", () => {
    expect(adresseSure("https://a.fr")).toBe("https://a.fr");
    expect(adresseSure("mailto:a@b.fr")).toBe("mailto:a@b.fr");
    expect(adresseSure("tel:+33600000000")).toBe("tel:+33600000000");
    expect(adresseSure("#section")).toBe("#section");
    expect(adresseSure("/blog/x")).toBe("/blog/x");
    expect(adresseSure("javascript:alert(1)")).toBeNull();
    expect(adresseSure("//ailleurs.fr")).toBeNull();
    expect(adresseSure("data:text/html,x")).toBeNull();
  });

  it("un média vient du site ou du web, jamais d’une ancre ni d’un courriel", () => {
    expect(mediaSur("/images/a.png")).toBe("/images/a.png");
    expect(mediaSur("https://a.fr/i.png")).toBe("https://a.fr/i.png");
    expect(mediaSur("#x")).toBeNull();
    expect(mediaSur("mailto:a@b.fr")).toBeNull();
    expect(mediaSur("javascript:x")).toBeNull();
  });
});

describe("lirePrix", () => {
  it("reconnaît la balise de prix, et rien qui lui ressemble", () => {
    expect(lirePrix('<Prix offre="vitrine" />')).toEqual({ offre: "vitrine", suivi: false });
    expect(lirePrix('<Prix offre="logiciel" suivi />')).toEqual({ offre: "logiciel", suivi: true });
    expect(lirePrix('<Prixe offre="x" />')).toBeNull();
    expect(lirePrix('<Prix offre="x">')).toBeNull();
    expect(lirePrix("<Prix />")).toBeNull();
    expect(lirePrix("<Prix offre= />")).toBeNull();
  });
});
