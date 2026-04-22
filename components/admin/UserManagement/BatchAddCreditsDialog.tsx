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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ChevronDown, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BatchAddCreditsDialogProps {
  open: boolean;
  onClose: (saved: boolean) => void;
  users: AdminUser[];
}

type Step = 'input' | 'confirm' | 'executing' | 'result';

export default function BatchAddCreditsDialog({ open, onClose, users }: BatchAddCreditsDialogProps) {
  const [step, setStep] = useState<Step>('input');
  const [credits, setCredits] = useState<string>('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: 0, failed: 0 });
  const [userListOpen, setUserListOpen] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('input');
      setCredits('');
      setProgress({ current: 0, total: 0 });
      setResults({ success: 0, failed: 0 });
      setUserListOpen(false);
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
    setStep('confirm');
  };

  const handleBackToInput = () => {
    setStep('input');
  };

  const handleExecute = async () => {
    setStep('executing');
    const total = users.length;
    let success = 0;
    let failed = 0;

    setProgress({ current: 0, total });

    for (let i = 0; i < users.length; i++) {
      try {
        await userManagementService.addCredits({
          uid: users[i].uid,
          credits: parseInt(credits),
        });
        success++;
      } catch (error) {
        console.error(`Failed to add credits for user ${users[i].uid}:`, error);
        failed++;
      }
      setProgress({ current: i + 1, total });
    }

    setResults({ success, failed });
    setStep('result');
  };

  const handleComplete = () => {
    if (results.success > 0) {
      toast.success(`成功为 ${results.success} 个用户添加了 ${credits} 积分`);
    }
    onClose(results.success > 0);
  };

  const handleCloseDialog = () => {
    if (step === 'executing') {
      return; // Prevent closing during execution
    }
    onClose(false);
  };

  const creditsNum = parseInt(credits) || 0;
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  // Calculate total credits to be added
  const totalCreditsToAdd = creditsNum * users.length;
  const totalCurrentCredits = users.reduce((sum, u) => sum + (u.credits_amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
      <DialogContent className="max-w-md">
        {/* Step 1: Input credits amount */}
        {step === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">批量添加积分</DialogTitle>
              <DialogDescription className="text-xs">
                为 <span className="font-medium">{users.length}</span> 个用户批量添加积分
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="batch-credits" className="text-sm">
                  积分数量 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="batch-credits"
                  type="text"
                  inputMode="numeric"
                  placeholder="请输入要添加的积分数量"
                  value={credits}
                  onChange={handleInputChange}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  请输入大于0的整数，所有选中用户将添加相同数量的积分
                </p>
              </div>

              {creditsNum > 0 && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">选中用户数:</span>
                    <span className="font-medium">{users.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">每人添加:</span>
                    <span className="font-medium text-green-600">+{creditsNum.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">总计添加:</span>
                    <span className="font-medium text-green-600">+{totalCreditsToAdd.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} size="sm">
                取消
              </Button>
              <Button onClick={handleProceedToConfirm} size="sm" disabled={!credits || creditsNum < 1}>
                下一步
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Confirmation */}
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">确认批量添加积分</DialogTitle>
              <DialogDescription className="text-xs">
                即将为以下用户添加 <span className="font-medium text-green-600">+{creditsNum.toLocaleString()}</span> 积分
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Collapsible open={userListOpen} onOpenChange={setUserListOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    查看用户列表 ({users.length}个)
                    <ChevronDown className={`h-4 w-4 transition-transform ${userListOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border p-2 space-y-1">
                    {users.map((user) => (
                      <div key={user.uid} className="flex justify-between text-xs py-1 border-b last:border-b-0">
                        <span className="truncate max-w-[180px]">{user.user_name || user.email}</span>
                        <span className="text-muted-foreground">当前: {(user.credits_amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="rounded-lg bg-muted p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">选中用户数:</span>
                  <span className="font-medium">{users.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">每人添加:</span>
                  <span className="font-medium text-green-600">+{creditsNum.toLocaleString()}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">当前总积分:</span>
                  <span>{totalCurrentCredits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">添加后总积分:</span>
                  <span className="font-bold text-green-600">{(totalCurrentCredits + totalCreditsToAdd).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleBackToInput} size="sm">
                返回修改
              </Button>
              <Button onClick={handleExecute} size="sm" className="bg-green-600 hover:bg-green-700">
                确认执行
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Executing */}
        {step === 'executing' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在执行...
              </DialogTitle>
              <DialogDescription className="text-xs">
                请勿关闭此窗口
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Progress value={progressPercent} className="h-2" />
              <div className="text-center text-sm text-muted-foreground">
                {progress.current} / {progress.total}
              </div>
            </div>
          </>
        )}

        {/* Step 4: Result */}
        {step === 'result' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">操作完成</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4 space-y-3">
                {results.success > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>成功: <span className="font-medium text-green-600">{results.success}</span> 个用户</span>
                  </div>
                )}
                {results.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span>失败: <span className="font-medium text-red-500">{results.failed}</span> 个用户</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleComplete} size="sm">
                完成
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
