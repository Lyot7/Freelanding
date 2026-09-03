/**
 * `GET /api/rendez-vous/creneaux` — créneaux libres d'un type de rendez-vous.
 *
 * POURQUOI CETTE ROUTE EXISTE ALORS QUE CAL.COM RÉPOND SANS CLEF. Le navigateur
 * pourrait techniquement appeler `api.cal.com` en direct. Trois raisons de ne
 * pas le faire :
 *
 *   1. la CONFIGURATION resterait publique. Le nom d'utilisateur et les
 *      identifiants d'événement partiraient dans le paquet JavaScript, donc
 *      dans l'index de n'importe quel moteur ;
 *   2. le DÉBIT ne serait plus limitable. Un visiteur qui pagine trente fois
 *      taperait trente fois sur l'API publique d'un tiers, sous notre nom ;
 *   3. les BORNES ne seraient plus tenues. La fenêtre demandée arrive du client
 *      et doit être ramenée entre aujourd'hui et l'horizon avant d'atteindre
 *      Cal.com — un contrôle qui n'a aucun sens côté navigateur.
 *
 * ABSENCE DE CONFIGURATION = 503 EXPLICITE, jamais une liste vide. Une liste
 * vide se lit « aucune disponibilité » et ferait croire à un agenda plein.
 */
import { creerJournal, empreinte, json, origineEtrangere } from "@/lib/api/reponse";
import { adresseAppelante, creerLimiteur } from "@/lib/contact/rate-limit";
import { recupererCreneaux } from "@/lib/rendez-vous/cal-com";
import { estIdRendezVous, resoudreConfiguration } from "@/lib/rendez-vous/config";
import {
  estDerniereSemaine,
  estPremiereSemaine,
  fenetreSemaine,
  formaterFenetre,
  lireCreneaux,
} from "@/lib/rendez-vous/creneaux";
import { LIMITE_CRENEAUX } from "@/lib/rendez-vous/limites";

/** `node:crypto` (empreinte de journal) et limiteur en mémoire : donc Node. */
export const runtime = "nodejs";
/** Des créneaux mis en cache sont des créneaux faux. */
export const dynamic = "force-dynamic";

const journaliser = creerJournal("rendez-vous");
const limiteur = creerLimiteur(LIMITE_CRENEAUX);

export async function GET(requete: Request): Promise<Response> {
  if (origineEtrangere(requete)) {
    return json({ message: "Requête refusée." }, 403);
  }

  const adresse = adresseAppelante(requete.headers);
  const limite = limiteur.verifier(adresse);
  if (!limite.autorise) {
    return json({ message: "Trop de demandes." }, 429, {
      "retry-after": String(limite.reessayerDansS),
    });
  }

  const parametres = new URL(requete.url).searchParams;
  const type = parametres.get("type");
  if (!estIdRendezVous(type)) {
    return json({ message: "Type de rendez-vous inconnu." }, 400);
  }

  const { cibles } = resoudreConfiguration();
  const cible = cibles[type];
  if (!cible) {
    journaliser("type_non_configure", { type });
    return json({ message: "Prise de rendez-vous non configurée." }, 503);
  }

  const maintenant = new Date();
  // Le jour demandé n'est qu'une suggestion : `fenetreSemaine` le ramène entre
  // aujourd'hui et l'horizon. Rien de ce que le client écrit n'atteint Cal.com.
  const fenetre = fenetreSemaine(parametres.get("debut") ?? "", maintenant);

  const resultat = await recupererCreneaux(cible, fenetre.debut, fenetre.fin);
  if (!resultat.ok) {
    journaliser("creneaux_indisponibles", {
      type,
      raison: resultat.raison,
      statut: resultat.raison === "refuse" ? resultat.statut : 0,
      detail: resultat.detail,
      appelant: empreinte(adresse),
    });
    // 502 et non 500 : la panne est chez le fournisseur, pas chez nous. Le
    // client, lui, ne lit qu'un message et n'a pas à connaître la différence.
    return json({ message: "Créneaux indisponibles." }, 502);
  }

  return json(
    {
      fenetre: {
        debut: fenetre.debut,
        fin: fenetre.fin,
        libelle: formaterFenetre(fenetre),
        premiere: estPremiereSemaine(fenetre.debut, maintenant),
        derniere: estDerniereSemaine(fenetre.debut, maintenant),
      },
      jours: lireCreneaux(resultat.donnees, maintenant),
    },
    200,
  );
}
