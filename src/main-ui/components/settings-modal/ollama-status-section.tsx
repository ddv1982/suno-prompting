import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusIndicator } from "@/components/ui/status-indicator";

import type { OllamaStatus } from "@/hooks/use-ollama-status";

interface OllamaStatusSectionProps {
  status: OllamaStatus;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function OllamaStatusSection({
  status,
  isRefreshing,
  onRefresh,
}: OllamaStatusSectionProps): React.JSX.Element {
  const getStatusIndicatorStatus = (): "ready" | "working" | "error" => {
    if (status === "checking") return "working";
    if (status === "available") return "ready";
    return "error";
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case "checking":
        return "Checking Ollama...";
      case "available":
        return "Ollama is running";
      case "unavailable":
        return "Ollama is not running";
      case "missing-model":
        return "Gemma model not installed";
      default:
        return "Unknown status";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionLabel>Status</SectionLabel>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator status={getStatusIndicatorStatus()} />
        <span className="text-sm text-muted-foreground">{getStatusLabel()}</span>
      </div>
    </div>
  );
}
