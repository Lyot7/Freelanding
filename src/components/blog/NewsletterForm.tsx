"use client";

/**
 * Bloc « Newsletter » du pied d'article — composant CLIENT.
 *
 * IL NE MENAIT NULLE PART : `<form>` sans `action` ni `onSubmit`, sur un site
 * sans service d'envoi de lettre d'information. Le lecteur saisissait son
 * adresse, appuyait sur « S'inscrire » et la page se rechargeait ; personne
 * n'était inscrit à rien.
 *
 * DEUX SORTIES POSSIBLES, ET LE CHOIX RETENU. Le retirer aurait été honnête et
 * aurait coûté un point de contact sur le seul endroit du site où quelqu'un
 * lit déjà Eliott. Fabriquer un faux succès était exclu. Il est donc BRANCHÉ
 * sur `POST /api/contact` avec l'intention `newsletter` : l'adresse arrive dans
 * la boîte d'Eliott, et le lecteur reçoit un accusé de réception qui dit
 * exactement ce qui va se passer — des notes envoyées à la main, pas plus d'une
 * fois par mois, et « stop » en réponse pour se désinscrire. Aucune promesse
 * qui ne soit tenue par un humain existant.
 *
 * Le jour où un service d'envoi est mis en place, seule la destination change :
 * l'intention `newsletter` est déjà distincte côté serveur.
 */

import { Reveal } from "@/components/motion/Reveal";
import { SwapText } from "@/components/ui";
import { SocialGlyph } from "@/components/layout/SocialGlyph";
import {
  ChampsProtection,
  MessageEtat,
  ReplisSansScript,
} from "@/components/forms/ProtectionFormulaire";
import { useEnvoiFormulaire } from "@/components/forms/useEnvoiFormulaire";
import type { NewsletterContent, SiteConfig } from "@/lib/content/types";

