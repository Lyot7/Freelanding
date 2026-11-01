import { describe, expect, test } from "bun:test";
import { POST } from "./route.ts";

/** La route se charge et refuse avant tout envoi ce qui n'est pas du JSON de son origine. */
describe("POST /api/contact", () => {
  test("refuse un corps qui n'est pas du JSON", async () => {
    const reponse = await POST(
      new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: { "content-type": "text/plain", origin: "http://localhost:3000" },
        body: "x",
      }),
    );
    expect(reponse.status).toBeGreaterThanOrEqual(400);
    expect(reponse.status).toBeLessThan(500);
  });

  const envoyer = (champs) =>
    POST(
      new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({
          intention: "footer",
          nom: "Jean Dupont",
          email: "jean@example.com",
          debutMs: Date.now() - 10_000,
          ...champs,
        }),
      }),
    );

  test("accepte deux lignes sans budget ni objectif : seul le captcha reste à passer", async () => {
    const reponse = await envoyer({ message: "Je recopie les commandes chaque lundi." });
    expect(reponse.status).not.toBe(400);
    expect(reponse.status).toBeGreaterThanOrEqual(403);
  });

  test("refuse une demande vide et désigne le champ du message", async () => {
    const reponse = await envoyer({ message: "" });
    expect(reponse.status).toBe(400);
    expect((await reponse.json()).champ).toBe("message");
  });
});
