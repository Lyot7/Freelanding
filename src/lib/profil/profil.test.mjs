import { describe, expect, it } from "vitest";
import { prestations, prixPlancher } from "@/content/offre";
import { IDS_RENDEZ_VOUS, lienRendezVous } from "@/content/rendez-vous";
import { workItems } from "@/content/work";
import { faqItems } from "@/content/faq";
import { absoluteUrl } from "@/lib/site-url";
import { content } from "@/lib/content";
import {
  consignesDuPrompt,
  construireProfil,
  construirePrompt,
  profilEnMarkdown,
} from "./profil";

const profil = await construireProfil();
const markdown = profilEnMarkdown(profil);
const prompt = construirePrompt(profil);

describe("profil complet de la vue Agent", () => {
  it("cite le plancher de chaque offre, ce qui est compris et ce qui fait monter le prix, sans durée", () => {
    for (const prestation of prestations) {
      expect(markdown).toContain(
        `À partir de ${prixPlancher(prestation)}\u00A0HT, prix fixé au devis.`,
      );
      for (const ligne of [...prestation.inclus, ...prestation.faitMonter]) {
        expect(markdown).toContain(ligne);
      }
    }
    // Paliers supprimés le 2026-10-05 : ni forfait, ni prix ferme par forfait.
    expect(markdown).not.toMatch(/prix ferme\.|\bforfaits?\b|\bpaliers?\b/iu);
    expect(markdown).not.toMatch(/jours ouvrés|repère/u);
    expect(markdown).not.toMatch(/\bTJM\b|taux journalier|par jour/iu);
  });

  it("ne garde rien de l'ancienne offre : ni Diagnostic, ni Audit, ni « Et aussi », ni lot payant", () => {
    expect(markdown).not.toMatch(/Le Diagnostic|Audit de code|Et aussi|lot payant|outil-metier/u);
    expect(consignesDuPrompt()).not.toMatch(/repères|30 minutes/u);
  });

  it("n'annonce plus de fourchette : ni « et plus », ni « de X à Y »", () => {
    expect(markdown).not.toMatch(/et plus\u00A0HT|et plus HT| et plus\)/u);
    expect(markdown).not.toMatch(/de \d[\d\u00A0\u202F ]*\u20AC à \d/u);
  });

  it("nomme le rendez-vous avec le libellé unique du site", () => {
    expect(markdown).toContain("Réserver un appel\u00A0: ");
    expect(markdown).not.toContain("En parler");
  });

  it("cite chaque réalisation et chaque question de la FAQ", () => {
    for (const work of workItems) expect(markdown).toContain(`### ${work.title}`);
    for (const item of faqItems) {
      if (/intelligence artificielle/iu.test(item.question)) expect(markdown).not.toContain(item.question);
      else expect(markdown).toContain(item.answer);
    }
  });

  it("donne le lien exact de chaque type de rendez-vous, et du formulaire", () => {
    for (const id of IDS_RENDEZ_VOUS) {
      expect(markdown).toContain(absoluteUrl(lienRendezVous(id)));
    }
    expect(markdown).toContain(absoluteUrl("/contact"));
  });

  it("n'écrit aucun lien relatif", () => {
    expect(markdown).not.toMatch(/(?:^|\s)\/(?:contact|services|realisations)\b/m);
  });

  it("ne propose aucun déplacement : les rendez-vous se font en visio", () => {
    expect(markdown).not.toMatch(/sur place|en personne|présentiel|chez toi\.|au téléphone ou chez toi/iu);
    expect(markdown).toMatch(/visio/iu);
  });

  it("ne fait pas de l'IA une raison de choisir Eliott", () => {
    const pourquoi = markdown.split("## Pourquoi moi")[1].split("\n## ")[0];
    expect(pourquoi).not.toMatch(/intelligence artificielle/iu);
  });

  it("ne porte aucun tiret cadratin dans le prompt", () => {
    expect(prompt).not.toContain("—");
  });

  it("place les consignes avant le profil, et le profil en entier", () => {
    expect(prompt.indexOf("conseiller")).toBeLessThan(prompt.indexOf(profil.titre));
    expect(prompt).toContain(markdown.trimEnd());
  });
});

