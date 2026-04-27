import type { Metadata } from "next";
import { appConfig } from "@/data/config";
import ApiUsagePage from "@/components/dashboard/ApiUsagePage";

export const metadata: Metadata = {
  title: `Dashboard | ${appConfig.appNameInHeader}`,
  description: "Monitor usage, keys, billing, and generation history from the APIDot dashboard.",
  openGraph: {
    images: [{ url: "https://storage.apidot.ai/og/og.png" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [{ url: "https://storage.apidot.ai/og/og.png" }],
  },
};

export default function DashboardPage() {
  return <ApiUsagePage />;
}
