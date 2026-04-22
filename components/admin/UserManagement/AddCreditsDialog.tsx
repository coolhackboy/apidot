'use client';

import React, { useState, useEffect } from 'react';
import {
  userManagementService,
  AdminUser,
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

interface AddCreditsDialogProps {
  open: boolean;
  onClose: (saved: boolean) => void;
  user: AdminUser | null;
}

export default function AddCreditsDialog({ open, onClose, user }: AddCreditsDialogProps) {
  const [credits, setCredits] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCredits('');
      setShowConfirm(false);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      setCredits(value);
    }
  };

  const handleProceedToConfirm = () => {
    const creditsNum = parseInt(credits);
    if (!credits || isNaN(creditsNum) || creditsNum < 1) {
      toast.error('请输入有效的积分数量（至少为1）');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmAddCredits = async () => {
    if (!user) return;

    const creditsNum = parseInt(credits);
    if (isNaN(creditsNum) || creditsNum < 1) {
      toast.error('积分数量无效');
      return;
    }

    setSubmitting(true);
    try {
      await userManagementService.addCredits({
        uid: user.uid,
        credits: creditsNum,
      });
      toast.success(`成功为用户 ${user.user_name || user.email} 添加 ${creditsNum} 积分`);
      setShowConfirm(false);
      onClose(true);
    } catch (error) {
      console.error('Failed to add credits:', error);
      toast.error('添加积分失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseConfirm = () => {
    setShowConfirm(false);
  };

  const handleCloseDialog = () => {
    setShowConfirm(false);
    onClose(false);
  };

  const creditsNum = parseInt(credits) || 0;
  const currentBalance = user?.credits_amount || 0;
  const newBalance = currentBalance + creditsNum;

  return (
    <>
      {/* Step 1: Input credits amount */}
      <Dialog open={open && !showConfirm} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">添加积分</DialogTitle>
            <DialogDescription className="text-xs">
              为用户 <span className="font-medium">{user?.user_name || user?.email}</span> 添加积分
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits" className="text-sm">
                积分数量 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="credits"
                type="text"
                inputMode="numeric"
                placeholder="请输入要添加的积分数量"
                value={credits}
                onChange={handleInputChange}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                请输入大于0的整数
              </p>
            </div>

            <div className="rounded-lg bg-muted p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">当前积分余额:</span>
                <span className="font-medium">{currentBalance.toLocaleString()}</span>
              </div>
              {creditsNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">添加后余额:</span>
                  <span className="font-medium text-green-600">{newBalance.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} size="sm">
              取消
            </Button>
            <Button onClick={handleProceedToConfirm} size="sm" disabled={!credits || creditsNum < 1}>
              下一步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: Confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={(isOpen) => !isOpen && handleCloseConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认添加积分</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>请确认以下积分操作信息：</p>
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">用户:</span>
                    <span className="font-medium">{user?.user_name || user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">用户ID:</span>
                    <span className="font-medium">{user?.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">添加积分:</span>
                    <span className="font-medium text-green-600">+{creditsNum.toLocaleString()}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">当前余额:</span>
                    <span>{currentBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">添加后余额:</span>
                    <span className="font-bold text-green-600">{newBalance.toLocaleString()}</span>
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
              onClick={handleConfirmAddCredits}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? '处理中...' : '确认添加'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
