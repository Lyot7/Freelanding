/**
 * Bloc de données structurées.
 *
 * `JSON.stringify` puis injection : le contenu vient de la donnée du site, donc
 * de l'admin, et une chaîne qui contiendrait `</script>` fermerait la balise en
 * plein milieu et laisserait le reste s'exécuter comme du HTML. On échappe donc
 * le chevron fermant, seule séquence capable de sortir du script.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
