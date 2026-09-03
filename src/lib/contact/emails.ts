/**
 * Gabarits des deux e-mails déclenchés par une soumission.
 *
 * 1. la NOTIFICATION à Eliott, avec `reply-to` positionné sur l’adresse du
 *    prospect : répondre est un clic, sans copier-coller d’adresse ;
 * 2. l’ACCUSÉ DE RÉCEPTION au prospect, qui reprend ce qu’il a écrit et annonce
 *    le délai. C’est lui qui règle le problème d’origine : jusqu’ici le
 *    prospect n’avait aucun signal, ni sur le site ni dans sa boîte.
 *
 * TOUTE valeur soumise passe par `echapperHtml` / `echapperHtmlMultiligne`.
 * Aucune exception, y compris pour les champs « sûrs » comme le type de projet :
 * la liste blanche le contraint aujourd’hui, une évolution du contenu pourrait
 * l’élargir demain, et l’échappement ne coûte rien.
 *
 * Le HTML est délibérément pauvre (styles en ligne, pas de tableau de mise en
 * page, pas d’image) : c’est ce qui traverse le mieux les clients de messagerie
 * et ce qui passe le mieux les filtres anti-spam.
 */
import type { SoumissionValide } from "./validation";
import {
  echapperHtml,
  echapperHtmlMultiligne,
  nettoyerEnTete,
} from "./sanitize";

/**
 * Promesse de délai, reprise MOT POUR MOT de ce que le site affiche
 * (`src/content/site.ts`, `src/content/stats.ts`, `src/content/about.ts` et
 * l'intro de `/contact`). Écrire ici un autre délai créerait une promesse
 * concurrente, et une promesse qui se contredit ne vaut rien quand elle est
 * l'argument de vente principal.
 *
 * « SOUVENT SOUS DEUX HEURES » A ÉTÉ RETIRÉ le 2026-08-31. Les deux heures
 * étaient écrites à trois endroits du site et Eliott les a supprimées : son
 * engagement est une réponse sous 24 heures ouvrées, point. Cet accusé de
 * réception est le seul texte que le prospect garde par écrit dans sa boîte :
 * c'est exactement la phrase qu'il ressortirait.
 */
export const PROMESSE_DELAI =
  "Je te réponds sous 24 heures ouvrées.";

export interface MessageCompose {
  readonly sujet: string;
  readonly html: string;
  readonly texte: string;
}

const STYLE_CORPS =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0b0b0b;";
const STYLE_ETIQUETTE =
  "font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6b6b6b;margin:0 0 2px;";
const STYLE_VALEUR = "margin:0 0 16px;";

function bloc(etiquette: string, valeurHtml: string): string {
  return `<p style="${STYLE_ETIQUETTE}">${echapperHtml(etiquette)}</p><p style="${STYLE_VALEUR}">${valeurHtml}</p>`;
}

function libelleIntention(intention: SoumissionValide["intention"]): string {
  switch (intention) {
    case "projet":
      return "formulaire de contact";
    case "footer":
      return "formulaire du pied de page";
    case "newsletter":
      return "inscription aux notes du blog";
  }
}

/** E-mail reçu par Eliott. */
export function composerNotification(
  soumission: SoumissionValide,
): MessageCompose {
  const origine = libelleIntention(soumission.intention);
  const qui = soumission.nom ?? soumission.email;
  const sujet = nettoyerEnTete(
    soumission.intention === "newsletter"
      ? `Inscription aux notes — ${soumission.email}`
      : `Nouvelle demande — ${qui}`,
  );

  const morceaux: string[] = [
    `<p style="${STYLE_ETIQUETTE}">Reçu depuis le ${echapperHtml(origine)}</p>`,
  ];
  if (soumission.nom) morceaux.push(bloc("Nom", echapperHtml(soumission.nom)));
  morceaux.push(
    bloc(
      "E-mail",
      `<a href="mailto:${echapperHtml(soumission.email)}" style="color:#0b0b0b;">${echapperHtml(soumission.email)}</a>`,
    ),
  );
  if (soumission.typeProjet) {
    morceaux.push(bloc("Type de projet", echapperHtml(soumission.typeProjet)));
  }
  if (soumission.message) {
    morceaux.push(bloc("Message", echapperHtmlMultiligne(soumission.message)));
  }

  const html = `<div style="${STYLE_CORPS}max-width:560px;">${morceaux.join("")}<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" /><p style="font-size:12px;color:#6b6b6b;margin:0;">Répondre à ce message écrit directement au prospect.</p></div>`;

  const lignesTexte = [`Reçu depuis le ${origine}`, ""];
  if (soumission.nom) lignesTexte.push(`Nom : ${soumission.nom}`);
  lignesTexte.push(`E-mail : ${soumission.email}`);
  if (soumission.typeProjet) {
    lignesTexte.push(`Type de projet : ${soumission.typeProjet}`);
  }
  if (soumission.message) {
    lignesTexte.push("", "Message :", soumission.message);
  }

  return { sujet, html, texte: lignesTexte.join("\n") };
}

