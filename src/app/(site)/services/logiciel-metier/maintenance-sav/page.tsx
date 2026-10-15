import { metadataTheme, RouteTheme } from "@/components/pages/services/RouteTheme";

/** `/services/logiciel-metier/maintenance-sav` : contenu dans `src/content/page-gmao.ts`. */
export const generateMetadata = () => metadataTheme("maintenance-sav");

export default function Page() {
  return <RouteTheme id="maintenance-sav" />;
}
