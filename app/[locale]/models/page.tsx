import MarketingModelsCatalog from '@/components/marketing/MarketingModelsCatalog';
import {
  buildCatalogPageMetadata,
  redirectLegacyCatalogQueryIfNeeded,
  type CatalogIndexPageProps,
} from './catalogPageShared';

export async function generateMetadata({ params }: CatalogIndexPageProps) {
  return buildCatalogPageMetadata(params.locale, "all");
}

export default function MarketPage({ params, searchParams }: CatalogIndexPageProps) {
  redirectLegacyCatalogQueryIfNeeded(params.locale, searchParams?.category);

  return <MarketingModelsCatalog activeCategory="all" />;
}
