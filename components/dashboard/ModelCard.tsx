'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatModelCardPriceUSD, getModelCardPricing, type AIModel } from '@/services/modelService';

export function SavingsBadge({ savings }: { savings: number }) {
    return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs font-medium">
            Save {savings}%
        </Badge>
    );
}

interface ModelCardProps {
    model: AIModel;
    linkBase: string;
    translations?: {
        perRequest: string;
        per1kInput: string;
        copyIdentifierSuccess: string;
        copyTitle: string;
    };
}

export function ModelCard({ model, linkBase, translations }: ModelCardProps) {
    const [copied, setCopied] = useState(false);

    const t = translations || {
        perRequest: "Per Request",
        per1kInput: "Per 1K Input",
        copyIdentifierSuccess: "Model identifier copied to clipboard",
        copyTitle: "Copy Model ID"
    };

    const handleCopyId = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const copyValue = (model.models && model.models.length > 0) ? model.models[0] : model.id;
        navigator.clipboard.writeText(copyValue);
        setCopied(true);
        toast.success(t.copyIdentifierSuccess);
        setTimeout(() => setCopied(false), 2000);
    };

    const pricing = getModelCardPricing(model);
    const usdPrice = formatModelCardPriceUSD(pricing.amountUSD);

    return (
        <Link href={`${linkBase}/models/${model.id}`} className="block h-full">
            <Card className="group relative h-full overflow-hidden border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-2xl flex flex-col">
                {/* Model Image/Preview */}
                <CardContent className="p-0 h-full flex flex-col">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                        {model.thumbnail ? (
                            <img
                                src={model.thumbnail}
                                alt={model.name}
                                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                                <div className="text-center px-4">
                                    <div className="text-2xl font-bold text-primary mb-1">
                                        {model.name}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Model Info */}
                    <div className="p-4 flex flex-col flex-1 gap-3">
                        <div className="flex items-center gap-2">
                            {model.icon && (
                                <img src={model.icon} alt="" className="w-5 h-5 object-contain" />
                            )}
                            <h4 className="font-bold text-base tracking-tight flex-1 truncate">
                                {model.name}
                            </h4>
                            <button
                                onClick={handleCopyId}
                                className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                title={t.copyTitle}
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="text-sm font-medium flex items-center justify-between">
                            <div>
                                <span className="text-muted-foreground mr-1">{t[pricing.labelKey]}:</span>
                                <span className="text-foreground">${usdPrice}</span>
                            </div>
                            {model.discount && <SavingsBadge savings={model.discount} />}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {model.description}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
