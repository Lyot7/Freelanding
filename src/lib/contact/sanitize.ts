/**
 * Assainissement des valeurs avant insertion dans un e-mail.
 *
 * POURQUOI CE FICHIER EXISTE. Le corps HTML de la notification contient des
 * données écrites par un inconnu. Sans échappement, un message contenant
 * `<img src=x onerror=…>` ou `<a href="…">` s'exécute ou s'affiche comme un
 * élément de l'interface dans la boîte d'Eliott : c'est une injection HTML
 * classique, et la boîte mail d'un freelance en prospection est exactement la
 * cible qui la rend rentable (hameçonnage sur mesure, faux lien de réponse).
 *
 * RÈGLE : aucune valeur soumise ne rejoint une chaîne HTML sans passer par
 * `echapperHtml`. Le gabarit texte, lui, n'a rien à échapper — mais il doit
 * quand même refuser les retours chariot dans un sujet (`nettoyerEnTete`).
 */

/**
 * Échappe les cinq caractères qui changent le sens d'un document HTML.
 *
 * `&` en PREMIER, sinon les entités produites par les remplacements suivants
 * seraient ré-échappées (`<` → `&lt;` → `&amp;lt;`).
 *
 * Les guillemets simples et doubles sont échappés aussi : une valeur peut se
 * retrouver dans un attribut (`title`, `alt`), et s'en échapper suffirait à
 * injecter un gestionnaire d'événement.
 */
export function echapperHtml(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Échappe puis convertit les sauts de ligne en `<br />`.
 *
 * Réservé au champ message, seul champ multiligne. L'échappement passe AVANT :
 * inverser les deux réintroduirait la faille, le `<br />` produit étant alors
 * lui-même échappé et le HTML de l'auteur, lui, laissé intact.
 */
export function echapperHtmlMultiligne(valeur: string): string {
  return echapperHtml(valeur).replace(/\n/g, "<br />");
}

/**
 * Nettoie une valeur destinée à un en-tête de message (sujet, nom d'expéditeur).
 *
 * L'API Resend prend du JSON, un `\n` n'y coupe donc pas l'en-tête comme dans
 * SMTP brut ; mais la valeur finit par être sérialisée en en-tête MIME quelque
 * part, et un sujet sur trois lignes est de toute façon cassé. On coupe court :
 * plus de retour à la ligne, plus de caractère de contrôle, longueur bornée.
 */
export function nettoyerEnTete(valeur: string, longueurMax = 160): string {
  const surUneLigne = valeur
    .replace(/[\r\n\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return surUneLigne.length > longueurMax
    ? `${surUneLigne.slice(0, longueurMax - 1)}…`
    : surUneLigne;
}
