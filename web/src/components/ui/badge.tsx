import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: 'border-white/10 bg-white/5 text-slate-200',
        brand: 'border-orange-500/30 bg-orange-500/15 text-orange-200',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-200',
        info: 'border-sky-500/30 bg-sky-500/15 text-sky-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
