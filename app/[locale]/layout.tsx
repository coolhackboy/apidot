import { Montserrat } from 'next/font/google';
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import FacebookPixel from '@/components/FacebookPixel';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/sonner";
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ScrollProgress } from '@/components/common/ScrollProgress';
import { PageLoading } from '@/components/common/PageLoading';
import { RouteChangeProvider } from '@/components/common/RouteChangeProvider';
import ConditionalLayout from '@/components/common/ConditionalLayout';

import AnnouncementModal from '@/components/common/AnnouncementModal';
import { UserProvider } from '@/contexts/UserContext';
import GoogleOneTap from '@/components/auth/GoogleOneTap';
import { appConfig } from '@/data/config';
const montserrat = Montserrat({ subsets: ['latin'], variable: "--font-montserrat" });

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.webUrl),
  title: {
    default: `${appConfig.appNameInHeader} | Unified AI API Platform`,
    template: `%s | ${appConfig.appNameInHeader}`,
  },
  description: "Unified AI API platform for image, video, audio, and chat models.",
  openGraph: {
    siteName: appConfig.appNameInHeader,
    images: [{ url: appConfig.appLogoUrl }],
  },
  twitter: {
    card: "summary_large_image",
    images: [{ url: appConfig.appLogoUrl }],
  },
};


export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {

  const messages = await getMessages();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const shouldLoadGoogleOAuth = Boolean(googleClientId);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NHQH3RLS');`}
        </Script>
      </head>
      <body className={montserrat.className}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NHQH3RLS"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {shouldLoadGoogleOAuth ? (
              <GoogleOAuthProvider clientId={googleClientId}>
                <UserProvider>
                  <GoogleOneTap />
                  <RouteChangeProvider>
                    <ScrollProgress />
                    <PageLoading />
                    <ConditionalLayout>
                      {children}
                    </ConditionalLayout>
                    <ScrollToTop />
                    <Toaster />
                    {/* <AnnouncementModal locale={locale} /> */}
                  </RouteChangeProvider>
                </UserProvider>
              </GoogleOAuthProvider>
            ) : (
              <UserProvider>
                <RouteChangeProvider>
                  <ScrollProgress />
                  <PageLoading />
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                  <ScrollToTop />
                  <Toaster />
                  {/* <AnnouncementModal locale={locale} /> */}
                </RouteChangeProvider>
              </UserProvider>
            )}
          </NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalytics />
        <FacebookPixel />

      </body>
    </html>
  );
}
