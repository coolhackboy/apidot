import { Montserrat } from 'next/font/google';
import '../[locale]/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/sonner";

const montserrat = Montserrat({ subsets: ['latin'], variable: "--font-montserrat" });

export const metadata = {
  title: 'Authentication',
  description: 'OAuth callback handler',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
