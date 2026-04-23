'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatModelCardPriceUSD, getModelCardPricing, type AIModel } from '@/services/modelService';
import { SavingsBadge } from './ModelCard';

interface MarketModelCardProps {
    model: AIModel;
    linkBase: string;
}

export function MarketModelCard({ model, linkBase }: MarketModelCardProps) {
    const t = useTranslations('modelDetail.market');
    const [copied, setCopied] = useState(false);

    const handleCopyId = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const copyValue = (model.models && model.models.length > 0) ? model.models[0] : model.id;
        navigator.clipboard.writeText(copyValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const pricing = getModelCardPricing(model);
    const usdPrice = formatModelCardPriceUSD(pricing.amountUSD);

    return (
        <Link href={`${linkBase}/models/${model.id}`} className="block h-full">
            <Card className="group relative h-[280px] overflow-hidden border-0 bg-card text-card-foreground shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 rounded-[2rem] flex flex-col">
                {/* Background Image/Video/Thumbnail */}
                <div className="absolute inset-0 z-0">
                    {model.thumbnailVideo ? (
                        <video
                            src={model.thumbnailVideo}
                            poster={model.thumbnail}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                        />
                    ) : model.thumbnail ? (
                        <img
                            src={model.thumbnail}
                            alt={model.name}
                            className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                </div>

                {/* Content Overlay */}
                <CardContent className="relative z-20 p-6 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-wrap gap-1.5">
                            {model.tasks.slice(0, 2).map((task) => (
                                <Badge
                                    key={task}
                                    variant="secondary"
                                    className="bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-white/5 text-white text-[10px] font-medium uppercase tracking-wider h-5"
                                >
                                    {task}
                                </Badge>
                            ))}
                        </div>
                        <button
                            onClick={handleCopyId}
                            className="p-2 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md hover:bg-white/20 dark:hover:bg-black/40 transition-all text-white/70 hover:text-white border border-white/10 dark:border-white/5"
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {model.icon && (
                                <div className="w-6 h-6 rounded-lg bg-white/10 dark:bg-black/20 backdrop-blur-md p-1 border border-white/10 dark:border-white/5">
                                    <img src={model.icon} alt="" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <span className="text-[10px] text-white/70 font-medium uppercase tracking-[0.1em]">
                                {model.provider}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                            {model.name}
                        </h3>

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-white">${usdPrice}</span>
                                <span className="text-[10px] text-white/60 uppercase">{t(pricing.labelKey)}</span>
                            </div>
                            {model.discount && (
                                <div className="bg-primary/20 backdrop-blur-md border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    -{model.discount}%
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 z-30 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </Card>
        </Link>
    );
}
