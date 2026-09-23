import { content } from "@/lib/content";
import type { ContentBlock, Stat } from "@/lib/content/types";
import { absoluteUrl } from "@/lib/site-url";
import {
  delaiPack,
  packEntree,
  prestations,
  prixPack,
  type Prestation,
} from "@/content/offre";
import { lienRendezVous, rendezVousContent } from "@/content/rendez-vous";
import { CHEMIN_VUE_AGENT, vueAgentContent } from "@/content/vue-agent";

/**
 * Profil complet d'Eliott, en un seul texte, pour la vue Agent (`/agent`), sa
 * version brute (`/llms-full.txt`) et le prompt que le visiteur copie.
 *
 * ASSEMBLÉ, JAMAIS ÉCRIT. Chaque fait vient du fichier de contenu qui l'affiche
 * déjà sur le site : les prix de `offre.ts` (donc du `TJM`), les rendez-vous de
 * `rendez-vous.ts`, les projets de `work.ts`, la FAQ de `faq.ts`. Changer un
 * tarif ou ajouter une réalisation met à jour les trois sorties sans qu'on y
 * pense. `vue-agent.ts` ne porte que les intertitres et les liaisons.
 *
 * LES LIENS SONT ABSOLUS. Le texte est fait pour être copié hors du site :
 * un chemin relatif collé dans un assistant ne mène nulle part.
 *
 * FORMAT : les blocs riches du site (`ContentBlock`), que `RichText` sait déjà
 * rendre et `sommaireDesBlocs` sait déjà résumer. La version Markdown en est
 * une simple sérialisation, ce qui garantit que la page et le texte brut
 * disent exactement la même chose.
 */

export interface Profil {
  readonly titre: string;
  readonly blocs: readonly ContentBlock[];
}

const T = vueAgentContent.profil;

/**
 * Deux-points précédé de l'insécable, comme partout dans le contenu du site
 * (`scripts/typo-fr.mjs`) : sans elle, « : » peut partir seul à la ligne.
 */
const DP = "\u00A0:";

const p = (text: string): ContentBlock => ({ type: "paragraph", text });
const h2 = (text: string): ContentBlock => ({ type: "heading", level: 2, text });
const h3 = (text: string): ContentBlock => ({ type: "heading", level: 3, text });
const liste = (items: readonly string[]): ContentBlock => ({
  type: "list",
  style: "unordered",
  items,
});

/** Minuscule initiale, pour ce qui suit un deux-points. */
function minuscule(texte: string): string {
  return texte.charAt(0).toLocaleLowerCase("fr") + texte.slice(1);
}

/** Point final ajouté si la phrase n'en porte pas déjà un. */
function phrase(texte: string): string {
  return /[.!?…»]$/.test(texte.trim()) ? texte.trim() : `${texte.trim()}.`;
}

function blocsPrestation(prestation: Prestation): ContentBlock[] {
  const blocs: ContentBlock[] = [];
  prestation.packs.forEach((pack, index) => {
    blocs.push(
      p(
        [
          T.offres.pack(pack.nom, prixPack(pack), delaiPack(pack)),
          pack.promesse,
          `${T.offres.pourQui}${DP} ${minuscule(phrase(pack.pourQui))}`,
        ].join(" "),
      ),
      p(`${index === 0 ? T.offres.contient : T.offres.ajoute}${DP}`),
      liste(pack.ajoute),
    );
  });
  blocs.push(p(`${T.offres.horsPack}${DP} ${minuscule(prestation.horsPack)}`));
  return blocs;
}

/**
 * Chiffres de méthode de la page À propos, relus comme des phrases :
 * « 30 % à la signature… », « 1 interlocuteur : … ». Le délai de réponse est
 * écarté ici parce qu'il est déjà donné en toutes lettres juste après.
 */
function phrasesDeMethode(stats: readonly Stat[]): string[] {
  return stats
    .filter((stat) => !/h$/i.test(stat.value.trim()))
    .map((stat) => `${stat.value} ${minuscule(stat.label)}`);
}

