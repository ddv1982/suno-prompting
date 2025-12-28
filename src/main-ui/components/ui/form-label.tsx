import { cn } from "@/lib/utils";

interface FormLabelProps {
  children: React.ReactNode;
  charCount?: number;
  maxChars?: number;
  error?: boolean;
  className?: string;
}

export function FormLabel({ 
  children, 
  charCount, 
  maxChars, 
  error,
  className 
}: FormLabelProps) {
  const showCharCount = charCount !== undefined && maxChars !== undefined;
  
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <label className="text-tiny text-muted-foreground font-medium">
        {children}
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