/** E-mail reçu par le prospect. */
export function composerAccuseReception(
  soumission: SoumissionValide,
  contactEmail: string,
): MessageCompose {
  if (soumission.intention === "newsletter") {
    const html = `<div style="${STYLE_CORPS}max-width:560px;"><p style="margin:0 0 16px;">Bonjour,</p><p style="margin:0 0 16px;">Ton adresse est bien enregistrée pour recevoir mes notes sur les sites, les outils métier et ce qui fait décider un client.</p><p style="margin:0 0 16px;">Ces notes partent à la main, pas plus d’une fois par mois. Pour ne plus les recevoir, il suffit de répondre « stop » à ce message.</p><p style="margin:0 0 4px;">Eliott Bouquerel</p><p style="margin:0;"><a href="mailto:${echapperHtml(contactEmail)}" style="color:#0b0b0b;">${echapperHtml(contactEmail)}</a></p></div>`;
    return {
      sujet: "Ton adresse est bien enregistrée",
      html,
      texte: [
        "Bonjour,",
        "",
        "Ton adresse est bien enregistrée pour recevoir mes notes sur les sites, les outils métier et ce qui fait décider un client.",
        "",
        "Ces notes partent à la main, pas plus d’une fois par mois. Pour ne plus les recevoir, répondez « stop » à ce message.",
        "",
        "Eliott Bouquerel",
        contactEmail,
      ].join("\n"),
    };
  }

  const prenom = soumission.nom ? echapperHtml(soumission.nom) : "";
  const salutation = prenom ? `Bonjour ${prenom},` : "Bonjour,";

  const rappel: string[] = [];
  if (soumission.typeProjet) {
    rappel.push(bloc("Ce que tu cherches", echapperHtml(soumission.typeProjet)));
  }
  if (soumission.message) {
    rappel.push(bloc("Ton message", echapperHtmlMultiligne(soumission.message)));
  }

  const html = `<div style="${STYLE_CORPS}max-width:560px;"><p style="margin:0 0 16px;">${salutation}</p><p style="margin:0 0 16px;">J’ai bien reçu ta demande. ${echapperHtml(PROMESSE_DELAI)}</p><p style="margin:0 0 24px;">Je lis ton message moi-même : la réponse sera honnête, même si c’est pour te dire que ce projet n’est pas pour moi.</p>${rappel.length > 0 ? `<hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px;" />${rappel.join("")}` : ""}<p style="margin:0 0 4px;">Eliott Bouquerel</p><p style="margin:0;"><a href="mailto:${echapperHtml(contactEmail)}" style="color:#0b0b0b;">${echapperHtml(contactEmail)}</a></p></div>`;

  const texte = [
    soumission.nom ? `Bonjour ${soumission.nom},` : "Bonjour,",
    "",
    `J’ai bien reçu ta demande. ${PROMESSE_DELAI}`,
    "",
    "Je lis ton message moi-même : la réponse sera honnête, même si c’est pour te dire que ce projet n’est pas pour moi.",
  ];
  if (soumission.typeProjet) {
    texte.push("", `Ce que tu cherches : ${soumission.typeProjet}`);
  }
  if (soumission.message) {
    texte.push("", "Ton message :", soumission.message);
  }
  texte.push("", "Eliott Bouquerel", contactEmail);

  return {
    sujet: "Ton message est bien arrivé",
    html,
    texte: texte.join("\n"),
  };
}