export async function construireProfil(): Promise<Profil> {
  const [site, home, about, works, faq] = await Promise.all([
    content.getSiteConfig(),
    content.getHome(),
    content.getAbout(),
    content.getWorks(),
    content.getFaq(),
  ]);
  const { contact } = site;
  const horaires = (contact.hours ?? []).join(", ");
  const personne = contact.person ?? {
    name: `${site.brand.given ?? ""} ${site.brand.name}`.trim(),
    role: "",
  };

  const blocs: ContentBlock[] = [];

  /* En-tête : de quoi il s'agit, et les repères qu'un assistant cherche. */
  blocs.push(
    p(site.meta.description),
    liste([
      `${T.reperes.zone}${DP} ${contact.address}`,
      `${T.reperes.email}${DP} ${contact.email}`,
      ...(contact.phone ? [`${T.reperes.telephone}${DP} ${contact.phone}`] : []),
      ...(horaires ? [`${T.reperes.horaires}${DP} ${horaires}`] : []),
      `${T.reperes.site}${DP} ${absoluteUrl("/")}`,
    ]),
    p(T.source(absoluteUrl(CHEMIN_VUE_AGENT))),
  );

  /* Ce que je fais. */
  blocs.push(
    h2(T.sections.quoi),
    p(phrase(home.hero.title)),
    ...(home.hero.subtitle ? [p(home.hero.subtitle)] : []),
    p(phrase(home.about.title)),
    ...home.about.body.map(p),
  );

  /* Pour qui. */
  blocs.push(h2(T.sections.pourQui), ...T.pourQui.map(p));

  /* Offres : l'ordre et les intitulés de l'accordéon de l'accueil, le détail
     des périmètres tiré de `offre.ts`. */
  blocs.push(h2(T.sections.offres), p(home.services.intro ?? ""), p(T.offres.prix));
  for (const service of home.services.items) {
    const prestation = prestations.find(
      (candidate) => service.cta?.href === `/services/${candidate.slug}`,
    );
    blocs.push(
      h3(service.price ? `${service.title} (${service.price}\u00A0HT)` : service.title),
      ...service.body.map(p),
      ...(prestation ? blocsPrestation(prestation) : []),
      ...(prestation
        ? [p(`${T.offres.detail}${DP} ${absoluteUrl(`/services/${prestation.slug}`)}`)]
        : []),
      ...(service.rdvHref
        ? [p(`${T.offres.rendezVous}${DP} ${absoluteUrl(service.rdvHref)}`)]
        : []),
    );
  }
  const horsCatalogue = home.services.horsCatalogue;
  if (horsCatalogue) {
    blocs.push(
      h3(horsCatalogue.titre),
      p(horsCatalogue.intro),
      liste(horsCatalogue.items.map((item) => `${item.nom}${DP} ${minuscule(item.corps)}`)),
      ...(horsCatalogue.cta
        ? [p(`${T.offres.rendezVous}${DP} ${absoluteUrl(horsCatalogue.cta.href)}`)]
        : []),
    );
  }

  /* Méthode. */
  blocs.push(
    h2(T.sections.methode),
    ...(home.numbers.title ? [p(phrase(home.numbers.title))] : []),
    liste([
      ...phrasesDeMethode(about.stats),
      ...(contact.responseTime
        ? [`${T.methode.reponse}${DP} ${minuscule(contact.responseTime)}`]
        : []),
    ]),
    ...(home.numbers.testimonial ? [p(`«\u00A0${home.numbers.testimonial.quote}\u00A0»`)] : []),
  );

  /* Réalisations. */
  blocs.push(h2(T.sections.realisations));
  for (const work of works) {
    const contexte = [work.client, work.scope, work.year].filter(Boolean).join(", ");
    blocs.push(
      h3(work.title),
      liste([
        ...(contexte ? [`${T.realisations.contexte}${DP} ${contexte}`] : []),
        ...(work.role ? [`${T.realisations.role}${DP} ${minuscule(work.role)}`] : []),
        ...(work.results ?? []).map(
          (metric) => `${T.realisations.resultat}${DP} ${metric.value} ${metric.label}`,
        ),
      ]),
      p(work.overview),
      ...work.outcome.map(p),
      ...(work.testimonial
        ? [p(`«\u00A0${work.testimonial.quote}\u00A0» (${work.testimonial.author.name})`)]
        : []),
      liste([
        `${T.realisations.voir}${DP} ${absoluteUrl(`/realisations/${work.slug}`)}`,
        `${T.realisations.enLigne}${DP} ${work.liveUrl}`,
      ]),
    );
  }

  /* Parcours. */
  if (about.parcours) {
    blocs.push(h2(T.sections.parcours));
    for (const groupe of about.parcours.groupes) {
      blocs.push(
        h3(groupe.titre),
        liste(
          groupe.etapes.map((etape) => {
            const ou = etape.lieu ? ` (${etape.lieu})` : "";
            const nature = etape.nature ? `, ${minuscule(etape.nature)}` : "";
            return `${etape.periode}${DP} ${etape.role}, ${etape.structure}${ou}${nature}`;
          }),
        ),
      );
    }
  }

  /* Pourquoi moi. Deux paragraphes de la page À propos sont écartés :
     - celui déjà repris par une réponse de la FAQ, qui suit plus bas (le
       texte copié le porterait deux fois) ;
     - celui sur l'intelligence artificielle. Sous « Pourquoi moi », il se lit
       comme un argument de vente, ce que le site s'interdit ; la question
       reste posée et répondue dans la FAQ. */
  const dejaDansLaFaq = (paragraphe: string) =>
    faq.some((item) => item.answer.includes(paragraphe.slice(0, 60)));
  blocs.push(
    h2(T.sections.pourquoi),
    ...about.body
      .filter((paragraphe) => !dejaDansLaFaq(paragraphe))
      .filter((paragraphe) => !/intelligence artificielle/iu.test(paragraphe))
      .map(p),
    liste(home.whyUs.stats.map((stat) => phrase(stat.label))),
  );

  /* Limites, pour que l'assistant du visiteur puisse trancher honnêtement. */
  const plancher = prestations
    .map((prestation) => packEntree(prestation.id))
    .reduce((a, b) => (a.jours <= b.jours ? a : b));
  blocs.push(
    h2(T.sections.limites),
    liste([T.limites.prixPlancher(prixPack(plancher)), ...T.limites.items]),
  );

  /* FAQ, réponses complètes. */
  if (faq.length) {
    blocs.push(h2(T.sections.faq));
    for (const item of faq) blocs.push(h3(item.question), p(item.answer));
  }

  /* Contact : chaque canal avec son lien exact. */
  const formulaire = absoluteUrl("/contact");
  blocs.push(
    h2(T.sections.contact),
    p(`${T.contact.visio} ${contact.responseTime ?? ""}`.trim()),
    h3(T.contact.rendezVous),
    liste(
      rendezVousContent.types.map(
        (type) =>
          `${type.nom} (${type.duree})${DP} ${type.description} ${T.contact.rendezVousLien}${DP} ${absoluteUrl(lienRendezVous(type.id))}`,
      ),
    ),
    h3(T.contact.rappel),
    p(`${T.contact.rappelTexte} ${formulaire}`),
    ...(contact.phone ? [p(T.contact.appel(contact.phone, horaires))] : []),
    h3(T.contact.formulaire),
    p(`${T.contact.formulaireTexte} ${formulaire}`),
    h3(T.contact.email),
    p(contact.email),
    h3(T.contact.ailleurs),
    liste(
      site.socials
        .filter((social) => T.contact.reseaux.includes(social.label))
        .map((social) => `${social.label}${DP} ${social.href}`),
    ),
  );

  return {
    titre: T.titre(personne.name, personne.role ?? ""),
    blocs: blocs.filter((bloc) => bloc.type !== "paragraph" || bloc.text.trim() !== ""),
  };
}

