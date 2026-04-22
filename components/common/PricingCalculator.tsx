"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export type PricingCalculatorProps = {
  eyebrow: string;
  title: string;
  description: string;
  pricePerUnit: {
    poyo: number;
    fal: number;
    replicate: number;
  };
  labels: {
    usage: string;
    perMonth: string;
    youSave: string;
    recommended?: string;
  };
  providerNames?: {
    poyo: string;
    fal: string;
    replicate: string;
  };
};

export function PricingCalculator({
  eyebrow,
  title,
  description,
  pricePerUnit,
  labels,
  providerNames = {
    poyo: "poyo.ai",
    fal: "fal.ai",
    replicate: "Replicate",
  },
}: PricingCalculatorProps) {
  const [usage, setUsage] = useState(1000);

  const costs = useMemo(() => {
    const poyoCost = usage * pricePerUnit.poyo;
    const falCost = usage * pricePerUnit.fal;
    const replicateCost = usage * pricePerUnit.replicate;
    const maxCost = Math.max(falCost, replicateCost);
    const savings = maxCost - poyoCost;
    const savingsPercent = Math.round((savings / maxCost) * 100);

    return {
      poyo: poyoCost,
      fal: falCost,
      replicate: replicateCost,
      savings,
      savingsPercent,
    };
  }, [usage, pricePerUnit]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatUsage = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }
    return value.toString();
  };

  return (
    <section className="container mx-auto px-4 py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className="max-w-4xl mx-auto border-muted/40 shadow-lg shadow-primary/5">
        <CardContent className="p-6 sm:p-8 space-y-8">
          {/* Usage Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                {labels.usage}
              </span>
              <span className="text-2xl font-bold">
                {formatUsage(usage)} {labels.perMonth}
              </span>
            </div>
            <Slider
              value={[usage]}
              onValueChange={([value]) => setUsage(value)}
              min={100}
              max={10000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100</span>
              <span>2,500</span>
              <span>5,000</span>
              <span>7,500</span>
              <span>10,000</span>
            </div>
          </div>

          {/* Provider Cost Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* poyo.ai - Highlighted */}
            <Card className="border-primary/50 bg-primary/5 relative">
              <CardContent className="p-4 text-center space-y-2">
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {labels.recommended || "Recommended"}
                </Badge>
                <p className="text-sm font-medium text-muted-foreground pt-2">
                  {providerNames.poyo}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(costs.poyo)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${pricePerUnit.poyo.toFixed(3)}/image
                </p>
              </CardContent>
            </Card>

            {/* fal.ai */}
            <Card className="border-muted/40">
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground pt-2">
                  {providerNames.fal}
                </p>
                <p className="text-3xl font-bold text-muted-foreground">
                  {formatCurrency(costs.fal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${pricePerUnit.fal.toFixed(2)}/image
                </p>
              </CardContent>
            </Card>

            {/* Replicate */}
            <Card className="border-muted/40">
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground pt-2">
                  {providerNames.replicate}
                </p>
                <p className="text-3xl font-bold text-muted-foreground">
                  {formatCurrency(costs.replicate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${pricePerUnit.replicate.toFixed(2)}/image
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Savings Summary */}
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
            <p className="text-lg">
              <span className="text-green-600 dark:text-green-400 font-bold">
                {labels.youSave} {formatCurrency(costs.savings)}/month (
                {costs.savingsPercent}%)
              </span>{" "}
              <span className="text-muted-foreground">
                with {providerNames.poyo}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
