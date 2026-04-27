'use client';

import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from "sonner";
import {
  apiService,
  type AffiliateCodeCheckDetail,
} from '@/services/api';
import { cn } from "@/lib/utils";
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from 'next-intl';
import { getInternalSourcePath, getSourceString, getUtmData } from '@/utils/source-detector';
import { useUserContext } from '@/contexts/UserContext';
import { appConfig } from '@/data/config';

import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';

// GitHub Icon Component
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

interface LoginFormProps {
  app_name: string;
  onLoginSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: 'login' | 'register';
  defaultAffiliateCode?: string;
}

type ViewType = 'login' | 'register' | 'forgot-password' | 'reset-password';

type AffiliateValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';
type AffiliateValidationResult = Extract<AffiliateValidationStatus, 'valid' | 'invalid'>;
type AffiliateCodeValidationError = Error & {
  status?: number;
  detail?: string;
};

function isAbortError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }

  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
  );
}

const LoginForm = ({
  app_name,
  onLoginSuccess,
  open,
  onOpenChange,
  defaultView = 'login',
  defaultAffiliateCode = '',
}: LoginFormProps) => {
  const tModal = useTranslations('Global.Common.modals.login');
  const tAuth = useTranslations('Auth.Login');
  const { isLoggedIn } = useUserContext();
  const brandLogo = appConfig.appLogoUrl;
  const brandLogoAlt = `${appConfig.appNameInHeader} logo`;
  const affiliateCodeLabel = tModal('affiliateCode.label');
  const affiliateCodePlaceholder = tModal('affiliateCode.placeholder');
  const normalizedDefaultAffiliateCode = defaultAffiliateCode.trim();
  const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const githubRedirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/github/callback`
    : '';
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewType>(defaultView);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [affiliateCode, setAffiliateCode] = useState(normalizedDefaultAffiliateCode);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [affiliateValidationStatus, setAffiliateValidationStatus] =
    useState<AffiliateValidationStatus>('idle');
  const [lastValidatedCode, setLastValidatedCode] = useState('');
  const [lastValidationResult, setLastValidationResult] =
    useState<AffiliateValidationResult | null>(null);
  const [isAffiliateCodeDirty, setIsAffiliateCodeDirty] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const affiliateValidationAbortControllerRef = useRef<AbortController | null>(null);
  const affiliateValidationRequestIdRef = useRef(0);

  const cancelAffiliateValidationRequest = useCallback(() => {
    affiliateValidationRequestIdRef.current += 1;
    affiliateValidationAbortControllerRef.current?.abort();
    affiliateValidationAbortControllerRef.current = null;
  }, []);

  const resetAffiliateValidationState = useCallback((nextCode: string, dirty: boolean = false) => {
    cancelAffiliateValidationRequest();
    setAffiliateValidationStatus('idle');
    setLastValidatedCode('');
    setLastValidationResult(null);
    setIsAffiliateCodeDirty(dirty && nextCode.length > 0);
    setValidationMessage(null);
  }, [cancelAffiliateValidationRequest]);

  const getAffiliateValidationErrorMessage = useCallback((detail?: string | null) => {
    switch (detail as AffiliateCodeCheckDetail | undefined) {
      case 'affiliate_code_invalid':
        return tModal('affiliateCode.errors.affiliate_code_invalid');
      case 'affiliate_code_inactive':
        return tModal('affiliateCode.errors.affiliate_code_inactive');
      case 'affiliate_code_vendor_mismatch':
        return tModal('affiliateCode.errors.affiliate_code_vendor_mismatch');
      case 'affiliate_code_not_allowed':
        return tModal('affiliateCode.errors.affiliate_code_not_allowed');
      case 'vendor_not_found':
        return tModal('affiliateCode.errors.vendor_not_found');
      default:
        return tModal('affiliateCode.errors.affiliate_code_invalid');
    }
  }, [tModal]);

  const getSocialAuthErrorMessage = useCallback((detail?: string | null) => {
    switch (detail) {
      case 'affiliate_code_invalid':
      case 'affiliate_code_inactive':
      case 'affiliate_code_vendor_mismatch':
      case 'affiliate_code_not_allowed':
      case 'vendor_not_found':
        return getAffiliateValidationErrorMessage(detail as AffiliateCodeCheckDetail);
      case 'social_email_not_verified':
        return tAuth('social.accountNotVerified');
      case 'social_account_conflict':
        return tAuth('social.accountConflict');
      default:
        return null;
    }
  }, [getAffiliateValidationErrorMessage, tAuth]);

  const validateAffiliateCode = useCallback(async (
    affiliateCodeValue: string
  ): Promise<AffiliateValidationResult | 'unavailable' | 'skipped'> => {
    const sanitizedAffiliateCode = affiliateCodeValue.trim();

    if (
      !sanitizedAffiliateCode ||
      !open ||
      view !== 'register' ||
      isLoggedIn
    ) {
      return 'skipped';
    }

    cancelAffiliateValidationRequest();
    const controller = new AbortController();
    const requestId = affiliateValidationRequestIdRef.current + 1;
    affiliateValidationRequestIdRef.current = requestId;
    affiliateValidationAbortControllerRef.current = controller;

    setAffiliateValidationStatus('checking');
    setLastValidatedCode('');
    setLastValidationResult(null);
    setValidationMessage(tModal('affiliateCode.checking'));

    try {
      const response = await apiService.checkAffiliateCode(
        {
          affiliate_code: sanitizedAffiliateCode,
          slug: app_name,
        },
        { signal: controller.signal }
      );

      if (affiliateValidationRequestIdRef.current !== requestId) {
        return 'skipped';
      }

      if (response.code === 200 && response.data.valid === true) {
        setAffiliateValidationStatus('valid');
        setLastValidatedCode(sanitizedAffiliateCode);
        setLastValidationResult('valid');
        setIsAffiliateCodeDirty(false);
        setValidationMessage(tModal('affiliateCode.valid'));
        return 'valid';
      }

      if (response.code === 200 && response.data.valid === false) {
        setAffiliateValidationStatus('invalid');
        setLastValidatedCode(sanitizedAffiliateCode);
        setLastValidationResult('invalid');
        setIsAffiliateCodeDirty(false);
        setValidationMessage(
          response.data.message ||
            getAffiliateValidationErrorMessage(response.data.reason) ||
            tModal('affiliateCode.errors.affiliate_code_invalid')
        );
        return 'invalid';
      }

      setAffiliateValidationStatus('idle');
      setLastValidatedCode(sanitizedAffiliateCode);
      setLastValidationResult(null);
      setIsAffiliateCodeDirty(false);
      setValidationMessage(null);
      return 'unavailable';
    } catch (error) {
      if (isAbortError(error)) {
        return 'skipped';
      }

      if (affiliateValidationRequestIdRef.current !== requestId) {
        return 'skipped';
      }

      setAffiliateValidationStatus('idle');
      setLastValidatedCode(sanitizedAffiliateCode);
      setLastValidationResult(null);
      setIsAffiliateCodeDirty(false);
      setValidationMessage(null);
      return 'unavailable';
    } finally {
      if (affiliateValidationAbortControllerRef.current === controller) {
        affiliateValidationAbortControllerRef.current = null;
      }
    }
  }, [app_name, cancelAffiliateValidationRequest, getAffiliateValidationErrorMessage, isLoggedIn, open, tModal, view]);

  const handleLoginSuccess = (data: any) => {
    localStorage.setItem(`${app_name}_token`, data.data.access_token);
    if (onLoginSuccess) {
      onLoginSuccess();
    }
    window.location.reload();
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUserName('');
    setAffiliateCode(normalizedDefaultAffiliateCode);
    setVerificationCode('');
    setCodeSent(false);
    setCountdown(0);
    resetAffiliateValidationState(normalizedDefaultAffiliateCode, false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUserName('');
    setAffiliateCode(normalizedDefaultAffiliateCode);
    setVerificationCode('');
    setCodeSent(false);
    setCountdown(0);
    setView(defaultView);
    resetAffiliateValidationState(normalizedDefaultAffiliateCode, false);
  }, [defaultView, normalizedDefaultAffiliateCode, open, resetAffiliateValidationState]);

  useEffect(() => {
    return () => {
      cancelAffiliateValidationRequest();
    };
  }, [cancelAffiliateValidationRequest]);

  const handleSocialLoginError = useCallback((error: any, providerLabel: string) => {
    const errorMessage = typeof error?.message === 'string' ? error.message : '';
    const normalizedMessage = errorMessage.trim();
    const lowerMessage = normalizedMessage.toLowerCase();

    if (
      lowerMessage.includes("device security") ||
      lowerMessage.includes("device is not supported") ||
      lowerMessage.includes("device fingerprint")
    ) {
      toast.error(tModal('deviceNotSupported') || "Device initialization failed. Please refresh the page and try again.");
      return;
    }

    const socialErrorMessage = getSocialAuthErrorMessage(normalizedMessage);
    if (socialErrorMessage) {
      toast.error(socialErrorMessage);
      return;
    }

    toast.error(tAuth('social.loginFailedTitle'), {
      description: tAuth('social.providerError', { provider: providerLabel })
    });
  }, [getSocialAuthErrorMessage, tAuth, tModal]);

  const handleSocialLoginSuccess = useCallback((data: any, provider: 'google' | 'github' | 'google_one_tap') => {
    handleLoginSuccess(data);
  }, [handleLoginSuccess]);

  const handleGoogleSocialLogin = useCallback(async (credential: string) => {
    try {
      setLoading(true);
      const source = getSourceString();
      const internalSource = getInternalSourcePath();
      const utmData = getUtmData();
      const sanitizedAffiliateCode = affiliateCode.trim();

      const data = await apiService.loginWithGoogle(
        credential,
        app_name,
        source,
        internalSource,
        sanitizedAffiliateCode || undefined,
        {
          first_utm_source: utmData.utm_source,
          first_utm_campaign: utmData.utm_campaign,
          first_utm_medium: utmData.utm_medium,
          registration_page: utmData.registration_page,
        }
      );

      handleSocialLoginSuccess(data, 'google');
    } catch (error: any) {
      handleSocialLoginError(error, 'Google');
    } finally {
      setLoading(false);
    }
  }, [affiliateCode, app_name, handleSocialLoginError, handleSocialLoginSuccess]);

  const handleGitHubLogin = useCallback(() => {
    if (!githubClientId) {
      toast.error(tAuth('social.githubNotConfigured'));
      return;
    }

    const scope = 'read:user user:email';
    const state = Math.random().toString(36).substring(7);
    const sanitizedAffiliateCode = affiliateCode.trim();

    // Persist the OAuth context locally because GitHub only gives us code/state on return.
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('github_oauth_state', state);
      sessionStorage.setItem('github_oauth_app_name', app_name);
      sessionStorage.setItem('github_oauth_source', getSourceString());
      sessionStorage.setItem('github_oauth_internal_source', getInternalSourcePath() || window.location.pathname);
      if (sanitizedAffiliateCode) {
        sessionStorage.setItem('github_oauth_affiliate_code', sanitizedAffiliateCode);
      } else {
        sessionStorage.removeItem('github_oauth_affiliate_code');
      }
    }

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(githubRedirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = githubAuthUrl;
  }, [affiliateCode, app_name, githubClientId, githubRedirectUri, tAuth]);

  const renderSocialLoginButtons = useCallback((mode: 'login' | 'register') => (
    <div className="flex justify-center">
      <div className="w-full max-w-[320px] space-y-3">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            await handleGoogleSocialLogin(credentialResponse.credential || '');
          }}
          onError={() => {
            toast.error(tAuth('social.loginFailedTitle'), {
              description: tAuth('social.googleError')
            });
          }}
          theme="filled_blue"
          size="large"
          width="320"
          text={mode === 'register' ? 'continue_with' : 'signin_with'}
        />

        {githubClientId && (
          <Button
            variant="outline"
            className="w-full h-10 flex items-center justify-center gap-2"
            onClick={handleGitHubLogin}
            disabled={loading}
          >
            <GitHubIcon className="h-5 w-5" />
            <span>{mode === 'register' ? tAuth('social.continueWithGithub') : tAuth('social.signInWithGithub')}</span>
          </Button>
        )}
      </div>
    </div>
  ), [githubClientId, handleGitHubLogin, handleGoogleSocialLogin, loading, tAuth]);

  useEffect(() => {
    const sanitizedAffiliateCode = affiliateCode.trim();

    if (
      !open ||
      view !== 'register' ||
      isLoggedIn ||
      affiliateValidationStatus === 'checking' ||
      isAffiliateCodeDirty ||
      !sanitizedAffiliateCode ||
      sanitizedAffiliateCode !== normalizedDefaultAffiliateCode ||
      lastValidatedCode === sanitizedAffiliateCode
    ) {
      return;
    }

    void validateAffiliateCode(sanitizedAffiliateCode);
  }, [
    affiliateCode,
    affiliateValidationStatus,
    isAffiliateCodeDirty,
    isLoggedIn,
    lastValidatedCode,
    normalizedDefaultAffiliateCode,
    open,
    validateAffiliateCode,
    view,
  ]);

  const handleAffiliateCodeBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
    const sanitizedAffiliateCode = event.currentTarget.value.trim();

    if (
      !open ||
      view !== 'register' ||
      isLoggedIn ||
      affiliateValidationStatus === 'checking' ||
      !sanitizedAffiliateCode
    ) {
      return;
    }

    if (
      sanitizedAffiliateCode === lastValidatedCode &&
      lastValidationResult !== null &&
      !isAffiliateCodeDirty
    ) {
      return;
    }

    void validateAffiliateCode(sanitizedAffiliateCode);
  }, [
    affiliateValidationStatus,
    isAffiliateCodeDirty,
    isLoggedIn,
    lastValidatedCode,
    lastValidationResult,
    open,
    validateAffiliateCode,
    view,
  ]);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Send verification code
  const handleSendCode = async (type: 'register' | 'reset_password') => {
    if (!email) {
      toast.error(tAuth('errors.enterEmail'));
      return;
    }

    try {
      setLoading(true);
      await apiService.sendVerificationCode(email, type, app_name);
      setCodeSent(true);
      startCountdown();
      toast.success(tAuth('errors.codeSent'));
    } catch (error: any) {
      toast.error(error.message || tAuth('errors.sendCodeFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Email login
  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error(tAuth('errors.enterEmailAndPassword'));
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.loginWithEmail({ username: email, password }, app_name);
      handleLoginSuccess(data);
    } catch (error: any) {
      toast.error(error.message || tAuth('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const submitEmailRegistration = async (sanitizedAffiliateCode: string) => {
    const source = getSourceString();
    const internalSource = getInternalSourcePath();
    const utmData = getUtmData();

    return apiService.registerWithEmail({
      email,
      password,
      verification_code: verificationCode,
      user_name: userName,
      slug: app_name,
      ...(sanitizedAffiliateCode ? { affiliate_code: sanitizedAffiliateCode } : {}),
      source,
      internal_source: internalSource,
      first_utm_source: utmData.utm_source,
      first_utm_campaign: utmData.utm_campaign,
      first_utm_medium: utmData.utm_medium,
      registration_page: utmData.registration_page,
    });
  };

  // Email registration
  const handleEmailRegister = async () => {
    if (!email || !password || !userName || !verificationCode) {
      toast.error(tAuth('errors.fillAllFields'));
      return;
    }

    if (password.length < 8) {
      toast.error(tAuth('errors.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(tAuth('errors.passwordsMismatch'));
      return;
    }

    const sanitizedAffiliateCode = affiliateCode.trim();
    const hasAffiliateCode = sanitizedAffiliateCode.length > 0;
    const hasCurrentValidation =
      hasAffiliateCode &&
      sanitizedAffiliateCode === lastValidatedCode &&
      !isAffiliateCodeDirty &&
      lastValidationResult !== null;

    if (hasCurrentValidation && lastValidationResult === 'invalid') {
      return;
    }

    try {
      setLoading(true);
      if (hasAffiliateCode && !hasCurrentValidation) {
        const validationResult = await validateAffiliateCode(sanitizedAffiliateCode);

        if (validationResult === 'invalid') {
          return;
        }
      }

      const data = await submitEmailRegistration(sanitizedAffiliateCode);

      handleLoginSuccess(data);
    } catch (error: any) {
      const message = (error.message || "").toLowerCase();
      if (message.includes("device security") || message.includes("device is not supported") || message.includes("device fingerprint")) {
        toast.error(tModal('deviceNotSupported') || "Device initialization failed. Please refresh the page and try again.");
      } else {
        toast.error(error.message || tAuth('errors.registrationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error(tAuth('errors.enterEmail'));
      return;
    }

    try {
      setLoading(true);
      await apiService.forgotPassword(email, app_name);
      setCodeSent(true);
      startCountdown();
      setView('reset-password');
      toast.success(tAuth('errors.codeSent'));
    } catch (error: any) {
      toast.error(error.message || tAuth('errors.sendResetCodeFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!email || !verificationCode || !password) {
      toast.error(tAuth('errors.fillAllFields'));
      return;
    }

    if (password.length < 8) {
      toast.error(tAuth('errors.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(tAuth('errors.passwordsMismatch'));
      return;
    }

    try {
      setLoading(true);
      await apiService.resetPassword({
        email,
        verification_code: verificationCode,
        new_password: password,
        slug: app_name,
      });

      toast.success(tAuth('success.passwordReset'));
      resetForm();
      setView('login');
    } catch (error: any) {
      toast.error(error.message || tAuth('errors.passwordResetFailed'));
    } finally {
      setLoading(false);
    }
  };

  const renderLoginView = () => {
    return (
    <div className="space-y-4">
      {renderSocialLoginButtons('login')}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {tAuth('divider')}
          </span>
        </div>
      </div>

      {/* Email Login Form */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">{tAuth('fields.email.label')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder={tAuth('fields.email.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{tAuth('fields.password.label')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder={tAuth('fields.password.placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => {
              resetForm();
              setView('forgot-password');
            }}
          >
            {tAuth('actions.forgotPassword')}
          </button>
        </div>

        <Button
          className="w-full"
          onClick={handleEmailLogin}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {tAuth('actions.signIn')}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {tAuth('hints.noAccount')}{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {
              resetForm();
              setView('register');
            }}
          >
            {tAuth('actions.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
  };

  const renderRegisterView = () => {
    const showAffiliateValidationMessage =
      affiliateCode.trim().length > 0 && affiliateValidationStatus !== 'idle';
    const affiliateValidationMessageClassName =
      affiliateValidationStatus === 'valid'
        ? 'text-emerald-600'
        : affiliateValidationStatus === 'invalid'
          ? 'text-destructive'
          : 'text-muted-foreground';

    return (
      <div className="space-y-4">
        <button
          type="button"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            resetForm();
            setView('login');
          }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {tAuth('actions.backToLogin')}
        </button>

        {renderSocialLoginButtons('register')}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {tAuth('divider')}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reg-email">{tAuth('fields.email.label')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-email"
                type="email"
                placeholder={tAuth('fields.email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-code">{tAuth('fields.verificationCode.label')}</Label>
            <div className="flex gap-2">
              <Input
                id="verification-code"
                type="text"
                placeholder={tAuth('fields.verificationCode.placeholder')}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
              <Button
                variant="outline"
                onClick={() => handleSendCode('register')}
                disabled={loading || countdown > 0}
                className="whitespace-nowrap"
              >
                {countdown > 0 ? `${countdown}s` : tAuth('actions.sendCode')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{tAuth('fields.username.label')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder={tAuth('fields.username.placeholder')}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password">{tAuth('fields.password.label')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-password"
                type="password"
                placeholder={tAuth('fields.password.minPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{tAuth('fields.confirmPassword.label')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                placeholder={tAuth('fields.confirmPassword.placeholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate-code">{affiliateCodeLabel}</Label>
            <Input
              id="affiliate-code"
              type="text"
              name="affiliateCode"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={affiliateCodePlaceholder}
              value={affiliateCode}
              onChange={(e) => {
                const nextAffiliateCode = e.target.value;
                setAffiliateCode(nextAffiliateCode);
                resetAffiliateValidationState(nextAffiliateCode.trim(), true);
              }}
              onBlur={handleAffiliateCodeBlur}
              aria-invalid={affiliateValidationStatus === 'invalid'}
            />
            {showAffiliateValidationMessage ? (
              <p
                className={cn(
                  'flex items-center gap-1.5 text-sm',
                  affiliateValidationMessageClassName
                )}
              >
                {affiliateValidationStatus === 'checking' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                <span>{validationMessage}</span>
              </p>
            ) : null}
          </div>

          <Button
            className="w-full"
            onClick={handleEmailRegister}
            disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {tAuth('actions.createAccount')}
        </Button>
      </div>
    </div>
    );
  };

  const renderForgotPasswordView = () => (
    <div className="space-y-4">
      <button
        type="button"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        onClick={() => {
          resetForm();
          setView('login');
        }}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {tAuth('actions.backToLogin')}
      </button>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {tAuth('descriptions.forgotPassword')}
        </p>

        <div className="space-y-2">
          <Label htmlFor="forgot-email">{tAuth('fields.email.label')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="forgot-email"
              type="email"
              placeholder={tAuth('fields.email.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {tAuth('actions.sendResetCode')}
        </Button>
      </div>
    </div>
  );

  const renderResetPasswordView = () => (
    <div className="space-y-4">
      <button
        type="button"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        onClick={() => {
          resetForm();
          setView('login');
        }}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {tAuth('actions.backToLogin')}
      </button>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="reset-code">{tAuth('fields.verificationCode.label')}</Label>
          <div className="flex gap-2">
            <Input
              id="reset-code"
              type="text"
              placeholder={tAuth('fields.verificationCode.placeholder')}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
            />
            <Button
              variant="outline"
              onClick={() => handleSendCode('reset_password')}
                disabled={loading || countdown > 0}
                className="whitespace-nowrap"
              >
                {countdown > 0 ? `${countdown}s` : tAuth('actions.resend')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
          <Label htmlFor="new-password">{tAuth('fields.newPassword.label')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="new-password"
              type="password"
              placeholder={tAuth('fields.password.minPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">{tAuth('fields.confirmNewPassword.label')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-new-password"
              type="password"
              placeholder={tAuth('fields.confirmPassword.placeholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleResetPassword}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {tAuth('actions.resetPassword')}
        </Button>
      </div>
    </div>
  );

  const getViewTitle = () => {
    switch (view) {
      case 'register':
        return tAuth('viewTitles.createAccount');
      case 'forgot-password':
        return tAuth('viewTitles.forgotPassword');
      case 'reset-password':
        return tAuth('viewTitles.resetPassword');
      default:
        return tAuth('viewTitles.login');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
        setView(defaultView);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[420px] p-6">
        <div className="flex flex-col items-center">
          {/* Small centered logo */}
          <Image
            src={brandLogo}
            width={48}
            height={48}
            alt={brandLogoAlt}
            className="mb-4 rounded-lg"
            priority
          />

          {/* Title */}
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            {getViewTitle()}
          </h2>

          {/* Form content */}
          <div className={cn(
            "w-full transition-opacity duration-200",
            loading ? "opacity-50 pointer-events-none" : "opacity-100"
          )}>
            {view === 'login' && renderLoginView()}
            {view === 'register' && renderRegisterView()}
            {view === 'forgot-password' && renderForgotPasswordView()}
            {view === 'reset-password' && renderResetPasswordView()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginForm;
