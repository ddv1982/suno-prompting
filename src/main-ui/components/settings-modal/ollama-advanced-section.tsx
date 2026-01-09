import { SectionLabel } from "@/components/ui/section-label";
import { Slider } from "@/components/ui/slider";

interface OllamaAdvancedSectionProps {
  temperature: number;
  maxTokens: number;
  contextLength: number;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  onContextLengthChange: (value: number) => void;
}

export function OllamaAdvancedSection({
  temperature,
  maxTokens,
  contextLength,
  onTemperatureChange,
  onMaxTokensChange,
  onContextLengthChange,
}: OllamaAdvancedSectionProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <SectionLabel>Advanced Settings</SectionLabel>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Temperature</label>
          <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
        </div>
        <Slider
          min={0}
          max={2}
          step={0.1}
          value={[temperature]}
          onValueChange={(value) => { onTemperatureChange(value[0] ?? 0.7); }}
        />
        <p className="text-xs text-muted-foreground">
          Higher values make output more random (0.0-2.0)
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Max Tokens</label>
          <span className="text-sm text-muted-foreground">{maxTokens}</span>
        </div>
        <Slider
          min={500}
          max={4000}
          step={100}
          value={[maxTokens]}
          onValueChange={(value) => { onMaxTokensChange(value[0] ?? 2000); }}
        />
        <p className="text-xs text-muted-foreground">
          Maximum length of generated response
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Context Length</label>
          <span className="text-sm text-muted-foreground">{contextLength}</span>
        </div>
        <Slider
          min={2048}
          max={8192}
          step={1024}
          value={[contextLength]}
          onValueChange={(value) => { onContextLengthChange(value[0] ?? 4096); }}
        />
        <p className="text-xs text-muted-foreground">
          Amount of context the model can consider
        </p>
      </div>
    </div>
  );
}
