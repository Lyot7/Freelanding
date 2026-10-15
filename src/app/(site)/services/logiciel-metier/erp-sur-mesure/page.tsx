import { metadataTheme, RouteTheme } from "@/components/pages/services/RouteTheme";

/** `/services/logiciel-metier/erp-sur-mesure` : contenu dans `src/content/page-erp.ts`. */
export const generateMetadata = () => metadataTheme("erp-sur-mesure");

export default function Page() {
  return <RouteTheme id="erp-sur-mesure" />;
}
