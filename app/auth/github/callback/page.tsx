'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { apiService } from '@/services/api';

import { Loader2 } from 'lucide-react';

function formatGitHubAuthErrorMessage(detail?: string | null) {
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
      return detail || 'Failed to complete GitHub login';
  }
}

function GitHubCallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (errorParam) {
        setError(errorDescription || errorParam);
        setProcessing(false);
        return;
      }

      // Validate code
      if (!code) {
        setError('No authorization code received from GitHub');
        setProcessing(false);
        return;
      }

      // Validate state for CSRF protection
      const storedState = sessionStorage.getItem('github_oauth_state');
      if (!storedState || storedState !== state) {
        setError('Invalid state parameter. Please try logging in again.');
        setProcessing(false);
        return;
      }

      // Get stored app_name
      const appName = sessionStorage.getItem('github_oauth_app_name');
      if (!appName) {
        setError('Session expired. Please try logging in again.');
        setProcessing(false);
        return;
      }

      // Get stored source and internal_source (saved when user clicked login button)
      const source = sessionStorage.getItem('github_oauth_source') || 'direct_visit';
      const internalSource = sessionStorage.getItem('github_oauth_internal_source') || '/';
      const affiliateCode = sessionStorage.getItem('github_oauth_affiliate_code') || undefined;

      try {
        // Call backend API to exchange code for token and login/register
        const response = await apiService.loginWithGitHub(
          code,
          appName,
          source,
          internalSource,
          affiliateCode
        );

        if (response.code === 200 && response.data.access_token) {
          // Store the token
          localStorage.setItem(`${appName}_token`, response.data.access_token);

          // Clean up session storage
          sessionStorage.removeItem('github_oauth_state');
          sessionStorage.removeItem('github_oauth_app_name');
          sessionStorage.removeItem('github_oauth_source');
          sessionStorage.removeItem('github_oauth_internal_source');
          sessionStorage.removeItem('github_oauth_affiliate_code');

          toast.success('Login successful!');

          // Redirect to home page
          window.location.href = '/';
        } else {
          throw new Error('Login failed');
        }
      } catch (err: any) {
        console.error('GitHub login error:', err);
        setError(formatGitHubAuthErrorMessage(err.message));

        // Clean up session storage
        sessionStorage.removeItem('github_oauth_state');
        sessionStorage.removeItem('github_oauth_app_name');
        sessionStorage.removeItem('github_oauth_source');
        sessionStorage.removeItem('github_oauth_internal_source');
        sessionStorage.removeItem('github_oauth_affiliate_code');
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Completing GitHub login...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-xl mb-4">Login Failed</div>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <GitHubCallbackContent />
    </Suspense>
  );
}
