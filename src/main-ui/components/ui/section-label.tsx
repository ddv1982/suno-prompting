import { cn } from '@/lib/utils';

import type { ReactElement } from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps): ReactElement {
  return <span className={cn('label-section', className)}>{children}</span>;
}
