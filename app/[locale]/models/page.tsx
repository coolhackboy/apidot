import MarketingModelsCatalog from '@/components/marketing/MarketingModelsCatalog';
import { Metadata } from 'next';
import { appConfig } from '@/data/config';
import { defaultLocale, locales } from '@/i18n/routing';

interface PageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const path = '/models';
  const canonical =
    locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;
  const languages = Object.fromEntries(
    locales.map((supportedLocale) => [
      supportedLocale,
      supportedLocale === defaultLocale
        ? `${appConfig.webUrl}${path}`
        : `${appConfig.webUrl}/${supportedLocale}${path}`,
    ])
  );
  const title = `Model APIs | Image and Video Models | ${appConfig.appNameInHeader}`;
  const description =
    `Explore APIDot's active image and video model lineup, including GPT Image 2, Seedance 2, and Veo 3.1.`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        'x-default': `${appConfig.webUrl}${path}`,
      },
    },
    openGraph: {
      type: 'website',
      locale,
      title,
      description,
      url: canonical,
      siteName: appConfig.appNameInHeader,
      images: [{ url: appConfig.appLogoUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: appConfig.appLogoUrl }],
    },
  };
}

export default function MarketPage() {
  return <MarketingModelsCatalog />;
}
