import MarketingModelsCatalog from '@/components/marketing/MarketingModelsCatalog';
import {
  buildCatalogPageMetadata,
  type CatalogPageProps,
} from '../catalogPageShared';

export async function generateMetadata({ params }: CatalogPageProps) {
  return buildCatalogPageMetadata(params.locale, "Chat");
}

export default function ChatModelsPage() {
  return <MarketingModelsCatalog activeCategory="Chat" />;
}
