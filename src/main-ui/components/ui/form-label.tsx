import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
}: FormLabelProps) {
  const showCharCount = charCount !== undefined && maxChars !== undefined;
  
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <label className="text-tiny text-muted-foreground font-medium flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {children}
        {badge && <Badge variant="outline" size="sm" className="ml-1 font-normal">{badge}</Badge>}
      </label>
      {showCharCount && (
        <span className={cn(
          "text-micro font-mono tabular-nums",
          error ? "text-destructive" : "text-muted-foreground"
        )}>
          {charCount} / {maxChars}
        </span>
      )}
    </div>
  );
}
