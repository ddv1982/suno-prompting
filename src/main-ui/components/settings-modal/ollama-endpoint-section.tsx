import { Server } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";

interface OllamaEndpointSectionProps {
  endpoint: string;
  onChange: (value: string) => void;
}

export function OllamaEndpointSection({
  endpoint,
  onChange,
}: OllamaEndpointSectionProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <SectionLabel>
        <Server className="h-4 w-4" />
        Ollama Endpoint
      </SectionLabel>
      <Input
        type="url"
        value={endpoint}
        onChange={(e) => { onChange(e.target.value); }}
        placeholder="http://localhost:11434"
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        The URL where your Ollama server is running
      </p>
    </div>
  );
}
