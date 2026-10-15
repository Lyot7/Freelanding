import { metadataTheme, RouteTheme } from "@/components/pages/services/RouteTheme";

/** `/services/site-vitrine/artisans` : contenu dans `src/content/page-artisans.ts`. */
export const generateMetadata = () => metadataTheme("artisans");

export default function Page() {
  return <RouteTheme id="artisans" />;
}
