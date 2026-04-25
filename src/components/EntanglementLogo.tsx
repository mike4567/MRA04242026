import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function EntanglementLogo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center", className)} {...props}>
      <h1 className="text-xl font-bold text-primary tracking-tight">
        West Coast Marine Incidents
      </h1>
    </div>
  );
}
