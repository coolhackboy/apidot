'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  userManagementService,
  AdminUser,
  RateLimitData,
  RateLimitOverride,
} from '@/services/userManagementService';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface RateLimitDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function RateLimitDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: RateLimitDialogProps) {
  const [limit, setLimit] = useState<string>('');
  const [window, setWindow] = useState<string>('10');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [currentRateLimit, setCurrentRateLimit] = useState<RateLimitData | null>(null);
  const [selectedScope, setSelectedScope] = useState<'scoped' | 'global'>('global');

  // 获取当前作用域的 override
  const currentOverride = useMemo<RateLimitOverride | null>(() => {
    if (!currentRateLimit) return null;
    return selectedScope === 'global'
      ? currentRateLimit.global.override
      : currentRateLimit.scoped.override;
  }, [currentRateLimit, selectedScope]);

  // Fetch current rate limit when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchCurrentRateLimit();
    } else {
      // Reset form when dialog closes
      setLimit('');
      setWindow('10');
      setShowConfirm(false);
      setCurrentRateLimit(null);
      setSelectedScope('global');
    }
  }, [open, user]);

  // 切换作用域时更新表单
  useEffect(() => {
    if (currentOverride) {
      setLimit(currentOverride.limit.toString());
      setWindow(currentOverride.window.toString());
    } else {
      setLimit('');
      setWindow('10');
    }
  }, [currentOverride]);

  const fetchCurrentRateLimit = async () => {
    if (!user) return;

    setLoadingCurrent(true);
    try {
      const rateLimit = await userManagementService.getRateLimit(user.uid);
      setCurrentRateLimit(rateLimit);
    } catch (error) {
      console.error('Failed to fetch rate limit:', error);
      toast.error('获取当前限流失败');
    } finally {
      setLoadingCurrent(false);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      setLimit(value);
    }
  };

  const handleWindowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      setWindow(value);
    }
  };

  const handleProceedToConfirm = () => {
    const limitNum = parseInt(limit);
    const windowNum = parseInt(window);

    if (!limit || isNaN(limitNum) || limitNum < 1) {
      toast.error('限制次数必须大于0');
      return;
    }

    if (!window || isNaN(windowNum) || windowNum < 1) {
      toast.error('时间窗口必须大于0');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSetRateLimit = async () => {
    if (!user) return;

    const limitNum = parseInt(limit);
    const windowNum = parseInt(window);

    if (isNaN(limitNum) || limitNum < 1 || isNaN(windowNum) || windowNum < 1) {
      toast.error('限制次数必须大于0');
      return;
    }

    setSubmitting(true);
    try {
      await userManagementService.setRateLimit({
        uid: user.uid,
        limit: limitNum,
        window: windowNum,
        scope: selectedScope === 'global' ? "" : "unified_submit",
      });
      toast.success('限流设置成功');
      setShowConfirm(false);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to set rate limit:', error);
      toast.error('限流设置失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseConfirm = () => {
    setShowConfirm(false);
  };

  const handleCloseDialog = () => {
    setShowConfirm(false);
    onOpenChange(false);
  };

  const limitNum = parseInt(limit) || 0;
  const windowNum = parseInt(window) || 10;

  return (
    <>
      {/* Step 1: Input rate limit settings */}
      <Dialog open={open && !showConfirm} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">设置用户限流</DialogTitle>
            <DialogDescription className="text-xs">
              为该用户配置API请求频率限制
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Info */}
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                用户信息
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">用户ID:</span>
                <span className="font-medium">{user?.uid}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">用户名:</span>
                <span className="font-medium">{user?.user_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">邮箱:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
            </div>

            {/* 作用域选择 - 标签形式 */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectedScope === 'global' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedScope('global')}
                className="flex-1"
                disabled={loadingCurrent}
              >
                Global 全局限流
              </Button>
              <Button
                type="button"
                variant={selectedScope === 'scoped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedScope('scoped')}
                className="flex-1"
                disabled={loadingCurrent}
              >
                Unified Submit
              </Button>
            </div>

            {/* Current Rate Limit */}
            {loadingCurrent ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">加载当前设置中...</span>
              </div>
            ) : (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                  当前 {selectedScope === 'global' ? 'Global' : 'Unified Submit'} 限流
                </div>
                {currentOverride ? (
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    {currentOverride.window}秒内{currentOverride.limit}次请求
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">未设置</div>
                )}
              </div>
            )}

            {/* Limit Input */}
            <div className="space-y-2">
              <Label htmlFor="limit" className="text-sm">
                限制次数 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="limit"
                type="text"
                inputMode="numeric"
                placeholder="输入允许的请求次数"
                value={limit}
                onChange={handleLimitChange}
                className="text-sm"
                disabled={loadingCurrent}
              />
              <p className="text-xs text-muted-foreground">
                允许的请求次数
              </p>
            </div>

            {/* Window Input */}
            <div className="space-y-2">
              <Label htmlFor="window" className="text-sm">
                时间窗口（秒）
              </Label>
              <Input
                id="window"
                type="text"
                inputMode="numeric"
                placeholder="10"
                value={window}
                onChange={handleWindowChange}
                className="text-sm"
                disabled={loadingCurrent}
              />
              <p className="text-xs text-muted-foreground">
                时间窗口秒数（默认：10）
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} size="sm">
              取消
            </Button>
            <Button
              onClick={handleProceedToConfirm}
              size="sm"
              disabled={!limit || limitNum < 1 || !window || windowNum < 1 || loadingCurrent}
            >
              下一步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: Confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={(isOpen) => !isOpen && handleCloseConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认限流设置</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>请确认限流配置</p>
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">用户:</span>
                    <span className="font-medium">{user?.user_name || user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">邮箱:</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">用户ID:</span>
                    <span className="font-medium">{user?.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">作用域:</span>
                    <span className="font-bold text-purple-600">
                      {selectedScope === 'global' ? 'Global 全局' : 'Unified Submit'}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">限制次数:</span>
                    <span className="font-bold text-blue-600">{limitNum} 次请求</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">时间窗口:</span>
                    <span className="font-bold text-blue-600">{windowNum} 秒</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-sm text-center font-medium text-blue-700 dark:text-blue-400">
                      {windowNum}秒内最多{limitNum}次请求
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseConfirm} disabled={submitting}>
              返回修改
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSetRateLimit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                '确认设置'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