/**
 * Variantes du contenu, injectées par `construireProfil(sources)` : chaque
 * champ facultatif du site absent, pour vérifier que le profil l'omet proprement
 * au lieu d'écrire une ligne vide, un « undefined » ou une virgule orpheline.
 */
const [siteReel, homeReel, aboutReel, worksReel, faqReel] = await Promise.all([
  content.getSiteConfig(),
  content.getHome(),
  content.getAbout(),
  content.getWorks(),
  content.getFaq(),
]);

function depot({ site = siteReel, home = homeReel, about = aboutReel, works = worksReel, faq = faqReel } = {}) {
  return {
    getSiteConfig: async () => site,
    getHome: async () => home,
    getAbout: async () => about,
    getWorks: async () => works,
    getFaq: async () => faq,
  };
}

const [premierService, ...autresServices] = homeReel.services.items;
const [premierTravail] = worksReel;

/** Tout ce qui est facultatif, retiré. */
const sourcesDepouillees = {
  depot: depot({
    site: {
      ...siteReel,
      brand: { ...siteReel.brand, given: undefined },
      contact: {
        ...siteReel.contact,
        person: undefined,
        hours: undefined,
        phone: "",
        responseTime: undefined,
      },
    },
    home: {
      ...homeReel,
      hero: { ...homeReel.hero, subtitle: undefined },
      services: {
        ...homeReel.services,
        intro: undefined,
        items: [{ ...premierService, rdvHref: undefined }, ...autresServices],
      },
      numbers: { ...homeReel.numbers, title: undefined, testimonial: undefined },
    },
    about: { ...aboutReel, parcours: undefined },
    works: [
      {
        ...premierTravail,
        client: undefined,
        scope: undefined,
        year: undefined,
        role: undefined,
        results: undefined,
        testimonial: { quote: "Livré à l’heure.", author: { name: "Camille Martin" } },
      },
    ],
    faq: [],
  }),
  // Ordre inversé : le prix plancher ne doit pas dépendre de l'ordre du fichier.
  prestations: [...prestations].reverse(),
};

/** Personne sans rôle, prénom de la marque, téléphone sans horaires. */
const sourcesSansRole = {
  depot: depot({
    site: {
      ...siteReel,
      contact: { ...siteReel.contact, person: undefined, hours: [] },
    },
    about: {
      ...aboutReel,
      parcours: {
        ...aboutReel.parcours,
        groupes: [
          {
            titre: "Expérience",
            etapes: [{ periode: "2020", structure: "Studio", role: "Développeur", lieu: undefined, nature: undefined }],
          },
        ],
      },
    },
  }),
  prestations,
};

