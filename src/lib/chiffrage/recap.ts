/**
 * Récapitulatif d'une estimation en texte brut, pour le mail de secours envoyé
 * à Eliott quand le cockpit ne répond pas : un prospect qui a laissé ses
 * coordonnées ne doit jamais se perdre en silence.
 */
import { echapperHtmlMultiligne, nettoyerEnTete } from "@/lib/contact/sanitize";
import type { MessageCompose } from "@/lib/contact/emails";
import type { Fourchette } from "./grille";
import type { EnvoiEstimation } from "./cockpit";

const euros = (n: number) => `${n.toLocaleString("fr-FR")} €`;

export function texteFourchette(f: Fourchette): string {
  return f.haut === undefined ? `dès ${euros(f.bas)}` : `${euros(f.bas)} à ${euros(f.haut)}`;
}

export function texteRecapitulatif(envoi: EnvoiEstimation): string {
  const { demande, estimation, source } = envoi;
  const { contact, reponses } = demande;
  const lignes = [
    `${contact.prenom} ${contact.nom}, ${contact.societe}`,
    `${contact.email} · ${contact.telephone}`,
    "",
    `Projet : ${reponses.type} · équipe ${reponses.equipe} · outils ${reponses.outils} · échéance ${reponses.urgence}`,
    `Composants lus ${source === "ia" ? "par l'IA" : "depuis les boutons"}`,
    "",
    demande.description,
    "",
    `Achat direct : ${texteFourchette(estimation.prix)} HT, maintenance ${texteFourchette(estimation.maintenance)} HT/mois`,
    ...estimation.abonnements.map(
      (a) =>
        `Abonnement ${a.duree} mois : mise en route ${texteFourchette(a.miseEnRoute)}, puis ${texteFourchette(a.mensualite)}/mois, ensuite ${texteFourchette(a.suiviApres)}/mois`,
    ),
  ];
  return lignes.join("\n");
}

export function messageSecours(envoi: EnvoiEstimation, motif: string): MessageCompose {
  const texte = `Le cockpit n'a pas reçu cette estimation (${motif}). À saisir à la main.\n\n${texteRecapitulatif(envoi)}`;
  return {
    sujet: nettoyerEnTete(`Estimation du site, cockpit injoignable : ${envoi.demande.contact.societe}`),
    texte,
    html: `<p style="font-family:sans-serif;font-size:14px;line-height:1.5;">${echapperHtmlMultiligne(texte)}</p>`,
  };
}
