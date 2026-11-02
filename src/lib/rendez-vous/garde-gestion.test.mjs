import { describe, expect, it } from "bun:test";
import { siteConfig } from "@/content/site";
import { EMAIL_CONTACT_PAR_DEFAUT } from "@/lib/contact/mailer";

/**
 * LA PHRASE DE REPLI des routes de gestion : quand l'opération échoue, le
 * prospect lit toujours une adresse où écrire, même si le site n'en publie
 * pas (`siteConfig.contact.email` vide).
 */
describe("REPLI_GESTION", () => {
  it("renvoie à l’adresse publiée par le site", async () => {
    const { REPLI_GESTION } = await import("./garde-gestion.ts");
    expect(REPLI_GESTION).toBe(`Écrivez-moi directement à ${siteConfig.contact.email}.`);
  });

  it("garde une adresse quand le site n’en publie pas", async () => {
    const publiee = siteConfig.contact.email;
    siteConfig.contact.email = "";
    try {
      // Requête distincte : une instance neuve du module, lue sans adresse publiée.
      const { REPLI_GESTION } = await import("./garde-gestion.ts?sans-adresse");
      expect(REPLI_GESTION).toBe(`Écrivez-moi directement à ${EMAIL_CONTACT_PAR_DEFAUT}.`);
      expect(REPLI_GESTION).not.toContain("à .");
    } finally {
      siteConfig.contact.email = publiee;
    }
  });
});
