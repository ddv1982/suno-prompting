import { cn } from '@/lib/utils';

import type { ReactElement } from 'react';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-primary/10 animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
