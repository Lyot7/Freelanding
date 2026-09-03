import { describe, expect, test } from "bun:test";
import { legalDocuments } from "./legal.ts";

/**
 * Ces tests ont changé de nature DEUX FOIS.
 *
 * 1. Ils vérifiaient la FIDÉLITÉ au texte anglais du template, rédigé pour une
 *    société américaine. Les documents n'ont pas été traduits mais RÉÉCRITS
 *    pour une entreprise individuelle française : ces assertions n'avaient plus
 *    rien à comparer.
 * 2. Ils exigeaient ensuite que les identifiants légaux restent ABSENTS, sous
 *    la forme d'espaces réservées « [À COMPLÉTER : … ] », et refusaient toute
 *    suite de neuf chiffres ou plus. C'était le bon garde-fou tant qu'Eliott
 *    n'avait pas communiqué son SIREN : un numéro plausible inventé « pour
 *    faire vrai » serait passé inaperçu à la relecture.
 *
 * LE GARDE-FOU EST INVERSÉ DEPUIS LE 2026-08-28, il n'est pas retiré. Les
 * documents sont complets : ce qu'il faut empêcher maintenant, c'est la
 * DÉRIVE d'un identifiant publié. Un SIRET faux ne casse rien, ne se voit pas
 * à l'écran, et expose à l'amende de l'article 1-2 de la LCEN. Les valeurs sont
 * donc figées ici, et toute espace réservée oubliée fait échouer la suite.
 */

const SLUGS = [
  "mentions-legales",
  "politique-de-confidentialite",
  "conditions-generales-de-vente",
];

/** Marqueur des valeurs qu'Eliott devait renseigner avant la mise en ligne. */
const PLACEHOLDER = "[À COMPLÉTER";

/**
 * Identifiants publiés, tels qu'ils figurent sur l'extrait Sirene d'Eliott et
 * sur les sources officielles de l'hébergeur (registre des sociétés de Chypre,
 * page « informations registraire » de Hostinger). Aucun n'est déduit.
 */
const IDENTIFIANTS = {
  siren: "105762231",
  siret: "10576223100014",
  hebergeur: "HE 301365",
  adresse: "52 chemin de la Ferme du Jardin, 14400 Subles",
};

/**
 * Prestataires de stockage tiers, art. 1-1 I 5° de la LCEN (apport de la loi
 * SREN du 21 mai 2024). Le texte exige le NOM et l'ADRESSE de chaque personne
 * qui stocke des données traitées dans le cadre de l'édition du service. Ces
 * valeurs sont relevées une à une sur les documents légaux des prestataires
 * (DPA, politique de confidentialité), le 2026-08-29. Elles sont figées ici
 * pour la même raison que les identifiants ci-dessus : une adresse fausse ne
 * casse rien à l'écran et expose à l'amende de l'article 1-2.
 *
 * PIÈGE : Resend n'est pas une société. Le service est exploité par PLUS FIVE
 * FIVE, INC. « Resend, Inc. » n'existe pas et ne doit jamais réapparaître.
 */
const STOCKAGE = [
  "PostHog, Inc., 2261 Market St. #4008, San Francisco, CA 94114",
  "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande",
  "Cal.com, Inc., 2261 Market Street #4382, San Francisco, CA 94114",
  "Plus Five Five, Inc.",
  "2261 Market Street #5039, San Francisco, CA 94114",
  "Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107",
];

/** Aplatit le corps d'un document en texte brut, listes comprises. */
function bodyText(documents) {
  return documents
    .flatMap((document) =>
      document.body.flatMap((block) =>
        block.type === "list" ? [...block.items] : [block.text],
      ),
    )
    .join("\n");
}

