import createMiddleware from "next-intl/middleware";
import { supportedLanguages } from "./data/languages";

const locales = supportedLanguages.map((lang) => lang.code);
const defaultLocale = "en";

export const middleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|auth|.*\\.).*)", "/dashboard/:path*"],
};