describe("profil : contenu facultatif absent", () => {
  it("omet chaque repère, chaque section et chaque mention vide", async () => {
    const profil = await construireProfil(sourcesDepouillees);
    const texte = profilEnMarkdown(profil);

    expect(profil.titre).toBe("Bouquerel");
    expect(texte).not.toMatch(/undefined|null/u);
    expect(texte).not.toContain("- Téléphone");
    expect(texte).not.toContain("- Horaires");
    expect(texte).not.toContain("Délai de réponse");
    expect(texte).not.toContain("## Parcours");
    expect(texte).not.toContain("## Questions fréquentes");
    expect(texte).not.toContain("appeler directement");
    expect(texte).not.toContain("- Contexte");
    expect(texte).not.toContain("- Rôle");
    expect(texte).toContain("«\u00A0Livré à l’heure.\u00A0» (Camille Martin)");
    expect(profil.blocs.every((bloc) => bloc.type !== "paragraph" || bloc.text.trim() !== "")).toBe(true);
  });

  it("garde le premier service sans lien de rendez-vous, et les suivants avec", async () => {
    const texte = profilEnMarkdown(await construireProfil(sourcesDepouillees));
    const premier = texte.split(`### ${premierService.title}`)[1].split("\n### ")[0];
    expect(premier).not.toContain("Réserver un appel\u00A0:");
    expect(texte).toContain(`Réserver un appel\u00A0: ${absoluteUrl(autresServices[0].rdvHref)}`);
  });

  it("donne le même prix plancher quel que soit l'ordre des prestations", async () => {
    const inverse = profilEnMarkdown(await construireProfil(sourcesDepouillees));
    const [plancher] = [...prestations].sort((a, b) => a.plancher - b.plancher);
    expect(inverse).toContain(`mes prix commencent à ${prixPlancher(plancher)}\u00A0HT`);
    expect(markdown).toContain(`mes prix commencent à ${prixPlancher(plancher)}\u00A0HT`);
  });

  it("titre au nom de la marque sans rôle, et le téléphone sans horaires", async () => {
    const profil = await construireProfil(sourcesSansRole);
    const texte = profilEnMarkdown(profil);

    expect(profil.titre).toBe(`${siteReel.brand.given} ${siteReel.brand.name}`);
    expect(texte).toContain(`Vous pouvez aussi appeler directement au ${siteReel.contact.phone}.`);
    expect(texte).not.toContain("- Horaires");
    expect(texte).toContain("- 2020\u00A0: Développeur, Studio\n");
  });

  it("titre au seul nom d'une personne déclarée sans rôle", async () => {
    const profilSansRole = await construireProfil({
      depot: depot({
        site: { ...siteReel, contact: { ...siteReel.contact, person: { name: "Eliott Bouquerel" } } },
      }),
      prestations,
    });
    expect(profilSansRole.titre).toBe("Eliott Bouquerel");
  });

  it("garde le titre complet quand la personne a un rôle", () => {
    expect(profil.titre).toBe(
      `${siteReel.contact.person.name}, ${siteReel.contact.person.role.toLowerCase()}`,
    );
  });
});

describe("profilEnMarkdown et consignesDuPrompt", () => {
  it("numérote une liste ordonnée et puce une liste simple", () => {
    const texte = profilEnMarkdown({
      titre: "Titre",
      blocs: [
        { type: "list", style: "ordered", items: ["un", "deux"] },
        { type: "list", style: "unordered", items: ["a"] },
        { type: "heading", level: 3, text: "Sous-titre" },
        { type: "paragraph", text: "Fin." },
      ],
    });
    expect(texte).toBe("# Titre\n\n1. un\n2. deux\n\n- a\n\n### Sous-titre\n\nFin.\n");
  });

  it("numérote les étapes des consignes, que la page affiche telles quelles", () => {
    const consignes = consignesDuPrompt();
    expect(consignes).toMatch(/^1\. /mu);
    expect(consignes).toMatch(/^5\. /mu);
    expect(prompt.startsWith(consignes)).toBe(true);
  });
});

describe("profil : ligne de service sans offre chiffrée", () => {
  it("garde le prix affiché par la ligne et ne pose ni bloc d’offre ni lien de détail", async () => {
    const ligne = {
      ...premierService,
      title: "Une ligne sans page d’offre",
      price: "sur devis",
      cta: { label: "Voir", href: "/ailleurs" },
      rdvHref: undefined,
    };
    const texte = profilEnMarkdown(
      await construireProfil({
        depot: depot({
          home: { ...homeReel, services: { ...homeReel.services, items: [ligne] } },
        }),
        prestations,
      }),
    );
    expect(texte).toContain("### Une ligne sans page d’offre (sur devis)");
    expect(texte).not.toContain("Détail\u00A0:");
    expect(texte).not.toContain("prix fixé au devis");
  });
});
