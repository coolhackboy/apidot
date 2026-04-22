'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ToolCategory {
  id: string;
  name: string;
  icon?: string;
  tools: any[];
}

export default function CategoryNavigation({ categories }: { categories: ToolCategory[] }) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0].id);
  
  // 监听滚动，更新当前激活的分类
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // 这个偏移量仅用于检测当前分类
      
      for (let i = categories.length - 1; i >= 0; i--) {
        const element = document.getElementById(`category-${categories[i].id}`);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // 滚动到指定分类 - 使用更现代的属性
  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      // 计算元素位置并考虑页面顶部内容的高度
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - 100;
      
      // 使用window.scrollTo以获得更精确的控制
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setActiveCategory(categoryId);
    }
  };

  // 处理分类选择变化
  const handleCategoryChange = (value: string) => {
    scrollToCategory(value);
  };
  
  // 获取当前活跃分类对象
  const currentCategory = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <>
      {/* 桌面端垂直导航 - 固定左侧 */}
      <div className="hidden md:block sticky top-24 self-start w-56 bg-background/50 backdrop-blur-sm rounded-lg border border-border/20 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Navigation</h3>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => scrollToCategory(category.id)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md transition-all",
                  "hover:bg-secondary/70",
                  activeCategory === category.id
                    ? "bg-secondary text-secondary-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {category.icon && (
                  <Image 
                    src={category.icon}
                    alt=""
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                )}
                <span>{category.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      {/* 移动端下拉选择器导航 */}
      <div className="md:hidden">
        <Select 
          value={activeCategory} 
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-full bg-black/40 border-white/10 text-white rounded-lg py-3">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent className="bg-black/80 border-white/10 text-white backdrop-blur-md">
            {categories.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id}
                className="focus:bg-white/10 focus:text-white hover:bg-white/10 data-[state=checked]:bg-primary/60"
              >
                <div className="flex items-center py-1">
                  {category.icon && (
                    <Image 
                      src={category.icon}
                      alt=""
                      width={18}
                      height={18}
                      className="mr-2"
                    />
                  )}
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}