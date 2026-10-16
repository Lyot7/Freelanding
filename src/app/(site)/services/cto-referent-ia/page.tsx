import { metadataTheme, RouteTheme } from "@/components/pages/services/RouteTheme";

/** `/services/cto-referent-ia` : contenu dans `src/content/page-cto.ts`. */
export const generateMetadata = () => metadataTheme("cto-referent-ia");

export default function Page() {
  return <RouteTheme id="cto-referent-ia" />;
}
