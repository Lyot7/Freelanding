# Freelanding (eliottbouquerel.fr)

Site personnel et portfolio d'Eliott Bouquerel, Développeur Freelance.
Projet développé avec **Next.js (App Router)**, **React**, **TailwindCSS v4**, et un
ensemble d'animations premium (**Lenis**, **GSAP**, **Framer Motion**, **Three.js**).

## 🛠️ Stack Technique

- **Framework** : [Next.js 15](https://nextjs.org/) (App Router, output `standalone`)
- **UI** : React 19 + TypeScript
- **Styles** : [TailwindCSS v4](https://tailwindcss.com/) (tokens `@theme` dans `globals.css`)
- **Smooth scroll** : [Lenis](https://github.com/darkroomengineering/lenis)
- **Animations scroll / texte** : [GSAP](https://gsap.com/) + ScrollTrigger + SplitText
- **Micro-interactions / transitions** : [Framer Motion](https://www.framer.com/motion/)
- **Hero 3D** : [Three.js](https://threejs.org/) via [@react-three/fiber](https://r3f.docs.pmnd.rs/) + drei
- **Runtime build** : [Bun](https://bun.sh/) — **Runtime serveur** : Node (serveur standalone Next)
- **Déploiement** : VPS via [Coolify](https://coolify.io/) (Docker / Nixpacks)

## 🚀 Installation & Développement

```bash
bun install
bun dev          # http://localhost:3000
```

Copiez `.env.example` vers `.env.local` et renseignez les variables :

| Variable | Portée | Rôle |
| --- | --- | --- |
| `RESEND_API_KEY` | serveur | Envoi du formulaire de contact (Resend) |
| `CONTACT_EMAIL` | serveur | Destinataire du formulaire |
| `NEXT_PUBLIC_POSTHOG_KEY` | client (build) | Analytics PostHog (opt-in RGPD) |
| `NEXT_PUBLIC_POSTHOG_HOST` | client (build) | Host PostHog |
| `NEXT_PUBLIC_CAL_LINK` | client | Lien Cal.com du calendrier |

## 📦 Build & Production

```bash
bun run build
node .next/standalone/server.js   # sert sur le port 3000
```

## 🏗️ Architecture des animations

- `SmoothScrollProvider` instancie Lenis et pilote le ticker GSAP (une seule boucle rAF),
  branche ScrollTrigger sur le scroll virtuel de Lenis, et expose `useLenis()`.
- Les primitives réutilisables vivent dans `src/components/animation/` :
  `AnimatedText` (reveal masqué SplitText), `RevealOnScroll`, `RevealImage`,
  `MagneticButton`, `Marquee`, `CustomCursor`, `PageTransition`, `ClickSpark`.
- Le hero 3D (`src/components/three/`) est chargé dynamiquement (`ssr:false`) avec un
  poster CSS de repli, des dégradations de performance (PerformanceMonitor / AdaptiveDpr)
  et un fallback statique en `prefers-reduced-motion`.
- Tout respecte `prefers-reduced-motion`.

## ☁️ Déploiement (Coolify)

- **Image Docker** multi-stage : build avec Bun, runtime Node sur la sortie `standalone`.
- `next.config.ts` : `output: 'standalone'`, en-têtes de cache immuables pour les assets,
  `images.remotePatterns` pour `cdn.simpleicons.org`.
- Déploiement automatique à chaque **push** sur `main`.

## 🐳 Docker Compose

```bash
docker compose up -d --build
```

Application disponible sur le port **3000**.
