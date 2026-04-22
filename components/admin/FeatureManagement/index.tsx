'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  featureManagementService,
  Feature,
  ListFeaturesParams,
} from '@/services/featureManagementService';
import {
  supplierModelService,
  SupplierModel,
} from '@/services/supplierModelService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { toast } from 'sonner';
import FallbackConfigDialog from './FallbackConfigDialog';
import FallbackConfigCell from './FallbackConfigCell';

const PAGE_SIZE = 10;

const getStatusBadge = (status: number) => {
  if (status === 1) {
    return { label: '启用', variant: 'default' as const };
  }
  if (status === 0) {
    return { label: '禁用', variant: 'secondary' as const };
  }
  return { label: String(status), variant: 'outline' as const };
};

export default function FeatureManagement() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchPublicModelId, setSearchPublicModelId] = useState('');
  const [activePublicModelId, setActivePublicModelId] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  // 供应商模型映射
  const [supplierMap, setSupplierMap] = useState<Map<string, SupplierModel>>(new Map());

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      const params: ListFeaturesParams = {
        page,
        page_size: PAGE_SIZE,
      };
      if (activePublicModelId.trim()) {
        params.public_model_id = activePublicModelId.trim();
      }
      const response = await featureManagementService.listFeatures(params);
      const fetchedFeatures = response?.items || [];
      setFeatures(fetchedFeatures);
      setTotal(response?.total || 0);

      // 批量获取所有 model_code 对应的供应商信息
      const allModelCodes: string[] = [];
      fetchedFeatures.forEach((feature) => {
        const mainCode = feature.model_code;
        if (mainCode) allModelCodes.push(mainCode);

        const fallbackModels = feature.fallback_config?.fallback_models || [];
        fallbackModels.forEach((item) => {
          if (item.model_code) allModelCodes.push(item.model_code);
        });
      });

      if (allModelCodes.length > 0) {
        try {
          const supplierModels = await supplierModelService.getSupplierModelsByCode(allModelCodes);
          const newMap = supplierModelService.createSupplierModelMap(supplierModels);
          setSupplierMap(newMap);
        } catch (error) {
          console.error('Failed to fetch supplier models:', error);
          // 不显示错误提示,降级显示 model_code
        }
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
      toast.error('获取模型列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, activePublicModelId]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleSearch = () => {
    setActivePublicModelId(searchPublicModelId);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEditFallback = (feature: Feature) => {
    setSelectedFeature(feature);
    setDialogOpen(true);
  };

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setSelectedFeature(null);
    if (saved) {
      fetchFeatures();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const startIndex = (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="w-full px-4 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">模型管理</CardTitle>
              <CardDescription className="mt-1">
                管理模型配置与备用渠道策略
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => fetchFeatures()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="按 Public Model ID 搜索"
                value={searchPublicModelId}
                onChange={(e) => setSearchPublicModelId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-64"
              />
              <Button variant="secondary" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : features.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无模型数据</p>
            </div>
          ) : (
            <TooltipProvider>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Public Model ID</TableHead>
                      <TableHead className="text-xs">Feature Code</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Model Code</TableHead>
                      <TableHead className="text-xs text-right">Credits</TableHead>
                      <TableHead className="text-xs text-center">Status</TableHead>
                      <TableHead className="text-xs">Submit Method</TableHead>
                      <TableHead className="text-xs">Fallback Config</TableHead>
                      <TableHead className="text-xs text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {features.map((feature) => {
                      const statusBadge = getStatusBadge(feature.status);
                      return (
                        <TableRow key={feature.code}>
                          <TableCell className="text-xs font-mono">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {feature.public_model_id || '-'}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {feature.public_model_id || '-'}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{feature.code}</TableCell>
                          <TableCell className="text-xs">{feature.name || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">{feature.model_code || '-'}</TableCell>
                          <TableCell className="text-xs text-right">
                            {Number(feature.credits_amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={statusBadge.variant} className="text-xs">
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{feature.submit_method || '-'}</TableCell>
                          <TableCell className="text-xs">
                            <FallbackConfigCell feature={feature} supplierMap={supplierMap} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleEditFallback(feature)}
                            >
                              <Settings className="mr-1 h-3 w-3" />
                              编辑
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          )}

          {!loading && features.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                显示第 {startIndex} - {endIndex} 条，共 {total} 条
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">{page}</span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <FallbackConfigDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        feature={selectedFeature}
      />
    </div>
  );
}
