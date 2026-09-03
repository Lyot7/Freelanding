<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Le serveur de développement tourne sur webpack

`bun run dev` lance `next dev --webpack`. Ne pas retirer ce drapeau : avec
Turbopack, ce projet fait boucler le serveur à sept ou huit cœurs après cinq
pages chargées, au repos, sans erreur visible. Mesures et protocole de
re-vérification dans `docs/ACTIVE.md`.

Ne pas lancer `bun run build` pour vérifier son travail : `bun run dev` rend
déjà toutes les pages, et un build lancé pendant que le serveur tourne se
dispute le cache `.next`. Le script refuse d'ailleurs de démarrer dans ce cas.
La construction se réserve aux jalons.

# Les cinq audits, et ce qu'ils gardent

Ils tournent sur le serveur de dev, jamais sur un build. Chacun existe parce
qu'un défaut de sa famille a été servi en production.

```bash
bun run audit:liens     # externes en nouvel onglet, internes non
bun run audit:fichiers  # tout média cité par le contenu existe sur le disque
bun run audit:accents   # aucun accent coupé par un overflow
bun run audit:typo      # apostrophes, insécables, guillemets, cadratins
bun run audit:textes    # aucune chaîne visible écrite dans un composant
```

`audit:liens` lit le DOM et non le code : les liens produits par la donnée, par
le MDX ou par une conversion à l'exécution (les adresses e-mail des mentions
légales) n'existent nulle part dans les sources. Il tolère un fichier servi
depuis notre origine (`.mp4`, `.pdf`) en nouvel onglet, ce qui est le bon
comportement, et refuse une page interne en `_blank`.

`audit:fichiers` compare les chemins de média cités dans `src/content/**` au
contenu de `public/`. Une image manquante ne casse rien de visible : les types
sont verts, Next renvoie un 404 sur le fichier et la page affiche un cadre vide.
Ce script rend l'attente explicite, ce qui permet d'écrire une entrée de galerie
avant d'avoir la capture.
