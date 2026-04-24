import MarketingModelsCatalog from '@/components/marketing/MarketingModelsCatalog';
import {
  buildCatalogPageMetadata,
  type CatalogPageProps,
} from '../catalogPageShared';

export async function generateMetadata({ params }: CatalogPageProps) {
  return buildCatalogPageMetadata(params.locale, "Image");
}

export default function ImageModelsPage() {
  return <MarketingModelsCatalog activeCategory="Image" />;
}
