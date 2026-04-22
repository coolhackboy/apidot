'use client';

import { AlertTriangle, CreditCard, ListOrdered, RefreshCw, TrendingUp, UserCheck, Wallet } from 'lucide-react';
import { useState } from 'react';
import type { ComponentType } from 'react';

import AffiliateApplicationsTab from '@/components/admin/AffiliateManagement/AffiliateApplicationsTab';
import AffiliateCommissionOrdersTab from '@/components/admin/AffiliateManagement/AffiliateCommissionOrdersTab';
import AffiliatePartnersTab from '@/components/admin/AffiliateManagement/AffiliatePartnersTab';
import AffiliateSettlementsTab from '@/components/admin/AffiliateManagement/AffiliateSettlementsTab';
import { formatMoney } from '@/components/admin/AffiliateManagement/helpers';
import type { TabKey } from '@/components/admin/AffiliateManagement/types';
import { useAffiliateAdminOverview } from '@/components/admin/AffiliateManagement/useAffiliateAdminOverview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabIcons = {
  applications: UserCheck,
  orders: ListOrdered,
  withdrawals: CreditCard,
  affiliates: TrendingUp,
} as const;

function QueueCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <Card className="border border-border/60 bg-card/80">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AffiliateAdminContent({ vendorCode }: { vendorCode?: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>('applications');
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);
  const [affiliatesTotal, setAffiliatesTotal] = useState(0);

  const {
    overview,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = useAffiliateAdminOverview(vendorCode);

  const tabItems: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'applications', label: '申请审核', count: applicationsTotal },
    { key: 'orders', label: '佣金订单', count: ordersTotal },
    { key: 'withdrawals', label: '提现审核', count: withdrawalsTotal },
    { key: 'affiliates', label: '推广员管理', count: affiliatesTotal },
  ];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">推广管理</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              申请审核、佣金订单、提现审核和推广员管理按实时接口渲染。列表只保留决策字段，详情承载判断材料和处理动作。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="border border-green-500/20 bg-green-500/10 text-green-600">实时接口</Badge>
            <Badge className="border border-border bg-muted/50 text-muted-foreground">主状态 + 标签状态</Badge>
          </div>
        </div>

        {overviewError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3 text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{overviewError}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => void refreshOverview()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重试总览
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <QueueCard
            title="待审核申请"
            value={overviewLoading ? '--' : `${overview?.pending_application_count ?? 0}`}
            description="当前申请状态为 submitted 的实时数量"
            icon={UserCheck}
            tone="bg-green-500/10 text-green-600"
          />
          <QueueCard
            title="待释放佣金"
            value={overviewLoading ? '--' : `${overview?.releasable_commission_count ?? 0}`}
            description={
              overviewLoading
                ? '正在加载金额...'
                : `可提现金额 ${formatMoney(overview?.releasable_commission_amount ?? null)}`
            }
            icon={Wallet}
            tone="bg-blue-500/10 text-blue-600"
          />
          <QueueCard
            title="待打款提现"
            value={overviewLoading ? '--' : `${overview?.pending_payout_count ?? 0}`}
            description={
              overviewLoading
                ? '正在加载金额...'
                : `待打款金额 ${formatMoney(overview?.pending_payout_amount ?? null)}`
            }
            icon={CreditCard}
            tone="bg-amber-500/10 text-amber-600"
          />
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-5 rounded-none border-b border-border/60 bg-transparent p-0 text-muted-foreground">
          {tabItems.map((tab) => {
            const Icon = tabIcons[tab.key];
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tab.count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="applications" className="mt-0 data-[state=inactive]:hidden" forceMount>
          <AffiliateApplicationsTab onTotalChange={setApplicationsTotal} vendorCode={vendorCode} />
        </TabsContent>

        <TabsContent value="orders" className="mt-0 data-[state=inactive]:hidden" forceMount>
          <AffiliateCommissionOrdersTab onTotalChange={setOrdersTotal} vendorCode={vendorCode} />
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-0 data-[state=inactive]:hidden" forceMount>
          <AffiliateSettlementsTab onTotalChange={setWithdrawalsTotal} vendorCode={vendorCode} />
        </TabsContent>

        <TabsContent value="affiliates" className="mt-0 data-[state=inactive]:hidden" forceMount>
          <AffiliatePartnersTab onTotalChange={setAffiliatesTotal} vendorCode={vendorCode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
