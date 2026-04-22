'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  supplierModelService,
  SupplierModel,
} from '@/services/supplierModelService';
import { toast } from 'sonner';

interface SupplierModelSelectorProps {
  value: string; // model_code
  onChange: (modelCode: string) => void;
  placeholder?: string;
  className?: string;
}

interface ScrollbarState {
  visible: boolean;
  thumbHeight: number;
  thumbOffset: number;
}

const DEFAULT_SCROLLBAR_STATE: ScrollbarState = {
  visible: false,
  thumbHeight: 0,
  thumbOffset: 0,
};

export default function SupplierModelSelector({
  value,
  onChange,
  placeholder = '选择供应商模型',
  className,
}: SupplierModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<SupplierModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollbar, setScrollbar] = useState<ScrollbarState>(
    DEFAULT_SCROLLBAR_STATE
  );
  const [draggingScrollbar, setDraggingScrollbar] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // 获取当前选中的模型信息
  const selectedModel = models.find((model) => model.model_code === value);

  // 加载供应商模型列表
  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await supplierModelService.listSupplierModels({
          page: 1,
          page_size: 100,
          ...(searchQuery.trim() && {
            keyword: searchQuery.trim(),
          }),
        });
        if (!cancelled) {
          setModels((prev) => {
            const nextItems = response.items || [];
            const currentSelected = prev.find(
              (model) => model.model_code === value
            );

            if (!value || !currentSelected) {
              return nextItems;
            }

            const hasSelected = nextItems.some(
              (model) => model.model_code === value
            );

            if (hasSelected) {
              return nextItems;
            }

            return [currentSelected, ...nextItems];
          });
        }
      } catch (error) {
        console.error('Failed to fetch supplier models:', error);
        toast.error('获取供应商模型列表失败');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchModels();

    return () => {
      cancelled = true;
    };
  }, [open, searchQuery, value]);

  // 当有初始值时,获取对应的模型信息用于显示
  useEffect(() => {
    if (value && !selectedModel && !open) {
      supplierModelService
        .getSupplierModelsByCode([value])
        .then((items) => {
          if (items.length > 0) {
            setModels((prev) => {
              const existing = prev.find((m) => m.model_code === value);
              if (!existing) {
                return [...prev, items[0]];
              }
              return prev;
            });
          }
        })
        .catch((error) => {
          console.error('Failed to fetch selected model info:', error);
        });
    }
  }, [value, selectedModel, open]);

  useEffect(() => {
    if (!open) {
      setScrollbar(DEFAULT_SCROLLBAR_STATE);
      return;
    }

    const listEl = listRef.current;
    const trackEl = trackRef.current;

    if (!listEl || !trackEl) {
      return;
    }

    const updateScrollbar = () => {
      const { scrollHeight, clientHeight, scrollTop } = listEl;
      const trackHeight = trackEl.clientHeight;
      const canScroll = scrollHeight > clientHeight + 1 && trackHeight > 0;

      if (!canScroll) {
        setScrollbar(DEFAULT_SCROLLBAR_STATE);
        return;
      }

      const nextThumbHeight = Math.max(
        (clientHeight / scrollHeight) * trackHeight,
        36
      );
      const maxThumbOffset = trackHeight - nextThumbHeight;
      const maxScrollTop = scrollHeight - clientHeight;
      const nextThumbOffset =
        maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbOffset : 0;

      setScrollbar({
        visible: true,
        thumbHeight: nextThumbHeight,
        thumbOffset: nextThumbOffset,
      });
    };

    updateScrollbar();

    listEl.addEventListener('scroll', updateScrollbar);
    window.addEventListener('resize', updateScrollbar);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollbar);
      resizeObserver.observe(listEl);
      resizeObserver.observe(trackEl);
    }

    return () => {
      listEl.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
      resizeObserver?.disconnect();
    };
  }, [open, loading, models.length]);

  useEffect(() => {
    if (!open || loading) {
      return;
    }

    if (!value || searchQuery.trim()) {
      return;
    }

    const listEl = listRef.current;
    const selectedItemEl = selectedItemRef.current;

    if (!listEl || !selectedItemEl) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      selectedItemEl.scrollIntoView({
        block: 'nearest',
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [open, loading, value, searchQuery, models]);

  const handleSelect = (modelCode: string) => {
    onChange(modelCode);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleScrollbarThumbMouseDown = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const listEl = listRef.current;
    const trackEl = trackRef.current;

    if (!listEl || !trackEl || !scrollbar.visible) {
      return;
    }

    const startY = event.clientY;
    const startScrollTop = listEl.scrollTop;
    const maxScrollTop = listEl.scrollHeight - listEl.clientHeight;
    const maxThumbOffset = trackEl.clientHeight - scrollbar.thumbHeight;

    if (maxScrollTop <= 0 || maxThumbOffset <= 0) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    setDraggingScrollbar(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const nextScrollTop =
        startScrollTop + (deltaY / maxThumbOffset) * maxScrollTop;
      listEl.scrollTop = Math.max(0, Math.min(nextScrollTop, maxScrollTop));
    };

    const handleMouseUp = () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      setDraggingScrollbar(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleScrollbarTrackMouseDown = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    const listEl = listRef.current;
    const trackEl = trackRef.current;

    if (!listEl || !trackEl || !scrollbar.visible) {
      return;
    }

    const rect = trackEl.getBoundingClientRect();
    const clickOffset = event.clientY - rect.top;
    const maxThumbOffset = rect.height - scrollbar.thumbHeight;
    const maxScrollTop = listEl.scrollHeight - listEl.clientHeight;

    if (maxThumbOffset <= 0 || maxScrollTop <= 0) {
      return;
    }

    const nextThumbOffset = Math.max(
      0,
      Math.min(clickOffset - scrollbar.thumbHeight / 2, maxThumbOffset)
    );

    listEl.scrollTop = (nextThumbOffset / maxThumbOffset) * maxScrollTop;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-9', className)}
        >
          <span className="truncate text-xs">
            {selectedModel
              ? `${selectedModel.supplier_name} - ${selectedModel.model_name}`
              : value || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="h-3 w-3 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(640px,calc(100vw-48px))] p-0 max-h-[min(70vh,720px)] overflow-hidden"
        align="start"
        sideOffset={8}
        collisionPadding={20}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="搜索供应商或模型名称..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-xs"
          />
          <div className="relative">
            <CommandList
              ref={listRef}
              className="supplier-model-selector-list max-h-[min(55vh,520px)] pr-5"
            >
              {loading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  加载中...
                </div>
              ) : models.length === 0 ? (
                <CommandEmpty className="text-xs">未找到匹配的模型</CommandEmpty>
              ) : (
                <CommandGroup>
                  {models.map((model) => (
                    <CommandItem
                      key={model.model_code}
                      ref={value === model.model_code ? selectedItemRef : null}
                      value={model.model_code}
                      onSelect={handleSelect}
                      className="flex flex-col items-start gap-1 py-2"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              'h-3 w-3',
                              value === model.model_code
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium">
                              {model.supplier_name} - {model.model_name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              model_code: {model.model_code}
                            </span>
                            <span className="text-xs text-muted-foreground break-all">
                              {model.submit_uri}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            <div
              ref={trackRef}
              className={cn(
                'absolute inset-y-2 right-1.5 w-3 rounded-full bg-muted/60 transition-opacity',
                scrollbar.visible ? 'opacity-100' : 'pointer-events-none opacity-0'
              )}
              onMouseDown={handleScrollbarTrackMouseDown}
            >
              {scrollbar.visible && (
                <div
                  className={cn(
                    'absolute inset-x-0.5 rounded-full bg-muted-foreground/75 transition-colors',
                    draggingScrollbar && 'bg-primary/80'
                  )}
                  style={{
                    height: `${scrollbar.thumbHeight}px`,
                    transform: `translateY(${scrollbar.thumbOffset}px)`,
                  }}
                  onMouseDown={handleScrollbarThumbMouseDown}
                />
              )}
            </div>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
