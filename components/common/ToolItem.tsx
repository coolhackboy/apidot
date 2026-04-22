import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface ToolItemProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  isNew?: boolean;
  isHot?: boolean;
}

export function ToolItem({ title, description, icon, href, isNew, isHot }: ToolItemProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:border-primary transition-colors"
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="rounded-lg bg-primary/10 p-3 flex items-center justify-center w-16 h-16 flex-shrink-0">
            <img
              src={icon}
              alt={title}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {isNew && (
              <span className="inline-block rounded-lg bg-violet-500 px-2 py-0.5 text-xs text-white">
                NEW
              </span>
            )}
            {isHot && (
              <span className="inline-block rounded-lg bg-red-500 px-2 py-0.5 text-xs text-white">
                Hot
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
