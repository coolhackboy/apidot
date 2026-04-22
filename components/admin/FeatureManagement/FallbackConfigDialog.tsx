'use client';

import React, { useEffect, useState } from 'react';
import {
  Feature,
  featureManagementService,
  UpdateFeatureRequest,
} from '@/services/featureManagementService';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import SupplierModelSelector from './SupplierModelSelector';

interface FallbackConfigDialogProps {
  open: boolean;
  onClose: (saved: boolean) => void;
  feature: Feature | null;
}

interface FallbackModelFormItem {
  model_code: string;
  priority: number;
  enabled: boolean;
}

const createEmptyFallbackModel = (): FallbackModelFormItem => ({
  model_code: '',
  priority: 0,
  enabled: true,
});

export default function FallbackConfigDialog({
  open,
  onClose,
  feature,
}: FallbackConfigDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [modelCode, setModelCode] = useState('');
  const [maxRetries, setMaxRetries] = useState(0);
  const [timeout, setTimeoutValue] = useState(0);
  const [fallbackModels, setFallbackModels] = useState<FallbackModelFormItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const config = feature?.fallback_config;
    setModelCode(feature?.model_code || '');
    setMaxRetries(typeof config?.max_retries === 'number' ? config.max_retries : 0);
    setTimeoutValue(typeof config?.timeout === 'number' ? config.timeout : 0);
    setFallbackModels(
      config?.fallback_models?.length
        ? config.fallback_models.map((item) => ({
          model_code: item.model_code || '',
          priority: typeof item.priority === 'number' ? item.priority : 0,
          enabled: !!item.enabled,
        }))
        : []
    );
  }, [open, feature]);

  const handleAddFallbackModel = () => {
    setFallbackModels((prev) => [...prev, createEmptyFallbackModel()]);
  };

  const handleRemoveFallbackModel = (index: number) => {
    setFallbackModels((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFallbackModel = (
    index: number,
    updates: Partial<FallbackModelFormItem>
  ) => {
    setFallbackModels((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const handleSubmit = async () => {
    if (!feature) {
      onClose(false);
      return;
    }

    setSubmitting(true);
    try {
      const cleanedFallbackModels = fallbackModels
        .filter((item) => item.model_code.trim())
        .map((item) => ({
          model_code: item.model_code.trim(),
          priority: Number.isFinite(item.priority) ? item.priority : 0,
          enabled: !!item.enabled,
        }));

      const payload: UpdateFeatureRequest = {
        code: feature.code,
        model_code: modelCode.trim(),
        fallback_config: {
          fallback_models: cleanedFallbackModels,
          max_retries: Number.isFinite(maxRetries) ? maxRetries : 0,
          timeout: Number.isFinite(timeout) ? timeout : 0,
        },
      };

      await featureManagementService.updateFeature(payload);
      toast.success('备用渠道配置已更新');
      onClose(true);
    } catch (error) {
      console.error('Failed to update fallback config:', error);
      toast.error('更新失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            备用渠道配置 {feature?.name ? `- ${feature.name}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">主渠道 Model</Label>
            <SupplierModelSelector
              value={modelCode}
              onChange={setModelCode}
              placeholder="选择主渠道供应商模型"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">最大重试次数</Label>
              <Input
                type="number"
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value, 10) || 0)}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">超时时间（秒）</Label>
              <Input
                type="number"
                value={timeout}
                onChange={(e) => setTimeoutValue(parseInt(e.target.value, 10) || 0)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="border rounded-md p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">备用渠道列表</Label>
              <Button size="sm" variant="outline" onClick={handleAddFallbackModel}>
                <Plus className="mr-1 h-3 w-3" />
                添加
              </Button>
            </div>

            {fallbackModels.length === 0 ? (
              <div className="text-xs text-muted-foreground">暂无备用渠道</div>
            ) : (
              <div className="space-y-3">
                {fallbackModels.map((item, index) => (
                  <div key={index} className="p-3 border rounded-md space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs">备用渠道 Model {index + 1}</Label>
                        <SupplierModelSelector
                          value={item.model_code}
                          onChange={(code) =>
                            updateFallbackModel(index, { model_code: code })
                          }
                          placeholder="选择备用渠道供应商模型"
                          className="text-xs"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveFallbackModel(index)}
                        className="mt-6"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">优先级</Label>
                        <Input
                          type="number"
                          value={item.priority}
                          onChange={(e) =>
                            updateFallbackModel(index, {
                              priority: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-5">
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={(checked) =>
                            updateFallbackModel(index, { enabled: checked })
                          }
                        />
                        <span className="text-xs">启用</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onClose(false)}>
            取消
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
