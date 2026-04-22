'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiService, CreditAlert } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Trash2, Plus, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MAX_ALERTS = 3;

interface CreditAlertSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreditAlertSettings({ open, onOpenChange }: CreditAlertSettingsProps) {
  const t = useTranslations('Dashboard.Billing.CreditAlert');
  const [alerts, setAlerts] = useState<CreditAlert[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAlerts();
    }
  }, [open]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await apiService.getCreditAlerts();
      if (response.code === 200) {
        setAlerts(response.data || []);
      }
    } catch {
      toast.error(t('load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlert = () => {
    if (alerts.length >= MAX_ALERTS) return;
    setAlerts([...alerts, { threshold: 0, enabled: true }]);
  };

  const handleRemoveAlert = async (index: number) => {
    const alert = alerts[index];
    if (alert.id) {
      try {
        await apiService.deleteCreditAlert(alert.id);
      } catch {
        toast.error(t('delete_error'));
        return;
      }
    }
    setAlerts(alerts.filter((_, i) => i !== index));
  };

  const handleThresholdChange = (index: number, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue)) return;
    const updated = [...alerts];
    updated[index] = { ...updated[index], threshold: numValue };
    setAlerts(updated);
  };

  const handleSave = async () => {
    const validAlerts = alerts.filter(a => a.threshold > 0);
    if (validAlerts.length === 0 && alerts.length > 0) {
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.saveCreditAlerts(
        validAlerts.map(a => ({ threshold: a.threshold }))
      );
      if (response.code === 200) {
        toast.success(t('save_success'));
        setAlerts(response.data || []);
        onOpenChange(false);
      }
    } catch {
      toast.error(t('save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <p className="text-sm font-medium">{t('description')}</p>
          <p className="text-sm text-muted-foreground">{t('sub_description')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {alerts.map((alert, index) => (
              <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t('alert_label', { number: index + 1 })}
                  </span>
                  <button
                    onClick={() => handleRemoveAlert(index)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={alert.threshold || ''}
                  onChange={(e) => handleThresholdChange(index, e.target.value)}
                  placeholder={t('input_placeholder')}
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{t('email_enabled')}</span>
                </div>
              </div>
            ))}

            {alerts.length < MAX_ALERTS && (
              <button
                onClick={handleAddAlert}
                className="w-full border-2 border-dashed border-primary/40 rounded-lg py-3 text-sm text-primary hover:border-primary hover:bg-primary/5 transition-colors"
              >
                + {t('add_alert', { current: alerts.length, max: MAX_ALERTS })}
              </button>
            )}
          </div>
        )}

        <DialogFooter className="gap-4 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
