import { content } from "@/lib/content";
import { absoluteUrl } from "@/lib/site-url";
import { fourchette, prestations as offre } from "@/content/offre";

/**
 * `/llms.txt` — fiche d'identité du site à destination des assistants.
 *
 * Un moteur génératif qui doit répondre « qui fait des sites à Bayeux » n'a pas
 * le budget de lire tout un site : il prend ce qu'il trouve vite. La convention
 * llms.txt propose un fichier court en Markdown, à la racine, qui dit en clair
 * ce qu'est le site, ce qu'il vend et où trouver le reste. C'est le pendant
 * lisible du JSON-LD, qui vise les moteurs classiques.
 *
 * GÉNÉRÉ, jamais écrit à la main : un fichier statique aurait divergé au
 * premier changement de tarif, et un assistant aurait alors cité des prix qui
 * n'existent plus. Même raison que pour le sitemap.
 *
 * À LA RACINE de `src/app`, hors des groupes de routes, comme `robots.ts` :
 * c'est là que le fichier doit être servi.
 */
export const dynamic = "force-static";

function ligne(titre: string, chemin: string, note: string): string {
  return `- [${titre}](${absoluteUrl(chemin)}) : ${note}`;
}

export async function GET(): Promise<Response> {
  const [site, home, works] = await Promise.all([
    content.getSiteConfig(),
    content.getHome(),
    content.getWorks(),
  ]);

  const prestations = home.services.items.map(
    (service) =>
      `- **${service.title}**${service.price ? ` (${service.price})` : ""} : ${service.body[0]}`,
  );

  const realisations = works.map((work) =>
    ligne(work.title, `/work/${work.slug}`, work.excerpt ?? work.overview),
  );

  const questions = (home.faq ?? []).map(
    (item) => `### ${item.question}\n\n${item.answer}`,
  );

  const corps = [
    `# ${site.brand.name}${site.brand.mark}`,
    "",
    `> ${site.meta.description}`,
    "",
    `Développeur web indépendant. Zone d’intervention : ${site.contact.address}.`,
    `Contact : ${site.contact.email}. ${site.contact.responseTime}`,
    "",
    "## Prestations",
    "",
    ...prestations,
    "",
    "Les montants indiqués sont des points d’entrée. Le prix exact est fixé avant",
    "le début du projet et ne varie pas en cours de route.",
    "",
    "## Réalisations",
    "",
    ...realisations,
    "",
    "## Pages",
    "",
    ligne("Accueil", "/", "présentation de l’offre"),
    /*
     * PAGES DE PRESTATION, ajoutées avec le retrait de la grille tarifaire de
     * la page d'accueil le 2026-08-27. Ce sont elles qui portent désormais le
     * détail des prix : les omettre ici enverrait un modèle chercher des
     * montants sur une page qui n'en a plus.
     */
    ...offre.map((p) =>
      ligne(
        p.nom,
        `/services/${p.slug}`,
        `trois périmètres chiffrés, ${fourchette(p.id)} HT`,
      ),
    ),
    ligne("À propos", "/about", "parcours et façon de travailler"),
    ligne("Réalisations", "/work", "les projets en détail"),
    ligne("Contact", "/contact", "formulaire et coordonnées"),
    "",
    ...(questions.length ? ["## Questions fréquentes", "", ...questions] : []),
  ].join("\n");

  return new Response(`${corps}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
