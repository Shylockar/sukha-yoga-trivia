"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface CategoryCardProps {
  category: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

export default function CategoryCard({
  category,
  label,
  description,
  icon,
  className = "",
}: CategoryCardProps) {
  return (
    <Link
      href={`/play/${category}`}
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-3xl border-l-4 border-l-sukha-accent bg-white p-5 transition-all duration-250 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      style={{
        boxShadow: "0 1px 3px rgba(67,67,68,0.05), 0 4px 14px rgba(153,147,192,0.07)",
        background: "linear-gradient(145deg, #ffffff 0%, rgba(153,147,192,0.04) 100%)",
        transition: "transform 250ms ease, box-shadow 250ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 6px 24px rgba(153,147,192,0.22), 0 1px 4px rgba(67,67,68,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 1px 3px rgba(67,67,68,0.05), 0 4px 14px rgba(153,147,192,0.07)";
      }}
    >
      {/* Icon container */}
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sukha-accent/10 text-sukha-accent transition-transform duration-250 group-hover:scale-110">
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="font-rubik text-sm font-medium text-sukha-dark transition-colors duration-200 group-hover:text-sukha-accent">
          {label}
        </h3>
        <p className="mt-1 font-rubik text-xs leading-relaxed text-sukha-mid/80">
          {description}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="font-rubik text-xs text-sukha-accent">Jugar</span>
        <ChevronRight size={12} className="text-sukha-accent" strokeWidth={2} />
      </div>
    </Link>
  );
}