describe("documents légaux", () => {
  test("les trois documents obligatoires sont publiés, aux slugs français", () => {
    // Les mentions légales sont une obligation pour tout site professionnel
    // français (LCEN, art. 1-1 depuis la loi SREN du 21 mai 2024) ; le template
    // américain n'en avait aucune. Les deux autres slugs étaient anglais
    // jusqu'au 2026-08-28 : leurs anciennes adresses sont redirigées en 301 par
    // `next.config.ts`, pas ressuscitées ici.
    expect(legalDocuments.map((document) => document.slug).sort()).toEqual(
      [...SLUGS].sort(),
    );
  });

  test("chaque document a un corps structuré et une date de révision", () => {
    for (const document of legalDocuments) {
      expect(document.body.length).toBeGreaterThan(5);
      expect(document.title.length).toBeGreaterThan(0);
      // Format ISO : c'est lui qui est affiché et trié.
      expect(document.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("plus aucune valeur ne reste à compléter", () => {
    // L'inverse exact de l'assertion d'origine. Une espace réservée oubliée
    // dans un document légal publié est pire qu'une information absente : elle
    // annonce au lecteur que personne n'a relu.
    expect(bodyText(legalDocuments)).not.toContain(PLACEHOLDER);
  });

  test("les identifiants publiés sont exactement ceux qui ont une source", () => {
    // Ce test remplace l'interdiction des suites de neuf chiffres, devenue
    // impossible à tenir le jour où un SIREN réel a dû être publié. Il fige les
    // valeurs plutôt que de les interdire : une faute de frappe dans le SIRET
    // le fait tomber, et l'invention d'un identifiant nouveau aussi.
    const mentions = legalDocuments.find(
      ({ slug }) => slug === "mentions-legales",
    );
    const texte = bodyText([mentions]);

    for (const valeur of Object.values(IDENTIFIANTS)) {
      expect(texte).toContain(valeur);
    }

    // Aucune AUTRE suite de neuf chiffres ou plus dans l'ensemble des trois
    // documents : la garde d'origine survit partout où elle reste applicable.
    const suites = bodyText(legalDocuments).match(/\d{9,}/g) ?? [];
    expect([...new Set(suites)].sort()).toEqual(
      [IDENTIFIANTS.siren, IDENTIFIANTS.siret].sort(),
    );
  });

  test("les mentions obligatoires de la LCEN et du code de commerce sont là", () => {
    const texte = bodyText(legalDocuments);

    // Art. 1-1 LCEN, éditeur personne physique : nom, domicile, téléphone.
    expect(texte).toContain("Eliott Bouquerel");
    // Les numéros portent des espaces INSÉCABLES après `audit:typo` : on les
    // compare sur les chiffres, jamais sur la nature de l'espace.
    expect(texte.replace(/\s+/g, " ")).toContain("06 32 21 37 11");
    // Art. 1-1 LCEN, hébergeur : dénomination, adresse, téléphone.
    expect(texte).toContain("Hostinger International Ltd");
    expect(texte).toContain("Larnaca");
    expect(texte.replace(/\s+/g, " ")).toContain("+370 645 03378");
    // Art. R. 526-27 C. com. : la mention « EI » accompagne le nom.
    expect(texte).toContain("Eliott Bouquerel EI");
    // Art. 293 B CGI : obligatoire tant que la franchise en base s'applique.
    expect(texte).toContain("293 B");
    // Art. L. 441-10 et D. 441-5 C. com. : pénalités et indemnité forfaitaire.
    expect(texte).toContain("L. 441-10");
    expect(texte).toMatch(/40\s€/);
    // Art. 13.2.d RGPD : le droit de réclamation auprès de la CNIL, qui
    // manquait purement et simplement à la version précédente.
    expect(texte).toContain("CNIL");
    expect(texte).toContain("réclamation");
  });

  test("les prestataires de stockage tiers sont nommés et adressés", () => {
    // Art. 1-1 I 5° LCEN. C'est l'apport de la loi SREN le plus souvent manqué :
    // avant l'audit du 2026-08-29, seul l'hébergeur était identifié, alors que
    // cinq autres prestataires stockent des données traitées dans le cadre de
    // l'édition du service. Le nom SEUL ne suffit pas, le texte exige l'adresse.
    const mentions = legalDocuments.find(
      ({ slug }) => slug === "mentions-legales",
    );
    const texte = bodyText([mentions]).replace(/\s+/g, " ");

    for (const prestataire of STOCKAGE) {
      expect(texte).toContain(prestataire);
    }
    // La raison sociale inventée par l'audit, à ne jamais republier.
    expect(texte).not.toContain("Resend, Inc.");
  });

  test("les prix affichés sont annoncés hors taxes, art. 19 de la LCEN", () => {
    // Art. 19 LCEN, version en vigueur depuis le 1er juillet 2016 : le prix doit
    // être indiqué « de manière claire et non ambiguë », en précisant si les
    // taxes sont incluses. Contrôle DGCCRF. Le site publiant des montants, la
    // mention est due, et elle doit rester cohérente avec la franchise en base.
    const mentions = legalDocuments.find(
      ({ slug }) => slug === "mentions-legales",
    );
    const texte = bodyText([mentions]);

    expect(texte).toContain("hors taxes");
    expect(texte).toContain("293 B");
    // Le 4° de l'art. 19 ne vaut que « le cas échéant » : en franchise en base,
    // aucun numéro de TVA n'est attribué, donc aucun ne doit être publié.
    expect(texte).not.toMatch(/FR\s?\d{2}\s?\d{9}/);
  });

  test("les CGV portent un barème de prix, sa méthode et l'escompte", () => {
    // Art. L. 441-1 I C. com. : les CGV comprennent « les éléments de
    // détermination du prix tels que le barème des prix unitaires ». Le III
    // ouvre la voie de la méthode de calcul pour les services non chiffrables a
    // priori. L'absence de ces deux mentions, escompte compris, expose à une
    // amende administrative de 75 000 € pour une personne physique.
    const cgv = legalDocuments.find(
      ({ slug }) => slug === "conditions-generales-de-vente",
    );
    const texte = bodyText([cgv]);

    expect(texte).toContain("barème");
    expect(texte).toContain("taux journalier");
    expect(texte).toContain("support durable");
    expect(texte).toContain("escompte");
  });

  test("les délais sont indicatifs sans priver le client de la résolution", () => {
    // La rédaction d'origine excluait « ni à résiliation » : une clause qui
    // interdit de mettre fin au contrat quel que soit le retard prive de sa
    // substance l'obligation de livrer, et tombe sous l'art. 1170 C. civ.
    // La référence à l'art. 1305, un temps envisagée, était pire : elle revient
    // à dire que l'obligation de livrer n'est jamais exigible. La distinction
    // délai indicatif / délai de rigueur ne se rattache à aucun article, et
    // c'est ce qui la rend solide : elle ne se laisse pas retourner.
    const cgv = legalDocuments.find(
      ({ slug }) => slug === "conditions-generales-de-vente",
    );
    const texte = bodyText([cgv]);

    expect(texte).toContain("délais indicatifs et non délais de rigueur");
    expect(texte).toContain("1217");
    expect(texte).toContain("résolution du contrat");
    expect(texte).not.toContain("1305");
    expect(texte).not.toContain("ni à résiliation");
  });

  test("la politique couvre transferts, décision automatisée et journaux", () => {
    // Trois manquements distincts du RGPD, relevés le 2026-08-29 :
    //   - art. 13.1.f : citer les clauses contractuelles types ne suffit pas,
    //     il faut indiquer LE MOYEN d'en obtenir copie ;
    //   - art. 13.2.f : l'information sur la décision automatisée est due même
    //     quand la réponse est négative ;
    //   - art. 13.1.c et 13.2.a : la section 2.2 annonçait les journaux du
    //     serveur, aucune finalité ne leur donnait de base légale ni de durée.
    const politique = legalDocuments.find(
      ({ slug }) => slug === "politique-de-confidentialite",
    );
    const texte = bodyText([politique]);

    expect(texte).toContain("Une copie des clauses contractuelles types");
    expect(texte).toContain("automatisée");
    expect(texte).toContain("profilage");
    expect(texte).toContain("sécurité du serveur");
    expect(texte).toContain("code de réponse");
  });

  test("aucune donnée pseudonyme n'est présentée comme anonyme", () => {
    // Considérant 26 du RGPD : « anonyme » ne vaut que si la personne n'est plus
    // identifiable. Avec autocapture, identifiant persistant et adresse IP
    // collectée, les données de mesure et de rejeu de session sont PSEUDONYMES.
    // La bannière a été corrigée dans `consent.ts` ; la politique disait encore
    // « rejouer une navigation anonyme ».
    expect(bodyText(legalDocuments)).not.toContain("anonym");
  });

  test("aucun médiateur de la consommation n'est inventé", () => {
    // L'activité est B2B pure : l'article L. 612-1 du code de la consommation
    // ne s'applique pas, et la version précédente portait une section
    // « Médiation de la consommation » vide de tout nom. Une obligation qu'on
    // n'a pas ne se comble pas par une rubrique creuse.
    expect(bodyText(legalDocuments)).not.toContain("médiateur");
  });
});
