# Freelanding (eliottbouquerel.fr)

Site personnel et portfolio d'Eliott Bouquerel, Développeur Freelance.
Ce projet est développé avec **SvelteKit**, **TailwindCSS** et fonctionne avec l'environnement **Bun**.

## 🛠️ Stack Technique

- **Framework** : [SvelteKit](https://kit.svelte.dev/)
- **Langage** : TypeScript
- **Styles** : [TailwindCSS v4](https://tailwindcss.com/)
- **Runtime & Manager** : [Bun](https://bun.sh/)
- **Déploiement** : VPS via [Coolify](https://coolify.io/) (Docker/Nixpacks)

## 🚀 Installation & Développement

Assurez-vous d'avoir [Bun](https://bun.sh/) installé sur votre machine.

```bash
# Installer les dépendances
bun i

# Lancer le serveur de développement
bun dev
```

L'application sera accessible sur `http://localhost:5173`.

## 📦 Build & Production

Pour créer une version de production locale :

```bash
bun build
bun start
```

## ☁️ Déploiement (Coolify)

Ce projet est configuré pour être déployé automatiquement sur Coolify via **Nixpacks**.

### Configuration spécifique
- **Adapter** : `@sveltejs/adapter-node` est utilisé pour la compatibilité VPS.
- **Nixpacks** : Un fichier `nixpacks.toml` est présent pour forcer l'usage de Bun lors du build sur le serveur.
- **Dépendances Linux** : `@rollup/rollup-linux-x64-gnu` est inclus dans les `optionalDependencies` pour assurer le build sur Linux.

### Mise en ligne
Le déploiement est automatique à chaque **Push** sur la branche `main`.
Si le déploiement ne se déclenche pas, vérifiez les Webhooks dans Coolify et GitHub.

## 🐳 Docker Compose (Optionnel)

Si vous préférez héberger l'application via Docker Compose directement :

```bash
# Construire et lancer le conteneur
docker compose up -d --build
```

L'application sera disponible sur le port **3000**.
Le `Dockerfile` est multi-stage et optimisé pour Bun, garantissant une image de production légère.
Le fichier de configuration est nommé `docker-compose.yaml` (format attendu par Coolify).


