/**
 * Refuse un `next build` pendant qu'un `next dev` tourne sur CE dossier.
 *
 * POURQUOI CE GARDE-FOU EXISTE. Turbopack tient un cache disque dans `.next`,
 * activé par défaut en développement depuis Next 16.1. `next dev` et
 * `next build` écrivent tous les deux dedans. Lancés en même temps, ils se
 * disputent le verrou de compaction, et Turbopack ne renonce pas : il réessaie.
 *
 * MESURÉ le 2026-08-27, après deux `bun run build` lancés alors que le serveur
 * de développement tournait :
 *   - le serveur au repos, sans une seule requête, consommait 730 % de
 *     processeur — 17 minutes de temps CPU en 2 min 21 d'horloge, sept cœurs
 *     occupés à ne rien produire ;
 *   - `sample(1)` montrait onze `tokio-runtime-worker` dans
 *     `next-swc.darwin-arm64.node`, avec `cthread_yield` et `swtch_pri` en
 *     tête : de la contention, pas du travail ;
 *   - le journal répétait « Compaction failed: Another write batch or
 *     compaction is already active » et « Persisting failed », en boucle.
 *
 * Rien ne s'affichait à l'écran. Le site répondait normalement pendant que la
 * machine chauffait. Après arrêt des processus surnuméraires et redémarrage
 * d'un serveur unique : 0,01 seconde de processeur sur 60 secondes de repos.
 *
 * CE QUE CE FICHIER N'EST PAS. Une raison de ne jamais construire. Un build
 * reste la seule vérification qui compile réellement toutes les routes, et il a
 * sa place avant une mise en ligne. Il demande simplement que le serveur de
 * développement soit arrêté d'abord — ce que ce script dit au lieu de laisser
 * la machine le découvrir en chauffant.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

/** Contourne le garde-fou en connaissance de cause. */
if (process.env.AUTORISER_BUILD_AVEC_DEV === "1") {
  process.exit(0);
}

const racine = path.resolve(import.meta.dirname, "..");

/** Les `next dev` en cours, quel que soit le dossier. */
function serveursDev() {
  let sortie = "";
  try {
    sortie = execFileSync("ps", ["-Ao", "pid=,command="], { encoding: "utf8" });
  } catch {
    // Sans `ps`, on ne bloque pas : un garde-fou qui échoue doit laisser passer,
    // pas empêcher de travailler.
    return [];
  }
  return sortie
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /next-server|next[/\\]dist[/\\]bin[/\\]next dev|next dev\b/.test(l))
    .filter((l) => !l.includes("assert-no-dev"))
    .map((l) => {
      const [pid, ...reste] = l.split(/\s+/);
      return { pid, commande: reste.join(" ") };
    });
}

/**
 * Le serveur tourne-t-il sur CE projet ?
 *
 * `next-server` n'affiche pas son dossier dans sa ligne de commande : on
 * interroge donc le répertoire courant du processus via `lsof`. Sur un poste où
 * plusieurs projets Next tournent en parallèle — le cas ici, un serveur d'un
 * autre projet tournait depuis 31 jours —, bloquer sur le simple fait qu'un
 * `next dev` existe quelque part serait un faux positif.
 */
function surCeProjet(pid) {
  try {
    const sortie = execFileSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return sortie.includes(racine);
  } catch {
    // `lsof` indisponible ou refusé : on préfère prévenir que bloquer à tort.
    return false;
  }
}

const coupables = serveursDev().filter((p) => surCeProjet(p.pid));

if (coupables.length > 0) {
  console.error(
    [
      "",
      "❌ Un serveur de développement tourne déjà sur ce dossier.",
      "",
      ...coupables.map((p) => `   pid ${p.pid}`),
      "",
      "   `next dev` et `next build` écrivent le même cache Turbopack dans",
      "   `.next`. Lancés ensemble, ils bouclent sur la compaction et occupent",
      "   plusieurs cœurs sans rien produire — mesuré à 730 % de processeur,",
      "   sans le moindre message d'erreur à l'écran.",
      "",
      "   Arrêtez le serveur, puis relancez la construction.",
      "   Pour passer outre : AUTORISER_BUILD_AVEC_DEV=1 bun run build",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
