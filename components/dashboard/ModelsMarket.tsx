'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getActiveMarketplaceModels,
  formatModelCardPriceUSD,
  getFeaturedModels,
  searchModels,
  getAllProviders,
  getAllTasks,
  getModelCardPricing,
  type AIModel
} from '@/services/modelService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Search, ArrowRight, LayoutGrid, List, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { MarketModelCard } from './MarketModelCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SavingsBadge } from './ModelCard';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 9;

export function ModelsMarket({ basePath }: { basePath?: string }) {
  const locale = useLocale();
  const t = useTranslations('modelDetail.market');
  const marketModels = useMemo(() => getActiveMarketplaceModels(), []);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [activeTab, setActiveTab] = useState<'task' | 'provider'>('task');
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const linkBase = basePath ?? `/${locale}`;

  const allProviders = getAllProviders();
  const allTasks = getAllTasks();

  const taskGroups = useMemo(() => [
    { name: t('groups.video'), tasks: ['Image to Video', 'Text to Video', 'Motion Control', 'Character Animation'] },
    { name: t('groups.image'), tasks: ['Text to Image', 'Image to Image'] },
    { name: t('groups.music'), tasks: ['Music'] },
    { name: t('groups.chat'), tasks: ['Chat', 'Code'] },
    { name: t('groups.others'), tasks: ['Others'] }
  ], [t]);

  const categoryFilter = useMemo(() => {
    const raw = searchParams.get('category');
    return raw ? raw.trim().toLowerCase() : '';
  }, [searchParams]);

  // Sync category filter from URL to selected tasks
  useEffect(() => {
    if (categoryFilter) {
      const matchedTask = allTasks.find(t => t.toLowerCase() === categoryFilter);
      if (matchedTask && !selectedTasks.includes(matchedTask)) {
        setSelectedTasks([matchedTask]);
      }
    }
  }, [categoryFilter, allTasks]);

  const toggleProvider = (provider: string) => {
    setSelectedProviders(prev =>
      prev.includes(provider)
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const toggleTask = (task: string) => {
    setSelectedTasks(prev =>
      prev.includes(task)
        ? prev.filter(t => t !== task)
        : [...prev, task]
    );
  };

  let displayedModels = marketModels;

  if (searchQuery) {
    displayedModels = searchModels(searchQuery);
  } else {
    if (selectedProviders.length > 0) {
      displayedModels = displayedModels.filter(model =>
        selectedProviders.includes(model.provider)
      );
    }

    if (selectedTasks.length > 0) {
      displayedModels = displayedModels.filter(model =>
        model.tasks?.some(task => selectedTasks.includes(task))
      );
    }
  }

  const clearFilters = () => {
    setSelectedProviders([]);
    setSelectedTasks([]);
    setSearchQuery('');
    setCurrentPage(1);
    router.push(linkBase + '/models');
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProviders, selectedTasks, searchQuery]);

  const totalPages = Math.ceil(displayedModels.length / PAGE_SIZE);
  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return displayedModels.slice(start, start + PAGE_SIZE);
  }, [displayedModels, currentPage]);

  const hasActiveFilters = selectedProviders.length > 0 || selectedTasks.length > 0 || searchQuery;
  const featured = getFeaturedModels();

  const taskColors: Record<string, string> = {
    'Video': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    'Image': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'Chat': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Music': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Audio': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Code': 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  };

  const getTaskColor = (task: string) => {
    for (const key in taskColors) {
      if (task.includes(key)) return taskColors[key];
    }
    return 'bg-secondary text-secondary-foreground border-border';
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-12">

        {/* Cinematic Hero Carousel */}
        <div className="relative group">
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
              {featured.map((model) => (
                <CarouselItem key={model.id}>
                  <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden rounded-[2.5rem] border border-border dark:border-white/5">
                    {/* Background */}
                    <div className="absolute inset-0">
                      {model.thumbnailVideo ? (
                        <video
                          src={model.thumbnailVideo}
                          poster={model.thumbnail}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : model.thumbnail ? (
                        <img src={model.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-purple-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-center px-8 md:px-20 space-y-6 max-w-3xl">
                      <div className="flex gap-2">
                        {model.tasks.map((task) => (
                          <Badge key={task} className="bg-white/10 backdrop-blur-xl border-white/10 text-white uppercase text-[10px] tracking-widest px-3 py-1">
                            {task}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                        {model.name}
                      </h2>
                      <p className="text-lg md:text-xl text-white/60 leading-relaxed line-clamp-2">
                        {model.description}
                      </p>
                      <Link href={`${linkBase}/models/${model.id}`}>
                        <Button size="lg" className="rounded-full px-10 h-14 text-lg bg-white text-black hover:bg-white/90 shadow-2xl transition-all transform hover:scale-105 active:scale-95">
                          {t('learnMore')}
                          <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-8 lg:left-12 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/20 dark:bg-white/5 hover:bg-background/40 dark:hover:bg-white/10 backdrop-blur-2xl border-border dark:border-white/10 hover:border-primary/50 dark:hover:border-white/20 text-foreground dark:text-white w-14 h-14 [&_svg]:h-6 [&_svg]:w-6" />
            <CarouselNext className="right-8 lg:right-12 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/20 dark:bg-white/5 hover:bg-background/40 dark:hover:bg-white/10 backdrop-blur-2xl border-border dark:border-white/10 hover:border-primary/50 dark:hover:border-white/20 text-foreground dark:text-white w-14 h-14 [&_svg]:h-6 [&_svg]:w-6" />
          </Carousel>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sidebar Filters */}
          <aside className="w-full lg:w-72 space-y-8 shrink-0 lg:sticky lg:top-8">
            <div className="bg-card backdrop-blur-xl border border-border dark:border-white/5 rounded-[2rem] p-6 space-y-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">{t('filters')}</h3>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 px-3 rounded-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('clear')}
                  </Button>
                )}
              </div>

              {/* Task Tabs */}
              <div className="space-y-6">
                <div className="flex gap-2 bg-secondary/50 dark:bg-black/40 p-1 rounded-2xl border border-border dark:border-white/5">
                  <button
                    onClick={() => setActiveTab('task')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'task' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t('tasks')}
                  </button>
                  <button
                    onClick={() => setActiveTab('provider')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'provider' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t('providers')}
                  </button>
                </div>

                {activeTab === 'task' ? (
                  <div className="space-y-6">
                    {taskGroups.filter(group => group.tasks.length > 0).map(group => (
                      <div key={group.name} className="space-y-3">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold px-2">{group.name}</h4>
                        <div className="flex flex-col gap-1.5">
                          {group.tasks.map(task => {
                            const isSelected = selectedTasks.includes(task);
                            return (
                              <button
                                key={task}
                                onClick={() => toggleTask(task)}
                                className={`group flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${isSelected
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'bg-secondary/30 dark:bg-black/20 border-border dark:border-white/5 text-muted-foreground hover:border-primary/50 dark:hover:border-white/20 hover:text-foreground hover:bg-secondary/50'}`}
                              >
                                <span className="text-sm font-medium">{task}</span>
                                <div className={`w-1.5 h-1.5 rounded-full transition-all ${isSelected ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-muted-foreground/20 group-hover:bg-muted-foreground/40'}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {allProviders.map(provider => {
                      const isSelected = selectedProviders.includes(provider);
                        const count = marketModels.filter(m => m.provider === provider).length;
                      return (
                        <button
                          key={provider}
                          onClick={() => toggleProvider(provider)}
                          className={`group flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-secondary/30 dark:bg-black/20 border-border dark:border-white/5 text-muted-foreground hover:border-primary/50 dark:hover:border-white/20 hover:text-foreground hover:bg-secondary/50'}`}
                        >
                          <span className="text-sm font-medium">{provider}</span>
                          <span className="text-xs opacity-40">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Right Main Content */}
          <main className="flex-1 space-y-8 w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card backdrop-blur-xl border border-border dark:border-white/5 rounded-[2rem] p-4 shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  placeholder={t('searchModels')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-secondary/50 dark:bg-black/40 border-border dark:border-white/5 rounded-[1.5rem] focus-visible:ring-primary focus:border-primary/50 text-foreground placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-secondary/30 dark:bg-black/40 p-1 rounded-xl border border-border dark:border-white/5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('card')}
                    className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'card' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedModels.map((model) => (
                  <MarketModelCard
                    key={model.id}
                    model={model}
                    linkBase={linkBase}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-border dark:border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border dark:border-white/5">
                      <TableHead className="text-muted-foreground/60 uppercase text-[10px] tracking-wider py-6 px-8 leading-none">{t('table.modelName')}</TableHead>
                      <TableHead className="text-muted-foreground/60 uppercase text-[10px] tracking-wider py-6 leading-none">{t('table.provider')}</TableHead>
                      <TableHead className="text-muted-foreground/60 uppercase text-[10px] tracking-wider py-6 leading-none">{t('table.tasks')}</TableHead>
                      <TableHead className="text-right text-muted-foreground/60 uppercase text-[10px] tracking-wider py-6 px-8 leading-none">{t('table.pricing')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedModels.map((model) => (
                      <TableRow key={model.id} className="group cursor-pointer hover:bg-secondary/50 dark:hover:bg-white/5 border-border dark:border-white/5 transition-colors">
                        <TableCell className="py-6 px-8">
                          <div className="flex items-center gap-3">
                            {model.icon && <img src={model.icon} alt="" className="w-8 h-8 object-contain rounded-lg bg-white/5 p-1.5" />}
                            <Link href={`${linkBase}/models/${model.id}`} className="font-bold text-foreground group-hover:text-primary transition-colors text-base">
                              {model.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground/60 font-medium tracking-wide">{model.provider}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {model.tasks.slice(0, 2).map((task) => (
                              <Badge key={task} className={`${getTaskColor(task)} border font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-tighter`}>
                                {task}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-6 px-8">
                          {(() => {
                            const pricing = getModelCardPricing(model);

                            return (
                              <div className="flex items-center justify-end gap-3">
                                {model.discount && <SavingsBadge savings={model.discount} />}
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-bold text-foreground">${formatModelCardPriceUSD(pricing.amountUSD)}</span>
                                  <span className="text-[10px] text-muted-foreground/40 uppercase font-medium">{t(pricing.labelKey)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-12 pb-8">
                <Pagination>
                  <PaginationContent className="bg-secondary/50 dark:bg-white/5 border border-border dark:border-white/5 p-1.5 rounded-2xl backdrop-blur-xl">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={`cursor-pointer hover:bg-secondary dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white border-none transition-all ${currentPage === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      // Show limited pages if many
                      if (totalPages > 7) {
                        if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                          if (page === 2 || page === totalPages - 1) return <PaginationEllipsis key={page} className="text-muted-foreground/30" />;
                          return null;
                        }
                      }

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className={`cursor-pointer rounded-xl transition-all border-none ${currentPage === page
                              ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]'
                              : 'text-muted-foreground hover:bg-secondary dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white'
                              }`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={`cursor-pointer hover:bg-secondary dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white border-none transition-all ${currentPage === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {displayedModels.length === 0 && (
              <div className="text-center py-32 rounded-[3rem] border border-dashed border-border dark:border-white/10 bg-secondary/20 dark:bg-white/5 backdrop-blur-sm">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-primary opacity-50" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t('noModelsFound')}</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed text-lg">
                  {t('noModelsFoundDesc')}
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="rounded-2xl px-8 h-12 bg-background dark:bg-white/5 border-border dark:border-white/10 hover:border-primary/50 transition-all font-medium"
                >
                  {t('clearAllFilters')}
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
