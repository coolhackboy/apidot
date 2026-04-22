import { supportedLanguages } from '@/data/languages';

export const AFFILIATE_CODE_QUERY_PARAM = 'affiliate_code';
export const OPEN_SIGNUP_QUERY_PARAM = 'open_signup';

const supportedLanguageCodes = new Set(supportedLanguages.map(({ code }) => code));

function normalizePathname(pathname: string) {
  if (!pathname) {
    return '/';
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function normalizeAffiliateCode(value: string | null | undefined) {
  return (value ?? '').trim();
}

export function isHomePathname(pathname: string) {
  const segments = normalizePathname(pathname).split('/').filter(Boolean);

  return segments.length === 0 || (segments.length === 1 && supportedLanguageCodes.has(segments[0]));
}

export function shouldOpenAffiliateSignup(
  pathname: string,
  affiliateCode: string,
  openSignup: string | null | undefined
) {
  return isHomePathname(pathname) && affiliateCode.length > 0 && openSignup === '1';
}
