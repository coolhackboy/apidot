'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiService, AutoRechargeConfigData } from '@/services/api';
import { CreditCard, Loader2, Trash2, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Pricing plans for auto recharge
const rechargePlans = [
  { code: '11000001', name: '1,000 Credits', credits: 1000, price: 5 },
  { code: '11000003', name: '10,000 Credits', credits: 10000, price: 50 },
  { code: '11000004', name: '105,000 Credits', credits: 105000, price: 500 },
  { code: '11000005', name: '275,000 Credits', credits: 275000, price: 1250 },
];

// Common billing countries (ISO 3166-1 alpha-2)
const BILLING_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'RU', name: 'Russia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PL', name: 'Poland' },
  { code: 'AE', name: 'United Arab Emirates' },
];

interface PaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  translations: {
    cancel: string;
    save_card: string;
    saving: string;
    cardholder_name: string;
    cardholder_name_placeholder: string;
    billing_country: string;
    billing_country_placeholder: string;
    name_required: string;
    country_required: string;
  };
}

function PaymentMethodForm({ onSuccess, onCancel, translations }: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [billingCountry, setBillingCountry] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate required fields
    if (!cardholderName.trim()) {
      setError(translations.name_required);
      return;
    }
    if (!billingCountry) {
      setError(translations.country_required);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create SetupIntent
      const setupIntentResponse = await apiService.createSetupIntent();
      if (setupIntentResponse.code !== 200) {
        throw new Error('Failed to create setup intent');
      }

      const { client_secret } = setupIntentResponse.data;

      // Confirm card setup
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName.trim(),
            address: {
              country: billingCountry,
            },
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (setupIntent?.payment_method) {
        // Confirm payment method with backend
        await apiService.confirmPaymentMethod(
          setupIntent.payment_method as string,
          cardholderName.trim(),
          billingCountry
        );
        toast.success('Payment method saved successfully');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save payment method');
      toast.error(err.message || 'Failed to save payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardholder-name">{translations.cardholder_name}</Label>
        <Input
          id="cardholder-name"
          type="text"
          placeholder={translations.cardholder_name_placeholder}
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing-country">{translations.billing_country}</Label>
        <Select value={billingCountry} onValueChange={setBillingCountry}>
          <SelectTrigger id="billing-country">
            <SelectValue placeholder={translations.billing_country_placeholder} />
          </SelectTrigger>
          <SelectContent>
            {BILLING_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 border rounded-lg bg-background">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {translations.cancel}
        </Button>
        <Button type="submit" disabled={!stripe || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {translations.saving}
            </>
          ) : (
            translations.save_card
          )}
        </Button>
      </div>
    </form>
  );
}

interface AutoRechargeSettingsProps {
  onConfigUpdate?: () => void;
  layoutPreview?: boolean;
}

const LAYOUT_PREVIEW_CONFIG: AutoRechargeConfigData = {
  enabled: false,
  threshold_credits: 1000,
  recharge_plan_code: '11000001',
  has_payment_method: false,
  payment_method_last4: null,
  payment_method_brand: null,
  last_recharge_time: null,
  last_recharge_status: null,
  billing_info_complete: true,
};

export default function AutoRechargeSettings({ onConfigUpdate, layoutPreview = false }: AutoRechargeSettingsProps) {
  const t = useTranslations('Dashboard.Billing.AutoRecharge');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [config, setConfig] = useState<AutoRechargeConfigData | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [thresholdCredits, setThresholdCredits] = useState(1000);
  const [rechargePlanCode, setRechargePlanCode] = useState('11000001');

  const fetchConfig = async () => {
    try {
      const response = await apiService.getAutoRechargeConfig();
      if (response.code === 200) {
        setConfig(response.data);
        setEnabled(response.data.enabled);
        setThresholdCredits(response.data.threshold_credits);
        if (response.data.recharge_plan_code) {
          setRechargePlanCode(response.data.recharge_plan_code);
        }
      }
    } catch (error) {
      console.error('Failed to fetch auto recharge config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (layoutPreview) {
      setConfig(LAYOUT_PREVIEW_CONFIG);
      setEnabled(false);
      setThresholdCredits(LAYOUT_PREVIEW_CONFIG.threshold_credits);
      setRechargePlanCode(LAYOUT_PREVIEW_CONFIG.recharge_plan_code);
      setLoading(false);
      return;
    }

    fetchConfig();
  }, [layoutPreview]);

  const handleSave = async () => {
    if (layoutPreview) {
      return;
    }

    if (!config?.has_payment_method && enabled) {
      toast.error('Please add a payment method first');
      return;
    }

    if (!rechargePlanCode) {
      toast.error('Please select a recharge plan');
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.updateAutoRechargeConfig({
        enabled,
        threshold_credits: thresholdCredits,
        recharge_plan_code: rechargePlanCode,
      });

      if (response.code === 200) {
        setConfig(response.data);
        toast.success('Settings saved successfully');
        onConfigUpdate?.();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePaymentMethod = async () => {
    setRemoving(true);
    try {
      await apiService.removePaymentMethod();
      setConfig(prev => prev ? { ...prev, has_payment_method: false, payment_method_last4: null, payment_method_brand: null } : null);
      setEnabled(false);
      toast.success('Payment method removed');
      setShowRemoveDialog(false);
      onConfigUpdate?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove payment method');
    } finally {
      setRemoving(false);
    }
  };

  const handlePaymentMethodAdded = () => {
    setShowAddCard(false);
    fetchConfig();
    onConfigUpdate?.();
  };

  const selectedPlan = rechargePlans.find(p => p.code === rechargePlanCode);
  const interactionDisabled = layoutPreview || saving;

  if (loading) {
    return (
      <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('title')}</CardTitle>
          </div>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-recharge-toggle">{t('enable')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('enable_description')}
              </p>
            </div>
            <Switch
              id="auto-recharge-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={interactionDisabled || !config?.has_payment_method}
            />
          </div>

          {/* Threshold Setting */}
          <div className="space-y-2">
            <Label htmlFor="threshold">{t('threshold_label')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="threshold"
                type="number"
                min={0}
                value={thresholdCredits}
                onChange={(e) => setThresholdCredits(parseInt(e.target.value) || 0)}
                className="w-32"
                disabled={layoutPreview}
              />
              <span className="text-sm text-muted-foreground">{t('threshold_unit')}</span>
            </div>
          </div>

          {/* Recharge Plan Selection */}
          <div className="space-y-2">
            <Label>{t('purchase_label')}</Label>
            <Select value={rechargePlanCode} onValueChange={setRechargePlanCode} disabled={layoutPreview}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_plan')} />
              </SelectTrigger>
              <SelectContent>
                {rechargePlans.map((plan) => (
                  <SelectItem key={plan.code} value={plan.code}>
                    {plan.name} - ${plan.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan && (
              <p className="text-sm text-muted-foreground">
                {selectedPlan.credits.toLocaleString()} {t('threshold_unit')} for ${selectedPlan.price}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>{t('payment_method')}</Label>
            {config?.has_payment_method ? (
              <>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {config.payment_method_brand?.toUpperCase()} •••• {config.payment_method_last4}
                      </p>
                      <p className="text-sm text-muted-foreground">{t('saved_for_auto')}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {config.billing_info_complete === false && (
                  <div className="flex items-start gap-2 p-3 border border-amber-300 rounded-lg bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        {t('billing_update_required')}
                      </p>
                      <p className="text-amber-700 dark:text-amber-400 mt-1">
                        {t('billing_update_description')}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          handleRemovePaymentMethod();
                        }}
                      >
                        {t('update_payment_method')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddCard(true)}
                className="w-full"
                disabled={layoutPreview}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t('add_payment_method')}
              </Button>
            )}
          </div>

          {/* Last Recharge Info */}
          {config?.last_recharge_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              <span>
                {t('last_recharge')}: {new Date(config.last_recharge_time).toLocaleString()}
              </span>
              <Badge variant={config.last_recharge_status === 'success' ? 'default' : 'destructive'}>
                {config.last_recharge_status}
              </Badge>
            </div>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} disabled={interactionDisabled} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save_settings')
            )}
          </Button>

          {/* Warning if no payment method */}
          {!config?.has_payment_method && (
            <p className="text-sm text-muted-foreground text-center">
              {layoutPreview ? t('description') : t('add_payment_first')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialog_title')}</DialogTitle>
            <DialogDescription>
              {t('dialog_description')}
            </DialogDescription>
          </DialogHeader>
          <Elements stripe={stripePromise}>
            <PaymentMethodForm
              onSuccess={handlePaymentMethodAdded}
              onCancel={() => setShowAddCard(false)}
              translations={{
                cancel: t('cancel'),
                save_card: t('save_card'),
                saving: t('saving'),
                cardholder_name: t('cardholder_name'),
                cardholder_name_placeholder: t('cardholder_name_placeholder'),
                billing_country: t('billing_country'),
                billing_country_placeholder: t('billing_country_placeholder'),
                name_required: t('name_required'),
                country_required: t('country_required'),
              }}
            />
          </Elements>
        </DialogContent>
      </Dialog>

      {/* Remove Card Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('remove_title')}</DialogTitle>
            <DialogDescription>
              {t('remove_description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemovePaymentMethod}
              disabled={removing}
            >
              {removing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('removing')}
                </>
              ) : (
                t('remove')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
