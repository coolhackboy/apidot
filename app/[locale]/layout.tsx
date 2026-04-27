import { JetBrains_Mono, Sora } from 'next/font/google';
import type { Metadata } from 'next';
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
const sora = Sora({
  subsets: ['latin'],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.webUrl),
  title: {
    default: `${appConfig.appNameInHeader} | Unified AI API Platform`,
    template: `%s | ${appConfig.appNameInHeader}`,
  },
  description: "Unified AI API platform for image, video, audio, and chat models.",
  openGraph: {
    siteName: appConfig.appNameInHeader,
    images: [{ url: "https://storage.apidot.ai/og/og.png" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [{ url: "https://storage.apidot.ai/og/og.png" }],
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
      <body className={`${sora.variable} ${jetBrainsMono.variable}`}>
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
        {/* <FacebookPixel /> */}

      </body>
    </html>
  );
}
