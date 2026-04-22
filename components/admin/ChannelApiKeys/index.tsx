'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  channelApiKeysService,
  ChannelApiKeyItem,
  ChannelApiKeyTestResult,
  FalBalanceResponse,
} from '@/services/channelApiKeysService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Copy, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getStatusBadge(status: number) {
  if (status === 1) {
    return { label: 'Active', variant: 'default' as const };
  }

  return { label: 'Disabled', variant: 'secondary' as const };
}

export default function ChannelApiKeys() {
  const [items, setItems] = useState<ChannelApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [balanceLoadingId, setBalanceLoadingId] = useState<number | null>(null);
  const [balanceMap, setBalanceMap] = useState<Record<number, FalBalanceResponse>>({});
  const [result, setResult] = useState<ChannelApiKeyTestResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const loadItems = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await channelApiKeysService.listChannelApiKeys();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load channel api keys:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load channel API keys');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const falItems = useMemo(() => items.filter((item) => item.channel === 'fal'), [items]);
  const replicateItems = useMemo(
    () => items.filter((item) => item.channel === 'replicate'),
    [items]
  );

  const handleTest = async (item: ChannelApiKeyItem) => {
    try {
      setTestingId(item.id);
      // 测试直接在前端调用渠道接口，结果原样展示。
      const response = await channelApiKeysService.testChannelApiKey(item);
      setResult(response);
      setResultOpen(true);
      toast.success(`${item.channel} test succeeded`);
    } catch (error) {
      console.error('Channel api key test failed:', error);
      toast.error(error instanceof Error ? error.message : 'Channel API key test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleQueryBalance = async (item: ChannelApiKeyItem) => {
    try {
      setBalanceLoadingId(item.id);
      // 余额仍走后端，避免暴露 fal 的 admin_api_key。
      const data = await channelApiKeysService.queryFalBalance(item.id);
      setBalanceMap((prev) => ({ ...prev, [item.id]: data }));
      toast.success('Balance query succeeded');
    } catch (error) {
      console.error('Failed to query fal balance:', error);
      toast.error(error instanceof Error ? error.message : 'Balance query failed');
    } finally {
      setBalanceLoadingId(null);
    }
  };

  const handleCopyApiKey = async (item: ChannelApiKeyItem) => {
    if (!item.api_key) {
      toast.error('API Key is empty');
      return;
    }

    try {
      await navigator.clipboard.writeText(item.api_key);
      toast.success('API Key 已复制');
    } catch (error) {
      console.error('Failed to copy api key:', error);
      toast.error('复制 API Key 失败');
    }
  };

  const renderTable = (channelItems: ChannelApiKeyItem[], channel: 'fal' | 'replicate') => {
    if (loading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    if (channelItems.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No {channel} channel API keys
        </div>
      );
    }

    return (
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Channel</TableHead>
              <TableHead className="text-xs">Supplier</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs">API Key</TableHead>
              <TableHead className="text-xs">Admin Key</TableHead>
              <TableHead className="text-center text-xs">Status</TableHead>
              <TableHead className="text-center text-xs">Current Tasks</TableHead>
              <TableHead className="text-xs">Updated At</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelItems.map((item) => {
              const statusBadge = getStatusBadge(item.status);
              const balance = balanceMap[item.id];
              const isTesting = testingId === item.id;
              const isBalanceLoading = balanceLoadingId === item.id;

              return (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-medium uppercase">
                    {item.channel}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{item.supplier_name || '-'}</div>
                    <div className="text-muted-foreground">{item.supplier_code || '-'}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.is_current_supplier_key ? (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Pool
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{item.masked_api_key || '-'}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!item.api_key}
                        onClick={() => handleCopyApiKey(item)}
                        title="复制 API Key"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {item.masked_admin_api_key || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusBadge.variant} className="text-xs">
                      {statusBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {item.current_task_counts}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDateTime(item.updated_time)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={isTesting || !item.api_key}
                        onClick={() => handleTest(item)}
                      >
                        {isTesting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Test
                      </Button>
                      {channel === 'fal' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isBalanceLoading}
                          onClick={() => handleQueryBalance(item)}
                        >
                          {isBalanceLoading && (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          )}
                          Balance
                        </Button>
                      )}
                    </div>
                    {/* 只显示当前行已查询过的余额，不做整页批量查询。 */}
                    {channel === 'fal' && balance && (
                      <div className="mt-2 text-right text-xs text-muted-foreground">
                        Latest balance: {balance.current_balance ?? '-'}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <div className="w-full px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Channel API Keys</CardTitle>
                <CardDescription className="mt-1">
                  Manage fal and Replicate channel keys, run provider tests, and query fal balance.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => loadItems(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fal" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="fal">Fal</TabsTrigger>
                <TabsTrigger value="replicate">Replicate</TabsTrigger>
              </TabsList>

              <TabsContent value="fal">{renderTable(falItems, 'fal')}</TabsContent>

              <TabsContent value="replicate">
                {renderTable(replicateItems, 'replicate')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Channel Test Result</DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-muted-foreground">Channel</div>
                  <div className="font-medium uppercase">{result.channel}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Model</div>
                  <div className="font-medium">{result.model}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">HTTP Status</div>
                  <div className="font-medium">{result.status}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Raw Response</div>
                <pre className="max-h-[420px] overflow-auto rounded-md bg-muted p-4 text-xs">
                  {JSON.stringify(result.body, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
