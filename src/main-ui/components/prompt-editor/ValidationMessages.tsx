import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";

type ValidationMessagesProps = {
  errors: string[];
  warnings: string[];
};

export function ValidationMessages({ errors, warnings }: ValidationMessagesProps) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {errors.map((error, i) => (
        <Alert key={i} className="py-2 px-4 glass-panel-subtle border-destructive/30 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-tiny ml-2">{error}</AlertDescription>
        </Alert>
      ))}
      {warnings.map((warning, i) => (
        <Alert key={i} className="py-2 px-4 glass-panel-subtle border-amber-500/30 text-amber-400">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-tiny ml-2">{warning}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
