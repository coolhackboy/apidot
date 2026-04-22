'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SourceBreakdownItem } from '@/services/analyticsService';

interface SourceBreakdownTableProps {
  sources: SourceBreakdownItem[];
  translations: {
    source: string;
    uv: string;
    registrations: string;
    registrationRate: string;
    paidUsers: string;
    newPaidUsers: string;
    repeatPaidUsers: string;
    paymentRate: string;
    revenue: string;
    noData: string;
  };
}

export function SourceBreakdownTable({ sources, translations }: SourceBreakdownTableProps) {
  if (sources.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        {translations.noData}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.source}</TableHead>
            <TableHead className="text-right">{translations.uv}</TableHead>
            <TableHead className="text-right">{translations.registrations}</TableHead>
            <TableHead className="text-right">{translations.registrationRate}</TableHead>
            <TableHead className="text-right">{translations.paidUsers}</TableHead>
            <TableHead className="text-right">{translations.newPaidUsers}</TableHead>
            <TableHead className="text-right">{translations.repeatPaidUsers}</TableHead>
            <TableHead className="text-right">{translations.paymentRate}</TableHead>
            <TableHead className="text-right">{translations.revenue}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.source}</TableCell>
              <TableCell className="text-right">{item.uv.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.registrations.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.registration_rate.toFixed(1)}%</TableCell>
              <TableCell className="text-right">{item.paid_users.toLocaleString()}</TableCell>
              <TableCell className="text-right">{(item.new_paid_users || 0).toLocaleString()}</TableCell>
              <TableCell className="text-right">{(item.repeat_paid_users || 0).toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.payment_rate.toFixed(1)}%</TableCell>
              <TableCell className="text-right">${item.revenue.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
