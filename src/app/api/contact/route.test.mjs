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
});

describe("POST /api/contact — téléphone", () => {
  test("refuse un numéro invalide en nommant le champ", async () => {
    const reponse = await POST(
      new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "x-forwarded-for": "203.0.113.200",
        },
        body: JSON.stringify({
          intention: "footer",
          nom: "Jean Dupont",
          email: "jean@example.com",
          typeProjet: "Une solution métier",
          telephone: "abc",
          debutMs: Date.now() - 10_000,
        }),
      }),
    );
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({
      message: "Ce numéro de téléphone ne semble pas valide.",
      champ: "telephone",
    });
  });
});