/** Le profil en Markdown : ce que sert `/llms-full.txt`. */
export function profilEnMarkdown(profil: Profil): string {
  const lignes: string[] = [`# ${profil.titre}`];
  for (const bloc of profil.blocs) {
    if (bloc.type === "heading") {
      lignes.push(`${"#".repeat(bloc.level)} ${bloc.text}`);
    } else if (bloc.type === "list") {
      lignes.push(
        bloc.items
          .map((item, index) => (bloc.style === "ordered" ? `${index + 1}. ${item}` : `- ${item}`))
          .join("\n"),
      );
    } else {
      lignes.push(bloc.text);
    }
  }
  return `${lignes.join("\n\n")}\n`;
}

/** Les consignes données à l'assistant, seules : ce que la page affiche. */
export function consignesDuPrompt(): string {
  const { consignes, etapes, langue } = vueAgentContent.prompt;
  return [
    ...consignes,
    etapes.map((etape, index) => `${index + 1}. ${etape}`).join("\n"),
    langue,
  ].join("\n\n");
}

/** Le prompt complet que le visiteur colle dans son assistant. */
export function construirePrompt(profil: Profil): string {
  const { debutProfil, finProfil } = vueAgentContent.prompt;
  return [
    consignesDuPrompt(),
    `--- ${debutProfil} ---`,
    profilEnMarkdown(profil).trimEnd(),
    `--- ${finProfil} ---`,
  ].join("\n\n");
}