export function NewsletterForm({
  newsletter,
  socials,
  emailContact,
}: {
  /**
   * Contenu du bloc, passé en PROPRIÉTÉ et non lu ici.
   *
   * Importer `@/content/blog` depuis un composant client embarquerait tout le
   * registre des articles dans le paquet du navigateur, pour cinq chaînes.
   */
  newsletter: NewsletterContent;
  socials: SiteConfig["socials"];
  /** Adresse publiée, affichée en repli quand l'envoi ne peut pas aboutir. */
  emailContact: string;
}) {
  const envoi = useEnvoiFormulaire("newsletter", emailContact);
  const enCours = envoi.etat === "envoi";

  // Le décalage `-ml-[20px]` compensait un rembourrage gauche de la colonne qui
  // n'existe pas sur la source : le bloc newsletter occupe exactement la
  // demi-colonne (381 px à 810, 690 px à 1440, 720 px à 1920, relevés). Son
  // rembourrage haut vaut 30 px à 390 et 50 px au-dessus, ce que nous avions
  // déjà juste.
  return (
    <form
      className="relative mt-[30px] tablet:mt-[50px]"
      /* Voir `ReplisSansScript` : en POST, jamais en GET, pour qu'une
         soumission sans script ne remonte pas l'adresse dans l'URL. */
      method="post"
      action="/api/contact"
      onSubmit={envoi.gererSoumission}
      onFocusCapture={envoi.protection.activer}
    >
      {/* MESURÉ sur le live : le bloc titre + accroche (`framer-1k04ubz`,
          690×63) et la rangée de saisie (`framer-185jd9k`, 500×50) apparaissent
          en FONDU SEUL (opacité seule qui varie pendant le balayage, aucun
          transform). Chez nous les deux étaient figés : ils comptaient pour 2
          des 9 éléments animés du live absents du clone. */}
      <Reveal as="div" initialOpacity={0.001} duration={0.8} delay={0.15}>
        {/* Relevé sur le live : 18px sous 1200 (interligne 21,6) et 20px
            au-delà (interligne 24), interlettrage -0,01em. Nous étions à 20px
            partout en -0,04em, soit 2,4 px de trop à 390 et à 810. */}
        <h2 className="text-[18px] font-medium leading-[1.2] tracking-[-0.01em] desktop:text-[20px]">
          {newsletter.title}
        </h2>
        <p className="mt-[8px] max-w-[230px] text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-background/60">
          {newsletter.body}
        </p>
      </Reveal>
      <Reveal
        as="div"
        className="mt-[18px] flex max-w-[500px] flex-col tablet:mt-[22px] tablet:flex-row"
        initialOpacity={0.001}
        duration={0.8}
        delay={0.25}
      >
        {/* Nom accessible porté par `aria-label` et non plus par un `<label>`
            en `sr-only` : le libellé visible du bouton est le SEUL texte de la
            rangée sur le live (relevé « SubscribeSubscribe » sur la source
            anglophone, soit les deux copies du swap — chez nous
            « S’inscrireS’inscrire »), un texte masqué en plus aurait décalé
            l'appariement des deux DOM sans rien apporter au lecteur d'écran. */}
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-label={newsletter.emailLabel}
          placeholder={newsletter.placeholder}
          aria-invalid={envoi.champEnErreur === "email" || undefined}
          // `outline-none` retiré : voir `src/app/focus.css`.
          className="h-[50px] w-full flex-none border border-background/10 bg-transparent px-[15px] text-[14px] font-medium text-background placeholder:text-background/30 focus:border-background/40 tablet:min-w-0 tablet:flex-1"
        />
        <button
          type="submit"
          disabled={enCours}
          // 13px / interligne 1,2 / -0,01em relevés sur le live, et non 12px
          // sans interlettrage. La hauteur du bouton reste fixée à 50px des
          // deux côtés, la taille ne change donc que le libellé.
          className="group relative mt-[10px] flex h-[50px] shrink-0 items-center justify-center overflow-hidden bg-background px-[20px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-opacity disabled:cursor-progress disabled:opacity-60 tablet:mt-0 tablet:w-[112px]"
        >
          {/* Libellé en double copie clippée, comme tous les boutons de la
              source (le live relève bien « SubscribeSubscribe ») : au survol la
              copie visible sort et la copie masquée prend sa place. Même
              composant `.framer-yuvr8` que l'envoi du formulaire de contact,
              relevé sur `/live-proxy/blog/stop-hiding-your-prices` : 12 px vers
              le BAS, fondu croisé, 430 ms. */}
          <SwapText travel={12}>
            {enCours ? "Envoi…" : newsletter.submitLabel}
          </SwapText>
        </button>
      </Reveal>

      {/* État d'envoi. Le bloc annonce une inscription : il doit donc dire ce
          qui s'est réellement passé, et surtout ne rien affirmer quand l'envoi
          échoue. */}
      <MessageEtat
        etat={envoi.etat}
        message={envoi.message}
        className="mt-[12px] max-w-[500px]"
      />

      <ReplisSansScript emailContact={emailContact} />
      <ChampsProtection refConteneur={envoi.protection.refConteneur} />

      <div className="mt-[18px] flex gap-[8px] tablet:mt-[22px]">
        {/* Les glyphes étaient DEUX SVG du template (X et Instagram), servis
            depuis `framerusercontent.com` et appariés au RANG du lien : comme
            `socials` ne contenait alors que GitHub, le blog affichait le glyphe
            de X au-dessus d'un lien vers GitHub. Le glyphe vient désormais du
            réseau lui-même (`SocialGlyph`), comme dans le pied de page.

            `text-background` : la pastille est CLAIRE ici et sombre en pied de
            page. C'est exactement pour ça que le glyphe est rendu inline plutôt
            que par une balise `<img>` : il hérite de la couleur de son hôte au
            lieu de retomber sur un noir qui disparaît sur l'un des deux fonds. */}
        {socials.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            /* `rgb(245,245,245)` relevé sur la source. `bg-white/60` composait
               ≈ #f2f2f2 sur le #e9e9e9 de la page : proche, mais dépendant du
               fond, donc faux dès que le fond change. */
            className="flex h-[37px] w-[37px] items-center justify-center rounded-full bg-[rgb(245,245,245)] text-background"
          >
            <SocialGlyph
              social={social}
              className="h-[18px] w-[18px] opacity-50"
            />
          </a>
        ))}
      </div>
    </form>
  );
}
