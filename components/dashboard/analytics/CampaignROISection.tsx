'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CampaignROIItem } from '@/services/analyticsService';
import { cn } from '@/lib/utils';

interface CampaignROISectionProps {
  campaigns: CampaignROIItem[];
  summary: {
    total_spend: number;
    total_revenue: number;
    overall_roi: number;
    overall_roas: number;
  };
  adsConfigured: boolean;
  translations: {
    campaignName: string;
    spend: string;
    revenue: string;
    roi: string;
    roas: string;
    clicks: string;
    conversions: string;
    notConfigured: string;
    configureHint: string;
    noCampaignData: string;
    totalSpend: string;
    totalRevenue: string;
    overallROI: string;
    overallROAS: string;
  };
}

export function CampaignROISection({
  campaigns,
  summary,
  adsConfigured,
  translations,
}: CampaignROISectionProps) {
  if (!adsConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground space-y-2">
        <p>{translations.notConfigured}</p>
        <p className="text-xs">{translations.configureHint}</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        {translations.noCampaignData}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{translations.totalSpend}</p>
          <p className="text-xl font-bold">${summary.total_spend.toFixed(2)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{translations.totalRevenue}</p>
          <p className="text-xl font-bold">${summary.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{translations.overallROI}</p>
          <p className={cn(
            "text-xl font-bold",
            summary.overall_roi >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {summary.overall_roi >= 0 ? "+" : ""}{summary.overall_roi.toFixed(1)}%
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{translations.overallROAS}</p>
          <p className="text-xl font-bold">{summary.overall_roas.toFixed(2)}x</p>
        </div>
      </div>

      {/* Campaign table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translations.campaignName}</TableHead>
              <TableHead className="text-right">{translations.spend}</TableHead>
              <TableHead className="text-right">{translations.revenue}</TableHead>
              <TableHead className="text-right">{translations.roi}</TableHead>
              <TableHead className="text-right">{translations.roas}</TableHead>
              <TableHead className="text-right">{translations.clicks}</TableHead>
              <TableHead className="text-right">{translations.conversions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                <TableCell className="text-right">${campaign.spend.toFixed(2)}</TableCell>
                <TableCell className="text-right">${campaign.revenue.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={campaign.roi >= 0 ? "default" : "destructive"}
                    className={cn(
                      campaign.roi >= 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                    )}
                  >
                    {campaign.roi >= 0 ? "+" : ""}{campaign.roi.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{campaign.roas.toFixed(2)}x</TableCell>
                <TableCell className="text-right">{campaign.clicks.toLocaleString()}</TableCell>
                <TableCell className="text-right">{campaign.conversions}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
