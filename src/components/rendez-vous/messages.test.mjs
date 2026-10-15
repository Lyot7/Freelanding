import { describe, expect, test } from "bun:test";
import { messageEchecInconnu, messageProtectionAbsente } from "./messages.ts";

describe("messages de la réservation", () => {
  test("donnent l'adresse de repli et vouvoient le visiteur", () => {
    for (const message of [
      messageProtectionAbsente("contact@exemple.fr"),
      messageEchecInconnu("contact@exemple.fr"),
    ]) {
      expect(message).toContain("contact@exemple.fr");
      expect(message).toContain("Écrivez-moi");
      expect(message).not.toMatch(/\b(tu|ton|ta|tes|écris-moi)\b/iu);
    }
  });
});
