import { metadataTheme, RouteTheme } from "@/components/pages/services/RouteTheme";

/** `/services/automatisation` : contenu dans `src/content/page-automatisation.ts`. */
export const generateMetadata = () => metadataTheme("automatisation");

export default function Page() {
  return <RouteTheme id="automatisation" />;
}
