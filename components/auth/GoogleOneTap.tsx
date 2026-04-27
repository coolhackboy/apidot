'use client';

import { useGoogleOneTapLogin } from '@react-oauth/google';
import { useSearchParams } from 'next/navigation';
import { toast } from "sonner";

import { apiService } from '@/services/api';
import { appConfig } from '@/data/config';
import { useUserContext } from '@/contexts/UserContext';
import {
  AFFILIATE_CODE_QUERY_PARAM,
  normalizeAffiliateCode,
} from '@/lib/affiliate-landing';
import { getInternalSourcePath, getSourceString } from '@/utils/source-detector';
import { useEffect, useState } from 'react';

export default function GoogleOneTap() {
  const { isLoggedIn, isLoading } = useUserContext();
  const searchParams = useSearchParams();
  const [shouldShowOneTap, setShouldShowOneTap] = useState(false);
  const affiliateCode = normalizeAffiliateCode(searchParams.get(AFFILIATE_CODE_QUERY_PARAM));

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      setShouldShowOneTap(true);
      return;
    }

    setShouldShowOneTap(false);
  }, [isLoading, isLoggedIn]);

  if (!shouldShowOneTap) {
    return null;
  }

  return <OneTapInner affiliateCode={affiliateCode} />;
}

function formatGoogleOneTapErrorMessage(detail?: string | null) {
  switch (detail) {
    case 'affiliate_code_invalid':
      return 'Referral code not found. Please check and try again.';
    case 'affiliate_code_inactive':
      return 'This referral code has expired. Please use another code.';
    case 'affiliate_code_vendor_mismatch':
      return 'This referral code is not valid for this site.';
    case 'affiliate_code_not_allowed':
      return 'This referral code is temporarily unavailable. Please use another code.';
    case 'social_email_not_verified':
      return 'This social account email is not verified. Please verify it first.';
    case 'social_account_conflict':
      return 'This social account is already linked to another account.';
    default:
      return null;
  }
}

function OneTapInner({ affiliateCode }: { affiliateCode?: string | null }) {
  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      try {
        const source = getSourceString();
        const internalSource = getInternalSourcePath();

        const data = await apiService.loginWithGoogle(
          credentialResponse.credential || '',
          appConfig.appName,
          source,
          internalSource,
          affiliateCode || undefined
        );

        localStorage.setItem(`${appConfig.appName}_token`, data.data.access_token);
        window.location.reload();
      } catch (error: any) {
        console.error('[GoogleOneTap] Login API Error:', error);
        const message = (error.message || "").toLowerCase();
        if (message.includes("device security") || message.includes("device is not supported") || message.includes("device fingerprint")) {
          toast.error("Device initialization failed. Please refresh the page and try again.");
        } else {
          const socialErrorMessage = formatGoogleOneTapErrorMessage(error.message);
          toast.error(socialErrorMessage || "Login Failed");
        }
      }
    },
    onError: () => {},
    use_fedcm_for_prompt: true,
  });

  return null;
}
