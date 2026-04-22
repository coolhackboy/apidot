'use client';

import { useState, useEffect, useRef } from 'react';

interface ImageComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    alt: string;
    autoPlay?: boolean;
    autoPlayDuration?: number;
    autoPlayPauseDuration?: number;
    resetKey?: string | number;
}

export default function ImageComparisonSlider({ 
    beforeImage, 
    afterImage, 
    alt,
    autoPlay = true,
    autoPlayDuration = 3000,
    autoPlayPauseDuration = 1000,
    resetKey
}: ImageComparisonSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [isUserInteracting, setIsUserInteracting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [autoPlayDirection, setAutoPlayDirection] = useState<'left' | 'right'>('right');

    // Reset slider when resetKey changes
    useEffect(() => {
        setSliderPosition(50);
        setAutoPlayDirection('right');
        setIsUserInteracting(false);
        setIsDragging(false);
    }, [resetKey]);

    const handleMouseDown = () => {
        setIsDragging(true);
        handleUserInteraction();
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            setSliderPosition(percentage);
            handleUserInteraction();
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            setSliderPosition(percentage);
            handleUserInteraction();
        }
    };

    const handleUserInteraction = () => {
        setIsUserInteracting(true);
        
        // Clear existing timeout
        if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current);
        }
        
        // Set timeout to resume auto-play after user stops interacting
        interactionTimeoutRef.current = setTimeout(() => {
            setIsUserInteracting(false);
        }, 2000); // Resume auto-play after 2 seconds of no interaction
    };

    const handleContainerInteraction = () => {
        handleUserInteraction();
    };

    // Auto-play functionality
    useEffect(() => {
        if (!autoPlay || isUserInteracting || isDragging) {
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
                autoPlayIntervalRef.current = null;
            }
            return;
        }

        const startAutoPlay = () => {
            autoPlayIntervalRef.current = setInterval(() => {
                setSliderPosition(prevPosition => {
                    // Determine the direction and next position
                    let nextPosition = prevPosition;
                    
                    if (autoPlayDirection === 'right') {
                        nextPosition = Math.min(100, prevPosition + 2);
                        if (nextPosition >= 100) {
                            setTimeout(() => setAutoPlayDirection('left'), autoPlayPauseDuration);
                        }
                    } else {
                        nextPosition = Math.max(0, prevPosition - 2);
                        if (nextPosition <= 0) {
                            setTimeout(() => setAutoPlayDirection('right'), autoPlayPauseDuration);
                        }
                    }
                    
                    return nextPosition;
                });
            }, 50); // Smooth animation with 50ms intervals
        };

        // Start auto-play with a slight delay
        const delayTimeout = setTimeout(startAutoPlay, 500);

        return () => {
            clearTimeout(delayTimeout);
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
                autoPlayIntervalRef.current = null;
            }
        };
    }, [autoPlay, isUserInteracting, isDragging, autoPlayDirection, autoPlayPauseDuration]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current);
            }
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
            }
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none bg-gray-100"
            onMouseEnter={handleContainerInteraction}
            onMouseLeave={() => {
                // Only stop interaction if not dragging
                if (!isDragging) {
                    handleUserInteraction();
                }
            }}
            onTouchStart={handleContainerInteraction}
        >
            {/* 右侧图片 - 完全显示在背景 */}
            <div className="absolute inset-0">
                <img 
                    src={afterImage} 
                    alt={`${alt} - 后`}
                    className="w-full h-full object-contain"
                />
            </div>
            
            {/* 左侧图片 - 使用clip-path限制可见区域 */}
            <div 
                className="absolute inset-0"
                style={{ 
                    clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` 
                }}
            >
                <img 
                    src={beforeImage} 
                    alt={`${alt} - 前`}
                    className="w-full h-full object-contain"
                />
            </div>
            
            {/* 中间分隔线和控制手柄 */}
            <div 
                className={`absolute h-full flex flex-col items-center justify-center z-10 cursor-ew-resize text-white pointer-events-none transition-opacity duration-300 ${
                    isUserInteracting ? 'opacity-100' : 'opacity-70'
                }`}
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                onTouchMove={(e) => handleTouchMove(e as unknown as TouchEvent)}
            >
                {/* 上部分隔线 */}
                <div 
                    className="flex-grow h-full w-0.5 bg-current pointer-events-auto"
                    style={{ boxShadow: 'rgba(0, 0, 0, 0.5) 0px 0px 4px' }}
                />
                
                {/* 中间控制按钮 */}
                <div 
                    className={`flex-shrink-0 grid grid-flow-col gap-2 place-content-center w-14 h-14 rounded-full border-solid border-2 border-white pointer-events-auto transition-all duration-300 ${
                        isUserInteracting ? 'scale-110' : 'scale-100'
                    }`}
                    style={{ 
                        backdropFilter: 'blur(7px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.125)',
                    }}
                >
                    {/* 左箭头 */}
                    <div style={{ 
                        width: 0,
                        height: 0,
                        borderTop: '8px solid transparent',
                        borderRight: '10px solid',
                        borderBottom: '8px solid transparent'
                    }} />
                    
                    {/* 右箭头 */}
                    <div style={{ 
                        width: 0,
                        height: 0,
                        borderTop: '8px solid transparent',
                        borderRight: '10px solid',
                        borderBottom: '8px solid transparent',
                        transform: 'rotate(180deg)'
                    }} />
                </div>
                
                {/* 下部分隔线 */}
                <div 
                    className="flex-grow h-full w-0.5 bg-current pointer-events-auto"
                    style={{ boxShadow: 'rgba(0, 0, 0, 0.5) 0px 0px 4px' }}
                />
            </div>

            {/* Auto-play indicator */}
            {autoPlay && !isUserInteracting && !isDragging && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 opacity-50">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                    Auto
                </div>
            )}
        </div>
    );
}