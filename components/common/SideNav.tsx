'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";

interface NavItem {
  title: string;
  href: string;
  active?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SideNavProps {
  items: NavGroup[];
}

export default function SideNav({ items }: SideNavProps) {
  return (
    <div className="p-4 space-y-4">
      {items.map((group, index) => (
        <div key={index}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">{group.title}</h2>
          <div className="space-y-1">
            {group.items.map((item, itemIndex) => (
              <Link
                key={itemIndex}
                href={item.href}
                className={cn(
                  "block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
                  item.active && "bg-accent text-accent-foreground"
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 