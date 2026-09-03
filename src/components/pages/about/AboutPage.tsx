import Image from "next/image";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { LogoBandSection } from "@/components/sections/LogoBandSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { Grain } from "@/components/effects/Grain";
import { ParallaxCover } from "@/components/effects/ParallaxCover";
import { Highlighted } from "@/components/ui";
import { siteFeatures } from "@/content/features";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { Signature } from "@/components/sections/hero/Signature";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import { content } from "@/lib/content";
import type {
  AboutContent,
  BlogPost,
  Stat,
  TeamMember,
} from "@/lib/content/types";

/*
 * FOND DU HERO. Il n'a pas de champ dans le modèle de contenu, contrairement à
 * `about.cover` : il reste donc une constante, mais elle pointe désormais sur
 * une image du mécanisme d'horlogerie extraite de notre propre boucle
 * (`public/videos/hero-loop.mp4`) plutôt que sur la photo du template.
 */
const HERO_IMAGE = "/images/mecanisme-large.jpg";
const COUNTER_SPEEDS = [10, 12, 40, 10] as const;

function AboutHero({ about }: { about: AboutContent }) {
  // Le sous-titre et ses fragments en emphase viennent de la DONNÉE. Ils
  // étaient recopiés en dur, en anglais : l'emphase disparaissait sans erreur
  // dès que le texte passait au français.
  const subtitleParagraph = about.hero.subtitleParagraphs?.[0];
  const subtitleText = subtitleParagraph?.text ?? about.hero.subtitle ?? "";
  const subtitleEmphasis = subtitleParagraph?.emphasis
    ? [...subtitleParagraph.emphasis]
    : [];
  return (
    <section className="relative flex h-[90svh] min-h-[600px] w-full items-end justify-center overflow-hidden bg-background px-[20px] pb-[60px] tablet:px-[24px] tablet:pb-[90px] desktop:px-[30px]">
      {/* framer-55nez « BG » : le fond du hero DÉRIVE au scroll sur la source,
          il était posé fixe. Relevé sur `/live-proxy/about` à 1440, par sauts de
          scroll : translateY = 75,15 px à 501 · 150,30 à 1002 · 225,45 à 1503 ·
          300,60 à 2004 · 375,75 à 2505, soit `0,150 x scrollY` à la troisième
          décimale et sans borne. C'est EXACTEMENT la loi du fond du hero de la
          home (`framer-60s0ze`), déjà relevée et implémentée là-bas ; les mêmes
          75,15 px se retrouvent sur le fond de l'article (`framer-14e0onr`,
          57,15 à 381) et sur le média de la page projet (`framer-1gqz6xi`,
          105,30 à 702). Trois pages, une seule loi.
          Le débord est absorbé par l'`overflow-hidden` de la section. */}
      <ScrollParallax
        factor={0.15}
        decorative
        className="pointer-events-none absolute inset-0 z-0 overflow-clip"
      >
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          preload
          sizes="100vw"
          /* `grayscale` fusionné DANS le `filter` : posés côte à côte, les
             deux écrivent la même propriété et l'utilitaire arbitraire gagne,
             donc le `grayscale` ne s'appliquait pas. Le fond est une image du
             mécanisme, quasi neutre (saturation moyenne 5/255), l'écart est
             invisible — mais c'est la collision qui, sur la couverture de cette
             même page, faisait sortir le portrait en couleur. */
          className="absolute inset-0 h-full w-full object-cover object-center [filter:grayscale(1)_brightness(.65)]"
        />
      </ScrollParallax>
      {/* RELEVÉ sur `/about` : hôte 1440 × 810, z-1, opacité 0,09. */}
      <Grain opacity={0.09} className="z-[1]" />
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 z-[2] hidden w-px bg-white/20 tablet:block"
      />

      <div className="relative z-[3] flex w-full max-w-[1440px] flex-col items-end gap-[20px] tablet:gap-[30px]">
        <Reveal
          className="grid w-full grid-cols-1 tablet:grid-cols-2"
          initialOpacity={0}
          initialY={48}
          duration={0.9}
          delay={0.12}
        >
          {/* Échelle de héros MESURÉE sur la source : 63 / 78 / 98 px et chasse
              -0,05em (pas 52 / 68 / 92 en -0,06em). */}
          <h1 className="col-start-1 m-0 text-[63px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-foreground tablet:col-start-2 tablet:text-[78px] desktop:text-[98px]">
            {about.hero.title}
          </h1>
        </Reveal>

        {subtitleText ? (
          <Reveal
            className="grid w-full grid-cols-1 tablet:grid-cols-2"
            initialOpacity={0}
            initialY={28}
            duration={0.8}
            delay={0.24}
          >
            {/* Largeur déjà conforme (310 px). En revanche le texte était en
                blanc PLEIN : le live le pose à 60 % et n'y met en blanc que les
                fragments d'emphase portés par la donnée. */}
            <p className="max-w-[310px] text-left text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 tablet:justify-self-end tablet:text-right">
              <Highlighted text={subtitleText} highlights={subtitleEmphasis} />
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

function StatCell({ stat, speedMs }: { stat: Stat; speedMs: number }) {
  return (
    // Chiffre MESURÉ sur la source : 34 / 52 / 54 px, graisse 600, chasse
    // -0,07em et interligne `normal` (71px de haut à 54px, soit ~1,31 — pas 1).
    // La cellule n'a pas de hauteur minimale ; l'écart interne passe de 12 à 15.
    <div className="flex flex-col items-start justify-start gap-[12px] tablet:gap-[15px]">
      <AnimatedCounter
        value={stat.value}
        speedMs={speedMs}
        // Hauteur RÉSERVÉE au chiffre sous 810. L'explication d'origine était
        // inversée : re-mesuré à 390, l'hôte du compteur de la SOURCE fait 44 de
        // haut avec 8 px d'écart au libellé, le nôtre 40 avec 12. Ce n'est donc
        // pas la source qui borne à 40, c'est notre 40 + 12 qui reproduit son
        // 44 + 8 — même somme, donc libellé au même endroit et pas de rangée
        // identique des deux côtés (111 px). Le résultat était juste, le
        // raisonnement non. À partir de 810 la boîte naturelle vaut 67 puis 70,
        // exactement comme la source : on la laisse libre.
        className="flex h-[40px] text-[34px] font-semibold leading-[normal] tracking-[-0.07em] text-background tablet:h-auto tablet:text-[52px] desktop:text-[54px]"
      />
      <p className="w-[150px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-[rgba(11,11,11,0.6)]">
        {stat.label}
      </p>
    </div>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    // En MOBILE la source empile : photo 110×135 au-dessus, texte en dessous,
    // écart 14 — la carte fait 114×202. Les 114 comptent : à 110 le texte n'a
    // plus la place et « Jennifer Peterson » passe sur deux lignes, ce qui
    // décale la seconde rangée de 17px. À partir de 810 elle passe côte à côte
    // (colonne photo 110px, gouttière 22px, contenu calé en bas).
    <article className="flex w-[114px] flex-col gap-[14px] tablet:grid tablet:w-auto tablet:grid-cols-[110px_1fr] tablet:items-end tablet:gap-[22px]">
      {member.avatar ? (
        // Portrait 110×135 sur la source, soit un rapport 0,8148 (pas 0,8333).
        // Les 3px manquants par carte décalaient tout le bas de page de 6px.
        <div className="relative aspect-[110/135] w-[110px] overflow-hidden bg-black/[0.03] tablet:w-full">
          {/* Portrait sur-cadré de 6 % et DÉRIVANT au scroll, comme la source.
              Pas de `grayscale` : le live laisse les photos d'équipe en couleur
              (vérifié, aucun filtre sur les 4 portraits, mêmes fichiers). */}
          <ParallaxCover
            src={member.avatar.src}
            alt={member.avatar.alt}
            overshoot={0.06}
            /* Portrait de 110 px de large à 1440 (114 en mobile) : sans ce
               `sizes`, le gabarit par défaut du composant ferait servir une
               variante trois fois trop large pour la vignette. */
            sizes="(min-width: 810px) 8vw, 114px"
            /* La source fait ENTRER chaque portrait : le conteneur passe de
               `scale 1.1` / opacité 0 à `scale 1` / opacité 1. Chez nous la
               photo était posée à plat, seule sa dérive de parallaxe bougeait.
               Invisible à `motion-sweep`, qui apparie par contenu textuel : un
               cadre d'image n'a pas de texte, donc pas de clé. */
            reveal
          >
            {/* RELEVÉ sur `/about` : quatre portraits d'équipe, hôte 110 × 135
                à 1440, z-3, opacité 0,05 (nous étions à 0,07). */}
            <Grain opacity={0.05} className="z-[3]" />
          </ParallaxCover>
        </div>
      ) : (
        <div className="aspect-[.8333] w-full bg-black/[0.03]" aria-hidden />
      )}
      <div className="flex min-w-0 flex-col items-start gap-[5px]">
        <h3 className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-background">
          {member.name}
        </h3>
        <p className="text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-black/60">
          {member.role}
          {member.company ? (
            <>
              <br />
              {/* 13px / 500 sur le live (nous étions à 11px hérités / 600). */}
              <span className="text-[13px] font-medium text-background">
                {member.company}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}

function AboutStory({ about }: { about: AboutContent }) {
  /* LE CHAPÔ DE « QUI JE SUIS » EST LE DERNIER PARAGRAPHE, pas le quatrième.
     La destructuration positionnelle précédente (`[lead, process, positioning,
     smallByDesign]`) laissait le CINQUIÈME paragraphe hors du rendu : il était
     écrit dans `about.ts`, il ne s'affichait nulle part, et `bodyHighlights`,
     qui déclare deux fragments de ce paragraphe-là, ne trouvait donc rien à
     mettre en avant — une emphase éteinte sans que rien ne le signale.
     La colonne du milieu prend tout l'entre-deux, le chapô prend la fin. */
  const [lead, ...suite] = about.body;
  const smallByDesign = suite.at(-1);
  const milieu = suite.slice(0, -1);

  return (
    <section className="relative flex w-full justify-center bg-muted px-[20px] pb-[30px] pt-[20px] text-background tablet:px-[24px] tablet:pb-[90px] tablet:pt-[30px] desktop:px-[30px]">
      <span
        aria-hidden
        /* `z-[2]` : cette encoche de raccord est peinte APRÈS le hero dans le
          document, mais le calque de grain du hero est posé à `z-[1]` et la
          section, en `position: relative` sans `z-index`, ne crée AUCUN contexte
          d'empilement — ce grain remonte donc dans le contexte racine et se
          peignait par-dessus l'encoche. Résultat visible : la moitié qui se
          termine plus tôt sortait grenue là où le reste de la section est plat,
          ce qui se lit comme un voile flou au bas du hero.
          `FaqSection` porte déjà ce `z-[2]` et rend propre : c'est la même
          correction, sur les trois autres encoches du site. */
        className="absolute right-0 top-[-20px] z-[2] h-[20px] w-1/2 bg-muted tablet:top-[-30px] tablet:h-[32px]"
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 hidden w-px bg-black/[0.08] tablet:block"
      />

      <div className="relative flex w-full max-w-[1440px] flex-col">
        {/* Surtitre du bloc récit (« Contact us » dans la source) : lu dans la
            donnée, il était recopié en dur en anglais. */}
        <p className="pb-[12px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-black/60 tablet:pb-[30px]">
          {about.storyEyebrow}
        </p>

        {lead ? (
          // La colonne fait 3/4 (1024px à 1440) et le paragraphe y est CALÉ À
          // GAUCHE avec un plafond de 900. Poser `max-w-[900px]` sur la boîte
          // qui porte déjà `ml-auto` la ramènerait à 900 et la pousserait 124px
          // trop à droite : il faut deux boîtes distinctes.
          <div className="w-full tablet:ml-auto tablet:w-3/4">
            <Reveal
              as="p"
              // 22 / 26 / 32 px. La chasse mobile est plus serrée (-0,02em) que
              // celle des paliers supérieurs (-0,01em) sur la source.
              className="w-full max-w-[900px] pb-[16px] text-[22px] font-medium leading-[1.1] tracking-[-0.02em] tablet:pb-[40px] tablet:text-[26px] tablet:tracking-[-0.01em] desktop:text-[32px]"
              initialOpacity={0}
              initialY={30}
              duration={0.75}
            >
              {lead}
            </Reveal>
          </div>
        ) : null}

        {/* `gap-y` À PARTIR DE 810, et `gap-x` toujours nul : la gouttière
            horizontale de la source est bien à zéro (elle vit dans le `pr` de
            la cellule), mais dès qu'il y a plus de deux paragraphes une
            DEUXIÈME RANGÉE apparaît, et sans gouttière verticale les deux
            paragraphes d'une même colonne se collent et se lisent comme un
            seul. À deux paragraphes il n'y a qu'une rangée : `gap-y` est alors
            sans effet, la mise en page d'origine est intacte. */}
        <div className="grid w-full grid-cols-1 gap-[16px] pb-[20px] tablet:ml-auto tablet:w-1/2 tablet:grid-cols-2 tablet:gap-x-0 tablet:gap-y-[16px] tablet:pb-[30px]">
          {/* La gouttière de 20px vit sur la CELLULE, pas sur le paragraphe :
              en `border-box` un `pr-20` sur le <p> rognerait sa colonne de texte
              (5 lignes au lieu de 4 à 1440, 4 au lieu de 5 à 810). */}
          {milieu.filter(Boolean).map((paragraph) => (
            <div key={paragraph} className="pr-[20px]">
              {/* Plafond de 320 px À PARTIR DE 810, et pas avant. La source
                  pose bien un `max-width: 320px` sur cette cellule — relevé
                  `none` à 809, `320px` à 810, 1000, 1199, 1200, 1300, 1440, 1600
                  et 1920. Le plafond inconditionnel qui existait ici avait été
                  retiré à juste titre : il rabotait le texte à 320 px là où la
                  source en fait 749 juste sous la bascule tablette. Mais la
                  version correctement bornée n'avait jamais été remise, d'où
                  325 px à 1440 et 340 au-delà de 1600 là où la source tient 320.
                  `text-background/60` et non `text-black/60` : chez Tailwind v4
                  le second rend du NOIR PUR à 60 %, la charte du site est
                  `#0b0b0b`. */}
              <p className="text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-background/60 tablet:max-w-[320px]">
                {paragraph}
              </p>
            </div>
          ))}
        </div>

        {/* La rangée photo + chiffres est calée en BAS sur la source
            (`align-items: flex-end`) : la colonne de chiffres, plus courte de
            47px que la photo, descend d'autant. En calage haut, tout le bloc
            remontait de 52px. */}
        <div className="grid w-full grid-cols-1 items-end gap-[30px] pb-[50px] tablet:grid-cols-2 tablet:gap-0 tablet:pb-[100px]">
          <div className="relative flex w-full justify-center overflow-visible tablet:justify-start">
            {/* Aucun plafond de largeur en mobile : la photo occupe toute la
                largeur utile (350px à 390 de fenêtre). Le `max-w-[320px]` la
                rabotait de 30px, donc de 38px en hauteur à ratio constant, et
                remontait d'autant tout le bas de la page à partir des
                compteurs. */}
            <div className="surface-dark relative aspect-[.791667] w-full overflow-visible tablet:w-1/2">
              {/* Photo sur-cadrée de 6 % et DÉRIVANTE au scroll, comme la
                  source (`top:-6%; height:calc(100% + 12%)`). Elle était posée
                  en `fill` sans sur-cadrage ni mouvement. */}
              <ParallaxCover
                src={about.cover?.src ?? ""}
                // L'ancien alt annonçait « l'équipe du studio d'origine » : image
                // d'illustration, aucune équipe réelle. La donnée décrit ce que
                // la photo montre.
                alt={about.cover?.alt ?? "Discussion de travail en extérieur"}
                overshoot={0.06}
                /* Le réglage précédent (`contraste .75` + `luminosité 1.8`)
                   avait été calibré sur un DÉTOURAGE sur aplat vert : il servait
                   à éteindre l'aplat, et il brûlait toute vraie photo. La
                   couverture est désormais la photo d'origine (voir
                   `about.cover`), une prise de vue de fin de journée : elle
                   demande une remontée LÉGÈRE, pas un lavage. MESURÉ sur le
                   fichier servi, filtre appliqué : moyenne 130/255 et 0,48 % de
                   pixels au-dessus de 99 % (le tee-shirt blanc et une trouée de
                   ciel, rien d'autre). L'ancien réglage sortait à 137/255 avec
                   1,66 % de brûlé, et le tirage sans remontée à 122/255 — trop
                   sourd à côté du gris clair de la section.

                   UNE SEULE déclaration `filter`, et c'est délibéré : la classe
                   `grayscale` et l'utilitaire arbitraire `[filter:…]` écrivent
                   la MÊME propriété, et le second gagne dans la feuille générée.
                   Le `grayscale` posé à côté n'a donc jamais rien fait — ça ne
                   se voyait pas tant que le fichier servi était un détourage
                   noir et blanc sur aplat, ça se voit immédiatement avec une
                   vraie photo, qui sortait en couleur au milieu d'une page
                   monochrome. */
                imgClassName="[filter:grayscale(1)_contrast(1.06)_brightness(1.06)]"
                /* Le cadre fait 345 × 436 à 1440, soit le rapport 0,7917 de
                   `aspect-[.791667]` — les 488 px sont la boîte de l'IMAGE après
                   le sur-cadrage de 12 %, pas celle du cadre. L'ancien fichier
                   était presque carré : `object-fit: cover` calait sur la
                   HAUTEUR et réclamait 540 px de large, d'où les 38vw posés ici.
                   Le fichier servi depuis le 2026-08-26 est cadré AU RAPPORT DU
                   CADRE (1100 × 1388) : il ne reste à couvrir que le
                   sur-cadrage de 12 % en hauteur du `overshoot`, soit
                   345 × 1,12 = 386 px, c'est-à-dire 27vw à 1440. 28vw laisse la
                   marge, sans continuer à servir 40 % de pixels inutiles. */
                sizes="(min-width: 810px) 28vw, 100vw"
                /* Même entrée que les portraits d'équipe : la source part de
                   `scale 1.1` et d'une opacité nulle. Relevé sur le conteneur
                   `.framer-1ambeg8-container` de 345x436 à 1440. */
                reveal
              >
                {/* RELEVÉ sur `/about` : hôte 345 × 436 à 1440, z-3,
                    opacité 0,09 (nous étions à 0,08). */}
                <Grain opacity={0.09} className="z-[3]" />
              </ParallaxCover>
              {/* `surface-dark` : la signature est posée SUR la photo, qui ne
                  déclare aucun fond. Sans cette classe, elle hérite du gris
                  clair de la section et passe à l'encre sombre — invisible sur
                  une image sombre. */}
              <Signature variant="about" />
            </div>
          </div>

          {/* Gouttière de colonne NULLE sur la source, et interligne de rangée
              qui s'ouvre avec la largeur : 30 / 50 / 70. */}
          <div className="grid grid-cols-2 gap-x-0 gap-y-[30px] tablet:gap-y-[50px] tablet:pt-[50px] desktop:gap-y-[70px] desktop:pt-[100px]">
            {about.stats.map((stat, index) => (
              <StatCell
                key={stat.label}
                stat={stat}
                speedMs={COUNTER_SPEEDS[index] ?? 10}
              />
            ))}
          </div>
        </div>

        {/* Bloc équipe — structure MESURÉE sur le live : une colonne verticale de
            gap 30, avec le grand titre « THE TEAM. » EN HAUT (moitié gauche,
            aligné à droite), puis un empilement de gap 50 dans la moitié droite
            contenant le chapô puis la grille. Le titre était purement absent, et
            le chapô se trouvait à gauche au lieu de la droite : d'où un déficit de
            275 px de hauteur de section. */}
        {/* Écart titre « THE TEAM. » → colonne de droite MESURÉ sur la source :
            20 sous 810 (bas du titre 1970, bloc suivant 1990 à 390, idem à 600
            et 809), 30 à partir de 810. Il était à 30 partout. */}
        <div className="flex w-full flex-col gap-[20px] tablet:gap-[30px]">
          {/* Le titre est RÉVÉLÉ LIGNE PAR LIGNE sur le live (motion-sweep :
              `TO SPAN "The"` et `TO SPAN "team."`, transform + opacité), il était
              figé chez nous. Motif repris tel quel de ShowreelSection : une ligne
              = un masque `overflow-hidden` + un `inline-block` qui remonte.
              Le découpage vient de la donnée (`about.teamTitleLines`) et NON de
              la largeur de la fenêtre : le couper est donc sûr. Il était écrit
              en dur en anglais (« The » / « team. »).
              La casse suit celle de la donnée : le rendu est identique
              puisque le `h2` porte déjà `uppercase`. */}
          {/* Le DÉCLENCHEUR vit sur le `h2`, pas sur chaque ligne.
              Un observateur posé sur la ligne raisonne sur sa boîte TRANSFORMÉE
              et CLIPPÉE par le masque : décalée de 40 px sous un masque de 75,
              elle n'entre dans la zone d'observation que 40 px trop tard, et
              chaque ligne repart pour son propre compte au lieu de suivre la
              cascade. Mesuré par saut direct puis attente de 1,7 s à 1440x900 :
              « team. » restait masqué tant que son haut était à 804 et se
              révélait à 755, alors que la source la révèle dès 970 — 215 px de
              retard. La source déclenche les DEUX lignes au même défilement
              (3948 → 3957 pour « News and » / « updates. »), signature d'un
              déclencheur unique porté par le conteneur. */}
          <LineReveal
            as="h2"
            lines={about.teamTitleLines ? [...about.teamTitleLines] : []}
            className="m-0 flex w-full flex-col p-0 text-left text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-background tablet:w-1/2 tablet:text-right tablet:text-[68px] desktop:text-[92px]"
            lineClassName="w-full overflow-hidden leading-[0.82]"
          />

          <div className="flex w-full flex-col gap-[30px] tablet:ml-auto tablet:w-1/2 tablet:gap-[50px]">
            {smallByDesign ? (
              // 12 px UPPERCASE à 60 %, avec deux fragments en noir plein. La
              // version précédente : 14 px, casse normale, sans emphase.
              // Largeur : 280 px sous 810, 260 au-delà — mesuré, la source rend
              // ce bloc en 280×43 à 390, 600 et 808, puis en 260×43 à 810 et
              // 1440. Il était plafonné à 260 partout.
              // Le chapô apparaît en FONDU sur le live (motion-sweep :
              // `-O DIV "Small on purpose. four p"`, opacité seule, sans
              // translation), il était immobile chez nous. Le fondu est porté par
              // un `div` enveloppant et non par le `<p>` : c'est bien un DIV qui
              // s'anime sur la source, et le paragraphe se révèle D'UN BLOC —
              // son texte vient des données, ses retours à la ligne dépendent de
              // la largeur, les découper les figerait hors de 1440.
              <Reveal
                as="div"
                initialOpacity={0.001}
                duration={0.8}
                delay={0.15}
              >
                <p className="max-w-[280px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-black/60 tablet:max-w-[260px]">
                  <Highlighted
                    text={smallByDesign}
                    highlights={
                      about.bodyHighlights ? [...about.bodyHighlights] : []
                    }
                    highlightClassName="text-background"
                  />
                </p>
              </Reveal>
            ) : null}
          </div>

          {/* Largeur de la grille : PLEINE entre 810 et 1199, puis moitié droite
              à partir de 1200. Mesuré aux deux bornes de chaque bande : noms à
              x156/537 en 810 et x852/1197 en 1440. Enfermée en permanence dans
              le demi-conteneur du chapô, elle comprimait les colonnes en
              tablette (410 et 600 au lieu de 156 et 537) et cassait les noms sur
              deux lignes ; en pleine largeur partout, elle ratait le desktop.
              Gouttière de colonne nulle à toutes les largeurs (`gap: 20px 0`). */}
          {/* `mt-[10px]` en mobile : la source empile le chapô ET la grille dans
              un même bloc d'écart 30 (bas du chapô 2033, grille 2063 à 390),
              alors que chez nous la grille est un troisième enfant de la colonne
              dont l'écart vaut 20. Les 10 manquants sont rendus ici. */}
          <div className="mt-[10px] grid grid-cols-2 gap-x-0 gap-y-[20px] tablet:mt-[20px] tablet:gap-y-[30px] desktop:ml-auto desktop:w-1/2">
            {about.team.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function selectArticles(
  posts: BlogPost[],
  featuredSlugs: readonly string[],
): BlogPost[] {
  return featuredSlugs
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is BlogPost => Boolean(post));
}

export async function AboutPage() {
  const [site, about, posts, home] = await Promise.all([
    content.getSiteConfig(),
    content.getAbout(),
    content.getPosts(),
    content.getHome(),
  ]);
  const articles = selectArticles(posts, about.articles.featuredSlugs);

  return (
    <>
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <AboutHero about={about} />
        <AboutStory about={about} />
        {/* Pas de barre d'accent orange ici : mesuré absent sur le live pour
            cette page (le seul élément orange y est le bouton « START A PROJECT »). */}
        <ServicesSection
          services={about.services.items}
          intro={about.services.intro}
          bottomAccent="muted"
        />
        {/* Témoignage client : DEUX conditions, et il en faut deux. Le drapeau
            `siteFeatures.testimonials` suspend l'affichage ; `about.testimonial`
            dit s'il y a quelque chose à afficher. Le champ était obligatoire et
            portait un persona du template, supprimé le 2026-09-01 : le drapeau
            seul aurait republié un faux client au premier retour à `true`. */}
        {siteFeatures.testimonials && about.testimonial ? (
          <TestimonialsSection testimonials={[about.testimonial]} />
        ) : null}
        {/* Bande de logos défilante (140px) : elle sépare les témoignages du
            teaser blog sur la source, elle manquait ici. */}
        {home.logoBand ? <LogoBandSection logoBand={home.logoBand} /> : null}
        {/* Retrait haut MESURÉ à 30 en mobile sur `/about` (contre 40 sur la
            home) : la section faisait 2119 sur la source à 390 et 2129 chez
            nous, écart identique à 600 et 809. */}
        {/* Teaser blog : suit le drapeau `blog` comme la section « actualités »
            de la home (voir `src/content/features.ts`). */}
        {siteFeatures.blog ? (
          <ArticlesSection posts={articles} compactTop headingTabletPx={64} />
        ) : null}
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
