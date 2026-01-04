import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FormLabelProps {
  children: React.ReactNode;
  charCount?: number;
  maxChars?: number;
  error?: boolean;
  className?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export function FormLabel({ 
  children, 
  charCount, 
  maxChars, 
  error,
  className,
  icon,
  badge
}: FormLabelProps): React.JSX.Element {
  const showCharCount = charCount !== undefined && maxChars !== undefined;
  
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium flex items-center gap-[var(--space-1)]">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {children}
        {badge && <Badge variant="outline" size="sm" className="ml-1 font-normal">{badge}</Badge>}
      </label>
      {showCharCount && (
        <span className={cn(
          "text-[length:var(--text-caption)] font-mono tabular-nums",
          error ? "text-destructive" : "text-muted-foreground"
        )}>
          {charCount} / {maxChars}
        </span>
      )}
    </div>
  );
}
