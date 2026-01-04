import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps): React.JSX.Element {
  return (
    <span className={cn("label-section", className)}>
      {children}
    </span>
  );
}
