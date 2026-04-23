'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiService } from '@/services/api';
import { apiKeyService, ApiKey } from '@/services/apiKeyService';
import { trackApiKeyGenerated } from '@/utils/gtm-events';
import { appConfig } from '@/data/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import LoginForm from '@/components/auth/LoginForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Key, Copy, Check, Edit, Trash2, Plus, User, Eye, EyeOff, Settings } from 'lucide-react';
import { toast } from 'sonner';

const formatSecurityLimitSummary = (key: ApiKey, hourlyLabel: string, dailyLabel: string) => {
  const hourlyValue = key.hourly_credit_limit && key.hourly_credit_limit > 0
    ? key.hourly_credit_limit.toLocaleString()
    : '∞';
  const dailyValue = key.daily_credit_limit && key.daily_credit_limit > 0
    ? key.daily_credit_limit.toLocaleString()
    : '∞';

  return `${hourlyLabel}: ${hourlyValue} · ${dailyLabel}: ${dailyValue}`;
};

export default function ApiKeyPage() {
  const t = useTranslations('Dashboard.ApiKey');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showIpWhitelistDialog, setShowIpWhitelistDialog] = useState(false);
  const [showSecurityLimitsDialog, setShowSecurityLimitsDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rate_limit: 100,
    ip_whitelist: [] as string[],
    hourly_credit_limit: '',
    daily_credit_limit: '',
  });

  // IP Whitelist form state
  const [ipFormData, setIpFormData] = useState({
    ip_whitelist: [] as string[],
  });

  // Security limits form state
  const [securityFormData, setSecurityFormData] = useState({
    hourly_credit_limit: '',
    daily_credit_limit: '',
  });

  const fetchApiKeys = async () => {
    try {
      const keys = await apiKeyService.listApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error(t('error_fetch'));
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!apiService.isLoggedInToApp(appConfig.appName)) {
          setIsLoggedIn(false);
          setLoading(false);
          setShowLoginModal(true);
          return;
        }

        setIsLoggedIn(true);
        await fetchApiKeys();
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error(t('error_name_required'));
      return;
    }

    setSubmitting(true);
    try {
      await apiKeyService.createApiKey({
        name: formData.name,
      });

      trackApiKeyGenerated();
      toast.success(t('success_create'));
      setShowCreateDialog(false);
      setFormData({
        name: '',
        rate_limit: 100,
        ip_whitelist: [],
        hourly_credit_limit: '',
        daily_credit_limit: '',
      });
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error(t('error_create'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedKey || !formData.name.trim()) {
      toast.error(t('error_name_required'));
      return;
    }

    setSubmitting(true);
    try {
      await apiKeyService.updateApiKey({
        key_id: selectedKey.id,
        name: formData.name,
      });

      toast.success(t('success_update'));
      setShowEditDialog(false);
      setSelectedKey(null);
      setFormData({
        name: '',
        rate_limit: 100,
        ip_whitelist: [],
        hourly_credit_limit: '',
        daily_credit_limit: '',
      });
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to update API key:', error);
      toast.error(t('error_update'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedKey) return;

    setSubmitting(true);
    try {
      await apiKeyService.deleteApiKey({
        key_id: selectedKey.id,
      });

      toast.success(t('success_delete'));
      setShowDeleteDialog(false);
      setSelectedKey(null);
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error(t('error_delete'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (keyId: number, apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKeyId(keyId);
    setTimeout(() => {
      setCopiedKeyId((currentKeyId) => (currentKeyId === keyId ? null : currentKeyId));
    }, 2000);
  };

  const toggleKeyVisibility = (keyId: number) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 10) return key;
    return `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
  };

  const handleIpWhitelistUpdate = async () => {
    if (!selectedKey) return;

    setSubmitting(true);
    try {
      await apiKeyService.updateApiKey({
        key_id: selectedKey.id,
        ip_whitelist: ipFormData.ip_whitelist,
      });

      toast.success(t('success_update_ip'));
      setShowIpWhitelistDialog(false);
      setSelectedKey(null);
      setIpFormData({ ip_whitelist: [] });
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to update IP whitelist:', error);
      toast.error(t('error_update_ip'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSecurityLimitsUpdate = async () => {
    if (!selectedKey) return;

    setSubmitting(true);
    try {
      await apiKeyService.updateApiKey({
        key_id: selectedKey.id,
        hourly_credit_limit: parseInt(securityFormData.hourly_credit_limit) || 0,
        daily_credit_limit: parseInt(securityFormData.daily_credit_limit) || 0,
      });

      toast.success(t('success_update_limits'));
      setShowSecurityLimitsDialog(false);
      setSelectedKey(null);
      setSecurityFormData({ hourly_credit_limit: '', daily_credit_limit: '' });
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to update security limits:', error);
      toast.error(t('error_update_limits'));
    } finally {
      setSubmitting(false);
    }
  };

  const addIpAddress = () => {
    if (ipFormData.ip_whitelist.length < 10) {
      setIpFormData({
        ip_whitelist: [...ipFormData.ip_whitelist, '']
      });
    }
  };

  const removeIpAddress = (index: number) => {
    setIpFormData({
      ip_whitelist: ipFormData.ip_whitelist.filter((_, i) => i !== index)
    });
  };

  const updateIpAddress = (index: number, value: string) => {
    const newIpList = [...ipFormData.ip_whitelist];
    newIpList[index] = value;
    setIpFormData({
      ip_whitelist: newIpList
    });
  };


  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-10 w-56 rounded-2xl" />
            <Skeleton className="h-5 w-80 rounded-full" />
          </div>
          <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-4 w-64 rounded-full" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full rounded-[24px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Account</div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{t('title')}</h1>
            </div>
            <Card className="rounded-[28px] border-border/70 shadow-sm">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">{t('please_login')}</h3>
                  <p className="text-muted-foreground">{t('login_required')}</p>
                  <Button onClick={() => setShowLoginModal(true)} className="h-11 rounded-xl px-5">
                    Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <LoginForm
          app_name={appConfig.appName}
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          onLoginSuccess={() => {
            setShowLoginModal(false);
            window.location.reload();
          }}
        />
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Account</div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{t('api_keys')}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('api_keys_description')}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setFormData({
                name: '',
                rate_limit: 100,
                ip_whitelist: [],
                hourly_credit_limit: '',
                daily_credit_limit: ''
              });
              setShowCreateDialog(true);
            }}
            className="h-11 rounded-xl px-5 text-sm font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {t('create_key')}
          </Button>
        </div>

        <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Key className="h-5 w-5" />
              {t('api_keys')}
            </CardTitle>
            <CardDescription className="text-sm">{t('api_keys_description')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {apiKeys.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t('no_keys')}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t('no_keys_description')}</p>
                <Button
                  onClick={() => {
                    setFormData({
                      name: '',
                      rate_limit: 100,
                      ip_whitelist: [],
                      hourly_credit_limit: '',
                      daily_credit_limit: '',
                    });
                    setShowCreateDialog(true);
                  }}
                  className="mt-5 h-11 rounded-xl px-5"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('create_first_key')}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 bg-muted/20 hover:bg-muted/20">
                      <TableHead className="h-12 px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('table_name')}</TableHead>
                      <TableHead className="h-12 px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('table_api_key')}</TableHead>
                      <TableHead className="h-12 px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('table_created')}</TableHead>
                      <TableHead className="h-12 px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('table_ip_whitelist')}</TableHead>
                      <TableHead className="h-12 px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('table_security_limits')}</TableHead>
                      <TableHead className="h-12 px-6 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('table_actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id} className="border-border/60 hover:bg-muted/10">
                        <TableCell className="px-6 py-5 align-top">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{key.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {key.rate_limit ? `${key.rate_limit}/min` : 'Default rate limit'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <code className="rounded-lg border border-border/60 bg-muted/35 px-3 py-1.5 text-sm">
                              {visibleKeys.has(key.id) ? key.api_key : maskApiKey(key.api_key)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground"
                              onClick={() => toggleKeyVisibility(key.id)}
                            >
                              {visibleKeys.has(key.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground"
                              onClick={() => handleCopy(key.id, key.api_key)}
                            >
                              {copiedKeyId === key.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 align-top text-sm text-muted-foreground">{key.created_time}</TableCell>
                        <TableCell className="px-6 py-5 align-top">
                          <div className="flex flex-wrap items-center gap-2">
                            {key.ip_whitelist && key.ip_whitelist.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-emerald-500/15 bg-emerald-500/8 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                  {key.ip_whitelist.length} IPs
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setSelectedKey(key);
                                    setIpFormData({
                                      ip_whitelist: key.ip_whitelist || []
                                    });
                                    setShowIpWhitelistDialog(true);
                                  }}
                                >
                                  {t('view')}
                                </Button>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg"
                              onClick={() => {
                                setSelectedKey(key);
                                setIpFormData({
                                  ip_whitelist: key.ip_whitelist || []
                                });
                                setShowIpWhitelistDialog(true);
                              }}
                            >
                              {t('add_ip')}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 align-top">
                          <div className="text-sm text-muted-foreground">
                            {formatSecurityLimitSummary(
                              key,
                              t('hourly_credit_limit'),
                              t('daily_credit_limit')
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-8 rounded-lg"
                            onClick={() => {
                              setSelectedKey(key);
                              setSecurityFormData({
                                hourly_credit_limit: (key.hourly_credit_limit || 0).toString(),
                                daily_credit_limit: (key.daily_credit_limit || 0).toString(),
                              });
                              setShowSecurityLimitsDialog(true);
                            }}
                          >
                            {t('security_limits')}
                          </Button>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-muted-foreground"
                              onClick={() => {
                                setSelectedKey(key);
                                setFormData({
                                  name: key.name,
                                  rate_limit: key.rate_limit || 100,
                                  ip_whitelist: key.ip_whitelist || [],
                                  hourly_credit_limit: (key.hourly_credit_limit || 0).toString(),
                                  daily_credit_limit: (key.daily_credit_limit || 0).toString(),
                                });
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-muted-foreground"
                              onClick={() => {
                                setSelectedKey(key);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog_create_title')}</DialogTitle>
            <DialogDescription>{t('dialog_create_description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('label_name')}</Label>
              <Input
                id="name"
                placeholder={t('placeholder_name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('button_cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? t('button_creating') : t('button_create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog_edit_title')}</DialogTitle>
            <DialogDescription>{t('dialog_edit_description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">{t('label_name')}</Label>
              <Input
                id="edit_name"
                placeholder={t('placeholder_name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('button_cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? t('button_updating') : t('button_update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog_delete_description', { name: selectedKey?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('button_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? t('button_deleting') : t('button_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* IP Whitelist Management Dialog */}
      <Dialog open={showIpWhitelistDialog} onOpenChange={setShowIpWhitelistDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dialog_ip_whitelist_title')}</DialogTitle>
            <DialogDescription>
              {t('dialog_ip_whitelist_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {ipFormData.ip_whitelist.length === 0 ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-700">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium">{t('ip_whitelist_empty_warning')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {ipFormData.ip_whitelist.map((ip, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={t('ip_placeholder')}
                      value={ip}
                      onChange={(e) => updateIpAddress(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeIpAddress(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {ipFormData.ip_whitelist.length < 10 && (
              <Button
                variant="outline"
                onClick={addIpAddress}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('add_ip_address')} ({ipFormData.ip_whitelist.length}/10)
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIpWhitelistDialog(false)}>
              {t('button_cancel')}
            </Button>
            <Button onClick={handleIpWhitelistUpdate} disabled={submitting}>
              {submitting ? t('button_saving') : t('button_save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Limits Dialog */}
      <Dialog open={showSecurityLimitsDialog} onOpenChange={setShowSecurityLimitsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              {t('dialog_security_limits_title')}
            </DialogTitle>
            <DialogDescription>
              {t('dialog_security_limits_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_limit" className="flex items-center gap-2">
                {t('hourly_credit_limit')}
                <span className="text-xs text-muted-foreground">({t('info_icon')})</span>
              </Label>
              <Input
                id="hourly_limit"
                type="number"
                min="0"
                placeholder="1000"
                value={securityFormData.hourly_credit_limit}
                onChange={(e) => setSecurityFormData({
                  ...securityFormData,
                  hourly_credit_limit: e.target.value
                })}
              />
              <p className="text-xs text-muted-foreground">{t('hourly_limit_hint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_limit">{t('daily_credit_limit')}</Label>
              <Input
                id="daily_limit"
                type="number"
                min="0"
                placeholder="5000"
                value={securityFormData.daily_credit_limit}
                onChange={(e) => setSecurityFormData({
                  ...securityFormData,
                  daily_credit_limit: e.target.value
                })}
              />
              <p className="text-xs text-muted-foreground">{t('daily_limit_hint')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSecurityLimitsDialog(false)}>
              {t('button_cancel')}
            </Button>
            <Button onClick={handleSecurityLimitsUpdate} disabled={submitting}>
              <Settings className="h-4 w-4 mr-2" />
              {submitting ? t('button_saving_limits') : t('button_save_limits')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
