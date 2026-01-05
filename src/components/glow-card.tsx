import React from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-card border border-border overflow-hidden max-w-md w-full rounded-2xl shadow-2xl relative z-10 dark:shadow-[0_0_20px_-10px_var(--color-primary)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlowCard.displayName = "GlowCard";

export { GlowCard };

