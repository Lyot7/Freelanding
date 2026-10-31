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
