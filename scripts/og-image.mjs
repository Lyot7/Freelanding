/**
 * Fabrique l'image de partage (Open Graph) à partir du hero du site.
 *
 *   bun run scripts/og-image.mjs            # depuis http://localhost:3000
 *   AUDIT_BASE=https://… bun run scripts/og-image.mjs
 *
 * POURQUOI ELLE EST REFAITE. Celle du template
 * (`framerusercontent.com/images/YgG7xJXgpwh3lukfkRrWlY0VQ.jpg`) montrait la
 * carte « LA MARQUE D'ORIGINE STUDIO », sa signature manuscrite et sa baseline anglaise.
 * C'est l'image qu'affichent LinkedIn, WhatsApp, Slack ou iMessage quand
 * quelqu'un partage le lien : le site se présentait donc sous le nom d'un autre
 * studio, à l'endroit le plus lu et le moins vérifié.
 *
 * POURQUOI UNE CAPTURE ET NON UNE COMPOSITION À PART. Le hero EST déjà la carte
 * de visite du site : même logotype, même typographie, même fond, même cadre.
 * Le recomposer à côté créerait une seconde vérité à maintenir, qui dériverait
 * au premier changement de marque. La capture, elle, suit le site sans effort.
 *
 * Capture en 2400 × 1260 (facteur 2) puis réduction à 1200 × 630, la taille
 * attendue par les réseaux : le texte fin y reste net au lieu de baver.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const SORTIE = "public/images/og.jpg";

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
await page.goto(BASE + "/", { waitUntil: "load" });
// Les entrées du hero durent 1,6 s, la plus tardive se termine vers 2 s.
await page.waitForTimeout(3000);

// Le chrome du site n'a rien à faire dans une vignette de partage : la
// navigation n'est pas cliquable, et la barre du bas affiche une heure qui
// serait fausse dès la seconde suivante.
await page.addStyleTag({
  content: `header, [data-part="floating-nav"] { visibility: hidden !important; }
    /* Badge de développement de Next.js : présent seulement en local, mais il
       se retrouverait gravé dans l'image si on génère depuis le serveur de dev. */
    nextjs-portal { display: none !important; }`,
});

const tmp = mkdtempSync(join(tmpdir(), "og-"));
const brut = join(tmp, "brut.png");
await page.screenshot({ path: brut });
await navigateur.close();

execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", brut,
  "-vf", "scale=1200:630:flags=lanczos",
  "-q:v", "3",
  SORTIE,
]);
console.log(`✅ ${SORTIE} écrit depuis ${BASE}/`);
