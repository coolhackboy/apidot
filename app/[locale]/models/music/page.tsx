import MarketingModelsCatalog from '@/components/marketing/MarketingModelsCatalog';
import {
  buildCatalogPageMetadata,
  type CatalogPageProps,
} from '../catalogPageShared';

export async function generateMetadata({ params }: CatalogPageProps) {
  return buildCatalogPageMetadata(params.locale, "Music");
}

export default function MusicModelsPage() {
  return <MarketingModelsCatalog activeCategory="Music" />;
}
