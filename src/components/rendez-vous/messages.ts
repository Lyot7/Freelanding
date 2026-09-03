/**
 * Messages d'état de la réservation qui dépendent d'une valeur d'exécution.
 *
 * POURQUOI ILS NE SONT PAS DANS `src/content/rendez-vous.ts`. Tout ce qui est
 * un LIBELLÉ y vit, et `scripts/hardcoded-text-audit.mjs` le vérifie. Ces
 * trois-là ne sont pas des libellés : ce sont des phrases construites autour de
 * l'adresse de contact publiée, qui n'est connue qu'au rendu. Elles suivent la
 * même convention que `MESSAGES_SUCCES` et `MESSAGE_RESEAU` dans
 * `src/components/forms/useEnvoiFormulaire.ts`, pour la même raison.
 */

/** Coupure réseau côté navigateur : la requête n'a jamais atteint le serveur. */
export const MESSAGE_RESEAU =
  "La connexion a échoué. Vérifiez votre réseau et réessayez.";

/**
 * Clef Turnstile absente.
 *
 * Traité côté client ET côté serveur : le serveur reste l'autorité, le client
 * évite juste un aller-retour inutile et dit la vérité au lieu d'afficher une
 * roue qui tourne.
 */
export function messageProtectionAbsente(emailContact: string): string {
  return `La réservation est momentanément indisponible (protection anti-robot non configurée). Écrivez-moi directement à ${emailContact}.`;
}

/** Réponse d'erreur sans message exploitable : dernier repli. */
export function messageEchecInconnu(emailContact: string): string {
  return `Le rendez-vous n’a pas pu être enregistré. Écrivez-moi directement à ${emailContact}.`;
}
